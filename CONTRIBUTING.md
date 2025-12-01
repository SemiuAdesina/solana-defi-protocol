# Contributing Guide

Thank you for your interest in contributing to the Solana Audit Registry Protocol! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and considerate of others
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Maintain a positive and professional environment

## Getting Started

### Prerequisites

Ensure you have the required tools installed:

- Node.js 20.x or higher
- PNPM 8.x or higher
- Rust 1.70+ with Cargo
- Solana CLI 1.18+
- Anchor CLI 0.30+
- Git

### Setting Up Development Environment

1. **Fork and Clone:**

```bash
git clone https://github.com/YOUR_USERNAME/solana-defi-protocol.git
cd solana-defi-protocol
```

2. **Install Dependencies:**

```bash
# Install root dependencies
pnpm install

# Install backend dependencies
cd backend
pnpm install

# Install frontend dependencies
cd ../frontend
pnpm install

# Install blockchain dependencies
cd ../blockchain
npm install
```

3. **Configure Environment:**

```bash
# Backend
cd backend
cp env.template .env
# Edit .env with your configuration

# Frontend
cd ../frontend
cp env.template .env.local
# Edit .env.local with your configuration
```

4. **Verify Setup:**

```bash
# From project root
./scripts/verify-setup.sh
```

## Development Workflow

### 1. Create a Branch

Create a feature branch from `main`:

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

**Branch Naming Conventions:**
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions or updates

### 2. Make Changes

- Follow the existing code style
- Write clear, self-documenting code
- Add comments for complex logic
- Update tests for your changes
- Update documentation as needed

### 3. Write Tests

All code changes should include tests:

**Backend:**
```bash
cd backend
pnpm test
```

**Frontend:**
```bash
cd frontend
pnpm test
```

**Blockchain:**
```bash
cd blockchain
anchor test
```

### 4. Run Linters

Ensure code passes all linters:

**Backend:**
```bash
cd backend
pnpm lint
```

**Frontend:**
```bash
cd frontend
pnpm lint
```

**Blockchain:**
```bash
cd blockchain
pnpm lint
```

### 5. Commit Changes

Follow conventional commit messages:

```
feat: add new feature
fix: fix bug
docs: update documentation
refactor: refactor code
test: add tests
chore: maintenance tasks
```

**Examples:**
- `feat: add metadata validation endpoint`
- `fix: resolve CORS configuration issue`
- `docs: update API documentation`
- `test: add tests for registry service`

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub with:
- Clear title and description
- Reference related issues
- List of changes made
- Screenshots (for UI changes)

## Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript strict mode
- Prefer explicit types over `any`
- Use async/await over promises
- Handle errors explicitly
- Use meaningful variable names
- Follow existing code style

**Example:**
```typescript
async function fetchMetadata(authority: string): Promise<RegistryMetadata | null> {
  try {
    const response = await fetch(`${backendUrl}/metadata/${authority}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch metadata:', error);
    return null;
  }
}
```

### Rust

- Follow Rust naming conventions (snake_case for functions/variables)
- Use `cargo fmt` for formatting
- Use `cargo clippy` for linting
- Document public functions with doc comments
- Keep functions small and focused

**Example:**
```rust
/// Initializes the registry PDA for the authority.
pub fn initialize_registry(
    ctx: Context<InitializeRegistry>,
    version: u64,
) -> Result<()> {
    require!(version > 0, AuditRegistryError::InvalidVersion);
    let registry = &mut ctx.accounts.registry;
    registry.authority = ctx.accounts.authority.key();
    registry.version = version;
    Ok(())
}
```

### React/Next.js

- Use functional components with hooks
- Keep components focused and reusable
- Use TypeScript for all components
- Follow Next.js best practices
- Optimize for performance

## Testing Guidelines

### Test Structure

Use AAA (Arrange, Act, Assert) pattern:

```typescript
it('should fetch metadata successfully', async () => {
  // Arrange
  const mockAuthority = 'EaDViQQPiBUqBCUXXkEsihCVHRcTuMctmnfEn9Mv9sqA';
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockMetadata
  });

  // Act
  const result = await fetchMetadata(mockAuthority);

  // Assert
  expect(result).toEqual(mockMetadata);
});
```

### Test Coverage

- Aim for high test coverage (80%+ for services)
- Test both happy paths and error cases
- Mock external dependencies
- Write clear test descriptions

### Running Tests

```bash
# All tests
cd backend && pnpm test
cd frontend && pnpm test

# With coverage
cd backend && pnpm test -- --coverage
cd frontend && pnpm test -- --coverage

# Watch mode
cd backend && pnpm test:watch
cd frontend && pnpm test:watch
```

## Documentation

### Code Documentation

- Document public functions and methods
- Explain complex logic
- Include parameter and return type documentation
- Update documentation when code changes

### README Updates

- Update README.md for significant changes
- Add new setup instructions if needed
- Update examples if API changes
- Keep documentation current

### Documentation Files

Located in `docs/` directory:
- `ARCHITECTURE.md` - System architecture
- `API.md` - API documentation
- `DEVELOPMENT.md` - Development guide
- `TESTING.md` - Testing documentation
- `DEPLOYMENT.md` - Deployment guide

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Linters pass
- [ ] Documentation updated
- [ ] Branch is up to date with main
- [ ] No merge conflicts

### PR Review Checklist

- [ ] Code review feedback addressed
- [ ] All CI checks passing
- [ ] Tests added for new features
- [ ] Documentation updated
- [ ] Breaking changes documented

### After Merge

- Delete feature branch
- Update local main branch
- Celebrate your contribution!

## Project Structure

```
solana-defi-protocol/
├── blockchain/        # Solana program (Anchor/Rust)
├── backend/           # Node.js backend service
├── frontend/          # Next.js frontend application
├── docs/              # Documentation
├── scripts/           # Utility scripts
└── .github/           # GitHub workflows and templates
```

## Areas for Contribution

### High Priority

- Additional test coverage
- Performance optimizations
- Security improvements
- Documentation enhancements
- Bug fixes

### Feature Ideas

- Database integration for CI status
- Enhanced error handling
- Additional GraphQL queries
- UI/UX improvements
- Monitoring and analytics

### Documentation

- API examples
- Tutorial guides
- Architecture diagrams
- Deployment guides
- Troubleshooting guides

## Getting Help

### Resources

- Read existing documentation in `docs/`
- Check existing issues on GitHub
- Review code examples in the codebase

### Questions

- Open a GitHub issue for questions
- Use discussions for general inquiries
- Check existing documentation first

## Release Process

Releases are managed by project maintainers. Contributors don't need to worry about versioning or releases.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Project documentation where applicable

Thank you for contributing to the Solana Audit Registry Protocol!

