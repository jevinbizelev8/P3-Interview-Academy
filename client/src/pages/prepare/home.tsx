import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, BookOpen, Clock, Trophy } from "lucide-react";

export default function PrepareHome() {
  const { user } = useAuth();
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const handleStartNewSession = async () => {
    setIsCreatingSession(true);
    try {
      // TODO: Implement session creation
      console.log("Creating new prepare session for user:", user?.id);
    } catch (error) {
      console.error("Error creating session:", error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Prepare Module
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Master interview fundamentals with AI-powered question practice and STAR method coaching. 
            Build your confidence through structured preparation sessions.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleStartNewSession}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Plus className="w-6 h-6 text-blue-600" />
                Start New Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Begin a new preparation session with AI-guided questions and STAR method practice.
              </p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                disabled={isCreatingSession}
              >
                {isCreatingSession ? "Starting..." : "Begin Preparation"}
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-purple-600" />
                Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Continue where you left off or review your completed preparation sessions.
              </p>
              <Button variant="outline" className="w-full">
                View Sessions
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-green-600" />
                Progress Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Monitor your improvement across different question types and competencies.
              </p>
              <Button variant="outline" className="w-full">
                View Progress
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8">Preparation Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-blue-600">WGLL Framework</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• <strong>Wonder:</strong> Explore diverse question types</li>
                <li>• <strong>Gather:</strong> Collect your experiences and examples</li>
                <li>• <strong>Link:</strong> Connect experiences to STAR structure</li>
                <li>• <strong>Launch:</strong> Practice confident delivery</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-purple-600">AI-Powered Coaching</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Personalized question generation</li>
                <li>• Real-time STAR method feedback</li>
                <li>• Competency-based assessment</li>
                <li>• Progressive difficulty adjustment</li>
              </ul>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}