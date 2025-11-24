
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Award, Target, Zap, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import {
  useReadinessScore,
  useXPPoints,
  useUserBadges,
  useSimulationHistory,
  usePerformanceStats
} from '@/hooks/useApi';

import PerformanceChart from "@/components/mvp/perform/PerformanceChart";
import BadgeGallery from "@/components/mvp/perform/BadgeGallery";
import InsightsPanel from "@/components/mvp/perform/InsightsPanel";
import ActualInterviewTracker from "@/components/mvp/perform/ActualInterviewTracker";
import ReflectionJournalList from "@/components/mvp/perform/ReflectionJournalList";

export default function Perform() {
  // Fetch data using P3 API hooks with error handling
  const {
    data: readinessData,
    isLoading: isLoadingReadiness,
    error: readinessError
  } = useReadinessScore();

  const {
    data: xpData,
    isLoading: isLoadingXP,
    error: xpError
  } = useXPPoints();

  const {
    data: badges = [],
    isLoading: isLoadingBadges,
    error: badgesError
  } = useUserBadges();

  const {
    data: historyData,
    isLoading: isLoadingHistory,
    error: historyError
  } = useSimulationHistory();

  const {
    data: performanceStats,
    isLoading: isLoadingStats,
    error: statsError
  } = usePerformanceStats();

  // Aggregate loading states
  const isLoading = isLoadingReadiness || isLoadingXP || isLoadingBadges || isLoadingHistory || isLoadingStats;

  // Aggregate errors
  const hasError = readinessError || xpError || badgesError || historyError || statsError;

  const simulations = historyData?.sessions || [];

  // Get user profile data (for InsightsPanel)
  const userProfile = {
    current_streak: performanceStats?.current_streak || 0
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your performance data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className="min-h-screen p-6 md:p-8 flex items-center justify-center">
        <Card className="max-w-md border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-red-900 mb-2">Failed to Load Performance Data</h2>
            <p className="text-red-700 mb-4">
              We couldn't load some of your performance data. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      label: "Readiness Score",
      value: `${Math.round(readinessData?.overall_score || 0)}%`,
      icon: Target,
      color: "from-blue-500 to-blue-600",
      change: "+12% this week"
    },
    {
      label: "Total Rewards Points",
      value: xpData?.points || 0,
      icon: Zap,
      color: "from-yellow-500 to-orange-500",
      change: "Keep earning!"
    },
    {
      label: "Simulations",
      value: performanceStats?.total_simulations || simulations.length,
      icon: TrendingUp,
      color: "from-purple-500 to-pink-500",
      change: "Great progress!"
    },
    {
      label: "Badges Earned",
      value: badges.length,
      icon: Award,
      color: "from-green-500 to-emerald-500",
      change: "Unlock more!"
    }
  ];

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
              Perform Stage
            </span>
          </h1>
          <p className="text-xl text-gray-600">
            Track your growth, analyze performance, and celebrate achievements
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-3`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl font-bold mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-600 font-medium mb-1">{stat.label}</p>
                  <p className="text-xs text-gray-500">{stat.change}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <PerformanceChart simulations={simulations} />
          </div>
          <div>
            <InsightsPanel simulations={simulations} userProfile={userProfile} />
          </div>
        </div>

        <div className="mb-8">
          <ActualInterviewTracker />
        </div>

        <div className="mb-8">
          <ReflectionJournalList />
        </div>

        <BadgeGallery />
      </div>
    </div>
  );
}
