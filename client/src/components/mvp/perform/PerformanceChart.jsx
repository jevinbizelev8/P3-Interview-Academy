import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function PerformanceChart({ simulations }) {
  const lineData = simulations
    .slice(0, 10)
    .reverse()
    .map((sim, index) => ({
      name: `#${index + 1}`,
      score: Math.round(sim.overall_score || 0),
      date: format(new Date(sim.created_date), 'MMM d')
    }));

  const latestSim = simulations[0];
  const radarData = latestSim ? [
    { subject: 'Relevance of\nResponse', value: Math.round(latestSim.relevance_score || 0), fullMark: 100 },
    { subject: 'Structured\nusing STAR', value: Math.round(latestSim.star_structure_score || 0), fullMark: 100 },
    { subject: 'Specific Evidence\nUsage', value: Math.round(latestSim.specific_evidence_score || 0), fullMark: 100 },
    { subject: 'Aligned with\nRole', value: Math.round(latestSim.role_alignment_score || 0), fullMark: 100 },
    { subject: 'Outcome-\nOriented', value: Math.round(latestSim.outcome_oriented_score || 0), fullMark: 100 },
    { subject: 'Communication\nSkills', value: Math.round(latestSim.communication_score || 0), fullMark: 100 },
    { subject: 'Problem-Solving', value: Math.round(latestSim.problem_solving_score || 0), fullMark: 100 },
    { subject: 'Cultural Fit', value: Math.round(latestSim.cultural_fit_score || 0), fullMark: 100 },
    { subject: 'Learning\nAgility', value: Math.round(latestSim.learning_agility_score || 0), fullMark: 100 }
  ] : [];

  return (
    <Card className="border-none shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Performance Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {simulations.length > 0 ? (
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold mb-4">Progress Over Time</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis domain={[0, 100]} stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="url(#colorGradient)" 
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>

            {latestSim && (
              <div>
                <h3 className="text-sm font-semibold mb-4">Latest Performance Breakdown</h3>
                <p className="text-xs text-gray-500 mb-4">Average across all criteria for: {latestSim.job_title}</p>
                <ResponsiveContainer width="100%" height={500}>
                  <RadarChart data={radarData} margin={{ top: 40, right: 80, bottom: 40, left: 80 }}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis 
                      dataKey="subject"
                      tick={{ 
                        fill: '#4b5563', 
                        fontSize: 11,
                        fontWeight: 500
                      }}
                      tickLine={false}
                    />
                    <PolarRadiusAxis 
                      domain={[0, 100]} 
                      stroke="#9ca3af"
                      angle={90}
                      tick={{ fill: '#9ca3af', fontSize: 10 }}
                    />
                    <Radar 
                      name="Score" 
                      dataKey="value" 
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      fillOpacity={0.6}
                      strokeWidth={2}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#fff', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value) => [`${value}%`, 'Score']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Complete simulations to see your progress</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}