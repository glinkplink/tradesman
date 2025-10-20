# Client Management System

## Overview

The SMS Invoice platform now includes an intelligent client management system that automatically stores client information and requests missing details via follow-up SMS messages. This eliminates the need to re-enter client information for repeat customers.

## How It Works

### First-Time Client

When you text an invoice or quote for a new client:

**Example SMS:**
```
John Smith - faucet $25, labor $100
```

**System Response:**
```
New client "John Smith" detected!

Please provide their phone number:
```

**You Reply:**
```
555-123-4567
```

**System Response:**
```
Great! Now please provide John Smith's address:
```

**You Reply:**
```
123 Main St, City, State 12345
```

**System Response:**
```
✅ Invoice INV-00001 created for John Smith!

Total: $125.00

View: https://your-app.com/invoices/abc123
```

The client information (name, phone, address) is now saved in your database.

### Repeat Client

For subsequent invoices/quotes with the same client:

**Example SMS:**
```
John Smith - bathroom repair labor $200
```

**System Response:**
```
✅ Invoice INV-00002 created for John Smith!

Total: $200.00

View: https://your-app.com/invoices/xyz789
```

No additional information needed! The system automatically retrieves John Smith's saved information.

## SMS Format Examples

### With Client Name (Recommended)

```
John Smith - faucet repair labor $100 parts $50
```

```
Quote for Jane Doe - deck repair labor $300 materials $200
```

```
Invoice Sarah Johnson - kitchen sink labor $150
```

### Without Client Name (System Will Ask)

```
Bathroom renovation labor $500 materials $300
```

**System Response:**
```
Please provide the client name for this invoice.

Example: "John Smith"
```

## Conversation Flow States

The system tracks multi-step conversations:

1. **awaiting_client_phone**: Waiting for client's phone number
2. **awaiting_client_address**: Waiting for client's address
3. **completed**: All information collected, invoice/quote created

## Client Database

All clients are stored per business profile with:

- **Name**: Client's full name
- **Phone**: Contact phone number
- **Email**: Email address (optional)
- **Address**: Full mailing address
- **Notes**: Additional notes (optional)

## Managing Clients via Dashboard

You can also view and manage clients through the web dashboard:

1. Log in to your account
2. Navigate to "Clients" section
3. View all saved clients
4. Add new clients manually
5. Edit existing client information

## API Endpoints

### tRPC Procedures

- `clients.list` - Get all clients for your business
- `clients.create` - Manually create a new client
- `clients.update` - Update client information

## Database Schema

### Clients Table

```sql
CREATE TABLE clients (
  id VARCHAR(64) PRIMARY KEY,
  businessProfileId VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320),
  phone VARCHAR(50),
  address TEXT,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

### SMS Conversations Table

```sql
CREATE TABLE smsConversations (
  id VARCHAR(64) PRIMARY KEY,
  businessProfileId VARCHAR(64) NOT NULL,
  phoneNumber VARCHAR(50) NOT NULL,
  state ENUM('awaiting_client_phone', 'awaiting_client_address', 'completed') NOT NULL,
  pendingInvoiceData TEXT,
  pendingQuoteData TEXT,
  clientName VARCHAR(255),
  clientPhone VARCHAR(50),
  clientAddress TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

## Benefits

1. **Time Savings**: No need to re-enter client information for repeat customers
2. **Professional**: Consistent client information across all invoices/quotes
3. **Organized**: Centralized client database accessible from dashboard
4. **Smart**: Automatic detection of new vs. existing clients
5. **Flexible**: Works with or without client names in initial SMS

## Tips

- Always include the client name in your SMS for faster processing
- Use consistent name formatting (e.g., "John Smith" not "john smith" or "J. Smith")
- The system is case-insensitive for client name matching
- You can update client information anytime via the dashboard
- Conversations expire after completion to keep your system clean

## Troubleshooting

**Q: What if I make a typo in the client name?**
A: The system will create a new client. You can merge or delete duplicate clients via the dashboard.

**Q: Can I skip providing phone or address?**
A: Currently, both are required for new clients. You can provide placeholder values and update later via dashboard.

**Q: What if the conversation gets interrupted?**
A: The system maintains conversation state. You can continue from where you left off.

**Q: How do I cancel a conversation?**
A: Simply start a new invoice/quote. The old conversation will be replaced.

## Example Workflow

### Scenario: Plumber creating invoices for two clients

**Day 1 - New Client:**
```
User: John Smith - faucet repair labor $100 parts $50
Bot:  New client "John Smith" detected! Please provide their phone number:
User: 555-123-4567
Bot:  Great! Now please provide John Smith's address:
User: 123 Main St, City, State 12345
Bot:  ✅ Invoice INV-00001 created for John Smith! Total: $150.00
```

**Day 2 - Same Client:**
```
User: John Smith - sink installation labor $200
Bot:  ✅ Invoice INV-00002 created for John Smith! Total: $200.00
```

**Day 3 - Another New Client:**
```
User: Quote for Jane Doe - bathroom renovation labor $500 materials $300
Bot:  New client "Jane Doe" detected! Please provide their phone number:
User: 555-987-6543
Bot:  Great! Now please provide Jane Doe's address:
User: 456 Oak Ave, City, State 12345
Bot:  ✅ Quote QUO-00001 created for Jane Doe! Total: $800.00
```

**Day 4 - Repeat Clients:**
```
User: John Smith - emergency repair labor $150
Bot:  ✅ Invoice INV-00003 created for John Smith! Total: $150.00

User: Jane Doe - bathroom renovation labor $500 materials $300
Bot:  ✅ Invoice INV-00004 created for Jane Doe! Total: $800.00
```

## Future Enhancements

Potential features for future versions:

- Email collection during conversation flow
- Client notes and preferences
- Client history and total revenue tracking
- Automatic client reminders for recurring services
- Client search and filtering in dashboard
- Bulk import/export of clients
- Client tags and categories

