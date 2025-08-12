import { Switch, Route } from "wouter";
import { PrepareSessionProvider } from "@/contexts/PrepareSessionContext";
import PrepareHome from "./home";
import NotFound from "@/pages/not-found";

function PrepareRouter() {
  return (
    <Switch>
      <Route path="/prepare" component={PrepareHome} />
      <Route path="/prepare/session/:sessionId" component={() => <div>Prepare Session (Coming Soon)</div>} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function PrepareModule() {
  return (
    <PrepareSessionProvider>
      <PrepareRouter />
    </PrepareSessionProvider>
  );
}