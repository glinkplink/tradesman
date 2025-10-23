# 📱 SMS Invoice & Quote Generator

A powerful SMS-first invoicing and quoting SaaS application built for tradespeople and small business owners. Generate professional PDFs from simple text messages.

## 🌟 Features

- **SMS-First Workflow**: Create invoices and quotes by sending a text message
- **Flexible Input Parsing**: Understands various formats and shorthand
- **Professional PDFs**: Auto-generated, branded invoices and quotes
- **Client Management**: Automatically stores and recalls client information
- **Multi-Channel Delivery**: Send PDFs via SMS and/or email
- **Admin Dashboard**: Monitor usage, track metrics, and view analytics
- **Payment Integration**: Include Venmo, CashApp, or Stripe payment links

## 🚀 How It Works

### For Users (Tradespeople)

1. **Onboarding**: Text any message to your Twilio number to start
2. **Setup**: Provide business name, address, and payment info
3. **Create Invoices**: Send requests like:
   - `Invoice 2 hrs @ $120, John Smith, john@email.com`
   - `Quote 4 hrs $150/hr, 3 boxes nails $50, Jane Doe, (555)123-4567`
4. **Get PDFs**: Professional PDFs are automatically generated and sent to clients

### Example SMS Formats

The parser is extremely flexible and understands:

```
Invoice 2 hrs @ $120, John Smith, client@example.com
Quote, 5 hrs at $120, John Smith, (555)555-1234
$200 2 hrs, invoice John Smith, 3 boxes of nails $50
Quote 4 hrs 120/hr John Smith
Invoice, John Smith, john@email.com, 2 hrs $120, materials $50
```

## 🏗️ Tech Stack

- **Frontend**: React 19 + Tailwind CSS 4 + Recharts
- **Backend**: Node.js + Express + tRPC 11
- **Database**: MySQL (via Drizzle ORM)
- **SMS**: Twilio Programmable Messaging
- **Email**: Resend API
- **PDF Generation**: PDFKit
- **Storage**: S3-compatible storage
- **Auth**: Manus OAuth (admin only)

## 📊 Database Schema

### Users Table
- Phone number as primary identity
- Business information (name, company, address)
- Payment preferences (Venmo, CashApp, Stripe links)
- Email preferences for PDF copies
- Onboarding state tracking

### Clients Table
- Linked to users
- Contact information (phone, email, address)
- Auto-created on first mention
- Reused on subsequent invoices

### Documents Table
- Invoices and quotes
- Line items stored as JSON
- Auto-generated document numbers
- PDF URLs for retrieval
- Status tracking

### SMS Messages Table
- Complete message log
- Inbound and outbound tracking
- Debugging and analytics

## 🔧 Setup & Configuration

### Required Environment Variables

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Resend Configuration
RESEND_API_KEY=re_your_api_key
FROM_EMAIL=invoices@yourdomain.com

