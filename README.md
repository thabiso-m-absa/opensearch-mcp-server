# OpenSearch MCP Server

A comprehensive Model Context Protocol (MCP) server that provides seamless integration with OpenSearch clusters. This server enables AI systems to search, index, aggregate, and manage data in OpenSearch through a standardized MCP interface.

**✨ Multi-Cluster Support:** Connect to multiple OpenSearch clusters simultaneously and route operations to specific clusters as needed.

## Features

### 🌐 **Multi-Cluster Management**

- Connect to multiple OpenSearch clusters in a single server instance
- Route operations to specific clusters dynamically
- Default cluster configuration with override capability
- Backward compatible with single-cluster setups

### 🔍 **Search & Query**

- Full-text search with Query DSL support
- Simple query string interface
- Advanced filtering and sorting
- Source field selection and highlighting
- Scroll API for large result sets

### 📊 **Analytics & Aggregations**

- Metric aggregations (avg, sum, count, etc.)
- Bucket aggregations (terms, date histogram, etc.)
- Complex nested aggregations
- Statistical analysis

### 📄 **Document Management**

- Index documents with auto-ID generation
- Bulk operations for high-throughput scenarios
- Get, update, and delete documents by ID
- Upsert operations with conflict resolution

### 🗂️ **Index Management**

- Create and delete indices
- Manage field mappings and index settings
- Index statistics and health monitoring
- Alias management

### 🏥 **Cluster Operations**

- Cluster health and status monitoring
- Node statistics and performance metrics
- Shard allocation information
- Version and build information

### 🤖 **AI-Friendly Tools**

- Query builder prompts with best practices
- Aggregation design assistance
- Mapping optimization suggestions
- Performance tuning recommendations

## Quick Start

### Prerequisites

- **Node.js** 18+
- **OpenSearch** cluster (local or remote)
- **VS Code** with MCP support (for development)

### Installation

#### Option 1: VS Code Development

```bash
# Clone the repository
git clone <repository-url>
cd opensearch-mcp-server

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit configuration
nano .env

# Build the project
npm run build

# Start the server
npm start
```

#### Option 2: Linux Server Deployment

```bash
# Make installation script executable
chmod +x install-linux.sh

# Run installation (requires sudo)
sudo ./install-linux.sh

# Edit configuration
sudo nano /etc/opensearch-mcp-server/config

# Restart service
sudo systemctl restart opensearch-mcp
```

#### Option 3: Docker Deployment

```bash
# Quick start with Docker Compose
./docker-deploy.sh start

# Or manually
docker-compose up -d
```

## Configuration

### Multi-Cluster Setup

The server supports connecting to multiple OpenSearch clusters simultaneously. You can configure clusters in two ways:

#### Option 1: Multi-Cluster JSON Configuration

Use the `OPENSEARCH_CLUSTERS` environment variable with a JSON string:

| Variable                     | Description                                           | Required |
| ---------------------------- | ----------------------------------------------------- | -------- |
| `OPENSEARCH_CLUSTERS`        | JSON object with named cluster configurations         | ✅       |
| `OPENSEARCH_DEFAULT_CLUSTER` | Default cluster name when not specified in tool calls | ❌       |

**Example:**

```json
{
  "OPENSEARCH_CLUSTERS": "{\"production\":{\"node\":\"https://prod-cluster:9200\",\"auth\":{\"username\":\"admin\",\"password\":\"secret\"}},\"staging\":{\"node\":\"https://staging-cluster:9200\",\"auth\":{\"username\":\"admin\",\"password\":\"secret\"}}}",
  "OPENSEARCH_DEFAULT_CLUSTER": "production"
}
```

#### Option 2: Legacy Single Cluster Configuration

For backward compatibility, use individual environment variables (automatically creates a "default" cluster):

| Variable                         | Description                 | Default                  | Required |
| -------------------------------- | --------------------------- | ------------------------ | -------- |
| `OPENSEARCH_URL`                 | OpenSearch cluster endpoint | `https://localhost:9200` | ✅       |
| `OPENSEARCH_USERNAME`            | Authentication username     | `admin`                  | ✅       |
| `OPENSEARCH_PASSWORD`            | Authentication password     | `admin`                  | ✅       |
| `OPENSEARCH_API_KEY`             | Alternative API key auth    | -                        | ❌       |
| `OPENSEARCH_REJECT_UNAUTHORIZED` | SSL certificate validation  | `true`                   | ❌       |
| `OPENSEARCH_CA_CERT_PATH`        | Path to CA certificate      | -                        | ❌       |
| `OPENSEARCH_REQUEST_TIMEOUT`     | Request timeout (ms)        | `30000`                  | ❌       |
| `OPENSEARCH_DEFAULT_INDEX`       | Default index pattern       | -                        | ❌       |
| `OPENSEARCH_INDEX_PREFIX`        | Index name prefix           | -                        | ❌       |

### VS Code Configuration

