# Render Deployment Guide (Free Tier)

This guide explains how to deploy the Solana DeFi Protocol on Render's **free tier**.

## ⚠️ Free Tier Limitations

Render's free tier has some limitations:
- **Services spin down after 15 minutes of inactivity**
- **First request after spin-down takes 30-60 seconds** (cold start)
- **750 hours/month total** (enough for 1 service running 24/7)
- **No persistent disk storage** (data in `/app/storage` is ephemeral)

## 🚀 Quick Deploy (Using render.yaml)

### Option 1: Automatic Setup (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Add Render configuration"
   git push origin main
   ```

2. **Connect to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select the repository
   - Render will detect `render.yaml` automatically

3. **Configure Environment Variables**
   - In the Render dashboard, go to your backend service
   - Add environment variable:
     ```
     API_KEY=your-secure-api-key-minimum-16-characters
     ```
   - The `NEXT_PUBLIC_BACKEND_URL` for frontend will be auto-configured

4. **Deploy**
   - Click "Apply" to deploy both services
   - Wait for builds to complete (~5-10 minutes)

### Option 2: Manual Setup

#### Backend Service

1. **Create Web Service**
   - New → Web Service
   - Connect GitHub repository

2. **Settings**
   - **Name**: `solana-backend`
   - **Environment**: Docker
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Docker Build Context**: `backend`
   - **Plan**: Free
   - **Health Check Path**: `/health`

3. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=4000
   SOLANA_RPC_URL=https://api.devnet.solana.com
   API_KEY=your-secure-api-key-minimum-16-characters
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Note the URL: `https://solana-backend.onrender.com`

#### Frontend Service

1. **Create Web Service**
   - New → Web Service
   - Connect same GitHub repository

2. **Settings**
   - **Name**: `solana-frontend`
   - **Environment**: Docker
   - **Dockerfile Path**: `frontend/Dockerfile`
   - **Docker Build Context**: `.` (project root)
   - **Plan**: Free
   - **Health Check Path**: `/`

3. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=3000
   NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
   NEXT_PUBLIC_BACKEND_URL=https://solana-backend.onrender.com
   ```
   ⚠️ **Important**: Replace `solana-backend.onrender.com` with your actual backend URL

4. **Deploy**
   - Click "Create Web Service"

## 🔧 Free Tier Optimizations

### 1. Keep Services Alive (Optional)

Since free tier services spin down after inactivity, you can use external services to ping them:

**Option A: UptimeRobot (Free)**
1. Sign up at [UptimeRobot.com](https://uptimerobot.com)
2. Add a monitor for your backend: `https://your-backend.onrender.com/health`
3. Set interval to 5 minutes
4. This keeps your service from spinning down

**Option B: Cron-Job.org (Free)**
1. Sign up at [cron-job.org](https://cron-job.org)
2. Create a job that pings: `https://your-backend.onrender.com/health`
3. Set to run every 5 minutes

**Option C: GitHub Actions (Free)**
Create `.github/workflows/keep-alive.yml`:
```yaml
name: Keep Render Alive
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Backend
        run: curl -f https://your-backend.onrender.com/health || true
      - name: Ping Frontend
        run: curl -f https://your-frontend.onrender.com/ || true
```

### 2. Handle Cold Starts

Your services are already optimized for cold starts:
- ✅ Health check endpoints (`/health` and `/`)
- ✅ Fast startup times
- ✅ No heavy initialization

### 3. Storage Considerations

**CI Status Storage**
- Data in `/app/storage/ci-status.json` is **ephemeral** on free tier
- Data will be lost on redeploy or service restart
- For production, consider:
  - Upgrading to paid plan with persistent disk
  - Using Render PostgreSQL (free tier available)
  - Using external storage (S3, etc.)

## 📊 Monitoring

### Check Service Status
- Backend: `https://your-backend.onrender.com/health`
- Frontend: `https://your-frontend.onrender.com/`

### View Logs
- Go to Render Dashboard → Your Service → Logs
- Check for build errors or runtime issues

## 🐛 Troubleshooting

### Build Fails
- **Check Dockerfile paths**: Make sure they're correct
- **Check build context**: Backend = `backend`, Frontend = `.`
- **View build logs**: Render Dashboard → Service → Logs

### Frontend Can't Connect to Backend
- **Verify backend URL**: Check `NEXT_PUBLIC_BACKEND_URL` matches your backend URL
- **Check CORS**: Backend has CORS enabled, should work
- **Test backend**: Visit `https://your-backend.onrender.com/health` directly

### Services Keep Spinning Down
- **Normal behavior** on free tier after 15 min inactivity
- **Use keep-alive service** (see above) to prevent this
- **First request** after spin-down will be slow (30-60s)

### Storage Data Lost
- **Expected** on free tier (ephemeral storage)
- **Solution**: Use Render PostgreSQL or external storage

## 💰 Upgrading from Free Tier

If you need:
- **Always-on services**: Upgrade to Starter ($7/month per service)
- **Persistent storage**: Add PostgreSQL database (free tier available)
- **Better performance**: Upgrade to higher plans

## ✅ Deployment Checklist

- [ ] Backend service created and deployed
- [ ] Frontend service created and deployed
- [ ] Environment variables configured
- [ ] Backend URL noted and set in frontend
- [ ] Health checks working (`/health` and `/`)
- [ ] Services accessible via URLs
- [ ] Frontend can connect to backend
- [ ] GraphQL queries working
- [ ] REST API endpoints working
- [ ] (Optional) Keep-alive service configured

## 🔗 Useful Links

- [Render Dashboard](https://dashboard.render.com)
- [Render Documentation](https://render.com/docs)
- [Render Free Tier Info](https://render.com/docs/free)
- [UptimeRobot](https://uptimerobot.com) - Free uptime monitoring
- [Cron-Job.org](https://cron-job.org) - Free cron jobs

## 📝 Notes

- Free tier is perfect for **development and testing**
- For **production**, consider upgrading to paid plans
- Services automatically get HTTPS certificates
- Auto-deploy on git push is enabled by default

