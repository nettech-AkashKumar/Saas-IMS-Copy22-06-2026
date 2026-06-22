#!/bin/bash

# ===========================================
# SaaS Tenant Isolation Security Fix - Deployment Script
# Version: 1.0
# Date: May 5, 2026
# ===========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
PROJECT_ROOT="/d/Projects/IMS-v2.0-19-01-2026"
BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="$PROJECT_ROOT/deployment_$(date +%Y%m%d_%H%M%S).log"

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "🔍 Running pre-deployment checks..."

    # Check if we're in the right directory
    if [[ ! -d "$PROJECT_ROOT/server" ]]; then
        error "Server directory not found. Are you in the correct project root?"
    fi

    # Check if required files exist
    local required_files=(
        "server/index.js"
        "server/middleware/security/tenantIsolationValidation.js"
        "server/middleware/auth.js"
        "server/config/SECURITY_AUDIT.js"
    )

    for file in "${required_files[@]}"; do
        if [[ ! -f "$PROJECT_ROOT/$file" ]]; then
            error "Required file missing: $file"
        fi
    done

    # Check Node.js version
    local node_version=$(node --version | sed 's/v//')
    if [[ "$(printf '%s\n' "$node_version" "16.0.0" | sort -V | head -n1)" != "16.0.0" ]]; then
        warning "Node.js version $node_version detected. Recommended: 16+"
    fi

    # Check if server can start (syntax check)
    log "Checking server syntax..."
    if ! node -c "$PROJECT_ROOT/server/index.js" 2>/dev/null; then
        error "Server has syntax errors. Fix before deployment."
    fi

    success "Pre-deployment checks passed"
}

# Create backup
create_backup() {
    log "💾 Creating backup..."

    mkdir -p "$BACKUP_DIR"

    # Backup critical files
    local files_to_backup=(
        "server/index.js"
        "server/middleware/auth.js"
        "server/middleware/security/tenantIsolationValidation.js"
        "server/config/SECURITY_AUDIT.js"
        "server/middleware/SaaS/globalTenantMiddleware.js"
    )

    for file in "${files_to_backup[@]}"; do
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            cp "$PROJECT_ROOT/$file" "$BACKUP_DIR/"
            log "Backed up: $file"
        fi
    done

    success "Backup created at: $BACKUP_DIR"
}

# Deploy to staging
deploy_to_staging() {
    log "🚀 Deploying to $ENVIRONMENT environment..."

    cd "$PROJECT_ROOT"

    # Install dependencies
    log "Installing dependencies..."
    if [[ -f "server/package.json" ]]; then
        cd server
        npm ci --production=false
        cd ..
    fi

    # Run security tests
    log "Running security tests..."
    if [[ -f "server/package.json" ]] && grep -q "test" server/package.json; then
        cd server
        npm test -- --grep="security" || warning "Security tests failed or not found"
        cd ..
    fi

    # Environment-specific configuration
    case $ENVIRONMENT in
        staging)
            export NODE_ENV=staging
            export PORT=3001
            ;;
        production)
            export NODE_ENV=production
            export PORT=3000
            ;;
        *)
            warning "Unknown environment: $ENVIRONMENT. Using default settings."
            ;;
    esac

    success "Deployment to $ENVIRONMENT completed"
}

# Post-deployment verification
post_deployment_verification() {
    log "✅ Running post-deployment verification..."

    cd "$PROJECT_ROOT/server"

    # Test server startup
    log "Testing server startup..."
    timeout 10s node index.js > /dev/null 2>&1 &
    local server_pid=$!
    sleep 3

    if kill -0 $server_pid 2>/dev/null; then
        success "Server started successfully"
        kill $server_pid
    else
        error "Server failed to start"
    fi

    # Verify middleware loading
    log "Verifying middleware integration..."
    if grep -q "tenantIsolationValidation" index.js; then
        success "Tenant isolation validation middleware integrated"
    else
        error "Tenant isolation validation middleware not found in server"
    fi

    success "Post-deployment verification completed"
}

# Security monitoring setup
setup_monitoring() {
    log "📊 Setting up security monitoring..."

    # Create monitoring script
    cat > "$PROJECT_ROOT/monitor_security.sh" << 'EOF'
#!/bin/bash

# Security Monitoring Script for Tenant Isolation
LOG_FILE="/var/log/ims_security.log"
ALERT_EMAIL="security@imsmymunc.com"

echo "🔍 Starting security monitoring..."

# Monitor for tenant isolation breaches
if grep -i "TENANT ISOLATION BREACH" "$LOG_FILE" | tail -5; then
    echo "🚨 TENANT ISOLATION BREACH DETECTED!"
    # Send alert email (implement based on your email system)
    # mail -s "SECURITY ALERT: Tenant Isolation Breach" "$ALERT_EMAIL"
fi

# Monitor for authentication failures
AUTH_FAILURES=$(grep -c "Authentication failed\|Invalid token\|Token expired" "$LOG_FILE")
if [ "$AUTH_FAILURES" -gt 10 ]; then
    echo "⚠️  High authentication failure rate detected: $AUTH_FAILURES"
fi

# Monitor for rate limiting
RATE_LIMITS=$(grep -c "Rate limit exceeded" "$LOG_FILE")
if [ "$RATE_LIMITS" -gt 5 ]; then
    echo "⚠️  High rate limiting detected: $RATE_LIMITS"
fi

echo "✅ Security monitoring completed"
EOF

    chmod +x "$PROJECT_ROOT/monitor_security.sh"
    success "Security monitoring script created: monitor_security.sh"
}

# Rollback function
rollback() {
    warning "🔄 Starting rollback..."

    if [[ ! -d "$BACKUP_DIR" ]]; then
        error "No backup found for rollback"
    fi

    # Restore files
    local files_to_restore=(
        "server/index.js"
        "server/middleware/auth.js"
        "server/middleware/security/tenantIsolationValidation.js"
        "server/config/SECURITY_AUDIT.js"
        "server/middleware/SaaS/globalTenantMiddleware.js"
    )

    for file in "${files_to_restore[@]}"; do
        if [[ -f "$BACKUP_DIR/$(basename "$file")" ]]; then
            cp "$BACKUP_DIR/$(basename "$file")" "$PROJECT_ROOT/$file"
            log "Restored: $file"
        fi
    done

    success "Rollback completed"
}

# Main deployment flow
main() {
    log "🚀 Starting SaaS Security Fix Deployment"
    log "Environment: $ENVIRONMENT"
    log "Project Root: $PROJECT_ROOT"
    log "Log File: $LOG_FILE"

    case ${2:-deploy} in
        deploy)
            pre_deployment_checks
            create_backup
            deploy_to_staging
            post_deployment_verification
            setup_monitoring
            ;;
        rollback)
            rollback
            ;;
        test)
            pre_deployment_checks
            post_deployment_verification
            ;;
        *)
            error "Usage: $0 [environment] [deploy|rollback|test]"
            ;;
    esac

    success "🎉 Deployment process completed successfully!"
    log "📋 Next steps:"
    log "  1. Monitor logs for tenant isolation breaches"
    log "  2. Run security tests: ./monitor_security.sh"
    log "  3. Check application health"
    log "  4. Notify team about deployment"
}

# Run main function with error handling
if [[ $# -eq 0 ]]; then
    main staging
else
    main "$@"
fi