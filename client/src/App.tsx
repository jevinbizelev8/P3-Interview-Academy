import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Practice from "@/pages/practice";
import AdminDashboard from "@/pages/admin/dashboard";
import PrepareModule from "@/pages/prepare";
import { useAuth } from "@/hooks/use-auth";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">P³ Interview Academy</h1>
          <p className="text-gray-600 mb-6">Please log in to access the interview practice platform</p>
          <a
            href="/api/login"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Log In
          </a>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Prepare Module Routes */}
      <Route path="/prepare" component={PrepareModule} />
      <Route path="/prepare/*" component={PrepareModule} />
      
      {/* Practice Module Routes */}
      <Route path="/practice" component={Practice} />
      <Route path="/practice/*" component={Practice} />
      
      {/* Perform Module Routes - Future implementation */}
      <Route path="/perform" component={() => <div>Perform Module (Coming Soon)</div>} />
      <Route path="/perform/*" component={() => <div>Perform Module (Coming Soon)</div>} />
      
      {/* Default route - Landing page with P³ overview */}
      <Route path="/" component={() => (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
          <div className="text-center max-w-4xl mx-auto px-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <span className="text-white font-bold text-2xl">P³</span>
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent mb-6">
              P³ Interview Academy
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Master your interview skills through our comprehensive three-stage framework: Prepare, Practice, and Perform.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold text-xl">P</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Prepare</h3>
                <p className="text-gray-600">Build your foundation with AI-powered question practice and STAR method coaching.</p>
                <button 
                  onClick={() => window.location.href = '/prepare'}
                  className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Preparing
                </button>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold text-xl">P</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Practice</h3>
                <p className="text-gray-600">Simulate real interviews with dynamic scenarios and personalized feedback.</p>
                <button 
                  onClick={() => window.location.href = '/practice'}
                  className="mt-4 w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Start Practicing
                </button>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 font-bold text-xl">P</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Perform</h3>
                <p className="text-gray-600">Showcase mastery with advanced simulations and portfolio building.</p>
                <button 
                  onClick={() => window.location.href = '/perform'}
                  className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>
      )} />
      
      {/* Admin Routes */}
      {user?.role === 'admin' && (
        <Route path="/admin/*" component={AdminDashboard} />
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
