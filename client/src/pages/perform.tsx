import { Switch, Route } from "wouter";
import MainNav from "@/components/navigation/main-nav";
import ModuleSwitcher from "@/components/navigation/module-switcher";
import PerformanceDashboard from "./perform/performance-dashboard";
import AssessmentHistory from "./perform/assessment-history";
import DetailedAssessment from "./perform/detailed-assessment";  
import PerformanceTrends from "./perform/performance-trends";
import AISimulation from "./perform/ai-simulation";
import LearningDrills from "./perform/learning-drills";

export default function Perform() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <MainNav currentModule="perform" />
      <ModuleSwitcher currentModule="perform" />

      {/* Routes */}
      <Switch>
        <Route path="/perform" component={PerformanceDashboard} />
        <Route path="/perform/history" component={AssessmentHistory} />
        <Route path="/perform/assessment/:assessmentId" component={DetailedAssessment} />
        <Route path="/perform/trends" component={PerformanceTrends} />
        <Route path="/perform/ai-simulation" component={AISimulation} />
        <Route path="/perform/drills" component={LearningDrills} />
        <Route component={PerformanceDashboard} />
      </Switch>
    </div>
  );
}