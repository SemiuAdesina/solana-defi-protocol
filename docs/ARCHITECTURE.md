# Architecture Documentation

## System Overview

The Solana DeFi Protocol Audit Registry is a distributed application consisting of three main components that work together to provide on-chain registry management with off-chain API access and a web-based user interface.

## Component Architecture

### Blockchain Program

The blockchain component is a Solana program written in Rust using the Anchor framework. It serves as the source of truth for all registry data.

#### Program Structure

- **Program ID**: `H3ZDWgBkZ9kxer2KjCeL2oFZkftZRUTikpd6PseXkgpL`
- **Framework**: Anchor 0.30+
- **Language**: Rust
- **Location**: `blockchain/programs/audit_registry/src/lib.rs`

#### Account Structure

Registry accounts are Program Derived Addresses (PDAs) with the following layout:

```
Offset  Size    Field
0-7     8       Discriminator (SHA256("account:Registry")[0:8])
8-39    32      Authority PublicKey
40-47   8       Version (u64, little-endian)
48      1       Bump seed (u8)
49-52   4       URI length (u32, little-endian)
53-N    N       Metadata URI (String, variable length, max 200 bytes)
N+1-N+32 32     Metadata checksum ([u8; 32])

Total: 285 bytes (fixed allocation)
```

#### Instructions

**initialize_registry**
- Purpose: Creates a new registry account for an authority
- Accounts:
  - `authority`: Signer account paying for account creation
  - `registry`: PDA to initialize
  - `system_program`: System program reference
- Parameters:
  - `version`: u64, must be greater than 0
- Side Effects:
  - Allocates 285 bytes for registry account
  - Sets initial metadata URI to empty string
  - Sets initial checksum to all zeros
  - Stores authority, version, and bump seed

**update_metadata**
- Purpose: Updates metadata URI and checksum for existing registry
- Accounts:
  - `authority`: Signer account (must match registry authority)
  - `registry`: PDA to update
- Parameters:
  - `payload`: MetadataInput struct containing URI (String) and checksum ([u8; 32])
- Constraints:
  - URI length must not exceed 200 bytes
  - Authority must match registry authority
  - Registry must already be initialized
- Side Effects:
  - Updates metadata URI
  - Updates metadata checksum

#### Error Codes

- `InvalidVersion`: Version must be greater than zero (error code 0)
- `UriTooLong`: Metadata URI exceeds 200 byte limit (error code 1)

#### Security Considerations

- Registry accounts are PDAs, preventing collision attacks
- Authority verification ensures only the owner can update metadata
- Version validation prevents invalid state initialization
- URI length limits prevent DoS attacks through excessive data

### Backend Service

The backend service is a Node.js application built with Express and Apollo Server that provides REST and GraphQL APIs for accessing registry data.

#### Technology Stack

- Runtime: Node.js 20+
- Framework: Express 4.x
- GraphQL: Apollo Server 4.x
- Language: TypeScript
- Package Manager: PNPM

#### Service Architecture

The backend follows a service-oriented architecture with clear separation of concerns:

```
Request → Express Router → Service Layer → Solana RPC → Response
```

#### Core Services

**RegistryService**
- Purpose: Fetches and decodes registry accounts from Solana blockchain
- Location: `backend/src/services/registry/registry.service.ts`
- Dependencies:
  - `@solana/web3.js`: Solana connection and account fetching
  - `crypto`: Discriminator calculation
- Methods:
  - `getRegistryByAuthority(authority: string)`: Fetches and decodes registry account
- Decoding Logic:
  - Validates account discriminator
  - Extracts authority, version, bump seed
  - Reads variable-length URI
  - Extracts 32-byte checksum
  - Returns decoded registry state or null

**CiStatusService**
- Purpose: Manages CI/CD pipeline status records
- Location: `backend/src/services/ci-status/ci-status.service.ts`
- Storage: JSON file-based storage (lowdb)
- Methods:
  - `getRecent(limit: number)`: Gets recent statuses
  - `getStatus(runId: string)`: Gets specific status
  - `addStatus(payload: CiStatusInput)`: Adds new status
- Storage Limits:
  - Maximum 500 statuses retained
  - Oldest statuses automatically removed

#### API Routes

**REST Endpoints**

- `GET /health`: Health check endpoint
- `GET /metadata/:authority`: Fetch registry metadata
- `GET /ci/status`: Get recent CI statuses
- `POST /ci/status/webhook`: Submit CI status (requires API key)

**GraphQL Endpoint**

- `POST /graphql`: GraphQL query endpoint
- Queries:
  - `registry(authority: String!)`: Get registry metadata
  - `ciStatuses(limit: Int)`: Get recent CI statuses
  - `ciStatus(runId: String!)`: Get specific CI status

#### Middleware

- CORS: Allows all origins with appropriate headers
- Helmet: Security headers configuration
- JSON Parsing: 64KB limit
- API Key Guard: Protects webhook endpoints

#### Error Handling

- Graceful degradation: Returns null instead of throwing for missing accounts
- Detailed logging: Console logs for debugging
- Error responses: Structured JSON error responses

### Frontend Application

The frontend is a Next.js 14 application with React 18 that provides a user interface for interacting with the registry.

#### Technology Stack

