import { Client } from '@opensearch-project/opensearch';
import * as fs from 'fs';
import * as https from 'https';
import { OpenSearchConfig } from '../types/config.js';
import {
  BulkRequest,
  BulkResponse,
  CatIndicesResponse,
  ClusterHealthResponse,
  ClusterStatsResponse,
  DeleteRequest,
  DeleteResponse,
  GetRequest,
  GetResponse,
  IndexRequest,
  IndexResponse,
  IndexSettings,
  IndexStats,
  Mapping,
  SearchRequest,
  SearchResponse,
  UpdateRequest
} from '../types/opensearch.js';

/**
 * OpenSearch API Client
 * 
 * Provides methods to interact with OpenSearch clusters
 */
export class OpenSearchClient {
  private client: Client;
  private config: OpenSearchConfig;

  constructor(config: OpenSearchConfig) {
    this.config = config;
    this.client = this.createClient(config);
  }

  /**
   * Create OpenSearch client with proper configuration
   */
  private createClient(config: OpenSearchConfig): Client {
    const clientConfig: any = {
      node: config.node,
      nodes: config.nodes,
      requestTimeout: config.requestTimeout,
      pingTimeout: config.pingTimeout,
      maxRetries: config.maxRetries,
      compression: config.compression,
    };

    // Handle authentication
    if (config.auth) {
      if (config.auth.username && config.auth.password) {
        clientConfig.auth = {
          username: config.auth.username,
          password: config.auth.password,
        };
      } else if (config.auth.apiKey) {
        clientConfig.auth = {
          apiKey: config.auth.apiKey,
        };
      }

      // AWS authentication (if using AWS OpenSearch Service)
      if (config.auth.awsRegion) {
        const AWS = require('aws-sdk');
        const awsCredentials = new AWS.Config();
        
        clientConfig.auth = {
          credentials: awsCredentials.credentials,
          region: config.auth.awsRegion,
          service: config.auth.awsService || 'es',
        };
      }
    }

    // Handle SSL configuration
    if (config.ssl && config.node?.startsWith('https')) {
      const agentOptions: https.AgentOptions = {
        rejectUnauthorized: config.ssl.rejectUnauthorized,
      };

      // Handle CA certificate from file
      if (config.ssl.caCertPath) {
        try {
          const caCert = fs.readFileSync(config.ssl.caCertPath, 'utf8');
          agentOptions.ca = caCert;
        } catch (error) {
          console.warn(`Warning: Could not read CA certificate file ${config.ssl.caCertPath}: ${error}`);
        }
      }

      // Handle CA bundle from string
      if (config.ssl.caBundle) {
        agentOptions.ca = config.ssl.caBundle;
      }

      // Handle client certificate
      if (config.ssl.cert) {
        agentOptions.cert = config.ssl.cert;
      }

      // Handle client key
      if (config.ssl.key) {
        agentOptions.key = config.ssl.key;
      }

      clientConfig.ssl = agentOptions;
    }

    return new Client(clientConfig);
  }

  /**
   * Test connection to OpenSearch cluster
   */
  async ping(): Promise<boolean> {
    try {
      const response = await this.client.ping();
      return response.statusCode === 200;
    } catch (error) {
      console.error('OpenSearch ping failed:', error);
      return false;
    }
  }

  /**
   * Get cluster information
   */
  async info(): Promise<any> {
    try {
      const response = await this.client.info();
      return response.body;
    } catch (error) {
      console.error('Failed to get cluster info:', error);
      throw error;
    }
  }

  /**
   * Get cluster health
   */
  async clusterHealth(index?: string, params?: any): Promise<ClusterHealthResponse> {
    try {
      const response = await this.client.cluster.health({
        index,
        ...params,
      });
      return response.body as ClusterHealthResponse;
    } catch (error) {
      console.error('Failed to get cluster health:', error);
      throw error;
    }
  }

