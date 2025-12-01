# Development Guide

## Development Environment Setup

### Local Development

For local development, you can run all services manually or use Docker Compose.

#### Manual Setup

1. Start Solana test validator
2. Deploy blockchain program
3. Start backend service
4. Start frontend application

#### Docker Compose Setup

Use Docker Compose to run all services with a single command:

```bash
docker-compose up
```

This starts:
- Solana validator on port 8899
- Backend service on port 4000
- Frontend application on port 3000

### Development Tools

#### Recommended IDE Setup

- VS Code with extensions:
  - Rust Analyzer (for blockchain code)
  - TypeScript and JavaScript (for backend/frontend)
  - Solana (for program debugging)
  - ESLint (for code linting)

#### Code Formatting

- Rust: Use `cargo fmt` (automatic with Rust Analyzer)
- TypeScript/JavaScript: Use Prettier (configured in ESLint)
- Format on save recommended

#### Linting

```bash
# Backend
cd backend
pnpm lint

# Frontend
cd frontend
pnpm lint

# Blockchain
cd blockchain
pnpm lint
```

## Development Workflow

### Making Changes

1. Create a feature branch from main
2. Make your changes
3. Write or update tests
4. Run tests to ensure everything passes
5. Run linters
6. Commit changes
7. Push and create pull request

### Code Style Guidelines

#### Rust (Blockchain)

- Follow Rust naming conventions (snake_case for functions/variables)
- Use `cargo clippy` for additional linting
- Document public functions with doc comments
- Keep functions small and focused

#### TypeScript (Backend/Frontend)

- Use TypeScript strict mode
- Prefer explicit types over `any`
- Use async/await over promises
- Handle errors explicitly
- Use meaningful variable names

### Testing Strategy

#### Unit Tests

- Test individual functions and methods
- Mock external dependencies
- Aim for high code coverage

#### Integration Tests

- Test complete workflows
- Use test fixtures for consistent data
- Test error cases

#### End-to-End Tests

- Test user workflows in frontend
- Test API interactions
- Test blockchain transactions

## Debugging

### Backend Debugging

#### Enable Verbose Logging

```bash
DEBUG=* pnpm dev
```

#### Debug Registry Account

Use the debug script:

```bash
cd backend
npx tsx scripts/debug-account.ts <authority-address>
```

This will:
- Fetch the account from blockchain
- Display raw account data
- Attempt to decode the account
- Show detailed error messages if decoding fails

#### Debug RPC Connection

Check connection status:

```bash
curl http://localhost:4000/health
```

Check if RPC endpoint is accessible:

```bash
curl -X POST https://api.devnet.solana.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

### Frontend Debugging

#### Browser DevTools

- Open DevTools (F12)
- Check Console for errors
- Check Network tab for failed requests
- Check Application tab for storage issues

#### React DevTools

Install React DevTools browser extension to:
- Inspect component tree
- View component props and state
- Debug component re-renders

#### Wallet Debugging

- Check wallet extension console
- Verify wallet network matches RPC endpoint
- Check wallet permissions

### Blockchain Debugging

#### View Account Data

```bash
solana account <account-address> --url devnet
```

#### View Program

```bash
solana program show <program-id> --url devnet
```

#### View Transaction

```bash
solana confirm <transaction-signature> --url devnet
```

Or use Solana Explorer:
```
https://explorer.solana.com/tx/<signature>?cluster=devnet
```

#### Anchor Debugging

Enable Anchor debug logging:

```bash
RUST_LOG=anchor=debug anchor test
```

## Common Development Tasks

### Adding a New API Endpoint

1. Add route handler in `backend/src/views/`
2. Add service method if needed
3. Add tests
4. Update API documentation

Example:

```typescript
// backend/src/views/example.ts
export const createExampleRouter = () => {
  const router = express.Router();
  router.get("/", async (req, res) => {
    res.json({ message: "Hello" });
  });
  return router;
};
```

### Adding a New Frontend Component

1. Create component file in `frontend/components/`
2. Add component to page
3. Add tests if applicable
4. Update styling as needed

Example:

```typescript
// frontend/components/Example.tsx
export const Example = () => {
  return <div>Example Component</div>;
};
```

### Modifying Blockchain Program

1. Make changes to Rust code
2. Run `anchor build`
3. Run `anchor test` to verify
4. Deploy with `anchor deploy`

**Important**: Program changes require redeployment. Existing accounts remain compatible if you only add new instructions or modify existing logic without changing account structure.

### Adding a New GraphQL Query

1. Update schema in `backend/src/graphql/schema.ts`
2. Add resolver in `backend/src/graphql/resolvers.ts`
3. Add service method if needed
4. Test with GraphQL explorer

Example:

```typescript
// In schema.ts
type Query {
  newQuery(param: String!): String
}

