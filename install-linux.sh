#!/bin/bash

# OpenSearch MCP Server Installation Script for Linux
# This script installs the OpenSearch MCP Server as a systemd service

set -e

# Configuration
SERVICE_NAME="opensearch-mcp"
SERVICE_USER="opensearch-mcp"
SERVICE_GROUP="opensearch-mcp"
INSTALL_DIR="/opt/opensearch-mcp-server"
CONFIG_DIR="/etc/opensearch-mcp-server"
LOG_DIR="/var/log/opensearch-mcp-server"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print functions
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        print_status "You can install Node.js using:"
        echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
        echo "  sudo apt-get install -y nodejs"
        exit 1
    fi
    
    # Check Node.js version
    node_version=$(node --version | cut -d'v' -f2)
    required_version="18.0.0"
    if ! printf '%s\n%s\n' "$required_version" "$node_version" | sort -V -C; then
        print_error "Node.js version $node_version is too old. Required: $required_version+"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check if systemctl is available
    if ! command -v systemctl &> /dev/null; then
        print_error "systemctl is not available. This script requires systemd."
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Create service user
create_service_user() {
    print_status "Creating service user and group..."
    
    if ! getent group "$SERVICE_GROUP" > /dev/null 2>&1; then
        groupadd --system "$SERVICE_GROUP"
        print_status "Created group: $SERVICE_GROUP"
    else
        print_warning "Group $SERVICE_GROUP already exists"
    fi
    
    if ! getent passwd "$SERVICE_USER" > /dev/null 2>&1; then
        useradd --system \
            --gid "$SERVICE_GROUP" \
            --create-home \
            --home-dir "$INSTALL_DIR" \
            --shell /bin/false \
            --comment "OpenSearch MCP Server" \
            "$SERVICE_USER"
        print_status "Created user: $SERVICE_USER"
    else
        print_warning "User $SERVICE_USER already exists"
    fi
}

# Create directories
create_directories() {
    print_status "Creating directories..."
    
    # Create installation directory
    mkdir -p "$INSTALL_DIR"
    chown "$SERVICE_USER:$SERVICE_GROUP" "$INSTALL_DIR"
    chmod 755 "$INSTALL_DIR"
    
    # Create configuration directory
    mkdir -p "$CONFIG_DIR"
    chown root:root "$CONFIG_DIR"
    chmod 755 "$CONFIG_DIR"
    
    # Create log directory
    mkdir -p "$LOG_DIR"
    chown "$SERVICE_USER:$SERVICE_GROUP" "$LOG_DIR"
    chmod 755 "$LOG_DIR"
    
    print_status "Directories created successfully"
}

# Install application
install_application() {
    print_status "Installing OpenSearch MCP Server..."
    
    # Copy application files
    if [[ -f "package.json" ]]; then
        # We're in the source directory
        print_status "Installing from source directory..."
        
        # Copy source files
        cp -r . "$INSTALL_DIR/"
        cd "$INSTALL_DIR"
        
        # Remove development files
        rm -rf .git .vscode scripts *.md
        
        # Install dependencies
        sudo -u "$SERVICE_USER" npm ci --only=production
        
        # Build the application
        sudo -u "$SERVICE_USER" npm run build
        
    else
        print_error "package.json not found. Please run this script from the project directory."
        exit 1
    fi
    
    # Set proper ownership
    chown -R "$SERVICE_USER:$SERVICE_GROUP" "$INSTALL_DIR"
    
    print_status "Application installed successfully"
}

# Install systemd service
install_service() {
    print_status "Installing systemd service..."
    
    # Copy service file
    if [[ -f "scripts/opensearch-mcp.service" ]]; then
        cp "scripts/opensearch-mcp.service" "$SERVICE_FILE"
    else
        print_error "Service file not found at scripts/opensearch-mcp.service"
        exit 1
    fi
    
    # Set proper permissions
    chmod 644 "$SERVICE_FILE"
    
    # Reload systemd
    systemctl daemon-reload
    
    print_status "Systemd service installed successfully"
}

# Create configuration file
create_config() {
    print_status "Creating configuration file..."
    
    cat > "$CONFIG_DIR/config" << EOF
# OpenSearch MCP Server Configuration
# Edit these values according to your environment

# OpenSearch Connection
OPENSEARCH_URL=https://localhost:9200
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=admin

# SSL/TLS Configuration
OPENSEARCH_REJECT_UNAUTHORIZED=false

# Connection Settings
OPENSEARCH_REQUEST_TIMEOUT=30000
OPENSEARCH_PING_TIMEOUT=3000
OPENSEARCH_MAX_RETRIES=3

# Index Configuration
OPENSEARCH_DEFAULT_INDEX=logs-*

# Logging
NODE_ENV=production
EOF
    
    # Set proper permissions
    chown root:root "$CONFIG_DIR/config"
    chmod 600 "$CONFIG_DIR/config"
    
    print_status "Configuration file created at $CONFIG_DIR/config"
    print_warning "Please edit $CONFIG_DIR/config with your OpenSearch connection details"
}

# Enable and start service
enable_service() {
    print_status "Enabling and starting service..."
    
    # Enable service
    systemctl enable "$SERVICE_NAME"
    
    # Start service
    systemctl start "$SERVICE_NAME"
    
    # Check status
    sleep 2
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        print_status "Service started successfully"
    else
        print_error "Service failed to start. Check logs with: journalctl -u $SERVICE_NAME"
        exit 1
    fi
}

# Main installation function
main() {
    print_status "Starting OpenSearch MCP Server installation..."
    
    check_root
    check_prerequisites
    create_service_user
    create_directories
    install_application
    install_service
    create_config
    enable_service
    
    print_status "Installation completed successfully!"
    echo
    print_status "Next steps:"
    echo "1. Edit configuration: $CONFIG_DIR/config"
    echo "2. Restart service: systemctl restart $SERVICE_NAME"
    echo "3. Check status: systemctl status $SERVICE_NAME"
    echo "4. View logs: journalctl -u $SERVICE_NAME -f"
    echo
    print_status "Service commands:"
    echo "  Start:   systemctl start $SERVICE_NAME"
    echo "  Stop:    systemctl stop $SERVICE_NAME"
    echo "  Restart: systemctl restart $SERVICE_NAME"
    echo "  Status:  systemctl status $SERVICE_NAME"
    echo "  Logs:    journalctl -u $SERVICE_NAME -f"
}

# Run main function
main "$@"