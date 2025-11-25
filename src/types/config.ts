import type { ZodError } from 'zod';
import { z } from 'zod';

/**
 * OpenSearch Single Cluster Configuration Schema
 */
export const OpenSearchClusterConfigSchema = z.object({
  // Connection settings
  node: z.string().url().describe('OpenSearch cluster endpoint URL'),
  nodes: z.array(z.string().url()).optional().describe('Multiple cluster nodes for load balancing'),
  
  // Authentication
  auth: z.object({
    username: z.string().optional(),
    password: z.string().optional(),
    apiKey: z.string().optional(),
    awsRegion: z.string().optional(),
    awsService: z.string().optional(),
  }).optional(),
  
  // SSL/TLS settings
  ssl: z.object({
    rejectUnauthorized: z.boolean().default(true),
    ca: z.string().optional(),
    cert: z.string().optional(),
    key: z.string().optional(),
    caCertPath: z.string().optional(),
    caBundle: z.string().optional(),
  }).optional(),
  
  // Connection options
  requestTimeout: z.number().default(30000),
  pingTimeout: z.number().default(3000),
  maxRetries: z.number().default(3),
  compression: z.boolean().default(false),
  
  // Index settings
  defaultIndex: z.string().optional(),
  indexPrefix: z.string().optional(),
});

export type OpenSearchClusterConfig = z.infer<typeof OpenSearchClusterConfigSchema>;

/**
 * Multi-Cluster Configuration Schema
 */
export const OpenSearchConfigSchema = z.object({
  clusters: z.record(z.string(), OpenSearchClusterConfigSchema).describe('Named cluster configurations'),
});

export type OpenSearchConfig = z.infer<typeof OpenSearchConfigSchema>;

/**
 * Backward compatibility: Legacy single cluster config
 */
export const LegacyOpenSearchConfigSchema = OpenSearchClusterConfigSchema;
export type LegacyOpenSearchConfig = OpenSearchClusterConfig;

/**
 * Validate multi-cluster configuration
 */
export function validateConfig(config: unknown): OpenSearchConfig {
  try {
    // Try multi-cluster format first
    return OpenSearchConfigSchema.parse(config);
  } catch (multiClusterError) {
    // Try legacy single cluster format for backward compatibility
    try {
      const legacyConfig = LegacyOpenSearchConfigSchema.parse(config);
      // Convert to multi-cluster format with 'default' cluster
      return {
        clusters: {
          default: legacyConfig
        }
      };
    } catch (legacyError) {
      // Return original multi-cluster error
      if (multiClusterError instanceof z.ZodError) {
        const issues = (multiClusterError as ZodError).issues.map((issue: any) => 
          `${issue.path.join('.')}: ${issue.message}`
        );
        throw new Error(`Invalid OpenSearch configuration:\n${issues.join('\n')}`);
      }
      throw multiClusterError;
    }
  }
}

/**
 * Create multi-cluster configuration from environment variables
 * 
 * Supports multiple formats:
 * 1. Individual cluster env vars: OPENSEARCH_CLUSTER_NAME, OPENSEARCH_URL, etc.
 * 2. Legacy format: OPENSEARCH_URL creates "default" cluster
 * 3. JSON format (deprecated): OPENSEARCH_CLUSTERS
 */
export function createConfigFromEnv(): Partial<OpenSearchConfig> {
  const clusters: Record<string, any> = {};
  
  // Check for cluster name - user can define their own cluster
  const clusterName = process.env.OPENSEARCH_CLUSTER_NAME;
  
  if (clusterName && (process.env.OPENSEARCH_URL || process.env.OPENSEARCH_NODE)) {
    // User-defined cluster with specific name
    clusters[clusterName] = {
      node: process.env.OPENSEARCH_URL || process.env.OPENSEARCH_NODE,
      nodes: process.env.OPENSEARCH_NODES ? process.env.OPENSEARCH_NODES.split(',') : undefined,
      auth: {
        username: process.env.OPENSEARCH_USERNAME,
        password: process.env.OPENSEARCH_PASSWORD,
        apiKey: process.env.OPENSEARCH_API_KEY,
        awsRegion: process.env.AWS_REGION,
        awsService: process.env.AWS_SERVICE || 'es',
      },
      ssl: {
        rejectUnauthorized: process.env.OPENSEARCH_REJECT_UNAUTHORIZED !== 'false',
        caCertPath: process.env.OPENSEARCH_CA_CERT_PATH,
        caBundle: process.env.OPENSEARCH_CA_BUNDLE,
      },
      requestTimeout: process.env.OPENSEARCH_REQUEST_TIMEOUT ? 
        parseInt(process.env.OPENSEARCH_REQUEST_TIMEOUT) : undefined,
      defaultIndex: process.env.OPENSEARCH_DEFAULT_INDEX,
      indexPrefix: process.env.OPENSEARCH_INDEX_PREFIX,
    };
    
    return { clusters };
  }
  
  // Check for multi-cluster JSON configuration (deprecated but supported)
  if (process.env.OPENSEARCH_CLUSTERS) {
    try {
      const clustersConfig = JSON.parse(process.env.OPENSEARCH_CLUSTERS);
      return {
        clusters: clustersConfig
      };
    } catch (error) {
      console.warn('Failed to parse OPENSEARCH_CLUSTERS JSON, falling back to legacy format');
    }
  }
  
  // Legacy single cluster format - create default cluster
  if (process.env.OPENSEARCH_URL || process.env.OPENSEARCH_NODE) {
    clusters.default = {
      node: process.env.OPENSEARCH_URL || process.env.OPENSEARCH_NODE,
      nodes: process.env.OPENSEARCH_NODES ? process.env.OPENSEARCH_NODES.split(',') : undefined,
      auth: {
        username: process.env.OPENSEARCH_USERNAME,
        password: process.env.OPENSEARCH_PASSWORD,
        apiKey: process.env.OPENSEARCH_API_KEY,
        awsRegion: process.env.AWS_REGION,
        awsService: process.env.AWS_SERVICE || 'es',
      },
      ssl: {
        rejectUnauthorized: process.env.OPENSEARCH_REJECT_UNAUTHORIZED !== 'false',
        caCertPath: process.env.OPENSEARCH_CA_CERT_PATH,
        caBundle: process.env.OPENSEARCH_CA_BUNDLE,
      },
      requestTimeout: process.env.OPENSEARCH_REQUEST_TIMEOUT ? 
        parseInt(process.env.OPENSEARCH_REQUEST_TIMEOUT) : undefined,
      defaultIndex: process.env.OPENSEARCH_DEFAULT_INDEX,
      indexPrefix: process.env.OPENSEARCH_INDEX_PREFIX,
    };
    
    return { clusters };
  }
  
  return { clusters: {} };
}