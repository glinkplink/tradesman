import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";

/**
 * All content in this page are only for example, delete if unneeded
 * When building pages, remember your instructions in Frontend Workflow, Frontend Best Practices, Design Guide and Common Pitfalls
 */
export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  // If theme is switchable in App.tsx, we can implement theme toggling like this:
  // const { theme, toggleTheme } = useTheme();

  // Use APP_LOGO (as image src) and APP_TITLE if needed

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-white mb-6">
            📱 SMS Invoice Generator
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Generate professional invoices and quotes via text message. 
            Perfect for tradespeople and small business owners on the go.
          </p>
          
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-8 mb-8 border border-slate-700">
            <h2 className="text-2xl font-semibold text-white mb-4">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <div className="text-4xl mb-2">1️⃣</div>
                <h3 className="font-semibold text-white mb-2">Text to Start</h3>
                <p className="text-slate-400 text-sm">Send any message to your dedicated Twilio number to begin onboarding</p>
              </div>
              <div>
                <div className="text-4xl mb-2">2️⃣</div>
                <h3 className="font-semibold text-white mb-2">Send Requests</h3>
                <p className="text-slate-400 text-sm">Text invoice details like "Invoice 2 hrs @ $120, John Smith, john@email.com"</p>
              </div>
              <div>
                <div className="text-4xl mb-2">3️⃣</div>
                <h3 className="font-semibold text-white mb-2">Get PDFs</h3>
                <p className="text-slate-400 text-sm">Professional PDFs are automatically generated and sent to your clients</p>
              </div>
            </div>
          </div>

          {isAuthenticated && user?.role === 'admin' && (
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 py-6">
                View Admin Dashboard →
              </Button>
            </Link>
          )}

          {!isAuthenticated && (
            <a href={getLoginUrl()}>
              <Button size="lg" className="text-lg px-8 py-6">
                Admin Login
              </Button>
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
