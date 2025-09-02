import { Switch, Route } from "wouter";
import MainNav from "@/components/navigation/main-nav";
import Home from "./home";
import PrepareDashboard from "./prepare/prepare-dashboard";
import EnhancedDashboard from "./prepare/enhanced-dashboard";
import InterviewStrategies from "./prepare/interview-strategies";
import CommonQuestions from "./prepare/common-questions";
import Complete from "./complete";
import Review from "./review";
import LanguageTest from "./language-test";

export default function Prepare() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <MainNav currentModule="prepare" />

      {/* Routes */}
      <Switch>
        <Route path="/prepare" component={Home} />
        <Route path="/prepare/strategies" component={InterviewStrategies} />
        <Route path="/prepare/questions" component={CommonQuestions} />
        <Route path="/prepare/dashboard" component={EnhancedDashboard} />
        <Route path="/prepare/session" component={PrepareDashboard} />
        <Route path="/prepare/complete" component={Complete} />
        <Route path="/prepare/review" component={Review} />
        <Route path="/prepare/language-test" component={LanguageTest} />
        <Route component={Home} />
      </Switch>
    </div>
  );
}