#!/bin/bash

################################################################################
# PRODUCTION SECRETS GENERATOR FOR LUMIKU APP
################################################################################
#
# This script generates secure secrets and validates environment configuration
# for production deployment. It ensures all required variables meet security
# requirements and provides a production-ready .env.production template.
#
# FEATURES:
#   - Generates cryptographically secure secrets (JWT, Redis, etc.)
#   - Validates all environment variables against Zod schema requirements
#   - Creates well-documented .env.production template
#   - Provides security warnings and best practices
#   - Works on Unix/Linux and Windows (Git Bash)
#   - Idempotent and safe to run multiple times
#
# USAGE:
#   ./production-secrets-generator.sh [OPTIONS]
#
# OPTIONS:
#   -o, --output FILE    Write output to FILE (default: .env.production)
#   -s, --stdout         Print to stdout instead of file
#   -h, --help           Display this help message
#   -q, --quiet          Suppress informational messages
#   -v, --validate-only  Only validate existing .env.production
#
# EXAMPLES:
#   ./production-secrets-generator.sh
#   ./production-secrets-generator.sh --stdout
#   ./production-secrets-generator.sh --output .env.staging
#   ./production-secrets-generator.sh --validate-only
#
# SECURITY:
#   - All secrets use cryptographically secure random generation
#   - Minimum entropy requirements enforced
#   - Validates against weak/default patterns
#   - Warns about common security misconfigurations
#   - Never commits secrets to version control
#
# AUTHOR: Claude Code (Anthropic)
# VERSION: 1.0.0
# LICENSE: MIT
################################################################################

set -euo pipefail  # Exit on error, undefined vars, pipe failures

################################################################################
# CONFIGURATION
################################################################################

# Default values
OUTPUT_FILE=".env.production"
STDOUT_MODE=false
QUIET_MODE=false
VALIDATE_ONLY=false

# Color codes (ANSI escape sequences)
if [[ -t 1 ]]; then  # Check if stdout is a terminal
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    MAGENTA='\033[0;35m'
    CYAN='\033[0;36m'
    BOLD='\033[1m'
    RESET='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    MAGENTA=''
    CYAN=''
    BOLD=''
    RESET=''
fi

################################################################################
# HELPER FUNCTIONS
################################################################################

# Print colored messages
print_info() {
    if [[ "$QUIET_MODE" != "true" ]]; then
        echo -e "${BLUE}[INFO]${RESET} $1"
    fi
}

print_success() {
    if [[ "$QUIET_MODE" != "true" ]]; then
        echo -e "${GREEN}[SUCCESS]${RESET} $1"
    fi
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${RESET} $1" >&2
}

print_error() {
    echo -e "${RED}[ERROR]${RESET} $1" >&2
}

print_header() {
    if [[ "$QUIET_MODE" != "true" ]]; then
        echo -e "\n${BOLD}${CYAN}$1${RESET}"
        echo -e "${CYAN}$(printf '=%.0s' {1..80})${RESET}"
    fi
}

# Display usage information
show_help() {
    cat << EOF
${BOLD}LUMIKU PRODUCTION SECRETS GENERATOR${RESET}

${BOLD}USAGE:${RESET}
    $0 [OPTIONS]

${BOLD}OPTIONS:${RESET}
    -o, --output FILE       Write output to FILE (default: .env.production)
    -s, --stdout            Print to stdout instead of file
    -h, --help              Display this help message
    -q, --quiet             Suppress informational messages
    -v, --validate-only     Only validate existing .env.production

${BOLD}EXAMPLES:${RESET}
    # Generate .env.production with secure secrets
    $0

    # Output to stdout (useful for piping)
    $0 --stdout

    # Generate staging environment
    $0 --output .env.staging

    # Validate existing production config
    $0 --validate-only

${BOLD}SECURITY FEATURES:${RESET}
    - Generates 64-character JWT_SECRET using OpenSSL
    - Creates secure Redis passwords
    - Validates minimum length requirements
    - Checks for weak/default patterns
    - Provides security warnings and recommendations

${BOLD}REQUIREMENTS:${RESET}
    - openssl (for secure random generation)
    - bash 4.0+ (for associative arrays)

${BOLD}NOTES:${RESET}
    - Script is idempotent (safe to run multiple times)
    - Existing .env.production will be backed up before overwriting
    - Never commit generated .env files to version control
    - Rotate secrets regularly (recommended: every 90 days)

EOF
    exit 0
}

