import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { config } from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { OpenSearchClient } from "./opensearch/client.js";
import { createConfigFromEnv, validateConfig } from "./types/config.js";

// Load environment variables from .env file
// Suppress ALL dotenv output to avoid MCP protocol interference
const originalStdout = process.stdout.write;
const originalStderr = process.stderr.write;
process.stdout.write = () => true;
process.stderr.write = () => true;
config();
process.stdout.write = originalStdout;
process.stderr.write = originalStderr;

// Redirect all console outputs to stderr to avoid interfering with MCP protocol
const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
  process.stderr.write(args.join(' ') + '\n');
};

/**
 * OpenSearch MCP Server
 * 
 * This server provides MCP integration with OpenSearch, allowing AI systems to:
 * - Search and query documents across indices
 * - Index and manage documents
 * - Perform aggregations and analytics
 * - Monitor cluster health and statistics
 * - Manage indices and mappings
 */
class OpenSearchMCPServer {
  private server: Server;
  private opensearch: OpenSearchClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: "opensearch-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
    this.setupPromptHandlers();
  }

  /**
   * Initialize OpenSearch client from configuration
   */
  private async initializeOpenSearch(): Promise<void> {
    if (this.opensearch) {
      return; // Already initialized
    }

    try {
      // Get configuration from environment variables
      const envConfig = createConfigFromEnv();
      
      // Validate configuration
      const config = validateConfig(envConfig);
      
      // Create client
      this.opensearch = new OpenSearchClient(config);
      
      // Test connection
      const isConnected = await this.opensearch.ping();
      if (!isConnected) {
        throw new Error("Failed to connect to OpenSearch cluster");
      }
      
      console.log("Successfully connected to OpenSearch cluster");
    } catch (error) {
      console.error("Failed to initialize OpenSearch client:", error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to initialize OpenSearch: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Setup tool handlers for OpenSearch operations
   */
  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Search and Query Tools
          {
            name: "opensearch_search",
            description: "Search for documents in OpenSearch indices using query DSL or simple query string",
            inputSchema: {
              type: "object",
              properties: {
                index: {
                  type: "string",
                  description: "Index name to search in (optional if default index is configured)"
                },
                query: {
                  type: "object",
                  description: "OpenSearch query DSL object"
                },
                q: {
                  type: "string",
                  description: "Simple query string (alternative to query DSL)"
                },
                size: {
                  type: "number",
                  description: "Number of results to return (default: 10, max: 10000)",
                  default: 10
                },
                from: {
                  type: "number",
                  description: "Offset for pagination (default: 0)",
                  default: 0
                },
                sort: {
                  type: ["string", "array", "object"],
                  description: "Sort specification"
                },
                _source: {
                  type: ["boolean", "string", "array"],
                  description: "Source filtering - fields to include/exclude"
                },
                highlight: {
                  type: "object",
                  description: "Highlighting configuration"
                }
              }
            }
          },
          {
            name: "opensearch_aggregate",
            description: "Perform aggregations on OpenSearch data for analytics and reporting",
            inputSchema: {
              type: "object",
              properties: {
                index: {
                  type: "string",
                  description: "Index name to aggregate data from"
                },
                aggregations: {
                  type: "object",
                  description: "Aggregation specifications (aggs)"
                },
                query: {
                  type: "object",
                  description: "Optional query to filter data before aggregation"
                },
                size: {
                  type: "number",
                  description: "Number of document hits to return alongside aggregations (default: 0)",
                  default: 0
                }
              },
              required: ["index", "aggregations"]
            }
          },
          {
            name: "opensearch_count",
            description: "Count documents matching a query in specified indices",
            inputSchema: {
              type: "object",
              properties: {
                index: {
                  type: "string",
                  description: "Index name to count documents in"
                },
                query: {
                  type: "object",
                  description: "Query to filter documents for counting"
                }
              }
            }
          },

          // Document Management Tools
          {
            name: "opensearch_index_document",
            description: "Index a document into OpenSearch",
            inputSchema: {
              type: "object",
              properties: {
                index: {
                  type: "string",
                  description: "Index name to store the document"
                },
                id: {
                  type: "string",
                  description: "Document ID (optional, will be auto-generated if not provided)"
                },
                document: {
                  type: "object",
                  description: "Document data to index"
                },
                refresh: {
                  type: ["boolean", "string"],
                  description: "Refresh policy: true, false, or 'wait_for'",
                  default: false
                }
              },
              required: ["index", "document"]
            }
          },
          {
            name: "opensearch_bulk_index",
            description: "Perform bulk indexing operations for multiple documents",
            inputSchema: {
              type: "object",
              properties: {
                operations: {
                  type: "array",
                  description: "Array of bulk operations (index, create, update, delete)",
                  items: {
                    type: "object"
                  }
                },
                refresh: {
                  type: ["boolean", "string"],
                  description: "Refresh policy for the bulk operation",
                  default: false
                }
              },
              required: ["operations"]
            }
          },
          {
            name: "opensearch_get_document",
            description: "Retrieve a document by ID from OpenSearch",
            inputSchema: {
              type: "object",
              properties: {
                index: {
                  type: "string",
                  description: "Index name containing the document"
                },
                id: {
                  type: "string",
                  description: "Document ID to retrieve"
                },
                _source: {
                  type: ["boolean", "string", "array"],
                  description: "Source filtering - fields to include/exclude"
                }
              },
              required: ["index", "id"]
            }
          },
          {
            name: "opensearch_update_document",
            description: "Update an existing document in OpenSearch",
            inputSchema: {
              type: "object",
              properties: {
                index: {
                  type: "string",
                  description: "Index name containing the document"
                },
                id: {
                  type: "string",
                  description: "Document ID to update"
                },
                doc: {
                  type: "object",
                  description: "Partial document with fields to update"
                },
                script: {
                  type: "object",
                  description: "Script to execute for the update"
                },
                upsert: {
                  type: "object",
                  description: "Document to create if it doesn't exist"
                },
                refresh: {
                  type: ["boolean", "string"],
                  description: "Refresh policy",
                  default: false
                }
              },
              required: ["index", "id"]
            }
          },
          {
            name: "opensearch_delete_document",
            description: "Delete a document by ID from OpenSearch",
            inputSchema: {
              type: "object",
              properties: {
                index: {
                  type: "string",
                  description: "Index name containing the document"
                },
                id: {
                  type: "string",
                  description: "Document ID to delete"
                },
                refresh: {
                  type: ["boolean", "string"],
                  description: "Refresh policy",
                  default: false
                }
              },
              required: ["index", "id"]
            }
          },

          // Index Management Tools
          {
            name: "opensearch_list_indices",
            description: "List all indices in the OpenSearch cluster with their statistics",
            inputSchema: {
              type: "object",
              properties: {
                format: {
                  type: "string",
                  description: "Output format (json, table)",
                  default: "json"
                },
                health: {
                  type: "string",
                  description: "Filter by health status (green, yellow, red)"
                },
                status: {
                  type: "string",
                  description: "Filter by status (open, close)"
                }
              }
            }
          },
          {
            name: "opensearch_create_index",
            description: "Create a new index with optional settings and mappings",
            inputSchema: {
              type: "object",
              properties: {
                index: {
                  type: "string",
                  description: "Name of the index to create"
                },
                settings: {
                  type: "object",
                  description: "Index settings (shards, replicas, etc.)"
                },
                mappings: {
                  type: "object",
                  description: "Field mappings for the index"
                }
              },
              required: ["index"]
            }
          },
          {
            name: "opensearch_delete_index",
            description: "Delete an index from OpenSearch cluster",
            inputSchema: {
              type: "object",
              properties: {
                index: {
                  type: "string",
                  description: "Name of the index to delete"
                }
              },
              required: ["index"]
            }
          },
          {
            name: "opensearch_get_mapping",
            description: "Get the field mappings for one or more indices",
            inputSchema: {
              type: "object",
              properties: {
                index: {
                  type: "string",
                  description: "Index name (optional, gets mappings for all indices if not specified)"
                }
              }
            }
          },
          {
            name: "opensearch_put_mapping",
            description: "Update field mappings for an existing index",
            inputSchema: {
              type: "object",
              properties: {
                index: {
                  type: "string",
                  description: "Index name to update mappings for"
                },
                mappings: {
                  type: "object",
                  description: "New field mappings to add/update"
                }
              },
              required: ["index", "mappings"]
            }
          },

          // Cluster Management Tools
          {
            name: "opensearch_cluster_health",
            description: "Get OpenSearch cluster health status and statistics",
            inputSchema: {
              type: "object",
              properties: {
                index: {
                  type: "string",
                  description: "Specific index to check health for (optional)"
                },
                level: {
                  type: "string",
                  description: "Level of detail: cluster, indices, or shards",
                  enum: ["cluster", "indices", "shards"],
                  default: "cluster"
                },
                wait_for_status: {
                  type: "string",
                  description: "Wait for cluster to reach specific status",
                  enum: ["green", "yellow", "red"]
                },
                timeout: {
                  type: "string",
                  description: "Timeout for wait_for_status",
                  default: "30s"
                }
              }
            }
          },
          {
            name: "opensearch_cluster_stats",
            description: "Get comprehensive cluster statistics including nodes, indices, and usage metrics",
            inputSchema: {
              type: "object",
              properties: {}
            }
          },
          {
            name: "opensearch_index_stats",
            description: "Get detailed statistics for one or more indices",
            inputSchema: {
              type: "object",
              properties: {
                index: {
                  type: "string",
                  description: "Index name (optional, gets stats for all indices if not specified)"
                },
                metric: {
                  type: "string",
                  description: "Specific metric to retrieve",
                  enum: ["_all", "completion", "docs", "fielddata", "query_cache", "flush", "get", "indexing", "merge", "refresh", "search", "segments", "store", "warmer", "suggest"]
                }
              }
            }
          },
          {
            name: "opensearch_cluster_info",
            description: "Get basic cluster information including version and build details",
            inputSchema: {
              type: "object",
              properties: {}
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      await this.initializeOpenSearch();
      
      if (!this.opensearch) {
        throw new McpError(ErrorCode.InternalError, "OpenSearch client not initialized");
      }

      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "opensearch_search":
            return await this.handleSearch(args);
          case "opensearch_aggregate":
            return await this.handleAggregate(args);
          case "opensearch_count":
            return await this.handleCount(args);
          case "opensearch_index_document":
            return await this.handleIndexDocument(args);
          case "opensearch_bulk_index":
            return await this.handleBulkIndex(args);
          case "opensearch_get_document":
            return await this.handleGetDocument(args);
          case "opensearch_update_document":
            return await this.handleUpdateDocument(args);
          case "opensearch_delete_document":
            return await this.handleDeleteDocument(args);
          case "opensearch_list_indices":
            return await this.handleListIndices(args);
          case "opensearch_create_index":
            return await this.handleCreateIndex(args);
          case "opensearch_delete_index":
            return await this.handleDeleteIndex(args);
          case "opensearch_get_mapping":
            return await this.handleGetMapping(args);
          case "opensearch_put_mapping":
            return await this.handlePutMapping(args);
          case "opensearch_cluster_health":
            return await this.handleClusterHealth(args);
          case "opensearch_cluster_stats":
            return await this.handleClusterStats(args);
          case "opensearch_index_stats":
            return await this.handleIndexStats(args);
          case "opensearch_cluster_info":
            return await this.handleClusterInfo(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool ${name} failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  // Tool implementation methods
  private async handleSearch(args: any) {
    const searchParams: any = {
      index: args.index,
      size: args.size || 10,
      from: args.from || 0,
    };

    if (args.query) {
      searchParams.body = { query: args.query };
    } else if (args.q) {
      searchParams.q = args.q;
    }

    if (args.sort) searchParams.sort = args.sort;
    if (args._source !== undefined) searchParams._source = args._source;
    if (args.highlight) {
      if (!searchParams.body) searchParams.body = {};
      searchParams.body.highlight = args.highlight;
    }

    const result = await this.opensearch!.search(searchParams);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleAggregate(args: any) {
    const result = await this.opensearch!.aggregate(args.index, args.aggregations, args.query);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleCount(args: any) {
    const body = args.query ? { query: args.query } : undefined;
    const result = await this.opensearch!.count(args.index, body);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleIndexDocument(args: any) {
    const result = await this.opensearch!.index({
      index: args.index,
      id: args.id,
      body: args.document,
      refresh: args.refresh
    });
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleBulkIndex(args: any) {
    const result = await this.opensearch!.bulk({
      body: args.operations,
      refresh: args.refresh
    });
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetDocument(args: any) {
    const result = await this.opensearch!.get({
      index: args.index,
      id: args.id,
      _source: args._source
    });
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleUpdateDocument(args: any) {
    const body: any = {};
    if (args.doc) body.doc = args.doc;
    if (args.script) body.script = args.script;
    if (args.upsert) body.upsert = args.upsert;

    const result = await this.opensearch!.update({
      index: args.index,
      id: args.id,
      body,
      refresh: args.refresh
    });
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleDeleteDocument(args: any) {
    const result = await this.opensearch!.delete({
      index: args.index,
      id: args.id,
      refresh: args.refresh
    });
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleListIndices(args: any) {
    const result = await this.opensearch!.catIndices(args);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleCreateIndex(args: any) {
    const result = await this.opensearch!.createIndex(args.index, args.settings, args.mappings);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleDeleteIndex(args: any) {
    const result = await this.opensearch!.deleteIndex(args.index);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetMapping(args: any) {
    const result = await this.opensearch!.getMapping(args.index);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handlePutMapping(args: any) {
    const result = await this.opensearch!.putMapping(args.index, args.mappings);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleClusterHealth(args: any) {
    const result = await this.opensearch!.clusterHealth(args.index, args);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleClusterStats(args: any) {
    const result = await this.opensearch!.clusterStats();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleIndexStats(args: any) {
    const result = await this.opensearch!.indexStats(args.index);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleClusterInfo(args: any) {
    const result = await this.opensearch!.info();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  /**
   * Setup resource handlers for OpenSearch data access
   */
  private setupResourceHandlers(): void {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: "opensearch://cluster/info",
            name: "Cluster Information",
            description: "Basic OpenSearch cluster information and version details",
            mimeType: "application/json"
          },
          {
            uri: "opensearch://cluster/health",
            name: "Cluster Health",
            description: "Current health status of the OpenSearch cluster",
            mimeType: "application/json"
          },
          {
            uri: "opensearch://indices/list",
            name: "Indices List",
            description: "List of all indices in the cluster with their statistics",
            mimeType: "application/json"
          }
        ]
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      await this.initializeOpenSearch();
      
      if (!this.opensearch) {
        throw new McpError(ErrorCode.InternalError, "OpenSearch client not initialized");
      }

      const { uri } = request.params;

      try {
        let data: any;
        
        switch (uri) {
          case "opensearch://cluster/info":
            data = await this.opensearch.info();
            break;
          case "opensearch://cluster/health":
            data = await this.opensearch.clusterHealth();
            break;
          case "opensearch://indices/list":
            data = await this.opensearch.catIndices();
            break;
          default:
            throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
        }

        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(data, null, 2)
            }
          ]
        };
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to read resource ${uri}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  /**
   * Setup prompt handlers for common OpenSearch operations
   */
  private setupPromptHandlers(): void {
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: "opensearch_query_builder",
            description: "Help build OpenSearch queries with proper syntax and best practices",
            arguments: [
              {
                name: "search_terms",
                description: "What you want to search for",
                required: true
              },
              {
                name: "index_pattern",
                description: "Index pattern to search in (e.g., 'logs-*', 'app-data')",
                required: false
              },
              {
                name: "filters",
                description: "Additional filters to apply (JSON format)",
                required: false
              }
            ]
          },
          {
            name: "opensearch_aggregation_builder",
            description: "Help build OpenSearch aggregation queries for analytics",
            arguments: [
              {
                name: "metric_type",
                description: "Type of aggregation (avg, sum, count, terms, date_histogram, etc.)",
                required: true
              },
              {
                name: "field_name",
                description: "Field to aggregate on",
                required: true
              },
              {
                name: "index_pattern",
                description: "Index pattern to aggregate data from",
                required: false
              }
            ]
          },
          {
            name: "opensearch_mapping_design",
            description: "Help design optimal field mappings for OpenSearch indices",
            arguments: [
              {
                name: "data_sample",
                description: "Sample of the data you want to index (JSON format)",
                required: true
              },
              {
                name: "use_case",
                description: "How you plan to search/analyze this data",
                required: false
              }
            ]
          }
        ]
      };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "opensearch_query_builder":
          return {
            description: "OpenSearch Query Builder",
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Help me build an OpenSearch query to search for: "${args?.search_terms}"
${args?.index_pattern ? `in indices matching: ${args.index_pattern}` : ''}
${args?.filters ? `with additional filters: ${args.filters}` : ''}

Please provide:
1. A basic query using query string syntax
2. A more advanced query using Query DSL
3. Best practices for performance
4. Suggestions for improving search relevance`
                }
              }
            ]
          };

        case "opensearch_aggregation_builder":
          return {
            description: "OpenSearch Aggregation Builder",
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Help me build an OpenSearch aggregation query:
- Metric type: ${args?.metric_type}
- Field: ${args?.field_name}
${args?.index_pattern ? `- Index pattern: ${args.index_pattern}` : ''}

Please provide:
1. The aggregation query in JSON format
2. Explanation of what this aggregation does
3. Performance considerations
4. Suggestions for additional useful aggregations`
                }
              }
            ]
          };

        case "opensearch_mapping_design":
          return {
            description: "OpenSearch Mapping Design",
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Help me design optimal field mappings for this data:

Data sample:
${args?.data_sample}

${args?.use_case ? `Use case: ${args.use_case}` : ''}

Please provide:
1. Recommended field mappings in JSON format
2. Explanation of mapping choices
3. Index settings recommendations
4. Performance and storage considerations`
                }
              }
            ]
          };

        default:
          throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt: ${name}`);
      }
    });
  }

  /**
   * Start the MCP server
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down OpenSearch MCP server...');
      if (this.opensearch) {
        await this.opensearch.close();
      }
      process.exit(0);
    });
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    const server = new OpenSearchMCPServer();
    await server.run();
  } catch (error) {
    console.error("Failed to start OpenSearch MCP server:", error);
    process.exit(1);
  }
}

// Run the server if this is the main module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] && (process.argv[1] === __filename || process.argv[1].endsWith('index.js'))) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}