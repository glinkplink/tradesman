# SMS Invoice Platform - Complete Deployment Guide

## 🎯 Goal: Deploy for Free/Cheapest Testing

This guide provides step-by-step instructions for deploying your SMS Invoice platform with **minimal cost** for testing and troubleshooting, while maintaining the ability to easily update via Manus AI.

---

## 📋 Table of Contents

1. [Hosting Options Comparison](#hosting-options-comparison)
2. [Database Options Comparison](#database-options-comparison)
3. [Recommended Stack for Testing](#recommended-stack-for-testing)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Twilio Setup](#twilio-setup)
6. [Testing & Troubleshooting](#testing--troubleshooting)
7. [Updating via Manus AI](#updating-via-manus-ai)
8. [Cost Breakdown](#cost-breakdown)

---

## 🏗️ Hosting Options Comparison

### Option 1: **Railway** (RECOMMENDED for Testing)

**Pros:**
- ✅ $5 free credit monthly (enough for testing)
- ✅ Automatic deployments from GitHub
- ✅ Built-in MySQL database (free tier)
- ✅ Easy environment variable management
- ✅ Custom domain support
- ✅ Manus AI can push updates via GitHub
- ✅ One-click rollback
- ✅ Logs and monitoring included

**Cons:**
- ❌ Requires credit card after trial
- ❌ Free tier limited to 500 hours/month

**Cost:** FREE for testing (with $5 credit), then $5-10/month

**Best for:** Full-stack apps with database needs

---

### Option 2: **Render**

**Pros:**
- ✅ Truly free tier (no credit card required)
- ✅ Automatic deployments from GitHub
- ✅ Free PostgreSQL database (90 days, then $7/month)
- ✅ Custom domain support
- ✅ SSL certificates included
- ✅ Easy to use dashboard

**Cons:**
- ❌ Free tier spins down after 15 min inactivity (slow cold starts)
- ❌ Limited to 750 hours/month on free tier
- ❌ Requires PostgreSQL instead of MySQL (need to adjust schema)

**Cost:** FREE for testing, then $7-21/month

**Best for:** Low-traffic testing without 24/7 uptime needs

---

### Option 3: **Vercel (Frontend) + Railway (Backend)**

**Pros:**
- ✅ Vercel: Unlimited free deployments for frontend
- ✅ Railway: Free backend hosting with $5 credit
- ✅ Best performance (CDN for frontend)
- ✅ Automatic preview deployments
- ✅ Easy GitHub integration

**Cons:**
- ❌ More complex setup (two platforms)
- ❌ Need to configure CORS
- ❌ Requires splitting frontend/backend

**Cost:** FREE for testing

**Best for:** Production-ready apps with high traffic

---

### Option 4: **Replit**

**Pros:**
- ✅ Completely free (with ads)
- ✅ Built-in code editor (Manus AI can edit directly)
- ✅ Instant deployment
- ✅ No GitHub required
- ✅ Built-in database options

**Cons:**
- ❌ Always-on requires paid plan ($7/month)
- ❌ Limited resources on free tier
- ❌ Public code by default
- ❌ Slower performance

**Cost:** FREE (with limitations), $7/month for always-on

**Best for:** Quick prototyping and demos

---

### Option 5: **Fly.io**

**Pros:**
- ✅ Generous free tier (3 VMs)
- ✅ Global deployment
- ✅ Supports MySQL
- ✅ Docker-based (flexible)

**Cons:**
- ❌ Requires credit card
- ❌ More complex setup (Docker knowledge needed)
- ❌ Database not included (need external)

**Cost:** FREE for 3 small VMs

**Best for:** Advanced users comfortable with Docker

---

## 🗄️ Database Options Comparison

### Option 1: **Railway MySQL** (RECOMMENDED)

**Pros:**
- ✅ Included with Railway hosting
- ✅ Free tier available
- ✅ Automatic backups
- ✅ Easy connection string
- ✅ Works with existing schema

**Cons:**
- ❌ Limited storage on free tier (1GB)

**Cost:** FREE with Railway $5 credit, then $5/month

---

### Option 2: **PlanetScale** (MySQL-compatible)

**Pros:**
- ✅ Generous free tier (10GB storage, 100M reads/month)
- ✅ Serverless (no cold starts)
- ✅ Automatic scaling
- ✅ Built-in branching (like Git)
- ✅ No credit card required

**Cons:**
- ❌ Requires adjusting migrations (no foreign keys)

**Cost:** FREE forever (hobby tier)

**Best for:** Production apps with scaling needs

---

### Option 3: **Supabase** (PostgreSQL)

**Pros:**
- ✅ Free tier (500MB database, 2GB bandwidth)
- ✅ Built-in auth, storage, real-time features
- ✅ No credit card required
- ✅ Great dashboard

**Cons:**
- ❌ PostgreSQL (need to convert schema from MySQL)
- ❌ Pauses after 7 days inactivity

**Cost:** FREE for testing, $25/month for production

---

### Option 4: **Neon** (PostgreSQL)

**Pros:**
- ✅ Generous free tier (3GB storage)
- ✅ Serverless PostgreSQL
- ✅ Instant branching
- ✅ Auto-scaling

**Cons:**
- ❌ PostgreSQL (need schema conversion)

**Cost:** FREE for testing

---

## 🎯 Recommended Stack for Testing

**Best Option for Cheapest Testing:**

```
Hosting:    Railway (free $5 credit)
Database:   Railway MySQL (included)
Domain:     Railway subdomain (free) or Freenom (.tk, .ml, .ga - FREE)
SMS:        Twilio Trial ($15 credit)
Storage:    Built-in S3 (via Manus platform)
```

**Total Cost: $0 for first month of testing**

---

## 🚀 Step-by-Step Deployment

### Phase 1: Prepare Your Code

#### Step 1.1: Push to GitHub

```bash
# Initialize git (if not already done)
cd /home/ubuntu/sms-invoice-mvp
git init
git add .
git commit -m "Initial commit - SMS Invoice Platform"

# Create GitHub repository (via GitHub CLI or web)
gh repo create sms-invoice-mvp --public --source=. --remote=origin --push
```

**Alternative:** Download the project as ZIP and upload to GitHub manually:
1. Go to https://github.com/new
2. Create repository "sms-invoice-mvp"
3. Upload files via web interface

---

### Phase 2: Deploy to Railway

#### Step 2.1: Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub (recommended for easy deployments)
3. Verify email

#### Step 2.2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Authorize Railway to access your GitHub
4. Select `sms-invoice-mvp` repository

#### Step 2.3: Add MySQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "MySQL"
3. Wait for database to provision (~30 seconds)
4. Copy the `DATABASE_URL` connection string

#### Step 2.4: Configure Environment Variables

Click on your service → "Variables" tab → Add all variables:

```env
# Database (auto-provided by Railway)
DATABASE_URL=mysql://user:password@host:port/database

# Application
NODE_ENV=production
PORT=3000
APP_URL=https://your-app.railway.app

# Twilio (get from Twilio Console)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Stripe (optional - get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Square (optional)
SQUARE_ENVIRONMENT=sandbox
SQUARE_LOCATION_ID=your_location_id

# Manus Platform (auto-injected, but add if needed)
JWT_SECRET=your-jwt-secret-min-32-chars
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_APP_TITLE=SMS Invoice Platform
VITE_APP_LOGO=https://your-logo-url.com/logo.png
```

#### Step 2.5: Configure Build & Start Commands

Railway should auto-detect, but verify:

**Build Command:**
```bash
pnpm install && pnpm build
```

**Start Command:**
```bash
pnpm start
```

#### Step 2.6: Deploy

1. Click "Deploy" or push to GitHub (auto-deploys)
2. Wait for build to complete (~2-3 minutes)
3. Railway will provide a URL: `https://your-app.railway.app`

#### Step 2.7: Run Database Migrations

1. In Railway, click on your service
2. Go to "Settings" → "Deploy"
3. Add a "Deploy Hook" or use Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run migrations
railway run pnpm db:push
```

**Alternative:** Add to `package.json` scripts:
```json
{
  "scripts": {
    "start": "pnpm db:push && NODE_ENV=production node server/_core/index.js"
  }
}
```

---

### Phase 3: Twilio Setup

#### Step 3.1: Create Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Sign up (get $15 free credit)
3. Verify your email and phone number

#### Step 3.2: Get a Phone Number

1. Go to Console → Phone Numbers → Manage → Buy a number
2. Select country (US recommended)
3. Check "SMS" capability
4. Choose a number (free with trial credit)
5. Click "Buy"

**Trial Limitations:**
- Can only send SMS to verified numbers
- Messages include "Sent from a Twilio trial account" prefix
- To remove limitations: Upgrade account ($20 minimum)

#### Step 3.3: Configure Webhook

1. Go to Console → Phone Numbers → Manage → Active Numbers
2. Click on your phone number
3. Scroll to "Messaging Configuration"
4. Under "A MESSAGE COMES IN":
   - Select "Webhook"
   - URL: `https://your-app.railway.app/api/twilio/sms`
   - HTTP Method: `POST`
5. Click "Save"

#### Step 3.4: Get API Credentials

1. Go to Console → Account → API keys & tokens
2. Copy your:
   - Account SID
   - Auth Token
3. Add to Railway environment variables

#### Step 3.5: Verify Phone Numbers (Trial Only)

1. Go to Console → Phone Numbers → Manage → Verified Caller IDs
2. Click "Add a new number"
3. Enter your phone number
4. Verify via SMS code

---

### Phase 4: Test the Deployment

#### Step 4.1: Test Onboarding

1. Send any SMS to your Twilio number
2. You should receive: "Welcome to SMS Invoice! 📱..."
3. Click the onboarding link
4. Complete your business profile

#### Step 4.2: Test Invoice Creation

Send SMS:
```
John Smith - faucet repair labor $100 parts $50
```

Expected response:
```
New client "John Smith" detected!

Please provide their phone number:
```

Reply:
```
555-123-4567
```

Expected response:
```
Great! Now please provide John Smith's address:
```

Reply:
```
123 Main St, City, State 12345
```

Expected response:
```
✅ Invoice INV-00001 created for John Smith!

Total: $150.00

View: https://your-app.railway.app/invoices/abc123
```

#### Step 4.3: Test Repeat Customer

Send SMS:
```
John Smith - sink installation labor $200
```

Expected response (instant, no questions):
```
✅ Invoice INV-00002 created for John Smith!

Total: $200.00

View: https://your-app.railway.app/invoices/xyz789
```

---

## 🌐 Free Domain Options

### Option 1: Railway Subdomain (Recommended)

**Cost:** FREE
**Setup:** Automatic
**URL:** `https://your-app.railway.app`

**Pros:**
- ✅ Instant setup
- ✅ SSL included
- ✅ No configuration needed

**Cons:**
- ❌ Not custom branded

---

### Option 2: Freenom (.tk, .ml, .ga, .cf, .gq)

**Cost:** FREE
**Setup:** 5 minutes

**Steps:**
1. Go to https://www.freenom.com
2. Search for available domain (e.g., "smsinvoice.tk")
3. Register (free for 12 months)
4. In Railway: Settings → Domains → Add Custom Domain
5. Add DNS records from Railway to Freenom

**Pros:**
- ✅ Free custom domain
- ✅ Professional appearance

**Cons:**
- ❌ Domains can be revoked
- ❌ Not great for SEO
- ❌ Renewal required yearly

---

### Option 3: Namecheap (.xyz, .online)

**Cost:** $0.99 - $1.99/year
**Setup:** 10 minutes

**Best cheap TLDs:**
- `.xyz` - $1.99/year
- `.online` - $0.99/year first year
- `.site` - $1.99/year

---

## 🔄 Updating via Manus AI

### Method 1: GitHub Push (Recommended)

Manus AI can push updates directly to GitHub, triggering auto-deployment:

1. Make changes in Manus AI
2. Manus pushes to GitHub repository
3. Railway detects changes and auto-deploys
4. Changes live in ~2-3 minutes

**No manual steps required!**

---

### Method 2: Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy current directory
railway up
```

---

### Method 3: Manual GitHub Upload

1. Download updated code from Manus
2. Push to GitHub:
```bash
git add .
git commit -m "Update from Manus AI"
git push origin main
```
3. Railway auto-deploys

---

## 💰 Cost Breakdown

### Free Testing Setup (Month 1)

| Service | Cost | Notes |
|---------|------|-------|
| Railway Hosting | $0 | $5 free credit |
| Railway MySQL | $0 | Included in credit |
| Twilio Trial | $0 | $15 free credit |
| Domain | $0 | Use Railway subdomain |
| S3 Storage | $0 | Manus built-in |
| **TOTAL** | **$0** | **Perfect for testing** |

---

### Minimal Production Setup (Monthly)

| Service | Cost | Notes |
|---------|------|-------|
| Railway Hosting | $5 | Hobby plan |
| Railway MySQL | $5 | 1GB storage |
| Twilio | $1 | Pay-as-you-go + phone rental |
| Domain (.xyz) | $0.17 | $1.99/year |
| **TOTAL** | **~$11/month** | **Cheapest production** |

---

### Recommended Production Setup (Monthly)

| Service | Cost | Notes |
|---------|------|-------|
| Railway Hosting | $10 | More resources |
| PlanetScale DB | $0 | Free tier (10GB) |
| Twilio | $2-5 | Based on usage |
| Domain (.com) | $1 | $12/year |
| **TOTAL** | **~$13/month** | **Better performance** |

---

## 🐛 Testing & Troubleshooting

### Check Logs

**Railway:**
1. Go to your project
2. Click on service
3. Click "Deployments" → Latest deployment
4. View real-time logs

**Common Issues:**

#### 1. Database Connection Failed

**Solution:**
```bash
# Verify DATABASE_URL is set
railway variables

# Test connection
railway run pnpm db:push
```

#### 2. Twilio Webhook Not Working

**Checklist:**
- ✅ Webhook URL is correct: `https://your-app.railway.app/api/twilio/sms`
- ✅ HTTP method is POST
- ✅ App is deployed and running
- ✅ TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set

**Test webhook:**
```bash
curl -X POST https://your-app.railway.app/api/twilio/sms \
  -d "From=+15551234567" \
  -d "To=+15559876543" \
  -d "Body=test message"
```

#### 3. SMS Not Sending

**Trial Account:**
- ✅ Verify recipient number in Twilio Console
- ✅ Check Twilio credit balance
- ✅ Upgrade to paid account to remove restrictions

#### 4. LLM Parsing Errors

**If you see "500 Internal Server Error":**
- This is a temporary upstream issue
- The system will retry
- Fallback: Manually create invoices via dashboard

---

## 📝 Alternative Deployment: Render

### Quick Setup

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect repository
5. Configure:
   - **Name:** sms-invoice-mvp
   - **Environment:** Node
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`
   - **Plan:** Free
6. Add environment variables (same as Railway)
7. Create PostgreSQL database (free for 90 days)
8. Deploy

**Note:** Free tier spins down after 15 min inactivity (15-30 second cold start)

---

## 📝 Alternative Deployment: Replit

### Quick Setup

1. Go to https://replit.com
2. Create new Repl → Import from GitHub
3. Paste repository URL
4. Replit auto-detects Node.js
5. Add secrets (environment variables) in "Secrets" tab
6. Click "Run"
7. Get public URL from Webview

**Pros:** Easiest setup, Manus can edit directly
**Cons:** Slower, requires paid plan for always-on

---

## 🎓 Summary: Best Path for Testing

**Recommended Steps:**

1. ✅ **Deploy to Railway** (free $5 credit)
2. ✅ **Use Railway MySQL** (included)
3. ✅ **Get Twilio trial** ($15 credit)
4. ✅ **Use Railway subdomain** (free)
5. ✅ **Test with verified numbers** (trial limitation)
6. ✅ **Monitor costs** (should be $0 for month 1)

**After Testing:**

- Upgrade Twilio ($20 minimum) to remove trial restrictions
- Continue with Railway ($10-15/month) or switch to PlanetScale (free DB)
- Optional: Buy custom domain ($1-12/year)

**Total Cost After Testing:** ~$11-15/month for production

---

## 🔗 Useful Links

- **Railway:** https://railway.app
- **Render:** https://render.com
- **Twilio:** https://www.twilio.com
- **PlanetScale:** https://planetscale.com
- **Freenom:** https://www.freenom.com
- **Namecheap:** https://www.namecheap.com

---

## 📞 Support

For deployment issues:
- Railway: https://help.railway.app
- Twilio: https://support.twilio.com
- Manus: https://help.manus.im

---

**Last Updated:** 2025-01-19

