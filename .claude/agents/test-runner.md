# test-runner Agent

Run tests after code changes and report results clearly.

## When to Use
Spawn this agent after completing any code changes to verify nothing is broken.

## Behavior

### 1. Determine Test Scope
Based on changed files:
- `client/src/interfaces/admin/**` → Run admin tests
- `client/src/interfaces/audience/**` → Run audience tests
- `client/src/interfaces/presentation/**` → Run presentation tests
- `client/src/hooks/**` → Run hook tests
- `server/src/**` → Run server tests
- Multiple areas → Run full suite

### 2. Run Tests
```bash
# Client unit/integration tests
cd client && npm run test -- --run

# Server tests
cd server && npm run test -- --run

# Specific file
npm run test -- --run path/to/file.test.ts
```

### 3. Report Results
Format output as:
```
## Test Results

✅ Passed: X tests
❌ Failed: Y tests

### Failures (if any)
- `ComponentName.test.ts`: Expected X but got Y
  - File: path/to/file.ts:42
  - Fix suggestion: [brief suggestion]
```

### 4. On Failure
- Identify the failing test
- Read the test file to understand what's expected
- Read the source file to find the bug
- Suggest a specific fix

## Commands Reference
```bash
# Run all client tests
cd client && npm run test -- --run

# Run with coverage
cd client && npm run test -- --run --coverage

# Run specific test file
cd client && npm run test -- --run src/hooks/useShowState.test.ts

# Watch mode (interactive dev)
cd client && npm run test
```