# Database
DATABASE_URL=mysql://user:password@host:port/database
```

### Twilio Webhook Setup

1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to Phone Numbers → Manage → Active Numbers
3. Click your phone number
4. Under "Messaging", set webhook URL to:
   ```
   https://your-deployed-url/api/trpc/sms.webhook
   ```
5. Set HTTP method to `POST`

## 📱 SMS Workflow

### New User Onboarding

**Step 1**: User texts "Hi" or any message
- System creates account with phone number as ID
- Prompts for: name, company, address, payment info

**Step 2**: Email preferences
- Ask if user wants PDF copies via email
- Store email address if provided

**Step 3**: Ready to use
- User can now send invoice/quote requests

### Invoice/Quote Generation

1. User sends SMS with invoice details
2. System parses flexible input format
3. Creates/updates client record
4. Generates professional PDF
5. Uploads PDF to S3
6. Sends PDF link to client (SMS and/or email)
7. Sends confirmation to user
8. Optionally emails copy to user

## 📈 Admin Dashboard

Access at `/dashboard` (requires admin login)

### Metrics Displayed

**User Statistics**
- Total users
- New users this week/month
- Active users (last 30 days)

**Document Statistics**
- Total invoices and quotes
- Documents created today/week/month
- Average invoices per user

**SMS Activity**
- Total messages processed
- Messages today

**Charts**
- Line chart: Invoices + Quotes over last 30 days
- Bar chart: New users per week (last 8 weeks)

## 🎨 Parsing Engine

The SMS parser (`server/smsParser.ts`) handles:

### Document Type Detection
- Keywords: "invoice" or "quote"

### Line Item Extraction
- Hours: `2 hrs @ $120`, `4 hours at $150`, `3 hrs 120/hr`
- Items: `3 boxes of nails $50`, `2 lightbulbs @ $30`
- Standalone amounts: `$200`

### Client Information
- Name: Capitalized words
- Phone: Various formats `(555)555-1234`, `555-555-1234`
- Email: Standard email format
- Address: After "address:" keyword

### Onboarding Data
- Flexible multi-line input
- Auto-detects email, payment info, company name
- Handles optional fields gracefully

## 🔐 Security

- Admin dashboard protected by OAuth
- SMS users authenticated by phone number
- Database credentials secured via environment variables
- S3 storage with presigned URLs
- Twilio webhook validation (recommended to add)

## 🚀 Deployment

### Pre-Deployment Checklist

1. ✅ Database migrations applied (`pnpm db:push`)
2. ✅ All environment variables configured
3. ✅ Twilio webhook URL updated
4. ✅ Resend domain verified (if using custom domain)
5. ✅ S3 storage configured

### Deployment Steps

1. Click "Publish" in the Manus UI
2. Configure deployment settings
3. Set production environment variables
4. Deploy application
5. Update Twilio webhook with production URL

### Post-Deployment

1. Test SMS workflow with real phone number
2. Verify PDF generation and delivery
3. Check admin dashboard metrics
4. Monitor error logs

## 📝 API Endpoints

### Public Endpoints

- `POST /api/trpc/sms.webhook` - Twilio SMS webhook handler

### Protected Endpoints (Admin Only)

- `GET /api/trpc/dashboard.stats` - Dashboard statistics
- `GET /api/trpc/dashboard.documentsTimeSeries` - Time series data
- `GET /api/trpc/dashboard.newUsersPerWeek` - User growth data

## 🧪 Testing

### Manual Testing Workflow

1. **Onboarding Test**
   - Send "Hi" to Twilio number
   - Complete onboarding steps
   - Verify user created in database

2. **Invoice Test**
   - Send: `Invoice 2 hrs @ $120, Test Client, test@example.com`
   - Verify PDF generated
   - Check client received SMS/email
   - Confirm user received confirmation

3. **Quote Test**
   - Send: `Quote 3 hrs $100/hr, materials $200, Test Client`
   - Verify quote PDF format
   - Check delivery

4. **Dashboard Test**
   - Login as admin
   - Navigate to `/dashboard`
   - Verify metrics display correctly
   - Check charts render

## 🐛 Troubleshooting

### SMS Not Sending
- Verify Twilio credentials are correct
- Check Twilio account balance
- Ensure phone number is verified (trial accounts)

### Emails Not Delivering
- Verify Resend API key
- Check FROM_EMAIL domain is verified
- Review Resend dashboard for errors

### PDF Generation Fails
- Check S3 storage configuration
- Verify sufficient permissions
- Review server logs for errors

### Webhook Not Receiving Messages
- Confirm webhook URL is correct in Twilio
- Ensure URL is publicly accessible
- Check server logs for incoming requests

## 📚 File Structure

```
server/
  ├── routers.ts          # tRPC routes (SMS webhook, dashboard)
  ├── db.ts               # Database queries
  ├── smsParser.ts        # Flexible SMS parsing logic
  ├── pdfGenerator.ts     # PDF creation with PDFKit
  ├── twilio.ts           # Twilio & Resend integration
  └── storage.ts          # S3 file storage

client/
  └── src/
      ├── pages/
      │   ├── Home.tsx         # Landing page
      │   └── Dashboard.tsx    # Admin metrics dashboard
      └── components/          # Reusable UI components

drizzle/
  └── schema.ts           # Database schema definitions
```

## 🎯 Future Enhancements

- [ ] Payment processing integration (Stripe)
- [ ] Invoice status tracking (paid/unpaid)
- [ ] Recurring invoices
- [ ] Multi-currency support
- [ ] Custom PDF templates
- [ ] Expense tracking
- [ ] Client portal
- [ ] SMS reminders for unpaid invoices
- [ ] Export to QuickBooks/Xero

## 📄 License

Proprietary - All rights reserved

## 🤝 Support

For issues or questions, contact the admin through the Manus platform.

---

Built with ❤️ for tradespeople who deserve simple, powerful tools.

