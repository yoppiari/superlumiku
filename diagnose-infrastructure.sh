#!/bin/bash
# ============================================================================
# Infrastructure Diagnostic Script for Lumiku Deployment
# ============================================================================
# This script diagnoses Redis and PostgreSQL connection issues on Coolify
# Run this on your Coolify server (dev.lumiku.com)
# ============================================================================

set -e

echo "============================================================================"
echo "  LUMIKU INFRASTRUCTURE DIAGNOSTIC TOOL"
echo "============================================================================"
echo "Date: $(date)"
echo "Host: $(hostname)"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# SECTION 1: Docker Containers
# ============================================================================

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}SECTION 1: Docker Containers Status${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# List all containers
echo "All running containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Find Redis container
REDIS_CONTAINER=$(docker ps --filter "name=redis" --format "{{.Names}}" | head -n 1)
if [ -z "$REDIS_CONTAINER" ]; then
    echo -e "${RED}❌ Redis container NOT FOUND!${NC}"
    echo "   Expected container name pattern: *redis*"
    echo "   Available containers:"
    docker ps --format "{{.Names}}"
    REDIS_FOUND=false
else
    echo -e "${GREEN}✅ Redis container found: $REDIS_CONTAINER${NC}"
    REDIS_FOUND=true
fi

echo ""

# Find PostgreSQL container
POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -n 1)
if [ -z "$POSTGRES_CONTAINER" ]; then
    echo -e "${RED}❌ PostgreSQL container NOT FOUND!${NC}"
    echo "   Expected container name pattern: *postgres*"
    echo "   Trying alternate patterns..."

    # Try 'pg' pattern
    POSTGRES_CONTAINER=$(docker ps --filter "name=pg" --format "{{.Names}}" | head -n 1)
    if [ -z "$POSTGRES_CONTAINER" ]; then
        echo -e "${RED}❌ No PostgreSQL container found with patterns: postgres, pg${NC}"
        POSTGRES_FOUND=false
    else
        echo -e "${GREEN}✅ PostgreSQL container found (alternate): $POSTGRES_CONTAINER${NC}"
        POSTGRES_FOUND=true
    fi
else
    echo -e "${GREEN}✅ PostgreSQL container found: $POSTGRES_CONTAINER${NC}"
    POSTGRES_FOUND=true
fi

echo ""

