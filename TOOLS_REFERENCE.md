# OpenSearch MCP Server - Tools Reference

This document provides a comprehensive reference for all tools available in the OpenSearch MCP Server.

## Search and Query Tools

### opensearch_search

**Description:** Search for documents in OpenSearch indices using Query DSL or simple query string.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "index": {
      "type": "string",
      "description": "Index name to search in (optional if default index is configured)"
    },
    "query": {
      "type": "object", 
      "description": "OpenSearch query DSL object"
    },
    "q": {
      "type": "string",
      "description": "Simple query string (alternative to query DSL)"
    },
    "size": {
      "type": "number",
      "description": "Number of results to return (default: 10, max: 10000)",
      "default": 10
    },
    "from": {
      "type": "number", 
      "description": "Offset for pagination (default: 0)",
      "default": 0
    },
    "sort": {
      "type": ["string", "array", "object"],
      "description": "Sort specification"
    },
    "_source": {
      "type": ["boolean", "string", "array"],
      "description": "Source filtering - fields to include/exclude"
    },
    "highlight": {
      "type": "object",
      "description": "Highlighting configuration"
    }
  }
}
```

**Examples:**

Basic text search:
```json
{
  "name": "opensearch_search",
  "arguments": {
    "index": "logs-2024",
    "q": "error AND status:500",
    "size": 20
  }
}
```

Advanced query with DSL:
```json
{
  "name": "opensearch_search", 
  "arguments": {
    "index": "application-logs",
    "query": {
      "bool": {
        "must": [
          {"match": {"level": "ERROR"}},
          {"range": {"@timestamp": {"gte": "now-1h"}}}
        ],
        "must_not": [
          {"term": {"service": "health-check"}}
        ]
      }
    },
    "sort": [{"@timestamp": "desc"}],
    "_source": ["timestamp", "level", "message", "service"],
    "highlight": {
      "fields": {
        "message": {}
      }
    }
  }
}
```

---

### opensearch_aggregate

**Description:** Perform aggregations on OpenSearch data for analytics and reporting.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "index": {
      "type": "string",
      "description": "Index name to aggregate data from"
    },
    "aggregations": {
      "type": "object", 
      "description": "Aggregation specifications (aggs)"
    },
    "query": {
      "type": "object",
      "description": "Optional query to filter data before aggregation"
    },
    "size": {
      "type": "number",
      "description": "Number of document hits to return alongside aggregations (default: 0)",
      "default": 0
    }
  },
  "required": ["index", "aggregations"]
}
```

**Examples:**

Terms aggregation:
```json
{
  "name": "opensearch_aggregate",
  "arguments": {
    "index": "web-logs",
    "aggregations": {
      "status_codes": {
        "terms": {
          "field": "status_code",
          "size": 10
        }
      }
    }
  }
}
```

Date histogram with metrics:
```json
{
  "name": "opensearch_aggregate",
  "arguments": {
    "index": "metrics-*",
    "aggregations": {
      "hourly_stats": {
        "date_histogram": {
          "field": "@timestamp", 
          "calendar_interval": "1h"
        },
        "aggs": {
          "avg_response_time": {
            "avg": {"field": "response_time"}
          },
          "total_requests": {
            "value_count": {"field": "request_id"}
          }
        }
      }
    },
    "query": {
      "range": {
        "@timestamp": {
          "gte": "now-24h"
        }
      }
    }
  }
}
```

---

### opensearch_count

**Description:** Count documents matching a query in specified indices.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "index": {
      "type": "string",
      "description": "Index name to count documents in"
    },
    "query": {
      "type": "object",
      "description": "Query to filter documents for counting"
    }
  }
}
```

**Examples:**

Simple count:
```json
{
  "name": "opensearch_count",
  "arguments": {
    "index": "user-events"
  }
}
```

Filtered count:
```json
{
  "name": "opensearch_count", 
  "arguments": {
    "index": "security-logs",
    "query": {
      "bool": {
        "must": [
          {"term": {"event_type": "login_failure"}},
          {"range": {"@timestamp": {"gte": "now-1d"}}}
        ]
      }
    }
  }
}
```

## Document Management Tools

### opensearch_index_document

**Description:** Index a document into OpenSearch.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "index": {
      "type": "string",
      "description": "Index name to store the document"
    },
    "id": {
      "type": "string",
      "description": "Document ID (optional, will be auto-generated if not provided)"
    },
    "document": {
      "type": "object",
      "description": "Document data to index"
    },
    "refresh": {
      "type": ["boolean", "string"],
      "description": "Refresh policy: true, false, or 'wait_for'",
      "default": false
    }
  },
  "required": ["index", "document"]
}
```

