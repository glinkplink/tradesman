# SMS Invoice & Quote Platform - Setup Guide

## Overview

This is a production-ready MVP SaaS platform that allows tradespeople to create quotes and invoices entirely via SMS, without needing to download or install an app.

## Features

- ✅ SMS-based invoice and quote creation
- ✅ AI-powered SMS parsing using OpenAI GPT
- ✅ Professional PDF generation with business branding
- ✅ Payment integration (Stripe, Square, PayPal, Manual)
- ✅ QuickBooks-compatible CSV export
- ✅ Mobile-friendly onboarding
- ✅ Secure authentication via Manus OAuth
- ✅ S3 file storage for PDFs and logos

## Technology Stack

- **Frontend**: React 19 + TailwindCSS 4 + shadcn/ui
- **Backend**: Express.js + tRPC 11
- **Database**: MySQL/TiDB (via Drizzle ORM)
- **SMS**: Twilio
- **AI**: OpenAI GPT (via built-in LLM helper)
- **Payments**: Stripe, Square, PayPal
- **Storage**: S3-compatible storage (built-in)
- **PDF Generation**: PDFKit

## Prerequisites

1. Node.js 22+ and pnpm
2. MySQL/TiDB database
3. Twilio account with phone number
4. Stripe account (optional, for payment processing)
5. Square account (optional, for payment processing)

## Environment Variables

Create a `.env` file in the project root with the following variables:

### Required Variables (Auto-injected by Platform)

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Authentication (Manus OAuth)
JWT_SECRET=your-jwt-secret
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
OWNER_OPEN_ID=owner-open-id
OWNER_NAME=Owner Name

# Built-in Services
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key

# App Configuration
VITE_APP_TITLE=SMS Invoice & Quote Platform
VITE_APP_LOGO=https://your-logo-url.com/logo.png
```

### Required Variables (You Must Configure)

```env
# Application URL
APP_URL=https://your-app-url.com

# Twilio Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Stripe Configuration (Optional)
STRIPE_SECRET_KEY=sk_test_...

# Square Configuration (Optional)
SQUARE_ENVIRONMENT=sandbox  # or "production"
SQUARE_LOCATION_ID=your-square-location-id

# Server Configuration
PORT=3000
NODE_ENV=production
```

## Installation

1. **Clone or download the project**

```bash
cd sms-invoice-mvp
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Create a `.env` file with all required variables (see above).

4. **Initialize the database**

```bash
pnpm db:push
```

This will create all necessary tables in your database.

## Twilio Configuration

### 1. Create a Twilio Account

