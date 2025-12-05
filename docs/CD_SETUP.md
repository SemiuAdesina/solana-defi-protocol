# Continuous Deployment (CD) Setup Guide

This document explains how to configure the CD workflow for automatic deployment after CI passes.

## CRITICAL: Program ID Preservation

**Before deploying, you MUST save your Program Keypair!**

Without the `SOLANA_PROGRAM_KEYPAIR` secret, Anchor will generate a **new Program ID on every deployment**, which will:
- Break your frontend (it has a hardcoded Program ID)
- Lose all on-chain state (data is tied to the Program ID)
- Require updating configurations after every deployment

**Quick Fix:**
1. Export your program keypair: `cat blockchain/target/deploy/audit_registry-keypair.json | base64`
2. Add it as GitHub secret: `SOLANA_PROGRAM_KEYPAIR`
3. See detailed instructions below

## Overview

The CD workflow (`.github/workflows/cd.yml`) automatically deploys your application after the CI pipeline passes on the `main` branch. It deploys:

1. **Blockchain Program** → Devnet
2. **Backend Service** → Railway/Render/Fly.io
3. **Frontend Application** → Vercel/Netlify/Cloudflare Pages

## Workflow Trigger

The CD workflow runs automatically when:
- The CI workflow completes successfully on the `main` branch
- You manually trigger it via GitHub Actions UI (workflow_dispatch)

## Required GitHub Secrets

### Blockchain Deployment Secrets

#### `SOLANA_DEPLOYER_KEYPAIR` (Required)
- **Description**: Base64-encoded Solana keypair for deploying the program (pays gas fees)
- **How to create**:
  ```bash
  # Generate a new keypair (or use existing wallet)
  solana-keygen new --outfile deployer-keypair.json
  
  # Export as base64 (on macOS/Linux)
  cat deployer-keypair.json | base64
  
  # Export as base64 (on Windows with PowerShell)
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("deployer-keypair.json"))
  ```
- **Funding**: Make sure this wallet has at least 2 SOL on Devnet
  - Get free SOL from: https://faucet.solana.com/
- **Security**: Never commit this keypair file to the repository!

#### `SOLANA_PROGRAM_KEYPAIR` (CRITICAL - Required to preserve Program ID)
- **Description**: Base64-encoded program keypair that determines your Program ID
- **Why it's critical**: Without this, Anchor generates a NEW Program ID on every deployment, breaking your frontend and losing all on-chain state!
- **How to create**:
  ```bash
  # Navigate to your blockchain directory
  cd blockchain
  
  # Build once to generate the keypair
  anchor build
  
  # Export the program keypair as base64 (on macOS/Linux)
  cat target/deploy/audit_registry-keypair.json | base64
  
  # Export as base64 (on Windows with PowerShell)
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("target/deploy/audit_registry-keypair.json"))
  ```
- **Important**: 
  - **Save this keypair BEFORE your first deployment!**
  - If you've already deployed, find your existing program keypair
  - The Program ID is derived from this keypair: `solana address -k target/deploy/audit_registry-keypair.json`
  - This keypair file should already exist in `blockchain/target/deploy/` after building locally

### Backend Deployment Secrets

Choose ONE of the following platforms:

#### Option 1: Railway
- `RAILWAY_TOKEN` - Railway API token
- `RAILWAY_BACKEND_SERVICE_ID` - Railway service ID for backend

#### Option 2: Render
- `RENDER_API_KEY` - Render API key
- `RENDER_BACKEND_SERVICE_ID` - Render service ID for backend

#### Option 3: Fly.io
- `FLY_API_TOKEN` - Fly.io API token
- Configure `fly.toml` in the backend directory

### Frontend Deployment Secrets

Choose ONE of the following platforms:

#### Option 1: Vercel (Recommended for Next.js)
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

#### Option 2: Netlify
- `NETLIFY_AUTH_TOKEN` - Netlify authentication token
- `NETLIFY_SITE_ID` - Netlify site ID

#### Option 3: Cloudflare Pages
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `CLOUDFLARE_PROJECT_NAME` - Cloudflare Pages project name

### Optional Configuration Secrets

- `BACKEND_URL` - Your deployed backend URL (for health checks)
- `FRONTEND_URL` - Your deployed frontend URL (for verification)
- `CI_WEBHOOK_API_KEY` - API key for deployment notifications (if using webhook)

## Setup Instructions

### Step 1: Save Your Program Keypair (CRITICAL!)

**DO THIS FIRST!** Without your program keypair, every deployment will generate a new Program ID, breaking your frontend.

```bash
# Navigate to blockchain directory
cd blockchain

# Build the program to generate the keypair (if not already built)
anchor build

# Get your Program ID (for reference)
solana address -k target/deploy/audit_registry-keypair.json

# Export the program keypair as base64 (SAVE THIS!)
cat target/deploy/audit_registry-keypair.json | base64

# Copy the entire base64 string - this is your SOLANA_PROGRAM_KEYPAIR secret
```

**If you've already deployed:**
- Check your existing program ID in `blockchain/Anchor.toml`
- The keypair file should be in `blockchain/target/deploy/audit_registry-keypair.json`
- Export it the same way: `cat target/deploy/audit_registry-keypair.json | base64`

