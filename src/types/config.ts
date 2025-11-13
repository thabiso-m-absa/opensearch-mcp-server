import { z } from 'zod';
import type { ZodError } from 'zod';

/**
 * OpenSearch Configuration Schema
 */
export const OpenSearchConfigSchema = z.object({
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

export type OpenSearchConfig = z.infer<typeof OpenSearchConfigSchema>;

/**
 * Validate OpenSearch configuration
 */
export function validateConfig(config: unknown): OpenSearchConfig {
  try {
    return OpenSearchConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = (error as ZodError).issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`);
      throw new Error(`Invalid OpenSearch configuration:\n${issues.join('\n')}`);
    }
    throw error;
  }
}

/**
 * Create OpenSearch configuration from environment variables
 */
export function createConfigFromEnv(): Partial<OpenSearchConfig> {
  return {
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
}