**Examples:**

Index with auto-generated ID:
```json
{
  "name": "opensearch_index_document",
  "arguments": {
    "index": "user-activity",
    "document": {
      "user_id": "user123",
      "action": "file_upload",
      "timestamp": "2024-01-15T14:30:00Z",
      "metadata": {
        "file_size": 1024000,
        "file_type": "pdf"
      }
    },
    "refresh": true
  }
}
```

Index with specific ID:
```json
{
  "name": "opensearch_index_document",
  "arguments": {
    "index": "configuration",
    "id": "app-config-v1.2",
    "document": {
      "version": "1.2.0",
      "settings": {
        "debug": false,
        "max_connections": 100
      },
      "updated_at": "2024-01-15T14:30:00Z"
    },
    "refresh": "wait_for"
  }
}
```

---

### opensearch_bulk_index

**Description:** Perform bulk indexing operations for multiple documents.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "operations": {
      "type": "array",
      "description": "Array of bulk operations (index, create, update, delete)",
      "items": {
        "type": "object"
      }
    },
    "refresh": {
      "type": ["boolean", "string"],
      "description": "Refresh policy for the bulk operation",
      "default": false
    }
  },
  "required": ["operations"]
}
```

**Examples:**

Bulk index multiple documents:
```json
{
  "name": "opensearch_bulk_index",
  "arguments": {
    "operations": [
      {"index": {"_index": "events", "_id": "1"}},
      {"event": "user_login", "user": "alice", "timestamp": "2024-01-15T10:00:00Z"},
      {"index": {"_index": "events", "_id": "2"}}, 
      {"event": "user_logout", "user": "alice", "timestamp": "2024-01-15T11:00:00Z"},
      {"index": {"_index": "events"}},
      {"event": "user_login", "user": "bob", "timestamp": "2024-01-15T10:30:00Z"}
    ],
    "refresh": true
  }
}
```

Mixed bulk operations:
```json
{
  "name": "opensearch_bulk_index",
  "arguments": {
    "operations": [
      {"index": {"_index": "products", "_id": "1"}},
      {"name": "Widget A", "price": 19.99, "category": "widgets"},
      {"update": {"_index": "products", "_id": "2"}},
      {"doc": {"price": 24.99}},
      {"delete": {"_index": "products", "_id": "3"}}
    ],
    "refresh": "wait_for"
  }
}
```

---

### opensearch_get_document

**Description:** Retrieve a document by ID from OpenSearch.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "index": {
      "type": "string",
      "description": "Index name containing the document"
    },
    "id": {
      "type": "string", 
      "description": "Document ID to retrieve"
    },
    "_source": {
      "type": ["boolean", "string", "array"],
      "description": "Source filtering - fields to include/exclude"
    }
  },
  "required": ["index", "id"]
}
```

**Examples:**

Get complete document:
```json
{
  "name": "opensearch_get_document",
  "arguments": {
    "index": "users",
    "id": "user123"
  }
}
```

Get specific fields:
```json
{
  "name": "opensearch_get_document",
  "arguments": {
    "index": "users", 
    "id": "user123",
    "_source": ["name", "email", "created_at"]
  }
}
```

---

### opensearch_update_document

