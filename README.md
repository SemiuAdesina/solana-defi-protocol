# Solana DeFi Protocol - Audit Registry

A comprehensive Solana-based DeFi protocol for managing audit registry metadata with on-chain verification, GraphQL API access, and CI status monitoring. This protocol enables projects to establish immutable audit readiness records on the Solana blockchain.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

## Overview

The Solana DeFi Protocol Audit Registry is a three-tier application consisting of:

1. **Blockchain Program**: Solana smart contract (Anchor) that manages registry accounts on-chain
2. **Backend Service**: Node.js/Express API server with GraphQL endpoint for querying registry data
3. **Frontend Application**: Next.js dashboard for wallet connectivity, metadata management, and CI monitoring

The protocol allows users to:
- Initialize registry accounts associated with their wallet addresses
- Store and update metadata URIs with checksums for verification
- Query registry data via REST API or GraphQL
- Monitor CI/CD pipeline status integrated with the registry
- Display audit readiness information in a user-friendly dashboard

## Architecture

### Blockchain Layer

The blockchain program is built with Anchor framework and Rust. It provides two main instructions:

- `initialize_registry`: Creates a Program Derived Address (PDA) for an authority to store audit metadata
- `update_metadata`: Updates the metadata URI and checksum stored in the registry account

Registry accounts are PDAs derived from the authority's public key using the seed `["registry", authority]`. Each account stores:
- Authority public key (32 bytes)
- Version number (8 bytes, u64)
- Bump seed (1 byte, u8)
- Metadata URI (variable length, max 200 bytes, String)
- Metadata checksum (32 bytes, [u8; 32])

Total account size: 285 bytes (8 discriminator + 32 authority + 8 version + 1 bump + 4 URI length + 200 URI max + 32 checksum)

### Backend Layer

The backend service provides:
- REST API endpoints for metadata and CI status
- GraphQL API with Apollo Server
- Account decoding service to read on-chain registry data
- CI status webhook endpoint for external integrations

The backend connects to a Solana RPC endpoint to fetch and decode account data from the blockchain program.

### Frontend Layer

The frontend is a Next.js application featuring:
- Solana wallet adapter integration (Phantom, etc.)
- Real-time metadata display with automatic refresh
- Registry initialization and update functionality
- GraphQL query explorer for developers
- CI status monitoring dashboard
- Responsive design with mobile support

## Project Structure

```
solana-defi-protocol/
├── blockchain/              # Solana program (Anchor/Rust)
│   ├── programs/
│   │   └── audit_registry/
│   │       └── src/
│   │           └── lib.rs   # Main program logic
│   ├── tests/               # Anchor integration tests
│   ├── Anchor.toml          # Anchor configuration
│   └── Cargo.toml           # Rust dependencies
│
├── backend/                 # Node.js backend service
│   ├── src/
│   │   ├── services/        # Business logic services
│   │   │   ├── registry/    # Registry account decoding
│   │   │   └── ci-status/   # CI status management
│   │   ├── graphql/         # GraphQL schema and resolvers
│   │   ├── views/           # Express route handlers
│   │   └── index.ts         # Application entry point
│   ├── scripts/             # Utility scripts
│   └── storage/             # JSON file storage for CI status
│
├── frontend/                # Next.js frontend application
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   ├── lib/                 # Utility functions
│   └── next.config.mjs      # Next.js configuration
│
├── docker-compose.yml       # Docker orchestration
├── package.json             # Root workspace configuration
└── pnpm-workspace.yaml      # PNPM workspace configuration
```

## Prerequisites

- Node.js 20.x or higher
- PNPM 8.x or higher (package manager)
- Rust 1.70+ with Cargo
- Solana CLI 1.18+
- Anchor CLI 0.30+
- Docker and Docker Compose (optional, for containerized development)

### Installing Prerequisites

#### Node.js and PNPM

```bash
# Install Node.js from nodejs.org or using nvm
node --version  # Should be 20.x or higher

# Install PNPM globally
npm install -g pnpm
pnpm --version  # Should be 8.x or higher
```

#### Rust and Cargo

```bash
# Install Rust using rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustc --version
cargo --version
```

#### Solana CLI

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
solana --version
solana config set --url devnet  # For devnet development
```

#### Anchor Framework

```bash
# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
anchor --version
```

## Installation

### Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd solana-defi-protocol

# Install root dependencies
pnpm install

# Install blockchain dependencies
cd blockchain
npm install

# Install backend dependencies
cd ../backend
pnpm install

# Install frontend dependencies
cd ../frontend
pnpm install
```

### Verify Installation

```bash
# From project root
./scripts/verify-setup.sh
```

## Configuration

### Backend Configuration

Create `backend/.env` from template:

```bash
cd backend
cp env.template .env
```

Edit `backend/.env`:

