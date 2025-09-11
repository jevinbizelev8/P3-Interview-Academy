import { Switch, Route } from "wouter";
import MainNav from "@/components/navigation/main-nav";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScenarioSelection from "./practice/scenario-selection";
import PreInterviewBriefing from "./practice/pre-interview-briefing";
import InterviewPractice from "./practice/interview-practice";
import PracticeAssessment from "./practice/assessment";
import { useAuth } from "@/hooks/use-auth";

export default function Practice() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <MainNav currentModule="practice" />

        {/* Routes */}
        <Switch>
          <Route path="/practice" component={ScenarioSelection} />
          <Route path="/practice/briefing/:scenarioId" component={PreInterviewBriefing} />
          <Route path="/practice/interview/:sessionId" component={InterviewPractice} />
          <Route path="/practice/assessment/:sessionId" component={PracticeAssessment} />
          <Route path="/" component={ScenarioSelection} />
          <Route component={ScenarioSelection} />
        </Switch>
      </div>
    </ProtectedRoute>
  );
}
