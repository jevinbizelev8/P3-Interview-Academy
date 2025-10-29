import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function SimulationHistory({ simulations }) {
  if (simulations.length === 0) {
    return (
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Simulation History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No simulations yet. Start your first one!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-600" />
          Simulation History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {simulations.map((sim) => (
            <Link 
              key={sim.id} 
              to={`${createPageUrl("Practice")}?viewSimulation=${sim.id}`}
              className="block"
            >
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold group-hover:text-purple-700 transition-colors">{sim.job_title}</h3>
                    <p className="text-sm text-gray-600">
                      {sim.stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      {sim.company_name && ` • ${sim.company_name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-600 text-white">
                      {Math.round(sim.overall_score || 0)}%
                    </Badge>
                    <ChevronRight className="w-5 h-5 text-purple-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">Communication</p>
                    <p className="font-semibold">{Math.round(sim.communication_score || 0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">STAR</p>
                    <p className="font-semibold">{Math.round(sim.star_structure_score || 0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Relevance</p>
                    <p className="font-semibold">{Math.round(sim.relevance_score || 0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Role Fit</p>
                    <p className="font-semibold">{Math.round(sim.role_alignment_score || 0)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {format(new Date(sim.created_date), 'MMM d, yyyy • h:mm a')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}