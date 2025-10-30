import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ChevronRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useReflections, useSimulationHistory } from "@/hooks/useApi";

export default function ReflectionJournalList() {
  const { data: reflectionData } = useReflections({ limit: 10 });
  const reflections = reflectionData?.reflections || [];

  const { data: simulationData } = useSimulationHistory();
  const simulations = simulationData?.sessions || [];

  const getSimulationDetails = (simId) => {
    return simulations.find(s => s.id === simId);
  };

  if (reflections.length === 0) {
    return (
      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            Reflection Journal Entries
          </CardTitle>
          <p className="text-sm text-gray-600">Your reflections help deepen learning and track growth</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No reflection entries yet</p>
            <p className="text-sm text-gray-400 mt-2">Complete a simulation and reflect on your performance to create your first entry</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600" />
          Reflection Journal Entries
        </CardTitle>
        <p className="text-sm text-gray-600">Your growth journey documented</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reflections.map((reflection, index) => {
            const sim = getSimulationDetails(reflection.simulation_id);
            
            return (
              <motion.div
                key={reflection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-semibold text-purple-900">
                          {format(new Date(reflection.created_date), 'MMM d, yyyy • h:mm a')}
                        </span>
                      </div>
                      {sim && (
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">{sim.job_title}</span>
                          {' • '}
                          <span>{sim.stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-purple-400" />
                  </div>

                  <div className="bg-white rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {reflection.reflection_text}
                    </p>
                  </div>

                  {reflection.ai_summary && (
                    <div className="bg-purple-100 rounded-lg p-3 border border-purple-200">
                      <p className="text-xs font-semibold text-purple-900 mb-1">AI Coach Summary:</p>
                      <p className="text-xs text-purple-800 line-clamp-2">
                        {reflection.ai_summary}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}