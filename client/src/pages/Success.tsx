import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MessageSquare, FileText, DollarSign } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Success() {
  const [, setLocation] = useLocation();
  const { data: profile, isLoading } = trpc.businessProfile.getMyProfile.useQuery();

  useEffect(() => {
    // Redirect to onboarding if no profile exists
    if (!isLoading && !profile) {
      setLocation("/onboarding");
    }
  }, [profile, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const twilioNumber = "+1 (555) 000-0000"; // This will be configured via environment variable

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success Header */}
        <Card className="shadow-xl border-green-200">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">You're All Set!</CardTitle>
            <CardDescription className="text-lg mt-2">
              Your business profile has been created. You can now create invoices and quotes via SMS.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* How to Use Section */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">How to Use SMS Invoice</CardTitle>
            <CardDescription>
              Simply text our number to create professional invoices and quotes instantly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Twilio Number */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Text this number to get started:</p>
              <p className="text-3xl font-bold text-blue-600">{twilioNumber}</p>
            </div>

            {/* Examples */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Example Messages
              </h3>

              {/* Invoice Example */}
              <div className="border-l-4 border-blue-500 bg-gray-50 p-4 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Create an Invoice:</p>
                    <code className="block bg-white p-3 rounded border text-sm">
                      "Fix faucet 250 labor 100 parts 50"
                    </code>
                    <p className="text-sm text-gray-600 mt-2">
                      → System generates invoice and sends payment link
                    </p>
                  </div>
                </div>
              </div>

              {/* Quote Example */}
              <div className="border-l-4 border-green-500 bg-gray-50 p-4 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Create a Quote:</p>
                    <code className="block bg-white p-3 rounded border text-sm">
                      "Quote deck repair labor 300 materials 200"
                    </code>
                    <p className="text-sm text-gray-600 mt-2">
                      → System creates a quote PDF and sends text reply
                    </p>
                  </div>
                </div>
              </div>

              {/* Advanced Example */}
              <div className="border-l-4 border-purple-500 bg-gray-50 p-4 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">With Client Details:</p>
                    <code className="block bg-white p-3 rounded border text-sm">
                      "Invoice for John Smith kitchen sink repair labor 150 parts 75"
                    </code>
                    <p className="text-sm text-gray-600 mt-2">
                      → Includes client name in the invoice
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">💡 Tips:</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Start with "invoice" or "quote" to specify the document type</li>
                <li>• Include "labor", "parts", or "materials" followed by amounts</li>
                <li>• Add client names for better record keeping</li>
                <li>• The system automatically calculates totals and generates professional PDFs</li>
                <li>• Payment links are included for Stripe, Square, or PayPal invoices</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={() => setLocation("/dashboard")}
                className="flex-1"
                size="lg"
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={() => setLocation("/settings")}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Edit Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

