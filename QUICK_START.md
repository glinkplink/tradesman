# 🚀 Quick Start Deployment (15 Minutes)

## Goal: Get your SMS Invoice platform live for FREE

---

## ✅ Pre-Deployment Checklist

- [ ] Code is ready (you have it!)
- [ ] GitHub account created
- [ ] Credit card ready (for Twilio verification only - won't be charged)

---

## 📦 Step 1: Push to GitHub (5 min)

### Option A: Using GitHub CLI (Recommended)

```bash
# Install GitHub CLI
brew install gh  # macOS
# or
sudo apt install gh  # Linux

# Login
gh auth login

# Create repo and push
cd /home/ubuntu/sms-invoice-mvp
git init
git add .
git commit -m "Initial commit"
gh repo create sms-invoice-mvp --public --source=. --remote=origin --push
```

### Option B: Manual Upload

1. Go to https://github.com/new
2. Create repository "sms-invoice-mvp"
3. Download project as ZIP from Manus
4. Upload files via GitHub web interface

---

## 🚂 Step 2: Deploy to Railway (5 min)

1. **Sign up:** https://railway.app (use GitHub login)

2. **Create project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `sms-invoice-mvp`

3. **Add MySQL database:**
   - Click "+ New" → "Database" → "MySQL"
   - Wait 30 seconds for provisioning

4. **Add environment variables:**
   - Click on your service → "Variables"
   - Add these (temporarily use placeholder values):

```env
NODE_ENV=production
PORT=3000
APP_URL=https://your-app.railway.app
TWILIO_ACCOUNT_SID=placeholder
TWILIO_AUTH_TOKEN=placeholder
TWILIO_PHONE_NUMBER=+1234567890
```

5. **Deploy:**
   - Railway auto-deploys on push
   - Wait 2-3 minutes
   - Copy your Railway URL: `https://your-app-xxxxx.railway.app`

6. **Run migrations:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and link
railway login
railway link

# Run migrations
railway run pnpm db:push
```

---

## 📱 Step 3: Setup Twilio (5 min)

1. **Sign up:** https://www.twilio.com/try-twilio
   - Get $15 free credit
   - Verify your email and phone

2. **Get phone number:**
   - Console → Phone Numbers → Buy a number
   - Select country → Check "SMS" → Choose number
   - Click "Buy" (uses free credit)

3. **Get credentials:**
   - Console → Account → API keys
   - Copy:
     - Account SID
     - Auth Token

4. **Configure webhook:**
   - Console → Phone Numbers → Active Numbers
   - Click your number
   - Under "Messaging Configuration":
     - Webhook URL: `https://your-app-xxxxx.railway.app/api/twilio/sms`
     - HTTP Method: POST
   - Click "Save"

5. **Update Railway variables:**
   - Go back to Railway → Variables
   - Update:
     - `TWILIO_ACCOUNT_SID` = your Account SID
     - `TWILIO_AUTH_TOKEN` = your Auth Token
     - `TWILIO_PHONE_NUMBER` = your Twilio number
     - `APP_URL` = your Railway URL

6. **Verify test number (trial only):**
   - Console → Verified Caller IDs
   - Add your personal phone number
   - Verify via SMS code

---

## 🧪 Step 4: Test It! (2 min)

### Test 1: Onboarding

1. Send any SMS to your Twilio number
2. Receive welcome message with onboarding link
3. Complete business profile (2 minutes)

### Test 2: Create Invoice

**SMS:**
```
John Smith - faucet repair labor $100 parts $50
```

**Expected Response:**
```
New client "John Smith" detected!
Please provide their phone number:
```

**Reply:**
```
555-123-4567
```

**Expected Response:**
```
Great! Now please provide John Smith's address:
```

**Reply:**
```
123 Main St, City, State 12345
```

**Expected Response:**
```
✅ Invoice INV-00001 created for John Smith!
Total: $150.00
View: https://your-app.railway.app/invoices/abc123
```

### Test 3: Repeat Customer

**SMS:**
```
John Smith - sink installation labor $200
```

**Expected Response (instant):**
```
✅ Invoice INV-00002 created for John Smith!
Total: $200.00
View: https://your-app.railway.app/invoices/xyz789
```

---

## ✅ You're Live!

**What you have:**
- ✅ SMS-based invoice creation
- ✅ Client management with auto-save
- ✅ Professional PDF generation
- ✅ Payment links (Stripe/Square)
- ✅ QuickBooks export
- ✅ Web dashboard

**Cost:** $0 (using free credits)

---

## 🔄 Making Updates

### Via Manus AI (Easiest)

1. Tell Manus what to change
2. Manus pushes to GitHub
3. Railway auto-deploys
4. Changes live in 2-3 minutes

### Via Git

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Railway auto-deploys
```

---

## 🐛 Troubleshooting

### Issue: "Database connection failed"

**Solution:**
```bash
railway run pnpm db:push
```

### Issue: "Twilio webhook not responding"

**Checklist:**
- [ ] Webhook URL is correct
- [ ] App is deployed (check Railway logs)
- [ ] Environment variables are set

**Test:**
```bash
curl -X POST https://your-app.railway.app/api/twilio/sms \
  -d "From=+15551234567" \
  -d "Body=test"
```

### Issue: "SMS not sending"

**Trial limitations:**
- Can only send to verified numbers
- Messages have "trial account" prefix
- Solution: Upgrade Twilio ($20 minimum)

### Issue: "LLM parsing error"

**Temporary fix:**
- Create invoices via web dashboard
- Wait for upstream service to recover
- System will auto-retry

---

## 📊 View Logs

**Railway:**
```bash
railway logs
```

**Or:** Railway Dashboard → Deployments → View Logs

---

## 💰 Costs After Free Credits

| Item | Cost |
|------|------|
| Railway (hobby) | $5/month |
| Railway MySQL | $5/month |
| Twilio (minimal usage) | $1-2/month |
| Domain (optional) | $1-12/year |
| **Total** | **~$11-12/month** |

---

## 🎯 Next Steps

1. [ ] Test all features thoroughly
2. [ ] Upgrade Twilio to remove trial restrictions
3. [ ] Add custom domain (optional)
4. [ ] Set up Stripe/Square for payments
5. [ ] Invite team members
6. [ ] Monitor usage and costs

---

## 📚 Full Documentation

- **Complete Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **Setup Guide:** `SETUP_GUIDE.md`
- **Client Management:** `CLIENT_MANAGEMENT.md`

---

## 🆘 Need Help?

- **Railway:** https://help.railway.app
- **Twilio:** https://support.twilio.com
- **Manus:** https://help.manus.im

---

**Estimated Total Time:** 15-20 minutes
**Total Cost:** $0 for first month

