# Simple Multi-Cluster Setup Guide

## Quick Start

Each OpenSearch cluster gets its own server entry in your `mcp.json` file. Use `OPENSEARCH_CLUSTER_NAME` to give each cluster a unique identifier.

## Basic Example

**`.vscode/mcp.json`:**

```json
{
  "servers": {
    "opensearch-icubed": {
      "type": "stdio",
      "command": "node",
      "args": ["./build/index.js"],
      "env": {
        "OPENSEARCH_CLUSTER_NAME": "icubed",
        "OPENSEARCH_URL": "https://prod-cluster:9200",
        "OPENSEARCH_USERNAME": "admin",
        "OPENSEARCH_PASSWORD": "secret"
      }
    },
    "opensearch-staging": {
      "type": "stdio",
      "command": "node",
      "args": ["./build/index.js"],
      "env": {
        "OPENSEARCH_CLUSTER_NAME": "staging",
        "OPENSEARCH_URL": "https://staging-cluster:9200",
        "OPENSEARCH_USERNAME": "admin",
        "OPENSEARCH_PASSWORD": "secret"
      }
    }
  }
}
```

## Environment Variables

| Variable                         | Description                             | Required       |
| -------------------------------- | --------------------------------------- | -------------- |
| `OPENSEARCH_CLUSTER_NAME`        | Unique cluster identifier               | ✅ Recommended |
| `OPENSEARCH_URL`                 | Cluster endpoint URL                    | ✅             |
| `OPENSEARCH_USERNAME`            | Authentication username                 | ✅             |
| `OPENSEARCH_PASSWORD`            | Authentication password                 | ✅             |
| `OPENSEARCH_API_KEY`             | Alternative API key authentication      | ❌             |
| `OPENSEARCH_REJECT_UNAUTHORIZED` | SSL certificate validation (true/false) | ❌             |
| `OPENSEARCH_CA_CERT_PATH`        | Path to CA certificate file             | ❌             |
| `OPENSEARCH_REQUEST_TIMEOUT`     | Request timeout in milliseconds         | ❌             |
| `OPENSEARCH_DEFAULT_INDEX`       | Default index pattern                   | ❌             |
| `OPENSEARCH_INDEX_PREFIX`        | Index name prefix                       | ❌             |

## Usage Examples

### List Your Clusters

```javascript
opensearch_list_clusters();
// Returns: {"clusters": ["production", "staging"], "count": 2}
```

### Query a Specific Cluster

```javascript
// Search production
opensearch_search({
  cluster: "production",
  index: "logs-*",
  query: { match: { level: "error" } },
});

// Search staging
opensearch_search({
  cluster: "staging",
  index: "logs-*",
  query: { match: { level: "error" } },
});
```

### Omit Cluster Parameter

If you don't specify a cluster, the first available cluster will be used:

```javascript
opensearch_cluster_health();
// Uses first available cluster
```

## Adding New Clusters

To add a new cluster, simply add another server entry to `mcp.json`:

```json
{
  "servers": {
    "opensearch-production": { ... },
    "opensearch-staging": { ... },
    "opensearch-development": {
      "type": "stdio",
      "command": "node",
      "args": ["./build/index.js"],
      "env": {
        "OPENSEARCH_CLUSTER_NAME": "development",
        "OPENSEARCH_URL": "http://localhost:9200",
        "OPENSEARCH_USERNAME": "admin",
        "OPENSEARCH_PASSWORD": "admin"
      }
    }
  }
}
```

## AWS OpenSearch Service Example

```json
{
  "servers": {
    "opensearch-aws-prod": {
      "type": "stdio",
      "command": "node",
      "args": ["./build/index.js"],
      "env": {
        "OPENSEARCH_CLUSTER_NAME": "aws-prod",
        "OPENSEARCH_URL": "https://vpc-domain-xxxxx.region.es.amazonaws.com:443",
        "OPENSEARCH_USERNAME": "master-user",
        "OPENSEARCH_PASSWORD": "master-password",
        "OPENSEARCH_REJECT_UNAUTHORIZED": "false",
        "AWS_REGION": "us-east-1",
        "AWS_SERVICE": "es"
      }
    }
  }
}
```

## Regional Clusters Example

```json
{
  "servers": {
    "opensearch-us-east": {
      "type": "stdio",
      "command": "node",
      "args": ["./build/index.js"],
      "env": {
        "OPENSEARCH_CLUSTER_NAME": "us-east",
        "OPENSEARCH_URL": "https://us-east-cluster:9200",
        "OPENSEARCH_USERNAME": "admin",
        "OPENSEARCH_PASSWORD": "secret"
      }
    },
    "opensearch-eu-west": {
      "type": "stdio",
      "command": "node",
      "args": ["./build/index.js"],
      "env": {
        "OPENSEARCH_CLUSTER_NAME": "eu-west",
        "OPENSEARCH_URL": "https://eu-west-cluster:9200",
        "OPENSEARCH_USERNAME": "admin",
        "OPENSEARCH_PASSWORD": "secret"
      }
    },
    "opensearch-ap-south": {
      "type": "stdio",
      "command": "node",
      "args": ["./build/index.js"],
      "env": {
        "OPENSEARCH_CLUSTER_NAME": "ap-south",
        "OPENSEARCH_URL": "https://ap-south-cluster:9200",
        "OPENSEARCH_USERNAME": "admin",
        "OPENSEARCH_PASSWORD": "secret"
      }
    }
  }
}
```

## Notes

- Each server entry runs independently
- Cluster names must be unique within your configuration
- If `OPENSEARCH_CLUSTER_NAME` is omitted, the cluster will be named "default"
- All tool calls accept an optional `cluster` parameter to target a specific cluster
- If no cluster is specified in a tool call, the first available cluster is used