// In resolvers.ts
Query: {
  newQuery: async (_parent, args, ctx) => {
    return "result";
  }
}
```

## Environment Variables

### Development Environment Variables

#### Backend

Create `backend/.env`:

```
PORT=4000
SOLANA_RPC_URL=http://localhost:8899
API_KEY=dev-api-key-minimum-16-characters
```

#### Frontend

Create `frontend/.env.local`:

```
NEXT_PUBLIC_SOLANA_RPC=http://localhost:8899
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

### Environment Variable Naming

- Backend: UPPER_SNAKE_CASE (e.g., `SOLANA_RPC_URL`)
- Frontend public: `NEXT_PUBLIC_*` prefix required for browser access
- Frontend private: Use server-side API routes

## Database and Storage

### CI Status Storage

Currently uses JSON file storage (`backend/storage/ci-status.json`). For production, consider:

- PostgreSQL for relational data
- MongoDB for document storage
- Redis for caching

### Migration Path

To migrate to a database:

1. Create new service implementation with database adapter
2. Update container to use new service
3. Migrate existing data
4. Remove file-based storage

## Performance Optimization

### Backend Performance

- Implement caching for registry data
- Use connection pooling for RPC
- Implement rate limiting
- Add request compression

### Frontend Performance

- Use dynamic imports for large components
- Optimize images and assets
- Implement service worker for caching
- Use CDN for static assets

### Blockchain Performance

- Batch multiple operations
- Optimize account data structure
- Minimize compute units usage
- Use efficient data structures

## Security Best Practices

### Code Security

- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all user inputs
- Sanitize data before database operations
- Use parameterized queries (when using database)

### Dependency Security

Regularly update dependencies:

```bash
# Check for outdated packages
pnpm outdated

# Update packages
pnpm update
```

Use security scanning:

```bash
# Backend
cd backend
pnpm audit

# Frontend
cd frontend
pnpm audit
```

### API Security

- Validate all inputs
- Use rate limiting
- Implement authentication where needed
- Use HTTPS in production
- Validate CORS origins

## Git Workflow

### Branch Naming

- `feature/description`: New features
- `fix/description`: Bug fixes
- `docs/description`: Documentation updates
- `refactor/description`: Code refactoring

### Commit Messages

Follow conventional commits:

```
feat: add new feature
fix: fix bug
docs: update documentation
refactor: refactor code
test: add tests
chore: maintenance tasks
```

### Pull Request Process

1. Create feature branch
2. Make changes and commit
3. Push branch to remote
4. Create pull request
5. Request review
6. Address feedback
7. Merge after approval

## Troubleshooting Development Issues

### Port Already in Use

```bash
# Find process using port
lsof -ti:4000

# Kill process
kill -9 <PID>
```

### Dependencies Out of Sync

```bash
# Remove node_modules and reinstall
rm -rf node_modules
pnpm install
```

### Build Errors

- Clear build cache
- Check TypeScript errors
- Verify all dependencies installed
- Check for version conflicts

### Transaction Failures

- Check wallet has SOL
- Verify network matches program
- Check program ID is correct
- Verify account exists

## Resources

### Documentation

- Solana Documentation: https://docs.solana.com
- Anchor Documentation: https://www.anchor-lang.com
- Next.js Documentation: https://nextjs.org/docs
- Express Documentation: https://expressjs.com
- GraphQL Documentation: https://graphql.org

### Tools

- Solana Explorer: https://explorer.solana.com
- Solana CLI: https://docs.solana.com/cli
- Anchor CLI: https://www.anchor-lang.com/docs/cli
- PNPM: https://pnpm.io

### Community

- Solana Discord: https://discord.gg/solana
- Anchor Discord: https://discord.gg/anchorlang
- Stack Overflow: Tag questions with `solana`, `anchor`, `nextjs`

