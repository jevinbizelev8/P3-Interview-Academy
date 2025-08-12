import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Practice from "@/pages/practice";
import AdminDashboard from "@/pages/admin/dashboard";
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
      {/* Prepare Module Routes - Add your prepare routes here */}
      <Route path="/prepare" component={() => <div>Prepare Module (To be imported)</div>} />
      <Route path="/prepare/*" component={() => <div>Prepare Module (To be imported)</div>} />
      
      {/* Practice Module Routes */}
      <Route path="/practice" component={Practice} />
      <Route path="/practice/*" component={Practice} />
      
      {/* Perform Module Routes - Future implementation */}
      <Route path="/perform" component={() => <div>Perform Module (Coming Soon)</div>} />
      <Route path="/perform/*" component={() => <div>Perform Module (Coming Soon)</div>} />
      
      {/* Default route */}
      <Route path="/" component={Practice} />
      
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
