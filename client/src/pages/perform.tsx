import { Switch, Route } from "wouter";
import MainNav from "@/components/navigation/main-nav";
import ModuleSwitcher from "@/components/navigation/module-switcher";
import PerformSetup from "./perform/perform-setup";
import PerformInterview from "./perform/perform-interview";
import PerformEvaluation from "./perform/perform-evaluation";

export default function Perform() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <MainNav currentModule="perform" />
      <ModuleSwitcher currentModule="perform" />

      {/* Routes */}
      <Switch>
        <Route path="/perform" component={PerformSetup} />
        <Route path="/perform/interview/:sessionId" component={PerformInterview} />
        <Route path="/perform/evaluation/:sessionId" component={PerformEvaluation} />
        <Route component={PerformSetup} />
      </Switch>
    </div>
  );
}