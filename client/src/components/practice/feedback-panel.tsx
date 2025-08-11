import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, Star, Lightbulb } from "lucide-react";
import type { InterviewSessionWithScenario } from "@shared/schema";

interface FeedbackPanelProps {
  session: InterviewSessionWithScenario;
}

export default function FeedbackPanel({ session }: FeedbackPanelProps) {
  // Calculate real-time metrics based on feedback from messages
  const userMessages = session.messages.filter(m => m.messageType === 'user');
  const feedbackMessages = userMessages.filter(m => m.feedback);
  
  // Simple scoring based on feedback keywords
  const calculateScore = (feedbackText: string) => {
    const positive = ['excellent', 'good', 'strong', 'well done', 'great'];
    const neutral = ['consider', 'could', 'try', 'perhaps'];
    const hasPositive = positive.some(word => feedbackText.toLowerCase().includes(word));
    const hasNeutral = neutral.some(word => feedbackText.toLowerCase().includes(word));
    
    if (hasPositive) return 4;
    if (hasNeutral) return 3;
    return 3.5; // Default neutral score
  };

  const averageConfidence = feedbackMessages.length > 0 
    ? feedbackMessages.reduce((sum, msg) => sum + calculateScore(msg.feedback || ''), 0) / feedbackMessages.length
    : 3.5;

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'bg-green-500';
    if (score >= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 3) return 'Improving';
    return 'Needs Work';
  };

  // Calculate session duration
  const startTime = session.startedAt ? new Date(session.startedAt) : new Date();
  const currentTime = new Date();
  const durationMinutes = Math.floor((currentTime.getTime() - startTime.getTime()) / (1000 * 60));
  const durationSeconds = Math.floor(((currentTime.getTime() - startTime.getTime()) % (1000 * 60)) / 1000);

  return (
    <>
      {/* Real-time Feedback */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 text-primary mr-2" />
            Live Feedback
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Overall Performance</span>
              <div className="flex items-center">
                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className={`h-2 rounded-full ${getScoreColor(averageConfidence)}`}
                    style={{ width: `${(averageConfidence / 5) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{getScoreLabel(averageConfidence)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Response Quality</span>
              <div className="flex items-center">
                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${Math.min((userMessages.length / 5) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {userMessages.length > 5 ? 'Excellent' : userMessages.length > 2 ? 'Good' : 'Building'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Engagement</span>
              <div className="flex items-center">
                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min(((session.currentQuestion || 1) / 15) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
            <Lightbulb className="w-4 h-4 text-blue-600 mr-2" />
            Quick Tips
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
              <span>Use specific examples from your experience</span>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
              <span>Quantify your achievements with numbers</span>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
              <span>Show enthusiasm and genuine interest</span>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
              <span>Follow the STAR method structure</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Session Progress */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Clock className="w-4 h-4 text-gray-600 mr-2" />
            Session Progress
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Time elapsed:</span>
              <span className="font-medium">
                {durationMinutes}m {durationSeconds}s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Questions answered:</span>
              <span className="font-medium">
                {Math.max((session.currentQuestion || 1) - 1, 0)} of 15
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current performance:</span>
              <Badge variant="outline" className="text-green-600 border-green-200">
                {averageConfidence.toFixed(1)}/5
              </Badge>
            </div>
            {session.currentQuestion && session.currentQuestion > 1 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Progress:</span>
                <span className="font-medium">
                  {Math.round(((session.currentQuestion - 1) / 15) * 100)}%
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
