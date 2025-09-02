import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";
import Practice from "@/pages/practice";
import Prepare from "@/pages/prepare";
import Perform from "@/pages/perform";
import AdminDashboard from "@/pages/admin/dashboard";
import { useAuth } from "@/hooks/use-auth";

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/prepare" component={Prepare} />
      <Route path="/prepare/*" component={Prepare} />
      <Route path="/practice" component={Practice} />
      <Route path="/practice/*" component={Practice} />
      <Route path="/perform" component={Perform} />
      <Route path="/perform/*" component={Perform} />
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
