import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function InsightsPanel({ simulations, userProfile }) {
  const getInsights = () => {
    if (simulations.length === 0) {
      return [
        "Start your first simulation to get personalized insights",
        "Complete all learning modules for better preparation",
        "Practice regularly to improve your interview skills"
      ];
    }

    const avgScore = simulations.reduce((sum, s) => sum + (s.overall_score || 0), 0) / simulations.length;
    const recentSims = simulations.slice(0, 3);
    const recentAvg = recentSims.reduce((sum, s) => sum + (s.overall_score || 0), 0) / recentSims.length;
    
    const insights = [];
    
    if (recentAvg > avgScore) {
      insights.push("Great improvement! Your recent simulations show significant progress.");
    } else {
      insights.push("Consider reviewing feedback from previous simulations to improve.");
    }

    const weakestMetric = simulations[0] ? 
      ['communication_score', 'clarity_score', 'relevance_score', 'confidence_score']
        .reduce((min, metric) => 
          simulations[0][metric] < simulations[0][min] ? metric : min
        ) : null;

    if (weakestMetric) {
      insights.push(`Focus on improving your ${weakestMetric.replace('_score', '').replace(/_/g, ' ')} skills.`);
    }

    if (userProfile?.current_streak > 0) {
      insights.push(`Keep your ${userProfile.current_streak}-day streak going!`);
    } else {
      insights.push("Start a practice streak to build consistency.");
    }

    return insights;
  };

  const insights = getInsights();

  return (
    <Card className="border-none shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
              <p className="text-sm text-gray-700 flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                {insight}
              </p>
            </div>
          ))}
        </div>

        {simulations.length > 0 && (
          <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-2">Next Steps</h3>
            <ul className="space-y-2 text-sm text-purple-800">
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                Practice the interview stage where you scored lowest
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                Review suggested responses from previous simulations
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                Aim for 5 simulations this week to improve rapidly
              </li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}