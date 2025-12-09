import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/mvp/Landing";
import NotFound from "@/pages/not-found";
import Practice from "@/pages/mvp/Practice";
import Prepare from "@/pages/mvp/Prepare";
import Perform from "@/pages/mvp/Perform";
import Billing from "@/pages/mvp/Billing";
import Home from "@/pages/mvp/Home";
import Profile from "@/pages/mvp/Profile";
import Referral from "@/pages/mvp/Referral";
import Layout from "@/pages/mvp/Layout";
import AdminDashboard from "@/pages/admin/dashboard";
import VerifyEmail from "@/pages/verify-email";
import ResetPassword from "@/pages/reset-password";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAuth } from "@/hooks/use-auth";

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <Layout currentPageName="Home">
            {user && <Home />}
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Layout currentPageName="Profile">
            {user && <Profile />}
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/referral">
        <ProtectedRoute>
          <Layout currentPageName="Referral">
            {user && <Referral />}
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/billing">
        <ProtectedRoute>
          <Layout currentPageName="Billing">
            <Billing />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/prepare">
        <ProtectedRoute>
          <Layout currentPageName="Prepare">
            <Prepare />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/prepare/*">
        <ProtectedRoute>
          <Layout currentPageName="Prepare">
            <Prepare />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/practice">
        <ProtectedRoute>
          <Layout currentPageName="Practice">
            <Practice />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/practice/*">
        <ProtectedRoute>
          <Layout currentPageName="Practice">
            <Practice />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/perform">
        <ProtectedRoute>
          <Layout currentPageName="Perform">
            <ErrorBoundary>
              <Perform />
            </ErrorBoundary>
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/perform/*">
        <ProtectedRoute>
          <Layout currentPageName="Perform">
            <ErrorBoundary>
              <Perform />
            </ErrorBoundary>
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/*">
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" richColors />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