  /**
   * Get cluster statistics
   */
  async clusterStats(): Promise<ClusterStatsResponse> {
    try {
      const response = await this.client.cluster.stats();
      return response.body as ClusterStatsResponse;
    } catch (error) {
      console.error('Failed to get cluster stats:', error);
      throw error;
    }
  }

  /**
   * Search documents
   */
  async search<T = any>(params: SearchRequest): Promise<SearchResponse<T>> {
    try {
      const searchParams: any = {
        index: params.index || this.config.defaultIndex,
        body: params.body,
        size: params.size,
        from: params.from,
        sort: params.sort,
        _source: params._source,
        q: params.q,
        timeout: params.timeout,
        scroll: params.scroll,
        ...params,
      };

      // Apply index prefix if configured
      if (this.config.indexPrefix && searchParams.index) {
        if (Array.isArray(searchParams.index)) {
          searchParams.index = searchParams.index.map((idx: string) => 
            idx.startsWith(this.config.indexPrefix!) ? idx : `${this.config.indexPrefix}${idx}`
          );
        } else if (typeof searchParams.index === 'string') {
          searchParams.index = searchParams.index.startsWith(this.config.indexPrefix) 
            ? searchParams.index 
            : `${this.config.indexPrefix}${searchParams.index}`;
        }
      }

      const response = await this.client.search(searchParams);
      return response.body as SearchResponse<T>;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  /**
   * Index a document
   */
  async index<T = any>(params: IndexRequest<T>): Promise<IndexResponse> {
    try {
      const indexParams: any = {
        index: this.applyIndexPrefix(params.index),
        id: params.id,
        body: params.body,
        refresh: params.refresh,
        routing: params.routing,
        timeout: params.timeout,
        pipeline: params.pipeline,
      };

      const response = await this.client.index(indexParams);
      return response.body as IndexResponse;
    } catch (error) {
      console.error('Index operation failed:', error);
      throw error;
    }
  }

  /**
   * Bulk operations
   */
  async bulk(params: BulkRequest): Promise<BulkResponse> {
    try {
      const bulkParams: any = {
        index: params.index ? this.applyIndexPrefix(params.index) : undefined,
        body: params.body,
        refresh: params.refresh,
        routing: params.routing,
        timeout: params.timeout,
        pipeline: params.pipeline,
      };

      const response = await this.client.bulk(bulkParams);
      return response.body as BulkResponse;
    } catch (error) {
      console.error('Bulk operation failed:', error);
      throw error;
    }
  }

  /**
   * Get a document by ID
   */
  async get<T = any>(params: GetRequest): Promise<GetResponse<T>> {
    try {
      const getParams: any = {
        index: this.applyIndexPrefix(params.index),
        id: params.id,
        _source: params._source,
        routing: params.routing,
      };

      const response = await this.client.get(getParams);
      return response.body as GetResponse<T>;
    } catch (error) {
      console.error('Get operation failed:', error);
      throw error;
    }
  }

  /**
   * Delete a document by ID
   */
  async delete(params: DeleteRequest): Promise<DeleteResponse> {
    try {
      const deleteParams: any = {
        index: this.applyIndexPrefix(params.index),
        id: params.id,
        refresh: params.refresh,
        routing: params.routing,
        timeout: params.timeout,
      };

      const response = await this.client.delete(deleteParams);
      return response.body as DeleteResponse;
    } catch (error) {
      console.error('Delete operation failed:', error);
      throw error;
    }
  }

  /**
   * Update a document
   */
  async update<T = any>(params: UpdateRequest<T>): Promise<any> {
    try {
      const updateParams: any = {
        index: this.applyIndexPrefix(params.index),
        id: params.id,
        body: params.body,
        refresh: params.refresh,
        routing: params.routing,
        timeout: params.timeout,
        retry_on_conflict: params.retry_on_conflict,
      };

      const response = await this.client.update(updateParams);
      return response.body;
    } catch (error) {
      console.error('Update operation failed:', error);
      throw error;
    }
  }

  /**
   * List all indices
   */
  async catIndices(params?: any): Promise<CatIndicesResponse[]> {
    try {
      const response = await this.client.cat.indices({
        format: 'json',
        ...params,
      });
      return response.body as CatIndicesResponse[];
    } catch (error) {
      console.error('Failed to list indices:', error);
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async indexStats(index?: string): Promise<IndexStats> {
    try {
      const response = await this.client.indices.stats({
        index: index ? this.applyIndexPrefix(index) : undefined,
      });
      return response.body as IndexStats;
    } catch (error) {
      console.error('Failed to get index stats:', error);
      throw error;
    }
  }

  /**
   * Create an index
   */
  async createIndex(index: string, settings?: IndexSettings, mappings?: Mapping): Promise<any> {
    try {
      const body: any = {};
      if (settings) body.settings = settings;
      if (mappings) body.mappings = mappings;

      const response = await this.client.indices.create({
        index: this.applyIndexPrefix(index),
        body: Object.keys(body).length > 0 ? body : undefined,
      });
      return response.body;
    } catch (error) {
      console.error('Failed to create index:', error);
      throw error;
    }
  }

  /**
   * Delete an index
   */
  async deleteIndex(index: string): Promise<any> {
    try {
      const response = await this.client.indices.delete({
        index: this.applyIndexPrefix(index),
      });
      return response.body;
    } catch (error) {
      console.error('Failed to delete index:', error);
      throw error;
    }
  }

  /**
   * Check if index exists
   */
  async indexExists(index: string): Promise<boolean> {
    try {
      const response = await this.client.indices.exists({
        index: this.applyIndexPrefix(index),
      });
      return response.statusCode === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get index mapping
   */
  async getMapping(index?: string): Promise<any> {
    try {
      const response = await this.client.indices.getMapping({
        index: index ? this.applyIndexPrefix(index) : undefined,
      });
      return response.body;
    } catch (error) {
      console.error('Failed to get mapping:', error);
      throw error;
    }
  }

  /**
   * Put index mapping
   */
  async putMapping(index: string, mapping: Mapping): Promise<any> {
    try {
      const response = await this.client.indices.putMapping({
        index: this.applyIndexPrefix(index),
        body: mapping,
      });
      return response.body;
    } catch (error) {
      console.error('Failed to put mapping:', error);
      throw error;
    }
  }

  /**
   * Refresh indices
   */
  async refresh(index?: string): Promise<any> {
    try {
      const response = await this.client.indices.refresh({
        index: index ? this.applyIndexPrefix(index) : undefined,
      });
      return response.body;
    } catch (error) {
      console.error('Failed to refresh indices:', error);
      throw error;
    }
  }

  /**
   * Count documents
   */
  async count(index?: string, body?: any): Promise<{ count: number }> {
    try {
      const response = await this.client.count({
        index: index ? this.applyIndexPrefix(index) : undefined,
        body,
      });
      return response.body as { count: number };
    } catch (error) {
      console.error('Count operation failed:', error);
      throw error;
    }
  }

  /**
   * Execute aggregation query
   */
  async aggregate(index: string, aggregations: any, query?: any): Promise<any> {
    try {
      const body: any = {
        aggs: aggregations,
        size: 0, // Only return aggregation results
      };

      if (query) {
        body.query = query;
      }

      const response = await this.search({
        index,
        body,
      });

      return response.aggregations;
    } catch (error) {
      console.error('Aggregation failed:', error);
      throw error;
    }
  }

  /**
   * Apply index prefix if configured
   */
  private applyIndexPrefix(index: string): string {
    if (this.config.indexPrefix && !index.startsWith(this.config.indexPrefix)) {
      return `${this.config.indexPrefix}${index}`;
    }
    return index;
  }

  /**
   * Close the client connection
   */
  async close(): Promise<void> {
    await this.client.close();
  }
}