**Description:** Update an existing document in OpenSearch.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "index": {
      "type": "string",
      "description": "Index name containing the document"
    },
    "id": {
      "type": "string",
      "description": "Document ID to update"
    },
    "doc": {
      "type": "object",
      "description": "Partial document with fields to update"
    },
    "script": {
      "type": "object", 
      "description": "Script to execute for the update"
    },
    "upsert": {
      "type": "object",
      "description": "Document to create if it doesn't exist"
    },
    "refresh": {
      "type": ["boolean", "string"],
      "description": "Refresh policy",
      "default": false
    }
  },
  "required": ["index", "id"]
}
```

**Examples:**

Partial document update:
```json
{
  "name": "opensearch_update_document",
  "arguments": {
    "index": "users",
    "id": "user123", 
    "doc": {
      "last_login": "2024-01-15T14:30:00Z",
      "login_count": 42
    },
    "refresh": true
  }
}
```

Script-based update:
```json
{
  "name": "opensearch_update_document",
  "arguments": {
    "index": "counters",
    "id": "page_views",
    "script": {
      "source": "ctx._source.count += params.increment",
      "params": {
        "increment": 1
      }
    }
  }
}
```

Upsert operation:
```json
{
  "name": "opensearch_update_document", 
  "arguments": {
    "index": "user_preferences",
    "id": "user123",
    "doc": {
      "theme": "dark"
    },
    "upsert": {
      "user_id": "user123",
      "theme": "light",
      "created_at": "2024-01-15T14:30:00Z"
    }
  }
}
```

---

### opensearch_delete_document

**Description:** Delete a document by ID from OpenSearch.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "index": {
      "type": "string",
      "description": "Index name containing the document"
    },
    "id": {
      "type": "string",
      "description": "Document ID to delete"
    },
    "refresh": {
      "type": ["boolean", "string"],
      "description": "Refresh policy",
      "default": false
    }
  },
  "required": ["index", "id"]
}
```

**Example:**
```json
{
  "name": "opensearch_delete_document",
  "arguments": {
    "index": "temporary_data",
    "id": "temp123", 
    "refresh": true
  }
}
```

## Index Management Tools

### opensearch_list_indices

**Description:** List all indices in the OpenSearch cluster with their statistics.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "format": {
      "type": "string",
      "description": "Output format (json, table)",
      "default": "json"
    },
    "health": {
      "type": "string",
      "description": "Filter by health status (green, yellow, red)"
    },
    "status": {
      "type": "string", 
      "description": "Filter by status (open, close)"
    }
  }
}
```

**Examples:**

List all indices:
```json
{
  "name": "opensearch_list_indices",
  "arguments": {}
}
```

Filter by health status:
```json
{
  "name": "opensearch_list_indices",
  "arguments": {
    "health": "yellow"
  }
}
```

---

### opensearch_create_index

**Description:** Create a new index with optional settings and mappings.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "index": {
      "type": "string",
      "description": "Name of the index to create"
    },
    "settings": {
      "type": "object",
      "description": "Index settings (shards, replicas, etc.)"
    },
    "mappings": {
      "type": "object",
      "description": "Field mappings for the index"
    }
  },
  "required": ["index"]
}
```

**Examples:**

Simple index creation:
```json
{
  "name": "opensearch_create_index",
  "arguments": {
    "index": "simple-logs"
  }
}
```

Index with settings and mappings:
```json
{
  "name": "opensearch_create_index",
  "arguments": {
    "index": "application-metrics",
    "settings": {
      "index": {
        "number_of_shards": 3,
        "number_of_replicas": 1,
        "refresh_interval": "30s"
      }
    },
    "mappings": {
      "properties": {
        "@timestamp": {
          "type": "date"
        },
        "service_name": {
          "type": "keyword"
        },
        "metric_name": {
          "type": "keyword"
        },
        "metric_value": {
          "type": "double"
        },
        "tags": {
          "type": "object",
          "dynamic": true
        },
        "message": {
          "type": "text",
          "analyzer": "standard"
        }
      }
    }
  }
}
```

---

### opensearch_delete_index

**Description:** Delete an index from OpenSearch cluster.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "index": {
      "type": "string",
      "description": "Name of the index to delete"
    }
  },
  "required": ["index"]
}
```

**Example:**
```json
{
  "name": "opensearch_delete_index",
  "arguments": {
    "index": "old-logs-2023"
  }
}
```

---

### opensearch_get_mapping

**Description:** Get the field mappings for one or more indices.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "index": {
      "type": "string",
      "description": "Index name (optional, gets mappings for all indices if not specified)"
    }
  }
}
```

