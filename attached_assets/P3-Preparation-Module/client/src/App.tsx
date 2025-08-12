import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "./contexts/SessionContext";
import Home from "@/pages/home";
import Preparation from "@/pages/practice";
import Review from "@/pages/review";
import Complete from "@/pages/complete";
import WGLL from "@/pages/wgll";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/preparation/:sessionId" component={Preparation} />
      <Route path="/review/:sessionId" component={Review} />
      <Route path="/wgll/:sessionId" component={WGLL} />
      <Route path="/complete/:sessionId" component={Complete} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SessionProvider>
          <Toaster />
          <Router />
        </SessionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
