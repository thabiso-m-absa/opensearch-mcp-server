# Multi-Cluster Configuration Guide

This guide explains how to configure and use the OpenSearch MCP Server with multiple clusters.

## Overview

The OpenSearch MCP Server supports connecting to multiple OpenSearch clusters simultaneously. This is useful when you need to:

- Query data from production and staging environments
- Manage multiple regional clusters
- Access different OpenSearch deployments from a single interface
- Route operations to specific clusters based on requirements

## Configuration Methods

### Method 1: JSON-based Multi-Cluster (Recommended)

Configure multiple clusters using the `OPENSEARCH_CLUSTERS` environment variable with a JSON string:

```json
{
  "OPENSEARCH_CLUSTERS": "{\"production\":{\"node\":\"https://prod-cluster:9200\",\"auth\":{\"username\":\"admin\",\"password\":\"secret\"},\"ssl\":{\"rejectUnauthorized\":false}},\"staging\":{\"node\":\"https://staging-cluster:9200\",\"auth\":{\"username\":\"admin\",\"password\":\"secret\"}}}",
  "OPENSEARCH_DEFAULT_CLUSTER": "production"
}
```

#### Cluster Configuration Options

Each cluster in the `OPENSEARCH_CLUSTERS` JSON object supports:

```typescript
{
  "cluster-name": {
    "node": "https://cluster-url:9200",           // Required: Cluster endpoint
    "nodes": ["https://node1:9200", "..."],       // Optional: Multiple nodes for load balancing
    "auth": {
      "username": "admin",                         // Username auth
      "password": "password",                      // Password auth
      "apiKey": "base64-encoded-key",             // Alternative: API key auth
      "awsRegion": "us-east-1",                   // AWS auth region
      "awsService": "es"                          // AWS service name
    },
    "ssl": {
      "rejectUnauthorized": false,                // SSL verification
      "caCertPath": "/path/to/ca.crt",           // CA certificate path
      "caBundle": "-----BEGIN CERTIFICATE-----"  // CA certificate string
    },
    "requestTimeout": 30000,                      // Request timeout in ms
    "pingTimeout": 3000,                          // Ping timeout in ms
    "maxRetries": 3,                              // Max retry attempts
    "compression": false,                         // Enable compression
    "defaultIndex": "logs-*",                     // Default index pattern
    "indexPrefix": "prod-"                        // Index prefix
  }
}
```

### Method 2: Legacy Single Cluster (Backward Compatible)

Use individual environment variables for a single cluster:

```json
{
  "OPENSEARCH_URL": "https://cluster:9200",
  "OPENSEARCH_USERNAME": "admin",
  "OPENSEARCH_PASSWORD": "password",
  "OPENSEARCH_REJECT_UNAUTHORIZED": "false"
}
```

This automatically creates a cluster named `"default"`.

## VS Code MCP Configuration Examples

### Example 1: Production + Staging Clusters

```json
{
  "servers": {
    "opensearch-mcp-server": {
      "type": "stdio",
      "command": "node",
      "args": ["./build/index.js"],
      "env": {
        "OPENSEARCH_CLUSTERS": "{\"production\":{\"node\":\"https://prod.example.com:9200\",\"auth\":{\"username\":\"prod-user\",\"password\":\"prod-pass\"},\"ssl\":{\"rejectUnauthorized\":false}},\"staging\":{\"node\":\"https://staging.example.com:9200\",\"auth\":{\"username\":\"staging-user\",\"password\":\"staging-pass\"},\"ssl\":{\"rejectUnauthorized\":false}}}",
        "OPENSEARCH_DEFAULT_CLUSTER": "production"
      }
    }
  }
}
```

### Example 2: Multi-Region Clusters

```json
{
  "servers": {
    "opensearch-mcp-server": {
      "type": "stdio",
      "command": "node",
      "args": ["./build/index.js"],
      "env": {
        "OPENSEARCH_CLUSTERS": "{\"us-east\":{\"node\":\"https://us-east-cluster:9200\",\"auth\":{\"username\":\"admin\",\"password\":\"secret\"}},\"eu-west\":{\"node\":\"https://eu-west-cluster:9200\",\"auth\":{\"username\":\"admin\",\"password\":\"secret\"}},\"ap-south\":{\"node\":\"https://ap-south-cluster:9200\",\"auth\":{\"username\":\"admin\",\"password\":\"secret\"}}}",
        "OPENSEARCH_DEFAULT_CLUSTER": "us-east"
      }
    }
  }
}
```

### Example 3: AWS OpenSearch Service Clusters

