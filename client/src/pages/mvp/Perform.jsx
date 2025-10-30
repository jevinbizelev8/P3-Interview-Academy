
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

import PerformanceChart from "../components/perform/PerformanceChart";
import BadgeGallery from "../components/perform/BadgeGallery";
import InsightsPanel from "../components/perform/InsightsPanel";
import ActualInterviewTracker from "../components/perform/ActualInterviewTracker";
import ReflectionJournalList from "../components/perform/ReflectionJournalList";

export default function Perform() {
  // Fetch data using P3 API hooks
  const { data: readinessData } = useReadinessScore();
  const { data: xpData } = useXPPoints();
  const { data: badges = [] } = useUserBadges();
  const { data: historyData } = useSimulationHistory();
  const { data: performanceStats } = usePerformanceStats();

  const simulations = historyData?.sessions || [];

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
            <PerformanceChart />
          </div>
          <div>
            <InsightsPanel />
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
