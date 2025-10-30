import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Target, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useReadinessScore } from "@/hooks/useApi";

export default function ReadinessScoreBadge({
  score: propScore,
  previousScore: propPreviousScore,
  size = "large",
  showDetails = true,
  fetchFromApi = true // Enable API fetching by default
}) {
  const [previousScore, setPreviousScore] = useState(propPreviousScore);

  // Fetch from API if enabled, otherwise use prop value
  const { data: apiData, isLoading } = useReadinessScore({
    enabled: fetchFromApi,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Use API data if fetching from API, otherwise use prop
  const score = fetchFromApi ? (apiData?.score ?? 0) : (propScore ?? 0);

  // Track previous score for trend indicator
  useEffect(() => {
    if (fetchFromApi && apiData?.score !== undefined) {
      if (previousScore === undefined) {
        setPreviousScore(apiData.score);
      } else if (apiData.score !== score) {
        setPreviousScore(score);
      }
    }
  }, [fetchFromApi, apiData?.score, score, previousScore]);
  const getScoreColor = (score) => {
    if (score >= 80) return { bg: "from-green-500 to-emerald-600", text: "text-green-600", badge: "bg-green-600" };
    if (score >= 60) return { bg: "from-blue-500 to-blue-600", text: "text-blue-600", badge: "bg-blue-600" };
    if (score >= 40) return { bg: "from-yellow-500 to-orange-500", text: "text-orange-600", badge: "bg-orange-600" };
    return { bg: "from-red-500 to-pink-500", text: "text-red-600", badge: "bg-red-600" };
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Interview Ready";
    if (score >= 60) return "Good Progress";
    if (score >= 40) return "Keep Practicing";
    return "Just Starting";
  };

  const getTrendIcon = () => {
    if (!previousScore || previousScore === score) return <Minus className="w-3 h-3" />;
    if (score > previousScore) return <TrendingUp className="w-3 h-3" />;
    return <TrendingDown className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!previousScore || previousScore === score) return "bg-gray-500";
    if (score > previousScore) return "bg-green-500";
    return "bg-red-500";
  };

  const colors = getScoreColor(score);

  // Show loading state only when fetching from API
  if (fetchFromApi && isLoading) {
    if (size === "compact") {
      return (
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center shadow">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400">Loading...</p>
            <p className="text-xs text-gray-400">Readiness</p>
          </div>
        </div>
      );
    }
    return (
      <Card className="border-2 border-gray-200 bg-gray-50">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (size === "compact") {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${colors.bg} flex items-center justify-center shadow-lg`}>
          <span className="text-white font-bold text-sm">{Math.round(score)}</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700">Readiness</p>
          <p className="text-xs text-gray-500">{getScoreLabel(score)}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Interview Readiness</p>
              <div className="flex items-center gap-2">
                <p className={`text-4xl font-bold ${colors.text}`}>{Math.round(score)}%</p>
                {previousScore !== undefined && previousScore !== score && (
                  <Badge className={`${getTrendColor()} text-white flex items-center gap-1`}>
                    {getTrendIcon()}
                    {Math.abs(Math.round(score - previousScore))}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{getScoreLabel(score)}</p>
            </div>
            <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${colors.bg} flex items-center justify-center shadow-lg`}>
              <Target className="w-8 h-8 text-white" />
            </div>
          </div>

          <Progress value={score} className="h-3 mb-3" />

          {showDetails && (
            <div className="space-y-2 mt-4 pt-4 border-t border-purple-200">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-500">Learning</p>
                  <p className="font-semibold">25% weight</p>
                </div>
                <div>
                  <p className="text-gray-500">Practice</p>
                  <p className="font-semibold">40% weight</p>
                </div>
                <div>
                  <p className="text-gray-500">Profile</p>
                  <p className="font-semibold">15% weight</p>
                </div>
                <div>
                  <p className="text-gray-500">Consistency</p>
                  <p className="font-semibold">10% weight</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Your score updates automatically as you complete activities
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}