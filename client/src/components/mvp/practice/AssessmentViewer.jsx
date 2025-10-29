import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function AssessmentViewer({ simulation, onBack }) {
  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Button
          onClick={onBack}
          variant="outline"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Practice
        </Button>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-none shadow-2xl mb-6 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl mb-2">{simulation.job_title}</CardTitle>
              <p className="text-gray-600">
                {simulation.stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {simulation.company_name && ` at ${simulation.company_name}`}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Completed on {format(new Date(simulation.created_date), 'MMMM d, yyyy • h:mm a')}
              </p>
            </CardHeader>
            <CardContent>
              <div className="mb-8">
                <div className="text-center mb-6">
                  <div className="inline-block p-6 bg-white rounded-2xl shadow-lg">
                    <p className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {Math.round(simulation.overall_score)}
                    </p>
                    <p className="text-gray-600 font-semibold mt-2">Overall Score</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
                  {[
                    { label: "Relevance", score: simulation.relevance_score, weight: "15%" },
                    { label: "STAR Structure", score: simulation.star_structure_score, weight: "15%" },
                    { label: "Evidence", score: simulation.specific_evidence_score, weight: "15%" },
                    { label: "Role Fit", score: simulation.role_alignment_score, weight: "15%" },
                    { label: "Outcomes", score: simulation.outcome_oriented_score, weight: "15%" },
                    { label: "Communication", score: simulation.communication_score, weight: "10%" },
                    { label: "Problem-Solving", score: simulation.problem_solving_score, weight: "10%" },
                    { label: "Cultural Fit", score: simulation.cultural_fit_score, weight: "5%" },
                    { label: "Adaptability", score: simulation.learning_agility_score, weight: "5%" }
                  ].map((metric) => (
                    <div key={metric.label} className="text-center p-3 bg-white rounded-xl shadow-sm">
                      <p className="text-2xl font-bold text-purple-700">{Math.round(metric.score)}</p>
                      <p className="text-xs text-gray-600 mt-1 font-medium">{metric.label}</p>
                      <p className="text-xs text-gray-400">{metric.weight}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {simulation.strengths?.length > 0 && (
                  <div className="p-5 bg-green-50 rounded-xl border-2 border-green-200">
                    <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2 text-lg">
                      <CheckCircle2 className="w-5 h-5" />
                      Your Strengths
                    </h3>
                    <ul className="space-y-2">
                      {simulation.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-green-800 flex items-start gap-2 leading-relaxed">
                          <span className="text-green-600 mt-1 font-bold">✓</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {simulation.improvement_areas?.length > 0 && (
                  <div className="p-5 bg-orange-50 rounded-xl border-2 border-orange-200">
                    <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2 text-lg">
                      <XCircle className="w-5 h-5" />
                      Areas to Improve
                    </h3>
                    <ul className="space-y-2">
                      {simulation.improvement_areas.map((area, index) => (
                        <li key={index} className="text-sm text-orange-800 flex items-start gap-2 leading-relaxed">
                          <span className="text-orange-600 mt-1 font-bold">→</span>
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {simulation.ai_feedback && (
                  <div className="p-5 bg-purple-50 rounded-xl border-2 border-purple-200">
                    <h3 className="font-bold text-purple-900 mb-3 text-lg">Detailed AI Feedback</h3>
                    <p className="text-sm text-purple-800 leading-relaxed whitespace-pre-line">{simulation.ai_feedback}</p>
                  </div>
                )}

                {simulation.model_answers?.length > 0 && (
                  <div className="p-5 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <h3 className="font-bold text-blue-900 mb-4 text-lg">Model Answers - How to Improve</h3>
                    <div className="space-y-4">
                      {simulation.model_answers.map((answer, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="font-semibold text-gray-900 mb-3">Q: {answer.question}</p>
                          
                          <div className="mb-3">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Your Response:</span>
                            <p className="text-sm text-gray-700 italic mt-1 bg-gray-50 p-3 rounded">{answer.your_response}</p>
                          </div>
                          
                          <div className="mb-3">
                            <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Model Answer (STAR):</span>
                            <p className="text-sm text-green-700 mt-1 bg-green-50 p-3 rounded font-medium">{answer.model_answer}</p>
                          </div>
                          
                          <div className="bg-blue-50 p-3 rounded">
                            <span className="text-xs font-bold text-blue-700">Why This is Better:</span>
                            <p className="text-xs text-blue-600 mt-1">{answer.why_better}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {simulation.conversation?.length > 0 && (
                  <div className="p-5 bg-gray-50 rounded-xl border-2 border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-4 text-lg">Interview Transcript</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {simulation.conversation.map((msg, index) => (
                        <div key={index} className={`p-3 rounded-lg ${
                          msg.role === 'interviewer' 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'bg-purple-50 border border-purple-200'
                        }`}>
                          <p className="text-xs font-bold uppercase tracking-wide mb-1">
                            {msg.role === 'interviewer' ? '👔 Interviewer' : '🎯 You'}
                          </p>
                          <p className="text-sm text-gray-800">{msg.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(msg.timestamp), 'h:mm:ss a')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <Button
                  onClick={onBack}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  size="lg"
                >
                  Back to Practice
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}