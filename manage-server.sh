#!/bin/bash

# OpenSearch MCP Server Management Script
# This script provides easy management of the OpenSearch MCP Server

set -e

SERVICE_NAME="opensearch-mcp"
CONFIG_DIR="/etc/opensearch-mcp-server"
LOG_DIR="/var/log/opensearch-mcp-server"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    echo -e "${BLUE}$1${NC}"
}

# Show service status
show_status() {
    print_header "=== OpenSearch MCP Server Status ==="
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        print_status "Service is running"
    else
        print_error "Service is not running"
    fi
    
    echo
    systemctl status "$SERVICE_NAME" --no-pager
}

# Start the service
start_service() {
    print_status "Starting OpenSearch MCP Server..."
    sudo systemctl start "$SERVICE_NAME"
    sleep 2
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        print_status "Service started successfully"
    else
        print_error "Failed to start service"
        exit 1
    fi
}

# Stop the service
stop_service() {
    print_status "Stopping OpenSearch MCP Server..."
    sudo systemctl stop "$SERVICE_NAME"
    print_status "Service stopped"
}

# Restart the service
restart_service() {
    print_status "Restarting OpenSearch MCP Server..."
    sudo systemctl restart "$SERVICE_NAME"
    sleep 2
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        print_status "Service restarted successfully"
    else
        print_error "Failed to restart service"
        exit 1
    fi
}

# Show logs
show_logs() {
    local lines="${1:-50}"
    print_header "=== OpenSearch MCP Server Logs (last $lines lines) ==="
    journalctl -u "$SERVICE_NAME" -n "$lines" --no-pager
}

# Follow logs
follow_logs() {
    print_header "=== Following OpenSearch MCP Server Logs ==="
    print_status "Press Ctrl+C to stop"
    journalctl -u "$SERVICE_NAME" -f
}

# Edit configuration
edit_config() {
    if [[ -f "$CONFIG_DIR/config" ]]; then
        print_status "Opening configuration file..."
        ${EDITOR:-nano} "$CONFIG_DIR/config"
    else
        print_error "Configuration file not found at $CONFIG_DIR/config"
        exit 1
    fi
}

# Show configuration
show_config() {
    print_header "=== OpenSearch MCP Server Configuration ==="
    if [[ -f "$CONFIG_DIR/config" ]]; then
        cat "$CONFIG_DIR/config"
    else
        print_error "Configuration file not found at $CONFIG_DIR/config"
        exit 1
    fi
}

# Test connection
test_connection() {
    print_status "Testing OpenSearch connection..."
    # This is a simple test - in reality you'd want to use the actual client
    echo "TODO: Implement connection test"
}

# Show help
show_help() {
    print_header "OpenSearch MCP Server Management Script"
    echo
    echo "Usage: $0 <command> [options]"
    echo
    echo "Commands:"
    echo "  status                Show service status"
    echo "  start                 Start the service"
    echo "  stop                  Stop the service"
    echo "  restart               Restart the service"
    echo "  logs [lines]          Show recent logs (default: 50 lines)"
    echo "  follow                Follow logs in real-time"
    echo "  config                Edit configuration file"
    echo "  show-config           Display current configuration"
    echo "  test                  Test OpenSearch connection"
    echo "  help                  Show this help message"
    echo
    echo "Examples:"
    echo "  $0 status             # Show current status"
    echo "  $0 logs 100           # Show last 100 log lines"
    echo "  $0 restart            # Restart the service"
    echo "  $0 follow             # Follow logs in real-time"
}

# Main function
main() {
    case "${1:-help}" in
        status)
            show_status
            ;;
        start)
            start_service
            ;;
        stop)
            stop_service
            ;;
        restart)
            restart_service
            ;;
        logs)
            show_logs "${2:-50}"
            ;;
        follow)
            follow_logs
            ;;
        config)
            edit_config
            ;;
        show-config)
            show_config
            ;;
        test)
            test_connection
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