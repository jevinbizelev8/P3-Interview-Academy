import { Switch, Route } from "wouter";
import MainNav from "@/components/navigation/main-nav";
import Dashboard from "./perform/dashboard";
import PerformEvaluation from "./perform/perform-evaluation";

export default function Perform() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <MainNav currentModule="perform" />

      {/* Routes */}
      <Switch>
        <Route path="/perform" component={Dashboard} />
        <Route path="/perform/evaluation/:sessionId" component={PerformEvaluation} />
        <Route component={Dashboard} />
      </Switch>
    </div>
  );
}