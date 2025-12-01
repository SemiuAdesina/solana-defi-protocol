# Changelog

All notable changes to the Solana Audit Registry Protocol will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Production deployment configurations
- Database integration for CI status storage
- Enhanced error handling and monitoring
- Additional GraphQL queries and mutations
- Performance optimizations

## [1.0.0] - 2025-11-30

### Added

#### Blockchain
- Initial Solana program implementation (`audit_registry`)
- `initialize_registry` instruction for creating registry accounts
- `update_metadata` instruction for updating metadata URI and checksum
- Registry account structure with authority, version, bump, URI, and checksum
- Integration tests for registry initialization and metadata updates
- Program deployment to devnet (Program ID: `H3ZDWgBkZ9kxer2KjCeL2oFZkftZRUTikpd6PseXkgpL`)

#### Backend
- Express server with REST API endpoints
- Apollo Server GraphQL endpoint
- Registry service for decoding on-chain account data
- CI status service with JSON file storage
- Metadata endpoint (`/metadata/:authority`)
- CI status endpoints (`/ci/status`, `/ci/status/:runId`)
- CI webhook endpoint (`/ci/status/webhook`) with API key authentication
- Health check endpoint (`/health`)
- Comprehensive error handling
- CORS configuration
- API key middleware for webhook protection

#### Frontend
- Next.js 14 application with React 18
- Solana wallet adapter integration (Phantom and other wallets)
- Registry metadata display card
- Metadata initialization and update functionality
- CI status monitoring board
- GraphQL query explorer (GraphiQL)
- Subsidy readiness checklist component
- Responsive design with mobile support
- Real-time metadata refresh with SWR
- Transaction confirmation modals

#### Testing
- Backend unit and integration tests (62 tests passing)
- Frontend component and API tests (9 tests passing)
- Blockchain integration tests configured
- Test coverage reporting
- Mock-based testing for isolation

#### Documentation
- Comprehensive README.md
- Architecture documentation (`docs/ARCHITECTURE.md`)
- API documentation (`docs/API.md`)
- Development guide (`docs/DEVELOPMENT.md`)
- Testing documentation (`docs/TESTING.md`)
- Deployment guide (`DEPLOYMENT.md`)
- Security policy (`SECURITY.md`)
- Contributing guide (`CONTRIBUTING.md`)
- Changelog (`CHANGELOG.md`)

#### CI/CD
- GitHub Actions workflow for continuous integration
- Automated testing on push and pull requests
- Linting checks (ESLint, Clippy)
- Security scanning (cargo audit, npm audit)
- Coverage reporting
- CI webhook integration for status updates

#### Infrastructure
- Docker Compose configuration for local development
- Dockerfiles for backend and frontend
- Environment variable templates
- Setup verification script

### Security

- API key authentication for webhook endpoints
- Input validation on all endpoints
- Error handling without information leakage
- PDA-based account structure prevents collisions
- Authority validation for metadata updates
- No private key storage or transmission

### Performance

- Efficient account data decoding
- Optimized GraphQL queries
- Client-side caching with SWR
- Responsive UI with optimized rendering

## Version History

- **1.0.0** (2025-11-30): Initial release with full audit registry functionality

## Upgrade Guide

### From Development to Production

1. Deploy blockchain program to target network (devnet/mainnet)
2. Update program ID in configuration if needed
3. Set production environment variables
4. Deploy backend service to hosting platform
5. Deploy frontend application to hosting platform
6. Update metadata with production URLs
7. Verify all endpoints are accessible

## Deprecations

None in current version.

## Breaking Changes

None in current version.

## Migration Notes

### Initial Setup

For first-time setup, follow the installation guide in README.md.

### Upgrading Dependencies

When upgrading dependencies:
1. Review changelogs for breaking changes
2. Update dependencies incrementally
3. Run all tests after each update
4. Fix any compatibility issues
5. Update documentation if APIs change

## Future Roadmap

- [ ] Production deployment to mainnet
- [ ] Database integration for scalable storage
- [ ] Enhanced monitoring and analytics
- [ ] Additional GraphQL features
- [ ] Performance optimizations
- [ ] Security audit completion
- [ ] Multi-registry support
- [ ] Advanced metadata validation