#### Multi-Cluster Example

Add to your VS Code `mcp.json`:

```json
{
  "servers": {
    "opensearch-mcp-server": {
      "type": "stdio",
      "command": "node",
      "args": ["./build/index.js"],
      "env": {
        "OPENSEARCH_CLUSTERS": "{\"production\":{\"node\":\"https://prod-cluster:9200\",\"auth\":{\"username\":\"admin\",\"password\":\"secret\"},\"ssl\":{\"rejectUnauthorized\":false}},\"staging\":{\"node\":\"https://staging-cluster:9200\",\"auth\":{\"username\":\"admin\",\"password\":\"secret\"},\"ssl\":{\"rejectUnauthorized\":false}}}",
        "OPENSEARCH_DEFAULT_CLUSTER": "production"
      }
    }
  }
}
```

#### Single Cluster (Legacy) Example

```json
{
  "servers": {
    "opensearch-mcp-server": {
      "type": "stdio",
      "command": "node",
      "args": ["./build/index.js"],
      "env": {
        "OPENSEARCH_URL": "https://your-opensearch-cluster:9200",
        "OPENSEARCH_USERNAME": "your-username",
        "OPENSEARCH_PASSWORD": "your-password"
      }
    }
  }
}
```

## API Reference

### Cluster Management

#### `opensearch_list_clusters`

List all available OpenSearch clusters and the default cluster.

**Returns:** List of cluster names and default cluster configuration.

### Search Tools

#### `opensearch_search`

Search for documents using Query DSL or simple query strings.

**Parameters:**

- `cluster` (string, optional): Cluster name to query (uses default if not specified)
- `index` (string, optional): Index name or pattern
- `query` (object, optional): OpenSearch Query DSL object
- `q` (string, optional): Simple query string
- `size` (number): Number of results (default: 10, max: 10000)
- `from` (number): Offset for pagination (default: 0)
- `sort` (string|array|object): Sort specification
- `_source` (boolean|string|array): Source field filtering
- `highlight` (object): Highlighting configuration

**Example:**

```json
{
  "name": "opensearch_search",
  "arguments": {
    "index": "logs-*",
    "query": {
      "match": {
        "message": "error"
      }
    },
    "size": 20,
    "sort": [{ "@timestamp": "desc" }]
  }
}
```

#### `opensearch_aggregate`

Perform aggregations for analytics and reporting.

**Parameters:**

- `cluster` (string, optional): Cluster name (uses default if not specified)
- `index` (string): Index name to aggregate
- `aggregations` (object): Aggregation specifications
- `query` (object, optional): Filter query before aggregation
- `size` (number): Document hits to return (default: 0)

**Example:**

```json
{
  "name": "opensearch_aggregate",
  "arguments": {
    "index": "app-logs",
    "aggregations": {
      "status_codes": {
        "terms": {
          "field": "status_code",
          "size": 10
        }
      },
      "avg_response_time": {
        "avg": {
          "field": "response_time"
        }
      }
    }
  }
}
```

### Document Management Tools

#### `opensearch_index_document`

Index a single document.

**Parameters:**

- `cluster` (string, optional): Cluster name (uses default if not specified)
- `index` (string): Target index name
- `id` (string, optional): Document ID (auto-generated if omitted)
- `document` (object): Document data
- `refresh` (boolean|string): Refresh policy

**Example:**

```json
{
  "name": "opensearch_index_document",
  "arguments": {
    "index": "user-events",
    "document": {
      "user_id": "12345",
      "event": "login",
      "timestamp": "2024-01-15T10:30:00Z",
      "ip_address": "192.168.1.100"
    },
    "refresh": true
  }
}
```

#### `opensearch_bulk_index`

Perform bulk operations for high throughput.

**Parameters:**

- `operations` (array): Array of bulk operation objects
- `refresh` (boolean|string): Refresh policy

**Example:**

```json
{
  "name": "opensearch_bulk_index",
  "arguments": {
    "operations": [
      { "index": { "_index": "logs", "_id": "1" } },
      { "message": "First log entry", "level": "info" },
      { "index": { "_index": "logs", "_id": "2" } },
      { "message": "Second log entry", "level": "warn" }
    ],
    "refresh": "wait_for"
  }
}
```

### Index Management Tools

#### `opensearch_create_index`

Create a new index with settings and mappings.

**Parameters:**

- `index` (string): Index name
- `settings` (object, optional): Index settings
- `mappings` (object, optional): Field mappings

**Example:**

```json
{
  "name": "opensearch_create_index",
  "arguments": {
    "index": "application-logs",
    "settings": {
      "index": {
        "number_of_shards": 2,
        "number_of_replicas": 1
      }
    },
    "mappings": {
      "properties": {
        "timestamp": { "type": "date" },
        "level": { "type": "keyword" },
        "message": { "type": "text" },
        "service": { "type": "keyword" }
      }
    }
  }
}
```

