import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { MessageSquare, FileText, DollarSign, CheckCircle } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: profile, isLoading: profileLoading } = trpc.businessProfile.getMyProfile.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (!loading && isAuthenticated && !profileLoading) {
      if (!profile) {
        // User is authenticated but has no profile, redirect to onboarding
        setLocation("/onboarding");
      }
    }
  }, [loading, isAuthenticated, profile, profileLoading, setLocation]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Create Invoices & Quotes
            <br />
            <span className="text-yellow-300">Via SMS</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            No app to download. No complicated software. Just text and get paid.
          </p>
          {!isAuthenticated ? (
            <Button
              size="lg"
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-lg px-8 py-6"
              onClick={() => window.location.href = getLoginUrl()}
            >
              Get Started Free
            </Button>
          ) : (
            <Button
              size="lg"
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-lg px-8 py-6"
              onClick={() => setLocation("/success")}
            >
              Go to Dashboard
            </Button>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <MessageSquare className="h-12 w-12 mb-4 text-yellow-300" />
            <h3 className="text-xl font-bold mb-2">Text to Create</h3>
            <p className="text-blue-100">
              Send a simple text message to generate professional invoices and quotes instantly.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <FileText className="h-12 w-12 mb-4 text-yellow-300" />
            <h3 className="text-xl font-bold mb-2">Professional PDFs</h3>
            <p className="text-blue-100">
              Automatically generated PDF invoices with your logo and branding.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <DollarSign className="h-12 w-12 mb-4 text-yellow-300" />
            <h3 className="text-xl font-bold mb-2">Get Paid Fast</h3>
            <p className="text-blue-100">
              Integrated payment links for Stripe, Square, and PayPal. Get paid in minutes.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <CheckCircle className="h-12 w-12 mb-4 text-yellow-300" />
            <h3 className="text-xl font-bold mb-2">QuickBooks Ready</h3>
            <p className="text-blue-100">
              Export your invoices to QuickBooks-compatible CSV format with one click.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign Up & Set Your Profile</h3>
                <p className="text-gray-600">
                  Create your account and add your business information in under 2 minutes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Text Your First Invoice</h3>
                <p className="text-gray-600">
                  Send a message like "Fix faucet 250 labor 100 parts 50" to our number.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Paid</h3>
                <p className="text-gray-600">
                  Receive a professional PDF invoice with a payment link. Your client pays instantly.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            {!isAuthenticated && (
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                onClick={() => window.location.href = getLoginUrl()}
              >
                Start Creating Invoices
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
