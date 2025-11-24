
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

  // Check for actual errors (not just missing data)
  const hasActualError = readinessError || xpError || badgesError || historyError || statsError;

  // Check if this is a new user with no data (empty state, not an error)
  const simulations = historyData?.sessions || [];
  const totalSessions = performanceStats?.total_simulations || simulations.length || 0;
  const totalBadges = badges?.length || 0;
  const totalXP = xpData?.points || 0;
  const isNewUser = totalSessions === 0 && totalBadges === 0 && totalXP === 0;

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

  // Show friendly empty state for new users (not an error!)
  if (isNewUser && !hasActualError) {
    return (
      <div className="min-h-screen p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
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

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-12 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">🚀</span>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to Your Performance Dashboard!
              </h2>

              <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
                This is where you'll track your interview preparation progress, earn badges,
                and see your readiness score grow. Let's get started!
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-white rounded-lg shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Start Preparing</h3>
                  <p className="text-sm text-gray-600">Complete learning modules to build your foundation</p>
                </div>

                <div className="p-6 bg-white rounded-lg shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Practice Interviews</h3>
                  <p className="text-sm text-gray-600">Run AI simulations to sharpen your skills</p>
                </div>

                <div className="p-6 bg-white rounded-lg shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                    <Award className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Earn Rewards</h3>
                  <p className="text-sm text-gray-600">Unlock badges and track your progress</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.location.href = '/prepare'}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                >
                  Start Preparing
                </button>
                <button
                  onClick={() => window.location.href = '/practice'}
                  className="px-8 py-3 bg-white text-purple-600 font-semibold rounded-lg border-2 border-purple-600 hover:bg-purple-50 transition-all"
                >
                  Try a Practice Session
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error state only for actual API failures
  if (hasActualError) {
    return (
      <div className="min-h-screen p-6 md:p-8 flex items-center justify-center">
        <Card className="max-w-md border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-red-900 mb-2">Temporary Connection Issue</h2>
            <p className="text-red-700 mb-2">
              We're having trouble loading your performance data right now.
            </p>
            <p className="text-sm text-red-600 mb-6">
              This is usually temporary. Please try again in a moment.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Retry Now
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-6 py-3 bg-white text-red-600 font-semibold rounded-lg border-2 border-red-300 hover:bg-red-50 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-6">
              If this persists, please contact support
            </p>
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
