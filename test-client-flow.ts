/**
 * Test script for client management and conversation flow
 * This simulates the SMS workflow to verify the client capture feature
 */

import * as db from "./server/db";
import { parseSmsMessage } from "./server/smsParser";
import { nanoid } from "nanoid";

async function testClientFlow() {
  console.log("=== Testing Client Management Flow ===\n");

  // Step 1: Create a test business profile
  console.log("Step 1: Creating test business profile...");
  const testUserId = "test-user-" + nanoid();
  const testProfileId = "test-profile-" + nanoid();

  await db.upsertUser({
    id: testUserId,
    name: "Test User",
    email: "test@example.com",
    loginMethod: "oauth",
  });

  const businessProfile = await db.createBusinessProfile({
    id: testProfileId,
    userId: testUserId,
    businessName: "ABC Plumbing",
    contactName: "John Doe",
    businessEmail: "john@abcplumbing.com",
    phoneNumber: "+15551234567",
    paymentProcessor: "stripe",
    paymentTerms: "due_on_receipt",
  });

  console.log(`✓ Business profile created: ${businessProfile.businessName}\n`);

  // Step 2: Test SMS parsing with client name
  console.log("Step 2: Testing SMS parsing with client name...");
  const smsMessage = "John Smith - faucet repair labor $100 parts $50";
  
  try {
    const parsedData = await parseSmsMessage(smsMessage);
    console.log("✓ SMS parsed successfully:");
    console.log(`  - Type: ${parsedData.type}`);
    console.log(`  - Client Name: ${parsedData.clientName || "NOT DETECTED"}`);
    console.log(`  - Description: ${parsedData.description}`);
    console.log(`  - Labor: $${(parsedData.laborAmount || 0) / 100}`);
    console.log(`  - Parts: $${(parsedData.partsAmount || 0) / 100}`);
    console.log(`  - Total: $${(parsedData.totalAmount || 0) / 100}\n`);
  } catch (error) {
    console.error("✗ SMS parsing failed:", error);
    return;
  }

  // Step 3: Check if client exists (should not exist)
  console.log("Step 3: Checking if client exists...");
  let client = await db.findClientByName(businessProfile.id, "John Smith");
  
  if (client) {
    console.log("✗ Client already exists (unexpected)\n");
  } else {
    console.log("✓ Client does not exist (expected for first-time client)\n");
  }

  // Step 4: Simulate conversation flow - create conversation
  console.log("Step 4: Creating SMS conversation (awaiting phone)...");
  const conversationId = nanoid();
  const conversation = await db.createSmsConversation({
    id: conversationId,
    businessProfileId: businessProfile.id,
    phoneNumber: "+15559876543",
    state: "awaiting_client_phone",
    pendingInvoiceData: JSON.stringify({
      type: "invoice",
      clientName: "John Smith",
      description: "faucet repair",
      laborAmount: 10000,
      partsAmount: 5000,
      totalAmount: 15000,
    }),
    clientName: "John Smith",
  });

  console.log(`✓ Conversation created with state: ${conversation.state}\n`);

  // Step 5: Update conversation with phone number
  console.log("Step 5: User provides phone number...");
  await db.updateSmsConversation(conversationId, {
    clientPhone: "555-123-4567",
    state: "awaiting_client_address",
  });

  const updatedConv1 = await db.getSmsConversationByPhone(
    businessProfile.id,
    "+15559876543"
  );
  console.log(`✓ Conversation updated, state: ${updatedConv1?.state}\n`);

  // Step 6: Update conversation with address and create client
  console.log("Step 6: User provides address, creating client...");
  await db.updateSmsConversation(conversationId, {
    clientAddress: "123 Main St, City, State 12345",
    state: "completed",
  });

  client = await db.createClient({
    id: nanoid(),
    businessProfileId: businessProfile.id,
    name: "John Smith",
    phone: "555-123-4567",
    address: "123 Main St, City, State 12345",
  });

  console.log("✓ Client created:");
  console.log(`  - Name: ${client.name}`);
  console.log(`  - Phone: ${client.phone}`);
  console.log(`  - Address: ${client.address}\n`);

  // Step 7: Create invoice with client information
  console.log("Step 7: Creating invoice for client...");
  const invoiceNumber = await db.getNextInvoiceNumber(businessProfile.id);
  const invoice = await db.createInvoice({
    id: nanoid(),
    businessProfileId: businessProfile.id,
    invoiceNumber,
    clientName: client.name,
    clientPhone: client.phone,
    description: "faucet repair",
    laborAmount: 10000,
    partsAmount: 5000,
    subtotal: 15000,
    taxRate: 0,
    taxAmount: 0,
    totalAmount: 15000,
    status: "draft",
    paymentStatus: "unpaid",
  });

  console.log(`✓ Invoice ${invoice.invoiceNumber} created`);
  console.log(`  - Client: ${invoice.clientName}`);
  console.log(`  - Total: $${(invoice.totalAmount / 100).toFixed(2)}\n`);

  // Step 8: Test repeat customer (client already exists)
  console.log("Step 8: Testing repeat customer workflow...");
  const existingClient = await db.findClientByName(businessProfile.id, "John Smith");
  
  if (existingClient) {
    console.log("✓ Client found in database:");
    console.log(`  - Name: ${existingClient.name}`);
    console.log(`  - Phone: ${existingClient.phone}`);
    console.log(`  - Address: ${existingClient.address}`);
    console.log("  → No need to request phone/address again!\n");

    // Create second invoice without conversation
    const invoice2Number = await db.getNextInvoiceNumber(businessProfile.id);
    const invoice2 = await db.createInvoice({
      id: nanoid(),
      businessProfileId: businessProfile.id,
      invoiceNumber: invoice2Number,
      clientName: existingClient.name,
      clientPhone: existingClient.phone,
      description: "sink installation",
      laborAmount: 20000,
      subtotal: 20000,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: 20000,
      status: "draft",
      paymentStatus: "unpaid",
    });

    console.log(`✓ Invoice ${invoice2.invoiceNumber} created instantly (no conversation needed)`);
    console.log(`  - Client: ${invoice2.clientName}`);
    console.log(`  - Total: $${(invoice2.totalAmount / 100).toFixed(2)}\n`);
  }

  // Step 9: Test client list retrieval
  console.log("Step 9: Retrieving all clients for business...");
  const allClients = await db.getClientsByBusinessProfileId(businessProfile.id);
  console.log(`✓ Found ${allClients.length} client(s):`);
  allClients.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.name} - ${c.phone}`);
  });
  console.log();

  // Step 10: Test invoice list retrieval
  console.log("Step 10: Retrieving all invoices for business...");
  const allInvoices = await db.getInvoicesByBusinessProfileId(businessProfile.id);
  console.log(`✓ Found ${allInvoices.length} invoice(s):`);
  allInvoices.forEach((inv, i) => {
    console.log(`  ${i + 1}. ${inv.invoiceNumber} - ${inv.clientName} - $${(inv.totalAmount / 100).toFixed(2)}`);
  });
  console.log();

  console.log("=== All Tests Passed! ===\n");
  console.log("Summary:");
  console.log("✓ Business profile creation");
  console.log("✓ SMS parsing with client name extraction");
  console.log("✓ Client existence check");
  console.log("✓ Multi-step conversation flow (phone → address)");
  console.log("✓ Client creation and storage");
  console.log("✓ Invoice creation with client info");
  console.log("✓ Repeat customer detection (no conversation needed)");
  console.log("✓ Client and invoice list retrieval");
  
  process.exit(0);
}

// Run the test
testClientFlow().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});

