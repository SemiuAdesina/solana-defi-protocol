# Testing Documentation

## Test Coverage Overview

This document provides an overview of all tests in the codebase and their coverage.

## Backend Tests

### Service Tests

#### Registry Service (`backend/src/services/registry/registry.service.test.ts`)

Tests for the registry account decoding service that reads on-chain data.

**Coverage:**
- Account existence checks
- Account ownership validation
- Account data validation (size, discriminator)
- Successful decoding with empty URI
- Successful decoding with URI and checksum
- Error cases (invalid authority, RPC errors, malformed data)
- URI length validation (200 byte limit)
- Account size validation

**Key Test Cases:**
- Returns null when account does not exist
- Returns null when account is not owned by program
- Successfully decodes valid registry account
- Handles invalid authority addresses
- Handles RPC connection errors gracefully

#### CI Status Service (`backend/src/services/ci-status/ci-status.service.test.ts`)

Tests for the CI status storage service.

**Coverage:**
- Adding new CI statuses
- Retrieving recent statuses with limits
- Retrieving specific status by runId
- Timestamp handling (provided vs generated)
- Storage limits (max 500 statuses)
- Reverse chronological ordering

**Key Test Cases:**
- Adds new CI status correctly
- Returns statuses in reverse chronological order
- Respects limit parameter
- Returns null for non-existent status
- Maintains maximum of 500 statuses

### Middleware Tests

#### API Key Guard (`backend/src/middleware/api-key.test.ts`)

Tests for API key authentication middleware.

**Coverage:**
- Valid API key acceptance
- Missing API key rejection
- Invalid API key rejection
- Timing-safe comparison
- Case-sensitive key handling
- Unconfigured API key handling

**Key Test Cases:**
- Allows access with valid API key
- Rejects request without API key header
- Rejects request with invalid API key
- Uses timing-safe comparison to prevent timing attacks
- Returns 500 when API key is not configured

### View/Route Tests

#### Metadata Route (`backend/src/views/metadata.test.ts`)

Tests for the metadata REST endpoint.

**Coverage:**
- Successful metadata retrieval
- 404 when registry not found
- Error handling for service failures
- Null URI and checksum handling

**Key Test Cases:**
- Returns metadata for known authority
- Responds 404 when registry not found
- Handles service errors gracefully (500)
- Handles metadata with null URI and checksum

#### Registry Route (`backend/src/views/registry.test.ts`)

Tests for the registry REST endpoint.

**Coverage:**
- Successful registry retrieval
- 404 when registry absent
- Invalid authority rejection

**Key Test Cases:**
- Returns registry payload when authority exists
- Returns 404 when registry absent
- Rejects invalid authority addresses

#### CI Status Route (`backend/src/views/ci-status.test.ts`)

Tests for CI status REST endpoints.

**Coverage:**
- Retrieving recent statuses
- Webhook authentication
- Webhook payload validation
- Status storage

**Key Test Cases:**
- Returns recent statuses
- Rejects webhook without API key
- Accepts valid webhook payload and stores status

#### Health Route (`backend/src/views/health.test.ts`)

Tests for the health check endpoint.

**Coverage:**
- Health status response
- Response format validation

**Key Test Cases:**
- Returns ok payload with timestamp

### GraphQL Tests

#### Resolvers (`backend/src/graphql/resolvers.test.ts`)

Tests for GraphQL query resolvers.

**Coverage:**
- Registry query with valid authority
- Registry query with invalid authority (error handling)
- Registry query when not found (returns null)
- CI statuses query with limit
- CI status query by runId
- Error handling for all queries

**Key Test Cases:**
- Fetches registry metadata for valid authority
- Returns null when registry does not exist
- Throws error for invalid authority address with helpful message
- Returns CI statuses list
- Returns CI status by runId
- Handles service errors gracefully

## Frontend Tests

### API Tests

#### API Functions (`frontend/lib/api.test.ts`)

Tests for frontend API utility functions.

**Coverage:**
- Metadata fetching
- CI status fetching
- Error handling (network errors, non-ok responses)
- Environment variable handling
- Null value handling

**Key Test Cases:**
- Fetches metadata successfully
- Returns null when response is not ok
- Returns null on fetch error
- Uses custom backend URL from environment
- Handles metadata with null URI and checksum
- Returns empty array for CI statuses on error

### Component Tests

#### Home Page (`frontend/app/page.test.tsx`)

Basic rendering test for the main page.

**Coverage:**
- Component rendering
- Headline display

**Key Test Cases:**
- Renders headline text

## Blockchain Tests

### Integration Tests

#### Registry Tests (`blockchain/tests/registry.spec.ts`)

Anchor integration tests for the registry program.

**Coverage:**
- Registry initialization
- Re-initialization rejection
- Metadata updates

**Key Test Cases:**
- Initializes registry state correctly
- Rejects reinitialization attempts
- Updates metadata successfully

#### Init Registry Tests (`blockchain/tests/init-registry.spec.ts`)

Tests for initializing registry for a specific authority.

**Coverage:**
- Registry initialization for specified authority
- Handling existing registries
- Authority validation

**Key Test Cases:**
- Initializes registry state for specified authority
- Handles already existing registry
- Validates authority matches wallet

## Running Tests

### Backend Tests

```bash
cd backend
pnpm test              # Run all tests once
pnpm test:watch        # Run tests in watch mode
pnpm test -- --coverage # Run with coverage report
```

### Frontend Tests

```bash
cd frontend
pnpm test              # Run all tests once
pnpm test:watch        # Run tests in watch mode
pnpm test -- --coverage # Run with coverage report
```

### Blockchain Tests

```bash
cd blockchain
anchor test            # Run all integration tests
anchor test --skip-local-validator --skip-build tests/init-registry.spec.ts  # Run specific test
```

## Test Coverage Goals

### Current Coverage

- Backend services: Comprehensive coverage for core services
- Backend routes: All REST endpoints tested
- Backend GraphQL: All resolvers tested
- Frontend API: API utility functions tested
- Frontend components: Basic rendering tests (can be expanded)
- Blockchain: Integration tests for all instructions

### Areas for Expansion

1. **Frontend Component Tests**: More comprehensive tests for complex components like MetadataCard
2. **Integration Tests**: End-to-end tests for complete user workflows
3. **Error Boundary Tests**: Test error handling in React components
4. **Wallet Integration Tests**: Test wallet connection and transaction flows
5. **E2E Tests**: Full browser automation tests with Playwright or Cypress

## Test Best Practices

### Writing Tests

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Clarity**: Test names should clearly describe what is being tested
3. **Coverage**: Test both happy paths and error cases
4. **Mocking**: Use mocks for external dependencies (RPC, network, etc.)
5. **Assertions**: Use specific assertions rather than generic ones

### Test Structure

```typescript
describe("Component/Service Name", () => {
  describe("Method/Function Name", () => {
    it("should do something when condition", () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Mocking Guidelines

- Mock external services (Solana RPC, file system, network)
- Don't mock the code under test
- Use dependency injection for testability
- Reset mocks between tests

## Continuous Integration

Tests are run automatically in CI/CD pipeline. See `.github/workflows/ci.yml` for configuration.

Test failures block deployments to ensure code quality.

