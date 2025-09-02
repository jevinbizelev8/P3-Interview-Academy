import { Switch, Route } from "wouter";
import MainNav from "@/components/navigation/main-nav";
import ScenarioSelection from "./practice/scenario-selection";
import PreInterviewBriefing from "./practice/pre-interview-briefing";
import InterviewPractice from "./practice/interview-practice";
import PostInterviewAssessment from "./practice/post-interview-assessment";
import { useAuth } from "@/hooks/use-auth";

export default function Practice() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <MainNav currentModule="practice" />

      {/* Routes */}
      <Switch>
        <Route path="/practice" component={ScenarioSelection} />
        <Route path="/practice/briefing/:scenarioId" component={PreInterviewBriefing} />
        <Route path="/practice/interview/:sessionId" component={InterviewPractice} />
        <Route path="/practice/assessment/:sessionId" component={PostInterviewAssessment} />
        <Route path="/" component={ScenarioSelection} />
        <Route component={ScenarioSelection} />
      </Switch>
    </div>
  );
}
