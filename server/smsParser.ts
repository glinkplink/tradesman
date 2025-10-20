import { invokeLLM } from "./_core/llm";

export interface ParsedSmsData {
  type: "invoice" | "quote";
  description: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  laborAmount?: number; // in cents
  materialsAmount?: number; // in cents
  partsAmount?: number; // in cents
  totalAmount?: number; // in cents
}

/**
 * Parse SMS message using OpenAI to extract invoice/quote information
 */
export async function parseSmsMessage(messageBody: string): Promise<ParsedSmsData> {
  const prompt = `You are an AI assistant that parses SMS messages to extract invoice and quote information for tradespeople.

Parse the following SMS message and extract:
1. Type: "invoice" or "quote" (default to "invoice" if not specified)
2. Description: A brief description of the work/service
3. Client name (if mentioned)
4. Client email (if mentioned)
5. Client phone (if mentioned)
6. Labor amount in dollars (convert to cents)
7. Materials amount in dollars (convert to cents)
8. Parts amount in dollars (convert to cents)
9. Total amount in dollars (convert to cents) - calculate if individual amounts are provided

SMS Message: "${messageBody}"

Return ONLY a JSON object with this exact structure (no additional text):
{
  "type": "invoice" or "quote",
  "description": "string",
  "clientName": "string or null",
  "clientEmail": "string or null",
  "clientPhone": "string or null",
  "laborAmount": number in cents or null,
  "materialsAmount": number in cents or null,
  "partsAmount": number in cents or null,
  "totalAmount": number in cents or null
}

Examples:
Input: "Fix faucet 250 labor 100 parts 50"
Output: {"type":"invoice","description":"Fix faucet","clientName":null,"clientEmail":null,"clientPhone":null,"laborAmount":10000,"materialsAmount":null,"partsAmount":5000,"totalAmount":25000}

Input: "Quote deck repair labor 300 materials 200"
Output: {"type":"quote","description":"deck repair","clientName":null,"clientEmail":null,"clientPhone":null,"laborAmount":30000,"materialsAmount":20000,"partsAmount":null,"totalAmount":50000}

Input: "Invoice for John Smith kitchen sink repair labor 150 parts 75"
Output: {"type":"invoice","description":"kitchen sink repair","clientName":"John Smith","clientEmail":null,"clientPhone":null,"laborAmount":15000,"materialsAmount":null,"partsAmount":7500,"totalAmount":22500}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that parses SMS messages and returns structured JSON data. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sms_parse_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["invoice", "quote"],
                description: "The type of document to create",
              },
              description: {
                type: "string",
                description: "Description of the work or service",
              },
              clientName: {
                type: ["string", "null"],
                description: "Client name if mentioned",
              },
              clientEmail: {
                type: ["string", "null"],
                description: "Client email if mentioned",
              },
              clientPhone: {
                type: ["string", "null"],
                description: "Client phone if mentioned",
              },
              laborAmount: {
                type: ["number", "null"],
                description: "Labor amount in cents",
              },
              materialsAmount: {
                type: ["number", "null"],
                description: "Materials amount in cents",
              },
              partsAmount: {
                type: ["number", "null"],
                description: "Parts amount in cents",
              },
              totalAmount: {
                type: ["number", "null"],
                description: "Total amount in cents",
              },
            },
            required: ["type", "description"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr) as ParsedSmsData;

    // Calculate total if not provided
    if (!parsed.totalAmount) {
      const labor = parsed.laborAmount || 0;
      const materials = parsed.materialsAmount || 0;
      const parts = parsed.partsAmount || 0;
      parsed.totalAmount = labor + materials + parts;
    }

    return parsed;
  } catch (error) {
    console.error("SMS parsing error:", error);
    throw new Error("Failed to parse SMS message");
  }
}

