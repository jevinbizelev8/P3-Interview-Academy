import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Target, Award } from "lucide-react";
import type { ModuleTimeBreakdown } from "@shared/types";
import { formatDuration } from "./TimeTrackingCard";

interface ModuleBreakdownChartProps {
  timeByModule: ModuleTimeBreakdown;
  showCredits?: boolean;
  creditsData?: {
    prepare: number;
    practice: number;
    perform: number;
  };
}

export function ModuleBreakdownChart({
  timeByModule,
  showCredits = false,
  creditsData,
}: ModuleBreakdownChartProps) {
  const totalTime = timeByModule.prepare + timeByModule.practice + timeByModule.perform;

  const modules = [
    {
      name: "Prepare",
      time: timeByModule.prepare,
      percentage: totalTime > 0 ? (timeByModule.prepare / totalTime) * 100 : 0,
      icon: BookOpen,
      color: "bg-blue-500",
      lightColor: "bg-blue-100",
      textColor: "text-blue-700",
      credits: creditsData?.prepare || 0,
    },
    {
      name: "Practice",
      time: timeByModule.practice,
      percentage: totalTime > 0 ? (timeByModule.practice / totalTime) * 100 : 0,
      icon: Target,
      color: "bg-green-500",
      lightColor: "bg-green-100",
      textColor: "text-green-700",
      credits: creditsData?.practice || 0,
    },
    {
      name: "Perform",
      time: timeByModule.perform,
      percentage: totalTime > 0 ? (timeByModule.perform / totalTime) * 100 : 0,
      icon: Award,
      color: "bg-purple-500",
      lightColor: "bg-purple-100",
      textColor: "text-purple-700",
      credits: creditsData?.perform || 0,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800">
          Module Usage Breakdown
        </CardTitle>
        <CardDescription>
          Time spent across different modules
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress bars */}
        <div className="space-y-4">
          {modules.map((module) => (
            <div key={module.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <module.icon className={`h-4 w-4 ${module.textColor}`} />
                  <span className="text-sm font-medium text-slate-700">
                    {module.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">
                    {formatDuration(module.time)}
                  </span>
                  <span className="text-xs text-slate-500 w-12 text-right">
                    {module.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${module.color} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${module.percentage}%` }}
                />
              </div>
              {showCredits && (
                <div className="text-xs text-slate-500 ml-6">
                  {module.credits} credits used
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary stats */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700">
              Total Time
            </span>
            <span className="text-lg font-bold text-slate-900">
              {formatDuration(totalTime)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
