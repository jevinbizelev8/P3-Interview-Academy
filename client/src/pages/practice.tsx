import { Switch, Route } from "wouter";
import ScenarioSelection from "./practice/scenario-selection";
import PreInterviewBriefing from "./practice/pre-interview-briefing";
import InterviewPractice from "./practice/interview-practice";
import PostInterviewAssessment from "./practice/post-interview-assessment";
import { useAuth } from "@/hooks/use-auth";

export default function Practice() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">P³ Interview Academy</h1>
              <span className="ml-4 px-3 py-1 bg-primary text-primary-foreground text-sm rounded-full">
                Practice
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome back, {user?.firstName || 'User'}
              </span>
              {user?.profileImageUrl && (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <a
                href="/api/logout"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Log out
              </a>
            </div>
          </div>
        </div>
      </header>

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