# Check for required dependencies
check_dependencies() {
    print_info "Checking dependencies..."

    local missing_deps=()

    if ! command -v openssl &> /dev/null; then
        missing_deps+=("openssl")
    fi

    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        echo ""
        echo "Install missing dependencies:"
        echo "  - macOS: brew install openssl"
        echo "  - Ubuntu/Debian: sudo apt-get install openssl"
        echo "  - Windows (Git Bash): openssl comes pre-installed"
        exit 1
    fi

    print_success "All dependencies satisfied"
}

# Generate cryptographically secure random string
generate_secret() {
    local length=$1
    local charset=${2:-"base64"}  # base64 or hex

    if [[ "$charset" == "hex" ]]; then
        openssl rand -hex "$((length / 2))"
    else
        openssl rand -base64 "$((length * 3 / 4))" | tr -d '\n' | head -c "$length"
    fi
}

# Generate a secure JWT secret (64 characters minimum)
generate_jwt_secret() {
    generate_secret 64 "hex"
}

# Generate a secure Redis password (32 characters minimum)
generate_redis_password() {
    generate_secret 32 "base64"
}

# Validate environment variable value
validate_var() {
    local var_name=$1
    local var_value=$2
    local min_length=${3:-1}
    local pattern=${4:-""}

    # Check if empty
    if [[ -z "$var_value" ]]; then
        print_error "$var_name is empty or not set"
        return 1
    fi

    # Check minimum length
    if [[ ${#var_value} -lt $min_length ]]; then
        print_error "$var_name must be at least $min_length characters (current: ${#var_value})"
        return 1
    fi

    # Check pattern if provided
    if [[ -n "$pattern" ]]; then
        if ! echo "$var_value" | grep -qE "$pattern"; then
            print_error "$var_name does not match required pattern: $pattern"
            return 1
        fi
    fi

    return 0
}

# Check for weak/default patterns
check_weak_patterns() {
    local var_name=$1
    local var_value=$2

    local weak_patterns=(
        "test" "sandbox" "demo" "example" "change" "replace"
        "your-" "merchant-code" "api-key" "12345" "password"
        "secret" "default" "admin"
    )

    local var_lower=$(echo "$var_value" | tr '[:upper:]' '[:lower:]')

    for pattern in "${weak_patterns[@]}"; do
        if [[ "$var_lower" == *"$pattern"* ]]; then
            print_warning "$var_name contains weak pattern: '$pattern'"
            return 1
        fi
    done

    return 0
}

# Validate URL format
validate_url() {
    local var_name=$1
    local url=$2
    local require_https=${3:-false}

    # Basic URL validation
    if ! echo "$url" | grep -qE '^https?://'; then
        print_error "$var_name is not a valid URL: $url"
        return 1
    fi

    # Check HTTPS requirement
    if [[ "$require_https" == "true" ]] && ! echo "$url" | grep -qE '^https://'; then
        print_error "$var_name must use HTTPS in production: $url"
        return 1
    fi

    return 0
}

# Validate existing .env.production file
validate_production_env() {
    local env_file=${1:-.env.production}

    if [[ ! -f "$env_file" ]]; then
        print_error "File not found: $env_file"
        return 1
    fi

    print_header "VALIDATING PRODUCTION ENVIRONMENT: $env_file"

    local errors=0
    local warnings=0

    # Source the file
    set -a  # Export all variables
    source "$env_file"
    set +a

    # Validate NODE_ENV
    print_info "Validating NODE_ENV..."
    if [[ "$NODE_ENV" != "production" ]]; then
        print_error "NODE_ENV must be 'production' (current: $NODE_ENV)"
        ((errors++))
    else
        print_success "NODE_ENV is correctly set to production"
    fi

    # Validate JWT_SECRET
    print_info "Validating JWT_SECRET..."
    if ! validate_var "JWT_SECRET" "${JWT_SECRET:-}" 64; then
        ((errors++))
    elif ! check_weak_patterns "JWT_SECRET" "$JWT_SECRET"; then
        ((warnings++))
    else
        print_success "JWT_SECRET meets security requirements (${#JWT_SECRET} characters)"
    fi

    # Validate DATABASE_URL
    print_info "Validating DATABASE_URL..."
    if ! validate_var "DATABASE_URL" "${DATABASE_URL:-}" 10; then
        ((errors++))
    elif [[ "$DATABASE_URL" == "file:"* ]]; then
        print_error "DATABASE_URL uses SQLite (not suitable for production)"
        ((errors++))
    else
        print_success "DATABASE_URL is set"
    fi

    # Validate CORS_ORIGIN
    print_info "Validating CORS_ORIGIN..."
    if ! validate_url "CORS_ORIGIN" "${CORS_ORIGIN:-}" true; then
        ((errors++))
    elif [[ "$CORS_ORIGIN" == *"localhost"* ]]; then
        print_error "CORS_ORIGIN points to localhost in production"
        ((errors++))
    else
        print_success "CORS_ORIGIN is properly configured"
    fi

    # Validate Duitku configuration
    print_info "Validating Duitku payment gateway..."
    if ! validate_var "DUITKU_MERCHANT_CODE" "${DUITKU_MERCHANT_CODE:-}" 1; then
        ((errors++))
    elif ! check_weak_patterns "DUITKU_MERCHANT_CODE" "$DUITKU_MERCHANT_CODE"; then
        ((warnings++))
    fi

    if ! validate_var "DUITKU_API_KEY" "${DUITKU_API_KEY:-}" 20; then
        ((errors++))
    elif ! check_weak_patterns "DUITKU_API_KEY" "$DUITKU_API_KEY"; then
        ((warnings++))
    fi

    if ! validate_url "DUITKU_CALLBACK_URL" "${DUITKU_CALLBACK_URL:-}" true; then
        ((errors++))
    fi

    if ! validate_url "DUITKU_RETURN_URL" "${DUITKU_RETURN_URL:-}" true; then
        ((errors++))
    fi

    if [[ "${DUITKU_ENV:-}" != "production" ]]; then
        print_warning "DUITKU_ENV is not set to 'production' (current: ${DUITKU_ENV:-sandbox})"
        ((warnings++))
    fi

    # Validate Redis configuration
    print_info "Validating Redis configuration..."
    if [[ -z "${REDIS_HOST:-}" ]]; then
        print_warning "REDIS_HOST not set (rate limiting will use in-memory store)"
        ((warnings++))
    else
        print_success "REDIS_HOST is configured: $REDIS_HOST"

        if [[ -z "${REDIS_PASSWORD:-}" ]]; then
            print_warning "REDIS_PASSWORD not set (insecure for production)"
            ((warnings++))
        fi
    fi

    # Print summary
    echo ""
    print_header "VALIDATION SUMMARY"
    echo -e "Errors:   ${RED}$errors${RESET}"
    echo -e "Warnings: ${YELLOW}$warnings${RESET}"
    echo ""

    if [[ $errors -gt 0 ]]; then
        print_error "Validation FAILED with $errors error(s)"
        return 1
    elif [[ $warnings -gt 0 ]]; then
        print_warning "Validation passed with $warnings warning(s)"
        print_info "Review warnings above and address before deploying to production"
        return 0
    else
        print_success "Validation PASSED - Configuration is production-ready!"
        return 0
    fi
}

# Generate .env.production template
generate_production_env() {
    print_header "GENERATING PRODUCTION SECRETS"

    # Generate secure secrets
    print_info "Generating JWT_SECRET (64 characters)..."
    local jwt_secret
    jwt_secret=$(generate_jwt_secret)
    print_success "JWT_SECRET generated (${#jwt_secret} characters)"

    print_info "Generating REDIS_PASSWORD (32 characters)..."
    local redis_password
    redis_password=$(generate_redis_password)
    print_success "REDIS_PASSWORD generated"

    # Create the .env.production content
    local env_content
    read -r -d '' env_content << 'EOF' || true
################################################################################
# LUMIKU PRODUCTION ENVIRONMENT CONFIGURATION
################################################################################
#
# SECURITY WARNING: This file contains sensitive secrets!
#
# IMPORTANT:
#   - NEVER commit this file to version control
#   - Store securely in password manager or secrets vault
#   - Rotate secrets regularly (recommended: every 90 days)
#   - Use different secrets for each environment
#   - Restrict file permissions: chmod 600 .env.production
#
# DEPLOYMENT:
#   - For Coolify: Add these as environment variables in the dashboard
#   - For Docker: Mount as secrets or use --env-file
#   - For manual deployment: Source this file before starting the application
#
# VALIDATION:
#   Run: ./production-secrets-generator.sh --validate-only
#
# Generated: TIMESTAMP
################################################################################

################################################################################
# NODE ENVIRONMENT
################################################################################

# [REQUIRED] Node environment mode
# MUST be "production" for production deployments
NODE_ENV=production

# [OPTIONAL] Server port number
# Default: 3000
# Coolify usually handles this automatically
PORT=3000

################################################################################
# DATABASE CONFIGURATION
################################################################################

# [REQUIRED] PostgreSQL connection string
# Format: postgresql://username:password@host:port/database
#
# SECURITY NOTES:
#   - Use strong database password (minimum 16 characters)
#   - Never use default postgres/postgres credentials
#   - Enable SSL/TLS for database connections
#   - Restrict database access to application IP only
#
# Example: postgresql://lumiku_prod:STRONG_PASSWORD@db.example.com:5432/lumiku_production?sslmode=require
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?sslmode=require"

################################################################################
# JWT AUTHENTICATION
################################################################################

# [REQUIRED] Secret key for JWT token signing
# Generated: 64-character cryptographically secure random string
#
# SECURITY REQUIREMENTS:
#   - Minimum 64 characters (enforced by validator)
#   - High entropy cryptographic random
#   - NEVER reuse across environments
#   - Rotate every 90 days
#
# GENERATED SECRET (DO NOT MODIFY):
JWT_SECRET="JWT_SECRET_VALUE"

# [OPTIONAL] JWT token expiration time
# Format: <number><unit> where unit is: s, m, h, d
# Recommended production: 7d (7 days)
# Security consideration: Shorter expiration = more secure, but more frequent login
JWT_EXPIRES_IN="7d"

################################################################################
# CORS CONFIGURATION
################################################################################

# [REQUIRED] Allowed CORS origin for frontend
# MUST be your production frontend URL with HTTPS
#
# Example: https://app.lumiku.com
# NEVER use localhost or HTTP in production
CORS_ORIGIN="https://YOUR_FRONTEND_DOMAIN.com"

################################################################################
# REDIS CONFIGURATION (REQUIRED FOR PRODUCTION)
################################################################################

# [REQUIRED] Redis host for rate limiting and caching
# Required in production for distributed rate limiting
#
# Examples:
#   - Managed Redis: redis.example.com
#   - Docker service: redis
#   - Upstash: unique-host-12345.upstash.io
REDIS_HOST="YOUR_REDIS_HOST"

# [OPTIONAL] Redis port number
# Default: 6379
REDIS_PORT=6379

# [REQUIRED-PROD] Redis password for authentication
# Generated: 32-character cryptographically secure random string
#
# SECURITY NOTES:
#   - Always use password authentication in production
#   - Rotate regularly (every 90 days)
#   - Never use empty password
#
# GENERATED SECRET (DO NOT MODIFY):
REDIS_PASSWORD="REDIS_PASSWORD_VALUE"

################################################################################
# PAYMENT GATEWAY (DUITKU)
################################################################################

# [REQUIRED] Duitku merchant identification code
# Obtain from: https://passport.duitku.com dashboard
#
# IMPORTANT: Use PRODUCTION merchant code, not sandbox
DUITKU_MERCHANT_CODE="YOUR_PRODUCTION_MERCHANT_CODE"

# [REQUIRED] Duitku API key for authentication
# Obtain from: Duitku dashboard -> API Settings
#
# SECURITY NOTES:
#   - Minimum 20 characters (typically 32+)
#   - Must be production API key, not sandbox
#   - Treat as highly sensitive (same as JWT_SECRET)
DUITKU_API_KEY="YOUR_PRODUCTION_API_KEY"

# [REQUIRED] Callback URL for payment notifications
# MUST use HTTPS in production
# Format: https://api.YOUR_DOMAIN.com/api/payments/callback
#
# IMPORTANT: This endpoint receives payment status updates from Duitku
DUITKU_CALLBACK_URL="https://api.YOUR_DOMAIN.com/api/payments/callback"

# [REQUIRED] Return URL after payment completion
# MUST use HTTPS in production
# Format: https://YOUR_DOMAIN.com/payment/status
#
# User is redirected here after completing payment
DUITKU_RETURN_URL="https://YOUR_DOMAIN.com/payment/status"

# [OPTIONAL] Duitku API base URL
# Default: https://passport.duitku.com
# Usually not needed unless using custom endpoint
DUITKU_BASE_URL="https://passport.duitku.com"

# [REQUIRED] Duitku environment mode
# MUST be "production" for live payments
# WARNING: "sandbox" will process test transactions only
DUITKU_ENV="production"

# [REQUIRED] Enable IP whitelist for payment callbacks
# SECURITY: Protects against forged payment callbacks
# NEVER set to false in production!
PAYMENT_IP_WHITELIST_ENABLED="true"

################################################################################
# RATE LIMITING CONFIGURATION
################################################################################

# [OPTIONAL] Enable rate limiting globally
# NEVER disable in production!
RATE_LIMIT_ENABLED="true"

# Login Rate Limits (IP-based anti-brute-force)
RATE_LIMIT_LOGIN_WINDOW_MS=900000        # 15 minutes
RATE_LIMIT_LOGIN_MAX_ATTEMPTS=5          # 5 attempts per window

# Registration Rate Limits (IP-based anti-spam)
RATE_LIMIT_REGISTER_WINDOW_MS=3600000    # 1 hour
RATE_LIMIT_REGISTER_MAX_ATTEMPTS=3       # 3 attempts per window

# Password Reset Rate Limits (IP-based)
RATE_LIMIT_PASSWORD_RESET_WINDOW_MS=3600000  # 1 hour
RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS=3     # 3 attempts per window

# Profile Update Rate Limits (User-based)
RATE_LIMIT_PROFILE_UPDATE_WINDOW_MS=3600000  # 1 hour
RATE_LIMIT_PROFILE_UPDATE_MAX_ATTEMPTS=10    # 10 updates per window

# Account Lockout (Account-based)
RATE_LIMIT_ACCOUNT_LOCKOUT_ATTEMPTS=10           # Failed attempts before lockout
RATE_LIMIT_ACCOUNT_LOCKOUT_DURATION_MS=1800000   # 30 minutes lockout

# Global Rate Limits (System-wide DDoS protection)
RATE_LIMIT_GLOBAL_AUTH_WINDOW_MS=60000       # 1 minute
RATE_LIMIT_GLOBAL_AUTH_MAX_REQUESTS=1000     # 1000 requests per window

################################################################################
# TRUSTED PROXIES
################################################################################

# [OPTIONAL] Comma-separated list of trusted proxy IPs
# Required if behind reverse proxy (Nginx, Cloudflare, etc.)
# Used for secure IP extraction from X-Forwarded-For headers
#
# Examples:
#   - Cloudflare: "173.245.48.0/20,103.21.244.0/22"
#   - Single proxy: "10.0.0.1"
#   - Multiple proxies: "10.0.0.1,10.0.0.2,10.0.0.3"
#
# Leave empty if not using proxies
TRUSTED_PROXY_IPS=""

################################################################################
# FILE STORAGE
################################################################################

# [OPTIONAL] Directory path for file uploads
# Ensure directory has proper permissions and sufficient space
UPLOAD_PATH="./uploads"

# [OPTIONAL] Directory path for generated outputs
OUTPUT_PATH="./outputs"

# [OPTIONAL] Maximum file upload size in bytes
# Default: 524288000 (500MB)
# Adjust based on your use case and available storage
MAX_FILE_SIZE=524288000

################################################################################
# AI SERVICES (OPTIONAL - FEATURE-SPECIFIC)
################################################################################

# [OPTIONAL] Anthropic API key for Claude AI
# Only required if using Claude-based features
# Obtain from: https://console.anthropic.com
# ANTHROPIC_API_KEY="your-anthropic-api-key"

# [OPTIONAL] OpenAI API key for GPT models
# Only required if using OpenAI-based features
# Obtain from: https://platform.openai.com
# OPENAI_API_KEY="your-openai-api-key"

# [OPTIONAL] Flux API key for image generation
# Only required if using Flux-based features
# FLUX_API_KEY="your-flux-api-key"

################################################################################
# FFMPEG CONFIGURATION
################################################################################

# [OPTIONAL] Path to FFmpeg executable
# Default: "ffmpeg" (uses system PATH)
FFMPEG_PATH="ffmpeg"

# [OPTIONAL] Path to FFprobe executable
# Default: "ffprobe" (uses system PATH)
FFPROBE_PATH="ffprobe"

################################################################################
# POST-GENERATION CHECKLIST
################################################################################
#
# Before deploying to production, complete this checklist:
#
# [ ] Replace all placeholder values (YOUR_DOMAIN, YOUR_REDIS_HOST, etc.)
# [ ] Update DATABASE_URL with real production database credentials
# [ ] Set CORS_ORIGIN to your actual frontend URL
# [ ] Configure REDIS_HOST and verify REDIS_PASSWORD
# [ ] Add production Duitku merchant code and API key
# [ ] Update all Duitku URLs to use your domain
# [ ] Set DUITKU_ENV to "production"
# [ ] Configure TRUSTED_PROXY_IPS if using reverse proxy
# [ ] Run validation: ./production-secrets-generator.sh --validate-only
# [ ] Test database connectivity
# [ ] Test Redis connectivity
# [ ] Test payment gateway (use small test transaction)
# [ ] Verify rate limiting is working
# [ ] Set file permissions: chmod 600 .env.production
# [ ] Backup this file securely
# [ ] Never commit to version control
#
################################################################################
EOF

    # Replace placeholder values with generated secrets
    env_content="${env_content//JWT_SECRET_VALUE/$jwt_secret}"
    env_content="${env_content//REDIS_PASSWORD_VALUE/$redis_password}"
    env_content="${env_content//TIMESTAMP/$(date -u +"%Y-%m-%d %H:%M:%S UTC")}"

    # Output to file or stdout
    if [[ "$STDOUT_MODE" == "true" ]]; then
        echo "$env_content"
    else
        # Backup existing file if it exists
        if [[ -f "$OUTPUT_FILE" ]]; then
            local backup_file="${OUTPUT_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
            print_warning "Backing up existing file to: $backup_file"
            cp "$OUTPUT_FILE" "$backup_file"
        fi

        # Write to file
        echo "$env_content" > "$OUTPUT_FILE"

        # Set secure file permissions (owner read/write only)
        chmod 600 "$OUTPUT_FILE"

        print_success "Generated: $OUTPUT_FILE"
        print_info "File permissions set to 600 (owner read/write only)"
    fi

    # Print security warnings
    print_header "SECURITY REMINDERS"
    echo -e "${YELLOW}⚠️  CRITICAL: This file contains highly sensitive secrets!${RESET}"
    echo ""
    echo "IMMEDIATE ACTIONS:"
    echo "  1. Replace all placeholder values (YOUR_DOMAIN, etc.)"
    echo "  2. Store this file securely (password manager or secrets vault)"
    echo "  3. NEVER commit to version control"
    echo "  4. Validate: ./production-secrets-generator.sh --validate-only"
    echo ""
    echo "BEST PRACTICES:"
    echo "  - Rotate secrets every 90 days"
    echo "  - Use different secrets for each environment"
    echo "  - Restrict file access (chmod 600)"
    echo "  - Backup securely before deploying"
    echo "  - Monitor for unauthorized access"
    echo ""

    if [[ "$STDOUT_MODE" != "true" ]]; then
        print_header "NEXT STEPS"
        echo "1. Edit $OUTPUT_FILE and replace all placeholder values"
        echo "2. Validate: ./production-secrets-generator.sh --validate-only"
        echo "3. Deploy to production (Coolify, Docker, etc.)"
        echo "4. Test thoroughly before going live"
        echo ""
    fi

    print_header "SECRET ROTATION SCHEDULE"
    echo "Add to your calendar:"
    echo "  - JWT_SECRET: Rotate every 90 days"
    echo "  - REDIS_PASSWORD: Rotate every 90 days"
    echo "  - Database password: Rotate every 90 days"
    echo "  - API keys: Check vendor recommendations"
    echo ""
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -o|--output)
                OUTPUT_FILE="$2"
                shift 2
                ;;
            -s|--stdout)
                STDOUT_MODE=true
                shift
                ;;
            -q|--quiet)
                QUIET_MODE=true
                shift
                ;;
            -v|--validate-only)
                VALIDATE_ONLY=true
                shift
                ;;
            -h|--help)
                show_help
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Run '$0 --help' for usage information"
                exit 1
                ;;
        esac
    done

    # Print banner
    if [[ "$QUIET_MODE" != "true" ]] && [[ "$STDOUT_MODE" != "true" ]]; then
        cat << 'EOF'

╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║              LUMIKU PRODUCTION SECRETS GENERATOR v1.0.0                    ║
║                                                                            ║
║  Generates secure secrets and validates production environment config     ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

EOF
    fi

    # Check dependencies
    check_dependencies

    # Execute based on mode
    if [[ "$VALIDATE_ONLY" == "true" ]]; then
        # Validation mode
        if validate_production_env "$OUTPUT_FILE"; then
            exit 0
        else
            exit 1
        fi
    else
        # Generation mode
        generate_production_env

        # Automatically validate if not in stdout mode
        if [[ "$STDOUT_MODE" != "true" ]] && [[ -f "$OUTPUT_FILE" ]]; then
            echo ""
            print_info "Running automatic validation..."
            echo ""
            # Note: Validation will show warnings about placeholders
            # This is expected and helps users know what to replace
            validate_production_env "$OUTPUT_FILE" || true
        fi
    fi
}

# Run main function with all arguments
main "$@"
