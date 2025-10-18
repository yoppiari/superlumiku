#!/bin/bash
# Settings Fix Verification Script
# Verifies all critical fixes have been applied

echo "╔════════════════════════════════════════════════════════════╗"
echo "║    Settings Fix Verification                               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

BACKEND_DIR="C:/Users/yoppi/Downloads/Lumiku App/backend"
cd "$BACKEND_DIR" || exit 1

PASS=0
FAIL=0

# Test 1: Check theme validation in settings.service.ts
echo "Test 1: Theme validation in settings.service.ts"
if grep -q "const validThemes = \['light', 'dark', 'system'\]" src/services/settings.service.ts; then
    echo "  ✓ PASS: Theme validation uses 'system'"
    ((PASS++))
else
    echo "  ✗ FAIL: Theme validation still uses 'auto'"
    ((FAIL++))
fi

# Test 2: Check Zod schema in settings.routes.ts (main schema)
echo "Test 2: Zod schema in settings.routes.ts (main)"
if grep -q "theme: z.enum(\['light', 'dark', 'system'\]).optional()" src/routes/settings.routes.ts; then
    echo "  ✓ PASS: Main Zod schema uses 'system'"
    ((PASS++))
else
    echo "  ✗ FAIL: Main Zod schema still uses 'auto'"
    ((FAIL++))
fi

# Test 3: Check display settings schema
echo "Test 3: Display settings Zod schema"
if grep -A 2 "const displaySchema" src/routes/settings.routes.ts | grep -q "theme: z.enum(\['light', 'dark', 'system'\])"; then
    echo "  ✓ PASS: Display schema uses 'system'"
    ((PASS++))
else
    echo "  ✗ FAIL: Display schema still uses 'auto'"
    ((FAIL++))
fi

# Test 4: Check debug logging in routes
echo "Test 4: Debug logging in settings.routes.ts"
if grep -q "\[SETTINGS\]" src/routes/settings.routes.ts; then
    echo "  ✓ PASS: Debug logging added to routes"
    ((PASS++))
else
    echo "  ✗ FAIL: Debug logging not found in routes"
    ((FAIL++))
fi

# Test 5: Check debug logging in service
echo "Test 5: Debug logging in settings.service.ts"
if grep -q "\[SETTINGS SERVICE\]" src/services/settings.service.ts; then
    echo "  ✓ PASS: Debug logging added to service"
    ((PASS++))
else
    echo "  ✗ FAIL: Debug logging not found in service"
    ((FAIL++))
fi

# Test 6: Check route export
echo "Test 6: Settings routes export"
if grep -q "export default settingsRoutes" src/routes/settings.routes.ts; then
    echo "  ✓ PASS: Settings routes exported correctly"
    ((PASS++))
else
    echo "  ✗ FAIL: Settings routes not exported"
    ((FAIL++))
fi

# Test 7: Check route import in app.ts
echo "Test 7: Settings routes import in app.ts"
if grep -q "import settingsRoutes from './routes/settings.routes'" src/app.ts; then
    echo "  ✓ PASS: Settings routes imported in app.ts"
    ((PASS++))
else
    echo "  ✗ FAIL: Settings routes not imported in app.ts"
    ((FAIL++))
fi

# Test 8: Check route mounting
echo "Test 8: Settings routes mounted"
if grep -q "app.route('/api/settings', settingsRoutes)" src/app.ts; then
    echo "  ✓ PASS: Settings routes mounted correctly"
    ((PASS++))
else
    echo "  ✗ FAIL: Settings routes not mounted"
    ((FAIL++))
fi

# Test 9: Check migration exists
echo "Test 9: Settings migration exists"
if [ -f "prisma/migrations/20251018_add_user_settings/migration.sql" ]; then
    echo "  ✓ PASS: Migration file exists"
    ((PASS++))
else
    echo "  ✗ FAIL: Migration file not found"
    ((FAIL++))
fi

# Test 10: Check test script exists
echo "Test 10: Test script exists"
if [ -f "scripts/test-settings.ts" ]; then
    echo "  ✓ PASS: Test script created"
    ((PASS++))
else
    echo "  ✗ FAIL: Test script not found"
    ((FAIL++))
fi

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║    Test Summary                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo "Total tests: $((PASS + FAIL))"
echo "✓ Passed: $PASS"
echo "✗ Failed: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "🎉 All fixes verified successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Start the backend server: bun run dev"
    echo "2. Run the test suite: bun run scripts/test-settings.ts"
    exit 0
else
    echo "❌ Some fixes are missing. Please review the failed tests."
    exit 1
fi