# ============================================================================
# SECTION 2: Redis Diagnostics
# ============================================================================

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}SECTION 2: Redis Diagnostics${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

if [ "$REDIS_FOUND" = true ]; then
    echo "Container: $REDIS_CONTAINER"
    echo ""

    # Test 1: Basic PING without password
    echo "Test 1: PING without password..."
    if docker exec $REDIS_CONTAINER redis-cli PING 2>&1 | grep -q "PONG"; then
        echo -e "${GREEN}✅ SUCCESS: Redis responds without password${NC}"
        echo -e "${YELLOW}   ⚠️  RECOMMENDATION: Set REDIS_PASSWORD to empty string in Coolify${NC}"
        REDIS_NO_PASSWORD=true
    else
        echo -e "${RED}❌ FAILED: Redis requires authentication${NC}"
        REDIS_NO_PASSWORD=false
    fi
    echo ""

    # Test 2: Get requirepass configuration
    echo "Test 2: Check requirepass setting..."
    REQUIREPASS=$(docker exec $REDIS_CONTAINER redis-cli CONFIG GET requirepass 2>&1)
    if echo "$REQUIREPASS" | grep -q "requirepass"; then
        REDIS_PASSWORD_VALUE=$(echo "$REQUIREPASS" | sed -n '2p' | tr -d '[:space:]')
        if [ -z "$REDIS_PASSWORD_VALUE" ]; then
            echo -e "${GREEN}✅ Redis requirepass: EMPTY (no password)${NC}"
            echo -e "${YELLOW}   ⚠️  ACTION: In Coolify, set:${NC}"
            echo "      REDIS_HOST=redis"
            echo "      REDIS_PORT=6379"
            echo "      REDIS_PASSWORD=  (leave empty or remove variable)"
        else
            echo -e "${GREEN}✅ Redis requirepass: SET${NC}"
            echo -e "${YELLOW}   ⚠️  ACTION: In Coolify, set:${NC}"
            echo "      REDIS_HOST=redis"
            echo "      REDIS_PORT=6379"
            echo "      REDIS_PASSWORD=$REDIS_PASSWORD_VALUE"
        fi
    else
        echo -e "${RED}❌ Cannot get requirepass config${NC}"
        echo "   Error: $REQUIREPASS"
    fi
    echo ""

    # Test 3: Redis INFO
    echo "Test 3: Redis server info..."
    if [ "$REDIS_NO_PASSWORD" = true ]; then
        REDIS_VERSION=$(docker exec $REDIS_CONTAINER redis-cli INFO server 2>&1 | grep "redis_version:" | cut -d':' -f2 | tr -d '\r')
        echo "   Redis version: $REDIS_VERSION"

        REDIS_UPTIME=$(docker exec $REDIS_CONTAINER redis-cli INFO server 2>&1 | grep "uptime_in_days:" | cut -d':' -f2 | tr -d '\r')
        echo "   Uptime (days): $REDIS_UPTIME"

        CONNECTED_CLIENTS=$(docker exec $REDIS_CONTAINER redis-cli INFO clients 2>&1 | grep "connected_clients:" | cut -d':' -f2 | tr -d '\r')
        echo "   Connected clients: $CONNECTED_CLIENTS"
    fi
    echo ""

    # Test 4: Network connectivity
    echo "Test 4: Network connectivity..."
    REDIS_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $REDIS_CONTAINER)
    echo "   Redis IP: $REDIS_IP"

    REDIS_NETWORKS=$(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' $REDIS_CONTAINER)
    echo "   Docker networks: $REDIS_NETWORKS"
    echo ""

    # Summary
    echo -e "${GREEN}============================================================================${NC}"
    echo -e "${GREEN}REDIS CONFIGURATION SUMMARY${NC}"
    echo -e "${GREEN}============================================================================${NC}"
    if [ "$REDIS_NO_PASSWORD" = true ]; then
        echo -e "${YELLOW}📋 Copy these values to Coolify Environment Variables:${NC}"
        echo ""
        echo "REDIS_HOST=redis"
        echo "REDIS_PORT=6379"
        echo "REDIS_USERNAME=  (leave empty or remove)"
        echo "REDIS_PASSWORD=  (leave empty or remove)"
    else
        echo -e "${YELLOW}📋 Copy these values to Coolify Environment Variables:${NC}"
        echo ""
        echo "REDIS_HOST=redis"
        echo "REDIS_PORT=6379"
        echo "REDIS_USERNAME=default"
        echo "REDIS_PASSWORD=<get_from_requirepass_above>"
    fi
    echo ""

else
    echo -e "${RED}⚠️  Skipping Redis tests - container not found${NC}"
    echo ""
fi

# ============================================================================
# SECTION 3: PostgreSQL Diagnostics
# ============================================================================

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}SECTION 3: PostgreSQL Diagnostics${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

if [ "$POSTGRES_FOUND" = true ]; then
    echo "Container: $POSTGRES_CONTAINER"
    echo ""

    # Test 1: pg_isready
    echo "Test 1: Check if PostgreSQL is accepting connections..."
    if docker exec $POSTGRES_CONTAINER pg_isready 2>&1 | grep -q "accepting connections"; then
        echo -e "${GREEN}✅ SUCCESS: PostgreSQL is accepting connections${NC}"
    else
        echo -e "${RED}❌ FAILED: PostgreSQL is not ready${NC}"
    fi
    echo ""

    # Test 2: Get environment variables
    echo "Test 2: PostgreSQL environment variables..."
    PG_ENV=$(docker inspect $POSTGRES_CONTAINER | grep -E "POSTGRES_USER|POSTGRES_PASSWORD|POSTGRES_DB")

    PG_USER=$(docker inspect $POSTGRES_CONTAINER | grep "POSTGRES_USER" | head -n 1 | sed 's/.*POSTGRES_USER=\([^"]*\).*/\1/')
    PG_PASSWORD=$(docker inspect $POSTGRES_CONTAINER | grep "POSTGRES_PASSWORD" | head -n 1 | sed 's/.*POSTGRES_PASSWORD=\([^"]*\).*/\1/')
    PG_DB=$(docker inspect $POSTGRES_CONTAINER | grep "POSTGRES_DB" | head -n 1 | sed 's/.*POSTGRES_DB=\([^"]*\).*/\1/')

    if [ ! -z "$PG_USER" ]; then
        echo "   POSTGRES_USER: $PG_USER"
    else
        PG_USER="postgres"
        echo "   POSTGRES_USER: postgres (default)"
    fi

    if [ ! -z "$PG_PASSWORD" ]; then
        echo "   POSTGRES_PASSWORD: ********** (hidden)"
    else
        echo -e "${RED}   POSTGRES_PASSWORD: NOT SET (using default)${NC}"
        PG_PASSWORD=""
    fi

    if [ ! -z "$PG_DB" ]; then
        echo "   POSTGRES_DB: $PG_DB"
    else
        PG_DB="postgres"
        echo "   POSTGRES_DB: postgres (default)"
    fi
    echo ""

    # Test 3: List databases
    echo "Test 3: List databases..."
    PG_DATABASES=$(docker exec $POSTGRES_CONTAINER psql -U "$PG_USER" -c "\l" 2>&1)
    if echo "$PG_DATABASES" | grep -q "lumiku-dev"; then
        echo -e "${GREEN}✅ Database 'lumiku-dev' EXISTS${NC}"
    else
        echo -e "${RED}❌ Database 'lumiku-dev' NOT FOUND${NC}"
        echo ""
        echo "Available databases:"
        docker exec $POSTGRES_CONTAINER psql -U "$PG_USER" -c "\l" 2>&1 | grep -E "Name|------|postgres|template" | head -n 10
        echo ""
        echo -e "${YELLOW}⚠️  ACTION: Create lumiku-dev database:${NC}"
        echo "   docker exec $POSTGRES_CONTAINER psql -U $PG_USER -c \"CREATE DATABASE \\\"lumiku-dev\\\";\""
    fi
    echo ""

    # Test 4: Check PostgreSQL version
    echo "Test 4: PostgreSQL version..."
    PG_VERSION=$(docker exec $POSTGRES_CONTAINER psql -U "$PG_USER" -c "SELECT version();" 2>&1 | grep PostgreSQL)
    echo "   $PG_VERSION"
    echo ""

    # Test 5: Network connectivity
    echo "Test 5: Network connectivity..."
    PG_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $POSTGRES_CONTAINER)
    echo "   PostgreSQL IP: $PG_IP"

    PG_NETWORKS=$(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' $POSTGRES_CONTAINER)
    echo "   Docker networks: $PG_NETWORKS"

    # Check listen addresses
    LISTEN_ADDRESSES=$(docker exec $POSTGRES_CONTAINER psql -U "$PG_USER" -c "SHOW listen_addresses;" 2>&1 | grep -v "listen_addresses" | grep -v "row" | tr -d ' ')
    echo "   Listen addresses: $LISTEN_ADDRESSES"
    echo ""

    # Test 6: Test connection with credentials
    echo "Test 6: Test database connection..."
    if docker exec $POSTGRES_CONTAINER psql -U "$PG_USER" -d "$PG_DB" -c "SELECT 1;" 2>&1 | grep -q "1 row"; then
        echo -e "${GREEN}✅ SUCCESS: Can connect and query database${NC}"
    else
        echo -e "${RED}❌ FAILED: Cannot connect to database${NC}"
    fi
    echo ""

    # Summary
    echo -e "${GREEN}============================================================================${NC}"
    echo -e "${GREEN}POSTGRESQL CONFIGURATION SUMMARY${NC}"
    echo -e "${GREEN}============================================================================${NC}"
    echo -e "${YELLOW}📋 Copy these values to Coolify Environment Variables:${NC}"
    echo ""

    # Construct DATABASE_URL
    if [ ! -z "$PG_PASSWORD" ]; then
        DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@postgres:5432/lumiku-dev"
    else
        DATABASE_URL="postgresql://${PG_USER}@postgres:5432/lumiku-dev"
    fi

    echo "DATABASE_URL=${DATABASE_URL}"
    echo "POSTGRES_HOST=postgres"
    echo "POSTGRES_PORT=5432"
    echo "POSTGRES_USER=${PG_USER}"
    echo "POSTGRES_PASSWORD=<get_from_container_env>"
    echo "POSTGRES_DB=lumiku-dev"
    echo ""

    # Show actual password retrieval command
    echo -e "${YELLOW}📋 To get actual POSTGRES_PASSWORD, run:${NC}"
    echo "docker inspect $POSTGRES_CONTAINER | grep POSTGRES_PASSWORD"
    echo ""

else
    echo -e "${RED}⚠️  Skipping PostgreSQL tests - container not found${NC}"
    echo ""
fi

# ============================================================================
# SECTION 4: Docker Networks
# ============================================================================

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}SECTION 4: Docker Networks${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

echo "Available Docker networks:"
docker network ls
echo ""

if [ "$REDIS_FOUND" = true ] && [ "$POSTGRES_FOUND" = true ]; then
    echo "Checking if Redis and PostgreSQL are on same network..."

    # Get networks for each container
    REDIS_NETS=$(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' $REDIS_CONTAINER)
    POSTGRES_NETS=$(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' $POSTGRES_CONTAINER)

    echo "   Redis networks: $REDIS_NETS"
    echo "   PostgreSQL networks: $POSTGRES_NETS"

    # Check for common network
    COMMON_NETWORK=""
    for redis_net in $REDIS_NETS; do
        for pg_net in $POSTGRES_NETS; do
            if [ "$redis_net" = "$pg_net" ]; then
                COMMON_NETWORK=$redis_net
                break 2
            fi
        done
    done

    if [ ! -z "$COMMON_NETWORK" ]; then
        echo -e "${GREEN}✅ Both containers are on network: $COMMON_NETWORK${NC}"
        echo "   This means they can communicate using container names"
    else
        echo -e "${YELLOW}⚠️  Containers are on DIFFERENT networks${NC}"
        echo "   They may not be able to communicate directly"
        echo "   Recommendation: Ensure Lumiku app is on same network as Redis and PostgreSQL"
    fi
fi

echo ""

# ============================================================================
# SECTION 5: Final Recommendations
# ============================================================================

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}SECTION 5: Final Recommendations & Next Steps${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

echo -e "${GREEN}✅ DIAGNOSTIC COMPLETE${NC}"
echo ""
echo "Summary:"
echo "--------"

if [ "$REDIS_FOUND" = true ]; then
    echo -e "${GREEN}✅ Redis container found and tested${NC}"
else
    echo -e "${RED}❌ Redis container NOT found${NC}"
fi

if [ "$POSTGRES_FOUND" = true ]; then
    echo -e "${GREEN}✅ PostgreSQL container found and tested${NC}"
else
    echo -e "${RED}❌ PostgreSQL container NOT found${NC}"
fi

echo ""
echo "Next Steps:"
echo "-----------"
echo "1. Copy the environment variable values from CONFIGURATION SUMMARY sections above"
echo "2. Go to Coolify dashboard → Your Lumiku app → Environment Variables"
echo "3. Update/add the variables shown in the summaries"
echo "4. Click Save"
echo "5. Redeploy the application"
echo "6. Monitor deployment logs for successful connections"
echo ""
echo "Key indicators of success in deployment logs:"
echo "  ✅ Redis connected"
echo "  ✅ Redis ready"
echo "  ✅ PostgreSQL is ready"
echo "  ✅ Prisma Client generated"
echo "  ✅ Nginx started"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT SECURITY NOTES:${NC}"
echo "  - For production, ALWAYS use strong passwords for Redis and PostgreSQL"
echo "  - Never use default passwords"
echo "  - Rotate credentials regularly"
echo "  - Use SSL/TLS for database connections when possible"
echo ""
echo "For detailed fix instructions, see: INFRASTRUCTURE_FIX_GUIDE.md"
echo ""
echo "============================================================================"
echo "Diagnostic completed at: $(date)"
echo "============================================================================"