```
PORT=4000
SOLANA_RPC_URL=https://api.devnet.solana.com
API_KEY=your-secure-api-key-minimum-16-characters
```

Environment variables:
- `PORT`: Server port (default: 4000)
- `SOLANA_RPC_URL`: Solana RPC endpoint URL
- `API_KEY`: API key for webhook authentication (minimum 16 characters)

### Frontend Configuration

Create `frontend/.env.local` from template:

```bash
cd frontend
cp env.template .env.local
```

Edit `frontend/.env.local`:

```
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

Environment variables:
- `NEXT_PUBLIC_SOLANA_RPC`: Solana RPC endpoint for wallet connection
- `NEXT_PUBLIC_BACKEND_URL`: Backend API URL

### Blockchain Configuration

The blockchain program is configured in `blockchain/Anchor.toml`:

```toml
[programs.devnet]
audit_registry = "H3ZDWgBkZ9kxer2KjCeL2oFZkftZRUTikpd6PseXkgpL"

[provider]
cluster = "Devnet"
wallet = "~/.config/solana/id.json"
```

The program ID is declared in `blockchain/programs/audit_registry/src/lib.rs` using `declare_id!()`.

## Development

### Local Development with Docker Compose

The easiest way to run all services locally:

```bash
# Start all services
docker-compose up

# Services will be available at:
# - Validator: http://localhost:8899
# - Backend: http://localhost:4000
# - Frontend: http://localhost:3000
```

### Manual Development Setup

#### 1. Start Solana Validator (Local)

```bash
solana-test-validator \
  --reset \
  --limit-ledger-size \
  --faucet-port 9900 \
  --rpc-port 8899
```

#### 2. Deploy Blockchain Program

```bash
cd blockchain
solana config set --url http://localhost:8899
anchor build
anchor deploy --provider.cluster localnet
```

Note the program ID from the deployment output and update `Anchor.toml` if needed.

#### 3. Start Backend Service

```bash
cd backend
PORT=4000 \
SOLANA_RPC_URL=http://localhost:8899 \
API_KEY=dev-api-key-minimum-16-chars \
pnpm dev
```

The backend will be available at `http://localhost:4000`.

#### 4. Start Frontend Application

```bash
cd frontend
NEXT_PUBLIC_SOLANA_RPC=http://localhost:8899 \
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000 \
pnpm dev
```

The frontend will be available at `http://localhost:3000`.

### Development Workflow

1. Make changes to code
2. Backend auto-reloads with `tsx watch`
3. Frontend hot-reloads with Next.js dev server
4. Blockchain changes require rebuild and redeploy:
   ```bash
   cd blockchain
   anchor build
   anchor deploy
   ```

## Testing

### Blockchain Tests

Run Anchor integration tests:

```bash
cd blockchain
anchor test
```

Run specific test suite:

```bash
anchor test --skip-local-validator --skip-build tests/init-registry.spec.ts
```

### Backend Tests

Run backend unit and integration tests:

```bash
cd backend
pnpm test              # Run once
pnpm test:watch        # Watch mode
```

Run with coverage:

```bash
pnpm test -- --coverage
```

### Frontend Tests

Run frontend tests:

```bash
cd frontend
pnpm test              # Run once
pnpm test:watch        # Watch mode
```

Run with coverage:

```bash
pnpm test -- --coverage
```

## Deployment

See `DEPLOYMENT.md` for comprehensive deployment instructions for:
- Blockchain program deployment to Devnet/Mainnet
- Backend deployment to Railway, Render, or Fly.io
- Frontend deployment to Vercel, Netlify, or Cloudflare Pages

### Quick Deployment Checklist

1. Deploy blockchain program to Devnet/Mainnet
2. Update program ID in backend and frontend code
3. Set backend environment variables on hosting platform
4. Set frontend environment variables on hosting platform
5. Deploy backend service
6. Deploy frontend application
7. Test all endpoints and user flows

## API Reference

### REST API Endpoints

#### Health Check

```
GET /health
```

Returns server health status.

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-30T12:00:00.000Z"
}
```

#### Get Registry Metadata

```
GET /metadata/:authority
```

Fetches registry metadata for a given authority address.

Parameters:
- `authority` (path): Solana wallet address (base58)

Response:
```json
{
  "authority": "EaDViQQPiBUqBCUXXkEsihCVHRcTuMctmnfEn9Mv9sqA",
  "version": 1,
  "metadataUri": "https://example.com/metadata.json",
  "metadataChecksum": [57, 29, 148, ...]
}
```

Errors:
- `404`: Registry not found
- `500`: Server error

#### Get CI Statuses

```
GET /ci/status?limit=10
```

Retrieves recent CI pipeline statuses.

Query Parameters:
- `limit` (optional): Maximum number of statuses to return (default: 10)

Response:
```json
[
  {
    "pipeline": "test-pipeline",
    "status": "success",
    "commit": "abc123",
    "runId": "run-123",
    "triggeredBy": "user",
    "timestamp": "2025-11-30T12:00:00.000Z"
  }
]
```

#### Webhook: Submit CI Status

```
POST /ci/status/webhook
Headers:
  x-api-key: <API_KEY>
