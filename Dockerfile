# OpenSearch MCP Server Docker Image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S opensearch && \
    adduser -S opensearch -u 1001 -G opensearch

# Install dependencies needed for node-gyp and native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Remove source files to reduce image size
RUN rm -rf src/ tsconfig.json

# Change ownership to non-root user
RUN chown -R opensearch:opensearch /app

# Switch to non-root user
USER opensearch

# Expose port (if needed for health checks)
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV OPENSEARCH_URL=https://localhost:9200
ENV OPENSEARCH_USERNAME=admin
ENV OPENSEARCH_PASSWORD=admin
ENV OPENSEARCH_REJECT_UNAUTHORIZED=false

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const { OpenSearchClient } = require('./build/opensearch/client.js'); \
                 const { createConfigFromEnv, validateConfig } = require('./build/types/config.js'); \
                 const config = validateConfig(createConfigFromEnv()); \
                 const client = new OpenSearchClient(config); \
                 client.ping().then(result => process.exit(result ? 0 : 1)).catch(() => process.exit(1));"

# Start the application
CMD ["node", "build/index.js"]