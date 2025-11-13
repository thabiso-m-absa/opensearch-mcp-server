#!/bin/bash

# Docker deployment script for OpenSearch MCP Server

set -e

# Configuration
DOCKER_IMAGE_NAME="opensearch-mcp-server"
DOCKER_TAG="${1:-latest}"
COMPOSE_FILE="docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Build Docker image
build_image() {
    print_header "Building Docker Image"
    print_status "Building $DOCKER_IMAGE_NAME:$DOCKER_TAG..."
    
    docker build -t "$DOCKER_IMAGE_NAME:$DOCKER_TAG" .
    
    print_status "Docker image built successfully"
}

# Start services
start_services() {
    print_header "Starting Services"
    print_status "Starting services with docker-compose..."
    
    # Create logs directory
    mkdir -p logs
    chmod 755 logs
    
    # Start services
    docker-compose -f "$COMPOSE_FILE" up -d
    
    print_status "Services started successfully"
}

# Stop services
stop_services() {
    print_header "Stopping Services"
    print_status "Stopping services..."
    
    docker-compose -f "$COMPOSE_FILE" down
    
    print_status "Services stopped"
}

# Show status
show_status() {
    print_header "Service Status"
    docker-compose -f "$COMPOSE_FILE" ps
}

# Show logs
show_logs() {
    local service="${1:-opensearch-mcp-server}"
    local lines="${2:-50}"
    
    print_header "Service Logs: $service"
    docker-compose -f "$COMPOSE_FILE" logs --tail="$lines" "$service"
}

# Follow logs
follow_logs() {
    local service="${1:-opensearch-mcp-server}"
    
    print_header "Following Logs: $service"
    print_status "Press Ctrl+C to stop"
    docker-compose -f "$COMPOSE_FILE" logs -f "$service"
}

# Clean up
cleanup() {
    print_header "Cleaning Up"
    print_warning "This will remove all containers, volumes, and images"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Stopping and removing containers..."
        docker-compose -f "$COMPOSE_FILE" down -v --remove-orphans
        
        print_status "Removing Docker image..."
        docker rmi "$DOCKER_IMAGE_NAME:$DOCKER_TAG" 2>/dev/null || true
        
        print_status "Cleanup completed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Test connection
test_connection() {
    print_header "Testing Connection"
    print_status "Testing OpenSearch connection..."
    
    # Wait for services to be ready
    sleep 10
    
    # Test OpenSearch
    if curl -s http://localhost:9200 > /dev/null; then
        print_status "OpenSearch is accessible"
    else
        print_error "OpenSearch is not accessible"
    fi
    
    # Test OpenSearch Dashboards
    if curl -s http://localhost:5601 > /dev/null; then
        print_status "OpenSearch Dashboards is accessible"
    else
        print_error "OpenSearch Dashboards is not accessible"
    fi
}

# Environment setup
setup_env() {
    print_header "Environment Setup"
    
    if [[ ! -f ".env" ]]; then
        print_status "Creating .env file from template..."
        cat > .env << EOF
# OpenSearch MCP Server Environment Configuration

# OpenSearch Admin Password (required for production)
OPENSEARCH_ADMIN_PASSWORD=admin123!@#

# OpenSearch Connection
OPENSEARCH_URL=https://opensearch:9200
OPENSEARCH_USERNAME=admin
OPENSEARCH_REJECT_UNAUTHORIZED=false

# MCP Server Configuration
OPENSEARCH_REQUEST_TIMEOUT=30000
OPENSEARCH_DEFAULT_INDEX=logs-*

# Docker Configuration
COMPOSE_PROJECT_NAME=opensearch-mcp
EOF
        print_status "Environment file created: .env"
        print_warning "Please review and update the configuration in .env"
    else
        print_status "Environment file already exists: .env"
    fi
}

# Show help
show_help() {
    print_header "OpenSearch MCP Server Docker Management"
    echo
    echo "Usage: $0 <command> [options]"
    echo
    echo "Commands:"
    echo "  build [tag]           Build Docker image (default tag: latest)"
    echo "  start                 Start all services"
    echo "  stop                  Stop all services"
    echo "  restart               Restart all services"
    echo "  status                Show service status"
    echo "  logs [service] [lines] Show logs (default: opensearch-mcp-server, 50 lines)"
    echo "  follow [service]      Follow logs in real-time"
    echo "  test                  Test service connectivity"
    echo "  setup                 Setup environment configuration"
    echo "  cleanup               Remove all containers, volumes, and images"
    echo "  help                  Show this help message"
    echo
    echo "Services:"
    echo "  opensearch-mcp-server OpenSearch MCP Server"
    echo "  opensearch            OpenSearch cluster node"
    echo "  opensearch-dashboards OpenSearch Dashboards"
    echo
    echo "Examples:"
    echo "  $0 build              # Build the Docker image"
    echo "  $0 start              # Start all services"
    echo "  $0 logs opensearch 100 # Show last 100 lines of OpenSearch logs"
    echo "  $0 follow opensearch-mcp-server # Follow MCP server logs"
}

# Main function
main() {
    case "${1:-help}" in
        build)
            check_prerequisites
            build_image "$2"
            ;;
        start)
            check_prerequisites
            setup_env
            build_image
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            stop_services
            start_services
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$2" "$3"
            ;;
        follow)
            follow_logs "$2"
            ;;
        test)
            test_connection
            ;;
        setup)
            setup_env
            ;;
        cleanup)
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"