- Framework: Next.js 14.2
- UI Library: React 18
- Styling: Tailwind CSS + inline styles
- Wallet: Solana Wallet Adapter
- Data Fetching: SWR (stale-while-revalidate)
- GraphQL Client: GraphiQL embedded explorer

#### Application Structure

```
app/
├── page.tsx          # Main dashboard page
├── layout.tsx        # Root layout with providers
└── providers.tsx     # Wallet and connection providers

components/
├── Header.tsx        # Navigation header
├── Hero.tsx          # Hero section
├── WalletSection.tsx # Wallet connection UI
├── MetadataCard.tsx  # Registry metadata display/editing
├── CiStatusBoard.tsx # CI status monitoring
├── GraphExplorer.tsx # GraphQL query interface
├── SubsidyChecklist.tsx # Readiness checklist
└── Footer.tsx        # Footer with network info
```

#### Key Components

**MetadataCard**
- Displays registry metadata (authority, version, URI, checksum)
- Handles registry initialization
- Handles metadata updates
- Transaction signing and confirmation
- Error handling with user-friendly messages

**WalletSection**
- Wallet connection/disconnection
- Authority address input
- Network indicator

**GraphExplorer**
- Embedded GraphiQL interface
- Query editor with syntax highlighting
- Query execution and result display
- Variable and header configuration

**SubsidyChecklist**
- Registry metadata publication check
- CI status verification
- GraphQL availability check
- Visual indicators for completion status

#### State Management

- React hooks for local state
- SWR for server state (metadata, CI status)
- Wallet adapter for wallet connection state
- No global state management library (Redux, etc.)

#### Data Flow

```
User Action → Component → API Call → Backend → Solana RPC → Response → UI Update
```

#### Responsive Design

- Mobile-first approach
- Breakpoints:
  - Small mobile: < 480px
  - Mobile: < 768px
  - Desktop: >= 768px
- Conditional rendering based on screen size

## Data Flow

### Registry Initialization Flow

1. User connects wallet in frontend
2. User clicks "Initialize Registry"
3. Frontend derives registry PDA from authority address
4. Frontend builds initialization instruction
5. User approves transaction in wallet
6. Transaction sent to Solana network
7. Program creates registry account
8. Frontend polls for confirmation
9. Frontend refreshes metadata display

### Metadata Update Flow

1. User enters metadata URI and calculates checksum
2. User clicks "Update Metadata"
3. Frontend builds update instruction with payload
4. User approves transaction in wallet
5. Transaction sent to Solana network
6. Program updates registry account
7. Frontend verifies update on-chain
8. Frontend refreshes metadata display

### Metadata Query Flow

1. User enters authority address
2. Frontend calls backend REST API
3. Backend fetches account from Solana RPC
4. Backend decodes account data
5. Backend returns JSON response
6. Frontend displays metadata
7. SWR caches result for future requests

### GraphQL Query Flow

1. User writes GraphQL query in explorer
2. Frontend sends POST request to /graphql
3. Apollo Server parses query
4. Resolver calls appropriate service
5. Service fetches data (blockchain or storage)
6. Data returned through GraphQL response
7. Frontend displays formatted results

## Security Architecture

### On-Chain Security

- PDA derivation prevents account collisions
- Authority verification prevents unauthorized updates
- Version validation prevents invalid states
- Size limits prevent DoS attacks

### Backend Security

- API key authentication for webhooks
- CORS configuration for cross-origin requests
- Helmet middleware for security headers
- Input validation for authority addresses
- Error handling without information leakage

### Frontend Security

- No sensitive data stored in client
- Environment variables for configuration
- HTTPS required in production
- Wallet connection handled by wallet adapter
- Transaction signing in user's wallet

## Scalability Considerations

### Blockchain Layer

- Each registry is independent (no global state)
- PDA structure allows O(1) account lookup
- Fixed account size enables predictable costs
- No program state limits horizontal scaling

### Backend Layer

- Stateless API design (except CI status storage)
- Can be horizontally scaled with load balancer
- RPC connection pooling
- JSON file storage can be replaced with database

### Frontend Layer

- Static site generation where possible
- SWR caching reduces API calls
- Dynamic imports for code splitting
- CDN distribution for static assets

## Performance Optimizations

### Backend

- Account data caching (can be added)
- Connection reuse for RPC calls
- Efficient binary decoding
- Minimal dependencies

### Frontend

- SWR stale-while-revalidate caching
- Dynamic component imports
- Optimistic UI updates
- Debounced input handling

## Monitoring and Observability

### Logging

- Backend: Console logging for all operations
- Frontend: Browser console for debugging
- Structured error messages

### Metrics

- Health check endpoint for uptime monitoring
- Error rates can be tracked via logs
- RPC call success/failure rates

### Alerting

- Health check monitoring
- Error rate thresholds
- RPC endpoint availability

## Future Enhancements

### Potential Improvements

1. Database storage for CI status (PostgreSQL, MongoDB)
2. Redis caching for registry data
3. WebSocket support for real-time updates
4. Batch registry queries
5. Registry search functionality
6. Multi-signature support for registry updates
7. Registry version history
8. Metadata validation on-chain
9. Automated CI status updates via GitHub Actions
10. Registry analytics dashboard

### Extension Points

- Service interfaces allow easy replacement of implementations
- Plugin architecture for additional features
- Webhook system extensible for other integrations
- GraphQL schema can be extended with new types