```json
{
  "servers": {
    "opensearch-mcp-server": {
      "type": "stdio",
      "command": "node",
      "args": ["./build/index.js"],
      "env": {
        "OPENSEARCH_CLUSTERS": "{\"datapower\":{\"node\":\"https://vpc-datapower-xxxxx.region.es.amazonaws.com:443\",\"auth\":{\"username\":\"master-user\",\"password\":\"master-pass\",\"awsRegion\":\"af-south-1\",\"awsService\":\"es\"},\"ssl\":{\"rejectUnauthorized\":false}},\"analytics\":{\"node\":\"https://vpc-analytics-xxxxx.region.es.amazonaws.com:443\",\"auth\":{\"username\":\"master-user\",\"password\":\"master-pass\",\"awsRegion\":\"us-east-1\",\"awsService\":\"es\"},\"ssl\":{\"rejectUnauthorized\":false}}}",
        "OPENSEARCH_DEFAULT_CLUSTER": "datapower"
      }
    }
  }
}
```

## Using Multi-Cluster in Tool Calls

### List Available Clusters

```json
{
  "name": "opensearch_list_clusters",
  "arguments": {}
}
```

**Response:**

```json
{
  "clusters": ["production", "staging"],
  "defaultCluster": "production",
  "count": 2
}
```

### Query Specific Cluster

Add the `cluster` parameter to any tool call:

```json
{
  "name": "opensearch_search",
  "arguments": {
    "cluster": "staging",
    "index": "logs-*",
    "query": {
      "match": { "level": "error" }
    },
    "size": 10
  }
}
```

### Use Default Cluster

Omit the `cluster` parameter to use the default cluster:

```json
{
  "name": "opensearch_search",
  "arguments": {
    "index": "logs-*",
    "query": {
      "match": { "level": "error" }
    }
  }
}
```

### Cross-Cluster Operations Example

```javascript
// Get cluster health from all clusters
for (const cluster of ["production", "staging", "development"]) {
  const health = await mcp.call("opensearch_cluster_health", {
    cluster: cluster,
  });
  console.log(`${cluster}: ${health.status}`);
}
```

## All Tools Support Multi-Cluster

Every tool in the OpenSearch MCP Server accepts an optional `cluster` parameter:

- `opensearch_search` - Search documents
- `opensearch_aggregate` - Run aggregations
- `opensearch_count` - Count documents
- `opensearch_index_document` - Index documents
- `opensearch_bulk_index` - Bulk operations
- `opensearch_get_document` - Get documents
- `opensearch_update_document` - Update documents
- `opensearch_delete_document` - Delete documents
- `opensearch_list_indices` - List indices
- `opensearch_create_index` - Create indices
- `opensearch_delete_index` - Delete indices
- `opensearch_get_mapping` - Get mappings
- `opensearch_put_mapping` - Update mappings
- `opensearch_cluster_health` - Cluster health
- `opensearch_cluster_stats` - Cluster statistics
- `opensearch_cluster_info` - Cluster information
- `opensearch_index_stats` - Index statistics

## Tips and Best Practices

1. **Default Cluster**: Set `OPENSEARCH_DEFAULT_CLUSTER` to your most frequently accessed cluster
2. **Naming**: Use descriptive cluster names like "production", "staging", "us-east", etc.
3. **Security**: Store credentials securely, consider using environment-specific config files
4. **Testing**: Use `opensearch_list_clusters` to verify your configuration
5. **Error Handling**: The server will provide clear errors if a cluster name is invalid
6. **Performance**: Each cluster maintains its own connection pool for optimal performance

## Troubleshooting

### Cluster Not Found Error

```
Error: Cluster 'staging' not found. Available clusters: production, development
```

**Solution**: Check cluster name spelling in `OPENSEARCH_CLUSTERS` and tool calls.

### Connection Failed

```
Warning: Failed to connect to OpenSearch cluster 'staging'
```

**Solution**: Verify cluster URL, credentials, and network connectivity. The server will skip unreachable clusters.

### No Clusters Initialized

```
Error: Failed to connect to any OpenSearch cluster
```

**Solution**: Check `OPENSEARCH_CLUSTERS` JSON syntax and ensure at least one cluster is accessible.

## Migration from Single to Multi-Cluster

If you're migrating from single-cluster configuration:

**Before:**

```json
{
  "OPENSEARCH_URL": "https://cluster:9200",
  "OPENSEARCH_USERNAME": "admin",
  "OPENSEARCH_PASSWORD": "password"
}
```

**After:**

```json
{
  "OPENSEARCH_CLUSTERS": "{\"default\":{\"node\":\"https://cluster:9200\",\"auth\":{\"username\":\"admin\",\"password\":\"password\"}}}",
  "OPENSEARCH_DEFAULT_CLUSTER": "default"
}
```

**Or keep the old format** - it's automatically converted to a cluster named "default" for backward compatibility!
