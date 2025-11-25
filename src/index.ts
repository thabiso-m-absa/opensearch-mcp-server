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
 * - Support multiple OpenSearch clusters
 */
class OpenSearchMCPServer {
  private server: Server;
  private opensearchClients: Map<string, OpenSearchClient> = new Map();
  private config: any = null;

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
   * Initialize OpenSearch clients from configuration
   */
  private async initializeOpenSearch(): Promise<void> {
    if (this.opensearchClients.size > 0) {
      return; // Already initialized
    }

    try {
      // Get configuration from environment variables
      const envConfig = createConfigFromEnv();
      
      // Validate configuration
      this.config = validateConfig(envConfig);
      
      // Create clients for each cluster
      for (const [clusterName, clusterConfig] of Object.entries(this.config.clusters)) {
        const client = new OpenSearchClient(clusterConfig as any);
        
        // Test connection
        const isConnected = await client.ping();
        if (!isConnected) {
          console.warn(`Warning: Failed to connect to OpenSearch cluster '${clusterName}'`);
          continue;
        }
        
        this.opensearchClients.set(clusterName, client);
        console.log(`Successfully connected to OpenSearch cluster '${clusterName}'`);
      }
      
      if (this.opensearchClients.size === 0) {
        throw new Error("Failed to connect to any OpenSearch cluster");
      }
      
      console.log(`Initialized ${this.opensearchClients.size} OpenSearch cluster(s)`);
    } catch (error) {
      console.error("Failed to initialize OpenSearch clients:", error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to initialize OpenSearch: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get OpenSearch client for specified cluster or first available
   */
  private getClient(clusterName?: string): OpenSearchClient {
    // If no cluster specified, use first available
    const targetCluster = clusterName || Array.from(this.opensearchClients.keys())[0];
    
    if (!targetCluster) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        "No clusters configured. Please configure at least one OpenSearch cluster."
      );
    }
    
    const client = this.opensearchClients.get(targetCluster);
    if (!client) {
      const availableClusters = Array.from(this.opensearchClients.keys()).join(', ');
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Cluster '${targetCluster}' not found. Available clusters: ${availableClusters}`
      );
    }
    
    return client;
  }

  /**
   * Get list of available clusters
   */
  private getAvailableClusters(): string[] {
    return Array.from(this.opensearchClients.keys());
  }

  /**
   * Setup tool handlers for OpenSearch operations
   */
  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const clusterParam = {
        cluster: {
          type: "string",
          description: "OpenSearch cluster name (optional, uses default cluster if not specified)"
        }
      };

      return {
        tools: [
          // Cluster Management Tool
          {
            name: "opensearch_list_clusters",
            description: "List all available OpenSearch clusters",
            inputSchema: {
              type: "object",
              properties: {}
            }
          },
          // Search and Query Tools
          {
            name: "opensearch_search",
            description: "Search for documents in OpenSearch indices using query DSL or simple query string",
            inputSchema: {
              type: "object",
              properties: {
                ...clusterParam,
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
                ...clusterParam,
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
                ...clusterParam,
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
                ...clusterParam,
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
                ...clusterParam,
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
                ...clusterParam,
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
                ...clusterParam,
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
                ...clusterParam,
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
                ...clusterParam,
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
                ...clusterParam,
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
                ...clusterParam,
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
                ...clusterParam,
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
                ...clusterParam,
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
                ...clusterParam,
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
              properties: {
                ...clusterParam
              }
            }
          },
          {
            name: "opensearch_index_stats",
            description: "Get detailed statistics for one or more indices",
            inputSchema: {
              type: "object",
              properties: {
                ...clusterParam,
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
              properties: {
                ...clusterParam
              }
            }
          },
          // Security Management Tools
          {
            name: "opensearch_create_user",
            description: "Create an internal user with password and optional attributes",
            inputSchema: {
              type: "object",
              properties: {
                ...clusterParam,
                username: {
                  type: "string",
                  description: "Username for the new user"
                },
                password: {
                  type: "string",
                  description: "Password for the new user"
                },
                attributes: {
                  type: "object",
                  description: "Optional user attributes (e.g., email, full_name)"
                }
              },
              required: ["username", "password"]
            }
          },
          {
            name: "opensearch_delete_user",
            description: "Delete an internal user",
            inputSchema: {
              type: "object",
              properties: {
                ...clusterParam,
                username: {
                  type: "string",
                  description: "Username to delete"
                }
              },
              required: ["username"]
            }
          },
          {
            name: "opensearch_get_user",
            description: "Get details of a specific user",
            inputSchema: {
              type: "object",
              properties: {
                ...clusterParam,
                username: {
                  type: "string",
                  description: "Username to retrieve"
                }
              },
              required: ["username"]
            }
          },
          {
            name: "opensearch_list_users",
            description: "List all internal users in the cluster",
            inputSchema: {
              type: "object",
              properties: {
                ...clusterParam
              }
            }
          },
          {
            name: "opensearch_create_role",
            description: "Create a role with specific permissions for indices and cluster operations",
            inputSchema: {
              type: "object",
              properties: {
                ...clusterParam,
                role_name: {
                  type: "string",
                  description: "Name for the new role"
                },
                permissions: {
                  type: "object",
                  description: "Role permissions definition including cluster_permissions, index_permissions, and tenant_permissions"
                }
              },
              required: ["role_name", "permissions"]
            }
          },
          {
            name: "opensearch_delete_role",
            description: "Delete a role from the cluster",
            inputSchema: {
              type: "object",
              properties: {
                ...clusterParam,
                role_name: {
                  type: "string",
                  description: "Role name to delete"
                }
              },
              required: ["role_name"]
            }
          },
          {
            name: "opensearch_get_role",
            description: "Get details of a specific role",
            inputSchema: {
              type: "object",
              properties: {
                ...clusterParam,
                role_name: {
                  type: "string",
                  description: "Role name to retrieve"
                }
              },
              required: ["role_name"]
            }
          },
          {
            name: "opensearch_list_roles",
            description: "List all roles in the cluster",
            inputSchema: {
              type: "object",
              properties: {
                ...clusterParam
              }
            }
          },
          {
            name: "opensearch_map_role",
            description: "Map a role to users, backend roles, or hosts",
            inputSchema: {
              type: "object",
              properties: {
                ...clusterParam,
                role_name: {
                  type: "string",
                  description: "Role name to map"
                },
                users: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of usernames to assign this role"
                },
                backend_roles: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of backend roles (e.g., LDAP groups) to assign this role"
                },
                hosts: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of host patterns to assign this role"
                }
              },
              required: ["role_name"]
            }
          },
          {
            name: "opensearch_get_role_mapping",
            description: "Get role mapping details for a specific role",
            inputSchema: {
              type: "object",
              properties: {
                ...clusterParam,
                role_name: {
                  type: "string",
                  description: "Role name to retrieve mapping for"
                }
              },
              required: ["role_name"]
            }
          },
          {
            name: "opensearch_list_role_mappings",
            description: "List all role mappings in the cluster",
            inputSchema: {
              type: "object",
              properties: {
                ...clusterParam
              }
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      await this.initializeOpenSearch();
      
      if (this.opensearchClients.size === 0) {
        throw new McpError(ErrorCode.InternalError, "OpenSearch clients not initialized");
      }

      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "opensearch_list_clusters":
            return await this.handleListClusters(args);
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
          // Security Management Tools
          case "opensearch_create_user":
            return await this.handleCreateUser(args);
          case "opensearch_delete_user":
            return await this.handleDeleteUser(args);
          case "opensearch_get_user":
            return await this.handleGetUser(args);
          case "opensearch_list_users":
            return await this.handleListUsers(args);
          case "opensearch_create_role":
            return await this.handleCreateRole(args);
          case "opensearch_delete_role":
            return await this.handleDeleteRole(args);
          case "opensearch_get_role":
            return await this.handleGetRole(args);
          case "opensearch_list_roles":
            return await this.handleListRoles(args);
          case "opensearch_map_role":
            return await this.handleMapRole(args);
          case "opensearch_get_role_mapping":
            return await this.handleGetRoleMapping(args);
          case "opensearch_list_role_mappings":
            return await this.handleListRoleMappings(args);
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
  private async handleListClusters(args: any) {
    const clusters = this.getAvailableClusters();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            clusters: clusters,
            count: clusters.length
          }, null, 2)
        }
      ]
    };
  }

  private async handleSearch(args: any) {
    const client = this.getClient(args.cluster);
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

    const result = await client.search(searchParams);
    
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
    const client = this.getClient(args.cluster);
    const result = await client.aggregate(args.index, args.aggregations, args.query);
    
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
    const client = this.getClient(args.cluster);
    const body = args.query ? { query: args.query } : undefined;
    const result = await client.count(args.index, body);
    
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
    const client = this.getClient(args.cluster);
    const result = await client.index({
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
    const client = this.getClient(args.cluster);
    const result = await client.bulk({
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
    const client = this.getClient(args.cluster);
    const result = await client.get({
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
    const client = this.getClient(args.cluster);
    const body: any = {};
    if (args.doc) body.doc = args.doc;
    if (args.script) body.script = args.script;
    if (args.upsert) body.upsert = args.upsert;

    const result = await client.update({
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
    const client = this.getClient(args.cluster);
    const result = await client.delete({
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
    const client = this.getClient(args.cluster);
    const result = await client.catIndices(args);
    
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
    const client = this.getClient(args.cluster);
    const result = await client.createIndex(args.index, args.settings, args.mappings);
    
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
    const client = this.getClient(args.cluster);
    const result = await client.deleteIndex(args.index);
    
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
    const client = this.getClient(args.cluster);
    const result = await client.getMapping(args.index);
    
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
    const client = this.getClient(args.cluster);
    const result = await client.putMapping(args.index, args.mappings);
    
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
    const client = this.getClient(args.cluster);
    const result = await client.clusterHealth(args.index, args);
    
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
    const client = this.getClient(args.cluster);
    const result = await client.clusterStats();
    
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
    const client = this.getClient(args.cluster);
    const result = await client.indexStats(args.index);
    
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
    const client = this.getClient(args.cluster);
    const result = await client.info();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // ============================================
  // Security Management Handlers
  // ============================================

  private async handleCreateUser(args: any) {
    const client = this.getClient(args.cluster);
    const result = await client.createUser(args.username, args.password, args.attributes);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            message: `User '${args.username}' created successfully`,
            details: result
          }, null, 2)
        }
      ]
    };
  }

  private async handleDeleteUser(args: any) {
    const client = this.getClient(args.cluster);
    const result = await client.deleteUser(args.username);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            message: `User '${args.username}' deleted successfully`,
            details: result
          }, null, 2)
        }
      ]
    };
  }

  private async handleGetUser(args: any) {
    const client = this.getClient(args.cluster);
    const result = await client.getUser(args.username);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleListUsers(args: any) {
    const client = this.getClient(args.cluster);
    const result = await client.listUsers();
    
    const users = Object.keys(result);
    const summary = {
      total_users: users.length,
      users: users,
      details: result
    };
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(summary, null, 2)
        }
      ]
    };
  }

  private async handleCreateRole(args: any) {
    const client = this.getClient(args.cluster);
    const result = await client.createRole(args.role_name, args.permissions);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            message: `Role '${args.role_name}' created successfully`,
            details: result
          }, null, 2)
        }
      ]
    };
  }

  private async handleDeleteRole(args: any) {
    const client = this.getClient(args.cluster);
    const result = await client.deleteRole(args.role_name);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            message: `Role '${args.role_name}' deleted successfully`,
            details: result
          }, null, 2)
        }
      ]
    };
  }

  private async handleGetRole(args: any) {
    const client = this.getClient(args.cluster);
    const result = await client.getRole(args.role_name);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleListRoles(args: any) {
    const client = this.getClient(args.cluster);
    const result = await client.listRoles();
    
    const roles = Object.keys(result);
    const summary = {
      total_roles: roles.length,
      roles: roles,
      details: result
    };
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(summary, null, 2)
        }
      ]
    };
  }

  private async handleMapRole(args: any) {
    const client = this.getClient(args.cluster);
    const result = await client.createRoleMapping(
      args.role_name,
      args.users,
      args.backend_roles,
      args.hosts
    );
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            message: `Role mapping for '${args.role_name}' created successfully`,
            details: result
          }, null, 2)
        }
      ]
    };
  }

  private async handleGetRoleMapping(args: any) {
    const client = this.getClient(args.cluster);
    const result = await client.getRoleMapping(args.role_name);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleListRoleMappings(args: any) {
    const client = this.getClient(args.cluster);
    const result = await client.listRoleMappings();
    
    const mappings = Object.keys(result);
    const summary = {
      total_mappings: mappings.length,
      role_mappings: mappings,
      details: result
    };
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(summary, null, 2)
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
      
      if (this.opensearchClients.size === 0) {
        throw new McpError(ErrorCode.InternalError, "OpenSearch clients not initialized");
      }

      const client = this.getClient();
      const { uri } = request.params;

      try {
        let data: any;
        
        switch (uri) {
          case "opensearch://cluster/info":
            data = await client.info();
            break;
          case "opensearch://cluster/health":
            data = await client.clusterHealth();
            break;
          case "opensearch://indices/list":
            data = await client.catIndices();
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
      for (const [name, client] of this.opensearchClients) {
        console.log(`Closing connection to cluster '${name}'...`);
        await client.close();
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