### Cluster Management Tools

#### `opensearch_cluster_health`

Get cluster health and status information.

**Parameters:**

- `index` (string, optional): Specific index to check
- `level` (string): Detail level (cluster, indices, shards)
- `wait_for_status` (string, optional): Wait for specific status
- `timeout` (string): Timeout for wait operations

**Example:**

```json
{
  "name": "opensearch_cluster_health",
  "arguments": {
    "level": "indices",
    "wait_for_status": "yellow",
    "timeout": "30s"
  }
}
```

## Advanced Usage

### Query Building Prompts

The server includes AI-friendly prompts to help build complex queries:

#### Query Builder

```json
{
  "name": "opensearch_query_builder",
  "arguments": {
    "search_terms": "error authentication failed",
    "index_pattern": "security-logs-*",
    "filters": "{\"range\": {\"@timestamp\": {\"gte\": \"now-1h\"}}}"
  }
}
```

#### Aggregation Builder

```json
{
  "name": "opensearch_aggregation_builder",
  "arguments": {
    "metric_type": "date_histogram",
    "field_name": "@timestamp",
    "index_pattern": "metrics-*"
  }
}
```

### Performance Optimization

#### Search Performance

- Use specific index patterns instead of wildcards
- Limit `size` parameter for large result sets
- Use `_source` filtering to reduce network overhead
- Implement proper pagination with `from` and `size`

#### Indexing Performance

- Use bulk operations for multiple documents
- Set appropriate refresh intervals
- Consider async refresh policies for high-throughput scenarios

#### Aggregation Performance

- Use `size: 0` to skip document hits when only aggregations are needed
- Implement proper field mappings for aggregated fields
- Use appropriate bucket sizes for date histograms

## Deployment Scenarios

### VS Code Development

Perfect for development, testing, and interactive data exploration with AI assistance.

**Setup:**

1. Install dependencies with `npm install`
2. Configure `.env` file
3. Add to VS Code `mcp.json`
4. Build and run with `npm run build && npm start`

### Linux Server Production

Ideal for production environments with proper service management, logging, and monitoring.

**Features:**

- Systemd service management
- Automatic startup on boot
- Structured logging
- Resource limits and security policies
- Configuration management

**Management:**

```bash
# Service management
sudo systemctl start opensearch-mcp
sudo systemctl status opensearch-mcp
sudo journalctl -u opensearch-mcp -f

# Using management script
./manage-server.sh status
./manage-server.sh logs 100
./manage-server.sh restart
```

### Docker Container

Best for containerized deployments, development environments, and cloud platforms.

**Features:**

- Complete OpenSearch stack included
- Configurable through environment variables
- Health checks and monitoring
- Volume persistence
- Network isolation

**Usage:**

```bash
# Development setup
./docker-deploy.sh start

# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Monitoring
./docker-deploy.sh logs opensearch-mcp-server
./docker-deploy.sh status
```

## Security Considerations

### Authentication

- Always use strong passwords for OpenSearch clusters
- Consider API key authentication for programmatic access
- Implement proper user roles and permissions

### Network Security

- Use HTTPS/TLS for OpenSearch connections
- Validate SSL certificates in production (`OPENSEARCH_REJECT_UNAUTHORIZED=true`)
- Implement network firewalls and access controls
- Use VPNs or private networks for cluster access

### Data Protection

- Enable audit logging in OpenSearch
- Implement field-level security for sensitive data
- Use index-level permissions and access controls
- Regular backup and disaster recovery procedures

## Troubleshooting

### Common Issues

#### Connection Problems

```bash
# Check OpenSearch cluster health
curl -k -u admin:password https://your-cluster:9200/_cluster/health

# Verify network connectivity
telnet your-cluster 9200

# Check SSL certificate issues
openssl s_client -connect your-cluster:9200 -showcerts
```

#### Authentication Failures

- Verify username and password in configuration
- Check user permissions in OpenSearch
- Ensure API key is valid and has proper permissions

#### Performance Issues

- Monitor cluster resource usage
- Check index shard allocation
- Review query patterns for optimization opportunities
- Implement proper field mappings

### Debugging

#### Development Mode

```bash
# Enable debug logging
export DEBUG=opensearch-mcp:*
npm run dev

# Use VS Code debugger
# Press F5 in VS Code with proper launch configuration
```

#### Production Monitoring

```bash
# Check service logs
journalctl -u opensearch-mcp -f

# Monitor cluster health
./manage-server.sh status

# Check resource usage
htop
iostat -x 1
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Run tests (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: See the `/docs` directory for detailed guides
- **Issues**: Report bugs and request features on GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions

## Related Projects

- [OpenSearch](https://opensearch.org/) - The search and analytics engine
- [Model Context Protocol](https://github.com/anthropics/mcp) - The protocol specification
- [OpenSearch Dashboards](https://opensearch.org/docs/latest/dashboards/) - Visualization and management interface