1. Sign up at [https://www.twilio.com](https://www.twilio.com)
2. Get a phone number with SMS capabilities
3. Copy your Account SID and Auth Token

### 2. Configure Webhook

1. Go to your Twilio Console
2. Navigate to Phone Numbers → Manage → Active Numbers
3. Click on your SMS-enabled phone number
4. Under "Messaging Configuration", set:
   - **A MESSAGE COMES IN**: Webhook
   - **URL**: `https://your-app-url.com/api/twilio/sms`
   - **HTTP Method**: POST

### 3. Test the Webhook

Send a test SMS to your Twilio number:

```
Fix faucet 250 labor 100 parts 50
```

You should receive an automated response with invoice details.

## Payment Processor Setup

### Stripe

1. Create a Stripe account at [https://stripe.com](https://stripe.com)
2. Get your Secret Key from the Dashboard
3. Add to `.env`: `STRIPE_SECRET_KEY=sk_test_...`
4. For production, use live keys: `sk_live_...`

### Square

1. Create a Square account at [https://squareup.com](https://squareup.com)
2. Go to Developer Dashboard
3. Create an application and get your Access Token
4. Add to `.env`:
   ```
   SQUARE_ENVIRONMENT=sandbox
   SQUARE_LOCATION_ID=your-location-id
   ```
5. For production, switch to production environment and use production tokens

### PayPal

1. Add your PayPal email in the business profile settings
2. PayPal payments are manual - users receive instructions to send payment

## Running the Application

### Development Mode

```bash
pnpm dev
```

This starts:
- Frontend dev server (Vite) on port 3000
- Backend API server (Express + tRPC)
- TypeScript compilation in watch mode

### Production Mode

```bash
# Build the frontend
pnpm build

# Start the production server
pnpm start
```

## Deployment

### Option 1: Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Create new project: `railway init`
4. Add environment variables: `railway variables`
5. Deploy: `railway up`

### Option 2: Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Set build command: `pnpm install && pnpm build`
4. Set start command: `pnpm start`
5. Add all environment variables in the Render dashboard

### Option 3: Vercel (Frontend) + Railway (Backend)

**Frontend (Vercel):**
1. Deploy to Vercel: `vercel`
2. Set environment variables in Vercel dashboard

**Backend (Railway):**
1. Deploy backend separately to Railway
2. Update `APP_URL` to point to your backend

### Option 4: Docker

```bash
# Build the Docker image
docker build -t sms-invoice-mvp .

# Run the container
docker run -p 3000:3000 --env-file .env sms-invoice-mvp
```

## Database Schema

The application uses the following tables:

- **users**: Core authentication
- **businessProfiles**: Business information and settings
- **invoices**: Invoice records
- **quotes**: Quote records
- **payments**: Payment transaction tracking
- **smsMessages**: SMS interaction logs
- **uploadedFiles**: File storage metadata

## Usage Flow

### 1. User Onboarding

1. User sends any SMS to the Twilio number
2. System responds with onboarding link
3. User completes business profile (2 minutes)
4. User can now create invoices/quotes via SMS

### 2. Creating an Invoice

**SMS Format:**
```
Fix faucet 250 labor 100 parts 50
```

**System Response:**
```
✅ Invoice INV-00001 created!
Total: $250.00
View and send: https://your-app.com/invoices/abc123
```

### 3. Creating a Quote

**SMS Format:**
```
Quote deck repair labor 300 materials 200
```

**System Response:**
```
✅ Quote QUO-00001 created!
Total: $500.00
View and send: https://your-app.com/quotes/xyz789
```

### 4. Advanced Examples

**With Client Name:**
```
Invoice for John Smith kitchen sink repair labor 150 parts 75
```

**Multiple Line Items:**
```
Bathroom renovation labor 500 materials 300 parts 200
```

## QuickBooks Export

Users can export their invoices and quotes to QuickBooks-compatible CSV format:

1. Log in to the dashboard
2. Navigate to Invoices or Quotes
3. Click "Export to QuickBooks"
4. Download the CSV file
5. Import into QuickBooks Desktop or Online

## API Endpoints

### Twilio Webhooks

- `POST /api/twilio/sms` - Incoming SMS handler
- `POST /api/twilio/sms-status` - SMS status updates

### File Upload

- `POST /api/upload-logo` - Upload business logo

### tRPC Procedures

- `businessProfile.create` - Create business profile
- `businessProfile.getMyProfile` - Get current user's profile
- `businessProfile.update` - Update business profile
- `quickbooks.exportInvoices` - Export invoices to CSV
- `quickbooks.exportQuotes` - Export quotes to CSV

## Troubleshooting

### SMS Not Working

1. Check Twilio webhook URL is correct
2. Verify Twilio credentials in `.env`
3. Check server logs for errors
4. Ensure webhook URL is publicly accessible (not localhost)

### PDF Generation Fails

1. Check S3 storage credentials
2. Verify business profile has required fields
3. Check server logs for specific errors

### Payment Links Not Generated

1. Verify payment processor credentials
2. Check if business profile has payment processor configured
3. For Stripe: ensure secret key is valid
4. For Square: verify access token and location ID

### Database Connection Issues

1. Verify `DATABASE_URL` is correct
2. Check database server is accessible
3. Run `pnpm db:push` to ensure schema is up to date

## Security Considerations

1. **Never commit `.env` files** to version control
2. Use **strong JWT secrets** in production
3. Enable **HTTPS** for all production deployments
4. Rotate **API keys** regularly
5. Use **production keys** for Stripe/Square in production
6. Implement **rate limiting** on Twilio webhooks
7. Validate **all SMS input** before processing

## Support

For issues or questions:
- Check the logs: `pnpm logs`
- Review Twilio webhook logs in Twilio Console
- Check database connectivity
- Verify all environment variables are set

## License

MIT License - See LICENSE file for details

## Credits

Built with:
- [Manus](https://manus.im) - Development platform
- [Twilio](https://twilio.com) - SMS infrastructure
- [OpenAI](https://openai.com) - AI parsing
- [Stripe](https://stripe.com) - Payment processing
- [Square](https://squareup.com) - Payment processing

