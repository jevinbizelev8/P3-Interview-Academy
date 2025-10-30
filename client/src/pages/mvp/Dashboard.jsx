
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Target, TrendingUp, Award, ArrowRight,
  CheckCircle2, Clock, Zap, Trophy, Flame
} from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import {
  useReadinessScore,
  useXPPoints,
  useStreak,
  useUpdateStreak,
  useUserBadges,
  useSimulationHistory,
  useUserModuleProgress
} from '@/hooks/useApi';

export default function Dashboard() {
  // Fetch data using P3 API hooks
  const { data: readinessData } = useReadinessScore();
  const { data: xpData } = useXPPoints();
  const { data: streakData } = useStreak();
  const { data: moduleProgress = [] } = useUserModuleProgress();
  const { data: historyData } = useSimulationHistory({ limit: 5 });
  const { data: allBadges = [] } = useUserBadges();
  const updateStreakMutation = useUpdateStreak();

  // Derived data
  const completedModules = moduleProgress.filter(m => m.completed);
  const simulations = historyData?.sessions || [];
  const badges = allBadges.slice(0, 3); // Get 3 most recent

  useEffect(() => {
    // Update streak when user visits dashboard
    updateStreakMutation.mutate();
  }, []);

  const stages = [
    {
      title: "Prepare",
      subtitle: "Build Your Foundation",
      icon: BookOpen,
      color: "from-blue-500 to-blue-600",
      progress: Math.min((completedModules.length / 5) * 100, 100),
      url: createPageUrl("Prepare"),
      description: "Self-intro, resume analysis & learning modules"
    },
    {
      title: "Practice",
      subtitle: "AI Interview Simulations",
      icon: Target,
      color: "from-purple-500 to-purple-600",
      progress: Math.min((simulations.length / 5) * 100, 100),
      url: createPageUrl("Practice"),
      description: "Role-play real interviews with AI"
    },
    {
      title: "Perform",
      subtitle: "Track Your Growth",
      icon: TrendingUp,
      color: "from-pink-500 to-pink-600",
      progress: readinessData?.overall_score || 0,
      url: createPageUrl("Perform"),
      description: "Analytics, insights & achievements"
    }
  ];

  const stats = [
    {
      label: "Rewards Points",
      value: xpData?.points || 0,
      icon: Zap,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      label: "Current Streak",
      value: `${streakData?.current_streak || 0} days`,
      icon: Flame,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      label: "Simulations",
      value: simulations.length,
      icon: Trophy,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      label: "Readiness",
      value: `${Math.round(readinessData?.overall_score || 0)}%`,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100"
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
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Welcome to P³ Interview Academy
            </span>
          </h1>
          <p className="text-xl text-gray-600">
            Master the art of interviewing through our P³ Framework: <span className="font-semibold text-purple-600">Prepare → Practice → Perform</span>
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
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <span className="text-2xl font-bold">{stat.value}</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {stages.map((stage, index) => (
            <motion.div
              key={stage.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.15 }}
            >
              <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                <div className={`h-2 bg-gradient-to-r ${stage.color}`}></div>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${stage.color} flex items-center justify-center shadow-lg`}>
                      <stage.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{stage.title}</CardTitle>
                      <p className="text-sm text-gray-500">{stage.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{stage.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-purple-700">{Math.round(stage.progress)}%</span>
                    </div>
                    <Progress value={stage.progress} className="h-2" />
                  </div>
                  <Link to={stage.url}>
                    <Button className={`w-full bg-gradient-to-r ${stage.color} hover:opacity-90 text-white`}>
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {simulations.length > 0 ? (
                <div className="space-y-3">
                  {simulations.map((sim) => (
                    <div key={sim.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{sim.stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Interview</p>
                        <p className="text-xs text-gray-500">{sim.job_title || 'Practice Session'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-700">{Math.round(sim.overall_score || 0)}%</p>
                        <p className="text-xs text-gray-500">Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No simulations yet</p>
                  <Link to={createPageUrl("Practice")}>
                    <Button variant="outline" className="mt-3">Start Practicing</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {badges.length > 0 ? (
                <div className="space-y-3">
                  {badges.map((badge) => (
                    <div key={badge.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Achievement Unlocked</p>
                        <p className="text-xs text-gray-500">Keep up the great work!</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Start earning badges!</p>
                  <p className="text-sm text-gray-400 mt-2">Complete modules and simulations to unlock achievements</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