Content-Type: application/json
```

Submits a new CI status update.

Request Body:
```json
{
  "pipeline": "test-pipeline",
  "status": "success",
  "commit": "abc123",
  "runId": "run-123",
  "triggeredBy": "user",
  "timestamp": "2025-11-30T12:00:00.000Z"
}
```

### GraphQL API

The GraphQL endpoint is available at `/graphql`.

#### Schema

```graphql
type RegistryMetadata {
  authority: String!
  version: Int!
  metadataUri: String
  metadataChecksum: [Int!]
}

type CiStatus {
  pipeline: String!
  status: String!
  commit: String!
  runId: String!
  triggeredBy: String!
  timestamp: String!
}

type Query {
  registry(authority: String!): RegistryMetadata
  ciStatuses(limit: Int = 10): [CiStatus!]!
  ciStatus(runId: String!): CiStatus
}
```

#### Example Queries

Get registry metadata:

```graphql
query GetRegistry {
  registry(authority: "EaDViQQPiBUqBCUXXkEsihCVHRcTuMctmnfEn9Mv9sqA") {
    authority
    version
    metadataUri
    metadataChecksum
  }
}
```

Get recent CI statuses:

```graphql
query GetCiStatuses {
  ciStatuses(limit: 5) {
    pipeline
    status
    commit
    runId
    triggeredBy
    timestamp
  }
}
```

Get specific CI status:

```graphql
query GetCiStatus {
  ciStatus(runId: "run-123") {
    pipeline
    status
    commit
    timestamp
  }
}
```

### Blockchain Program Instructions

#### Initialize Registry

Creates a new registry account for an authority.

Accounts:
- `authority` (signer, writable): The authority initializing the registry
- `registry` (PDA, writable): The registry account to initialize
- `system_program`: System program for account creation

Arguments:
- `version` (u64): Version number (must be > 0)

#### Update Metadata

Updates the metadata URI and checksum for an existing registry.

Accounts:
- `authority` (signer): The authority updating metadata
- `registry` (PDA, writable): The registry account to update

Arguments:
- `payload`: MetadataInput struct
  - `uri` (String): Metadata URI (max 200 bytes)
  - `checksum` ([u8; 32]): SHA-256 checksum of metadata

## Troubleshooting

### Common Issues

#### "No registry metadata found"

This means the registry account has not been initialized for that authority address. Initialize it using:
1. Frontend: Connect wallet and click "Initialize Registry"
2. Backend script: `cd backend && npx tsx scripts/init-registry-web3.ts <authority-address>`
3. Anchor test: `cd blockchain && anchor test --skip-local-validator tests/init-registry.spec.ts`

#### Backend cannot connect to Solana RPC

- Verify `SOLANA_RPC_URL` environment variable is set correctly
- Check network connectivity to RPC endpoint
- Verify RPC endpoint is publicly accessible
- For devnet, use `https://api.devnet.solana.com`

#### Frontend cannot connect to backend

- Verify `NEXT_PUBLIC_BACKEND_URL` environment variable matches backend URL
- Check CORS configuration in backend (should allow all origins by default)
- Verify backend service is running and accessible
- Check browser console for detailed error messages

#### Wallet connection issues

- Ensure wallet extension (Phantom, etc.) is installed
- Verify wallet network matches RPC endpoint (Devnet vs Mainnet)
- For Devnet, enable Developer Mode in wallet settings
- Clear browser cache and reload page

#### Transaction failures

- Verify wallet has sufficient SOL for transaction fees
- Ensure wallet network matches program deployment network
- Check program ID matches deployed program
- Verify account ownership and permissions

#### Account decoding errors

- Verify program ID in backend matches deployed program
- Check account discriminator matches expected value
- Ensure account is owned by the correct program
- Verify account data structure matches program schema

### Debugging

#### Backend Logs

Backend logs are output to console. Enable verbose logging:

```bash
DEBUG=* pnpm dev
```

Check registry decoding:

```bash
cd backend
npx tsx scripts/debug-account.ts <authority-address>
```

#### Frontend Console

Open browser DevTools (F12) and check:
- Console tab for JavaScript errors
- Network tab for API request failures
- Application tab for local storage issues

#### Blockchain Program

View on-chain account data:

```bash
solana account <registry-pda-address> --url devnet
```

Check program deployment:

```bash
solana program show <program-id> --url devnet
```

## License

See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Support

For issues, questions, or contributions, please open an issue on the repository.