### Step 2: Generate Solana Deployer Keypair

```bash
# Create a new keypair for deployment (pays gas fees)
solana-keygen new --outfile deployer-keypair.json --no-bip39-passphrase

# Get the base64 encoding
cat deployer-keypair.json | base64

# Fund the wallet on Devnet
DEPLOYER_ADDRESS=$(solana-keygen pubkey deployer-keypair.json)
solana airdrop 2 $DEPLOYER_ADDRESS --url devnet

# Verify balance (should show at least 2 SOL)
solana balance $DEPLOYER_ADDRESS --url devnet
```

### Step 2: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret listed above based on your deployment platform choice

### Step 3: Choose Deployment Platform

#### For Backend:

**Railway:**
1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Create new project: `railway init`
4. Get your service ID from Railway dashboard
5. Get API token from Railway settings

**Render:**
1. Create account at render.com
2. Create a new Web Service
3. Get API key from Account Settings → API Keys
4. Get service ID from your service dashboard

**Fly.io:**
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `flyctl auth login`
3. Launch app: `flyctl launch` (in backend directory)
4. Get API token: `flyctl tokens create deploy`

#### For Frontend:

**Vercel:**
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Link project: `cd frontend && vercel link`
4. Get tokens and IDs from Vercel dashboard

**Netlify:**
1. Create account at netlify.com
2. Create new site from Git
3. Get auth token from User settings → Applications
4. Get site ID from Site settings → General

**Cloudflare Pages:**
1. Create account at cloudflare.com
2. Go to Workers & Pages → Create application → Pages
3. Get API token from My Profile → API Tokens
4. Get account ID from Workers & Pages dashboard

### Step 4: Configure Environment Variables

#### Backend Environment Variables (on deployment platform)

Set these in your backend hosting platform:

- `PORT` - Server port (usually 4000 or auto-assigned)
- `SOLANA_RPC_URL` - `https://api.devnet.solana.com` (or mainnet URL)
- `API_KEY` - Your secure API key (minimum 16 characters)

#### Frontend Environment Variables (on deployment platform)

Set these in your frontend hosting platform:

- `NEXT_PUBLIC_SOLANA_RPC` - `https://api.devnet.solana.com` (or mainnet URL)
- `NEXT_PUBLIC_BACKEND_URL` - Your deployed backend URL

### Step 5: Test the Deployment

1. Push a commit to `main` branch
2. Wait for CI to pass
3. CD workflow will automatically trigger
4. Monitor the deployment in GitHub Actions tab

Or manually trigger:
1. Go to **Actions** tab
2. Select **cd** workflow
3. Click **Run workflow**
4. Select branch and click **Run workflow**

## Deployment Order

The CD workflow deploys components in this order:

1. **Blockchain Program** → Devnet
   - Builds and deploys the Anchor program
   - Verifies wallet has sufficient SOL
   - Outputs program ID and explorer link

2. **Backend Service** → Your chosen platform
   - Builds Docker image
   - Deploys to your platform
   - Runs health check

3. **Frontend Application** → Your chosen platform
   - Builds Next.js application
   - Deploys to your platform
   - Verifies deployment

4. **Notifications** → Sends webhook (if configured)
   - Reports deployment status
   - Includes commit and deployment URLs

## Troubleshooting

### Blockchain Deployment Fails

**Issue**: "Insufficient funds"
- **Solution**: Fund your deployer wallet with at least 2 SOL
  ```bash
  solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet
  ```

**Issue**: "Invalid keypair"
- **Solution**: Verify the base64 encoding is correct
  - Re-export the keypair as base64
  - Make sure there are no newlines or extra characters

### Backend Deployment Fails

**Issue**: "Authentication failed"
- **Solution**: Verify your platform API token/credentials are correct
- Check token hasn't expired
- Ensure token has deployment permissions

**Issue**: "Service not found"
- **Solution**: Verify service ID matches your platform dashboard
- Check service name is correct

### Frontend Deployment Fails

**Issue**: "Build failed"
- **Solution**: Check frontend builds locally first
  ```bash
  cd frontend
  pnpm build
  ```
- Verify all environment variables are set
- Check Next.js configuration

**Issue**: "Environment variables missing"
- **Solution**: Ensure `NEXT_PUBLIC_*` variables are set in deployment platform
- Frontend needs these at build time

## Security Best Practices

1. **Never commit secrets**: All sensitive data in GitHub Secrets
2. **Rotate keys regularly**: Update API tokens periodically
3. **Use separate wallets**: Don't use your main wallet for deployments
4. **Limit access**: Only grant deployment permissions to trusted team members
5. **Monitor deployments**: Review deployment logs regularly

## Manual Deployment

If automatic deployment is not desired, you can:

1. Disable the workflow by commenting out triggers
2. Use `workflow_dispatch` only for manual deployments
3. Deploy manually using platform CLIs

## Next Steps

After CD is set up:

1. Monitor first deployment carefully
2. Verify all services are accessible
3. Test end-to-end functionality
4. Set up monitoring and alerting
5. Consider adding staging environment
6. Document deployment URLs

## Support

For issues or questions:
- Check GitHub Actions logs
- Review platform-specific documentation
- Verify all secrets are configured correctly
- Test deployments manually first