**Examples:**

Get mappings for all indices:
```json
{
  "name": "opensearch_get_mapping",
  "arguments": {}
}
```

Get mappings for specific index:
```json
{
  "name": "opensearch_get_mapping",
  "arguments": {
    "index": "application-logs"
  }
}
```

---

### opensearch_put_mapping

**Description:** Update field mappings for an existing index.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "index": {
      "type": "string",
      "description": "Index name to update mappings for"
    },
    "mappings": {
      "type": "object", 
      "description": "New field mappings to add/update"
    }
  },
  "required": ["index", "mappings"]
}
```

**Example:**
```json
{
  "name": "opensearch_put_mapping",
  "arguments": {
    "index": "user-events",
    "mappings": {
      "properties": {
        "new_field": {
          "type": "keyword"
        },
        "nested_data": {
          "type": "nested",
          "properties": {
            "inner_field": {
              "type": "text"
            }
          }
        }
      }
    }
  }
}
```

## Cluster Management Tools

### opensearch_cluster_health

**Description:** Get OpenSearch cluster health status and statistics.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "index": {
      "type": "string",
      "description": "Specific index to check health for (optional)"
    },
    "level": {
      "type": "string",
      "description": "Level of detail: cluster, indices, or shards",
      "enum": ["cluster", "indices", "shards"],
      "default": "cluster"
    },
    "wait_for_status": {
      "type": "string",
      "description": "Wait for cluster to reach specific status",
      "enum": ["green", "yellow", "red"]
    },
    "timeout": {
      "type": "string",
      "description": "Timeout for wait_for_status",
      "default": "30s"
    }
  }
}
```

**Examples:**

Basic cluster health:
```json
{
  "name": "opensearch_cluster_health",
  "arguments": {}
}
```

Detailed indices health:
```json
{
  "name": "opensearch_cluster_health",
  "arguments": {
    "level": "indices"
  }
}
```

Wait for green status:
```json
{
  "name": "opensearch_cluster_health",
  "arguments": {
    "wait_for_status": "green",
    "timeout": "60s"
  }
}
```

---

### opensearch_cluster_stats

**Description:** Get comprehensive cluster statistics including nodes, indices, and usage metrics.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {}
}
```

**Example:**
```json
{
  "name": "opensearch_cluster_stats",
  "arguments": {}
}
```

---

### opensearch_index_stats

**Description:** Get detailed statistics for one or more indices.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "index": {
      "type": "string",
      "description": "Index name (optional, gets stats for all indices if not specified)"
    },
    "metric": {
      "type": "string",
      "description": "Specific metric to retrieve",
      "enum": ["_all", "completion", "docs", "fielddata", "query_cache", "flush", "get", "indexing", "merge", "refresh", "search", "segments", "store", "warmer", "suggest"]
    }
  }
}
```

**Examples:**

All index statistics:
```json
{
  "name": "opensearch_index_stats",
  "arguments": {}
}
```

Specific index stats:
```json
{
  "name": "opensearch_index_stats",
  "arguments": {
    "index": "application-logs"
  }
}
```

Specific metric:
```json
{
  "name": "opensearch_index_stats", 
  "arguments": {
    "index": "high-volume-index",
    "metric": "indexing"
  }
}
```

---

### opensearch_cluster_info

**Description:** Get basic cluster information including version and build details.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {}
}
```

**Example:**
```json
{
  "name": "opensearch_cluster_info",
  "arguments": {}
}
```

## Response Format

All tools return responses in the following format:

```json
{
  "content": [
    {
      "type": "text", 
      "text": "<JSON response from OpenSearch>"
    }
  ]
}
```

The `text` field contains the JSON response from OpenSearch, formatted with proper indentation for readability.

## Error Handling

Tools may return errors in the following scenarios:

- **Connection errors:** OpenSearch cluster is unreachable
- **Authentication errors:** Invalid credentials or insufficient permissions  
- **Validation errors:** Invalid parameters or malformed queries
- **Index errors:** Index does not exist or operation is not allowed
- **Resource errors:** Cluster resource limits exceeded

Error responses follow the MCP error format with descriptive messages to help diagnose issues.