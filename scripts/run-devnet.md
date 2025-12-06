# Running Application with Devnet

Since your program is already deployed to Devnet, you can run the app directly without starting a local validator.

## Quick Start

### Option 1: Use the startup script

```bash
./scripts/start-devnet.sh
```

This will start both backend and frontend automatically.

### Option 2: Manual start (3 terminal windows)

#### Terminal 1: Start Backend

```bash
cd backend
pnpm dev
```

Backend will be available at: http://localhost:4000

#### Terminal 2: Start Frontend

```bash
cd frontend
pnpm dev
```

Frontend will be available at: http://localhost:3000

#### Terminal 3: Monitor logs (optional)

```bash
# Watch backend logs
tail -f backend.log

# Or watch frontend logs
tail -f frontend.log
```

## Configuration

Your environment files are already configured for Devnet:

- `backend/.env`: Points to `https://api.devnet.solana.com`
- `frontend/.env.local`: Points to `https://api.devnet.solana.com` for RPC
- Program is deployed to Devnet: `H3ZDWgBkZ9kxer2KjCeL2oFZkftZRUTikpd6PseXkgpL`

## Access Points

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Backend GraphQL: http://localhost:4000/graphql
- Backend Health: http://localhost:4000/health

## Testing in Browser

1. Open http://localhost:3000
2. Connect your Solana wallet (Phantom, etc.)
3. Make sure your wallet is set to **Devnet** network
4. Test the application features

## Troubleshooting

### Backend won't start
- Check if port 4000 is already in use
- Verify `backend/.env` exists and has correct values
- Check backend logs for errors

### Frontend won't start
- Check if port 3000 is already in use
- Verify `frontend/.env.local` exists and has correct values
- Check frontend logs for errors

### Wallet connection issues
- Ensure wallet extension is installed (Phantom, etc.)
- Set wallet to Devnet network
- Check browser console for errors

