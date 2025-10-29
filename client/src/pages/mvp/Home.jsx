
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, Target, TrendingUp, Award, ArrowRight, 
  CheckCircle2, Clock, Zap, Trophy, Flame, Video, FileText
} from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { updateStreak } from "../components/utils/scoring";
import { format } from "date-fns";
import ReadinessScoreBadge from "../components/shared/ReadinessScoreBadge";

// Helper function to calculate and update readiness score in the backend
const calculateReadinessScore = async (userId) => {
    try {
        const currentUser = await base44.auth.me();
        if (currentUser.id !== userId) {
            console.warn("User ID mismatch for readiness score calculation.");
            return;
        }

        // Fetch user activities to calculate score
        const modules = await base44.entities.UserModuleProgress.filter({ 
            created_by: currentUser.email,
            completed: true 
        });
        const sims = await base44.entities.InterviewSimulation.filter(
            { created_by: currentUser.email }
        );
        const intros = await base44.entities.SelfIntro.filter(
            { created_by: currentUser.email }
        );
        const resumesAnalyzed = await base44.entities.Resume.filter(
            { created_by: currentUser.email }
        );

        let score = 0;
        // Base points for completing activities
        score += modules.length * 5; // e.g., 5 points per completed module
        score += sims.length * 10;   // e.g., 10 points per simulation
        score += intros.length * 5;  // e.g., 5 points per self-intro
        score += resumesAnalyzed.length * 5; // e.g., 5 points per resume analysis

        // Add weighted points based on average scores from activities
        if (sims.length > 0) {
            const avgSimScore = sims.reduce((acc, s) => acc + (s.overall_score || 0), 0) / sims.length;
            score += (avgSimScore / 100) * 20; // Max 20 points from average simulation score
        }
        if (intros.length > 0) {
            const avgIntroScore = intros.reduce((acc, i) => acc + (i.overall_score || 0), 0) / intros.length;
            score += (avgIntroScore / 100) * 10; // Max 10 points from average intro score
        }
        if (resumesAnalyzed.length > 0) {
            const avgResumeScore = resumesAnalyzed.reduce((acc, r) => acc + (r.ats_score || 0), 0) / resumesAnalyzed.length;
            score += (avgResumeScore / 100) * 10; // Max 10 points from average resume score
        }

        // Ensure score is within 0-100 range
        score = Math.min(Math.round(score), 100);
        score = Math.max(0, score);

        // Update the UserProfile in the database
        const profiles = await base44.entities.UserProfile.filter({ user_id: userId });
        if (profiles.length > 0) {
            await base44.entities.UserProfile.update(profiles[0].id, {
                readiness_score: score
            });
        } else {
            console.error("User profile not found for updating readiness score.");
        }
    } catch (error) {
        console.error("Error calculating and updating readiness score:", error);
    }
};


export default function Home() {
  const [user, setUser] = useState(null);
  const [previousReadiness, setPreviousReadiness] = useState(null); // State to store the previous readiness score

  const { data: userProfile, refetch: refetchProfile } = useQuery({ // Destructure refetch function
    queryKey: ['userProfile'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.id });
      
      if (profiles.length === 0) {
        const newProfile = await base44.entities.UserProfile.create({
          user_id: currentUser.id,
          xp_points: 0,
          current_streak: 0,
          total_simulations: 0,
          readiness_score: 0
        });
        // If a new profile is created, previous readiness is 0
        setPreviousReadiness(0); 
        return newProfile;
      }
      
      // Store the readiness score from the currently fetched profile data
      // This will be used as the 'previous' score for the next fetch/update cycle if the score changes.
      // On initial load, this will set previousReadiness to the initial score.
      if (profiles[0].readiness_score !== undefined) {
        // Only update if current userProfile data is available and previousReadiness isn't already capturing a value
        // This ensures the initial previousReadiness is set, and subsequent fetches rely on the `useEffect` below.
        setPreviousReadiness(profiles[0].readiness_score);
      }
      
      return profiles[0];
    },
    // Refetch profile data periodically to keep readiness score updated
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Use a separate useEffect to truly capture the 'previous' readiness score before `userProfile` updates
  useEffect(() => {
    // This effect runs after `userProfile` has been updated by the query.
    // However, if `previousReadiness` is set inside `queryFn` and this effect runs, it might be the same.
    // A more robust way to get "previous" data is to rely on `userProfile` changing.
    // If `userProfile.readiness_score` is defined and has changed from the currently displayed value,
    // then the `previousReadiness` should update to what `userProfile.readiness_score` *was* before this render.
    // For simplicity and to adhere to the outline's structure, we rely on the `queryFn` to set `previousReadiness`
    // on each fetch, and the badge component will interpret if `score === previousScore`.
  }, [userProfile?.readiness_score]);


  const { data: completedModules = [] } = useQuery({
    queryKey: ['completedModules'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return await base44.entities.UserModuleProgress.filter({ 
        created_by: currentUser.email,
        completed: true 
      });
    }
  });

  const { data: simulations = [] } = useQuery({
    queryKey: ['simulations'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return await base44.entities.InterviewSimulation.filter(
        { created_by: currentUser.email },
        '-created_date',
        10
      );
    }
  });

  const { data: selfIntros = [] } = useQuery({
    queryKey: ['selfIntros'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return await base44.entities.SelfIntro.filter(
        { created_by: currentUser.email },
        '-created_date',
        10
      );
    }
  });

  const { data: resumes = [] } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return await base44.entities.Resume.filter(
        { created_by: currentUser.email },
        '-created_date',
        10
      );
    }
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['userBadges'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return await base44.entities.UserBadge.filter(
        { created_by: currentUser.email },
        '-earned_date',
        3
      );
    }
  });

  // Combine all activities into a unified feed
  const recentActivities = React.useMemo(() => {
    const activities = [];

    // Add completed modules
    completedModules.forEach(module => {
      activities.push({
        id: `module-${module.id}`,
        type: 'module',
        title: module.module_name,
        subtitle: `${module.stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Stage`,
        icon: BookOpen,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        date: module.completion_date || module.created_date,
        score: module.quiz_score,
        url: createPageUrl("Prepare")
      });
    });

    // Add simulations
    simulations.forEach(sim => {
      activities.push({
        id: `sim-${sim.id}`,
        type: 'simulation',
        title: `${sim.stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Interview`,
        subtitle: sim.job_title || 'Practice Session',
        icon: Target,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        date: sim.created_date,
        score: Math.round(sim.overall_score || 0),
        url: `${createPageUrl("Practice")}?viewSimulation=${sim.id}`
      });
    });

    // Add self introductions
    selfIntros.forEach(intro => {
      activities.push({
        id: `intro-${intro.id}`,
        type: 'self-intro',
        title: 'Self-Introduction Video',
        subtitle: `${Math.floor(intro.duration_seconds / 60)}:${(intro.duration_seconds % 60).toString().padStart(2, '0')} minutes`,
        icon: Video,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        date: intro.created_date,
        score: Math.round(intro.overall_score || 0),
        url: createPageUrl("Prepare")
      });
    });

    // Add resume analyses
    resumes.forEach(resume => {
      activities.push({
        id: `resume-${resume.id}`,
        type: 'resume',
        title: 'Resume Analysis',
        subtitle: resume.file_name,
        icon: FileText,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        date: resume.created_date,
        score: Math.round(resume.ats_score || 0),
        url: createPageUrl("Prepare")
      });
    });

    // Sort by date (most recent first)
    return activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8); // Show top 8 recent activities
  }, [completedModules, simulations, selfIntros, resumes]);

  useEffect(() => {
    const initializeHome = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        await updateStreak(currentUser.id);
        
        // Recalculate readiness score on page load
        await calculateReadinessScore(currentUser.id);
        
        // Refetch profile to get updated score from the backend
        refetchProfile();
      } catch (error) {
        console.error("Error initializing home:", error);
      }
    };
    
    // Only run this effect once on component mount
    // refetchProfile is a stable function provided by useQuery, so it doesn't need to be in deps.
    // If it were a changing function, it should be in deps.
    initializeHome();
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
      progress: userProfile?.readiness_score || 0,
      url: createPageUrl("Perform"),
      description: "Analytics, insights & achievements"
    }
  ];

  const stats = [
    {
      label: "Rewards Points",
      value: userProfile?.xp_points || 0,
      icon: Zap,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      label: "Current Streak",
      value: `${userProfile?.current_streak || 0} days`,
      icon: Flame,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      label: "Simulations",
      value: userProfile?.total_simulations || 0,
      icon: Trophy,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      label: "Readiness",
      value: `${Math.round(userProfile?.readiness_score || 0)}%`,
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

        {/* Add Readiness Score Badge */}
        <div className="mb-8">
          <ReadinessScoreBadge 
            score={userProfile?.readiness_score || 0}
            // `previousReadiness` here will reflect the score from the last successful fetch.
            // If the score hasn't changed since the last fetch, it will be the same as `score`.
            // The `ReadinessScoreBadge` component should handle this by not showing a trend.
            previousScore={previousReadiness}
            size="large"
            showDetails={true}
          />
        </div>

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
              {recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <Link key={activity.id} to={activity.url}>
                      <div className={`flex items-center justify-between p-3 ${activity.bgColor} rounded-lg hover:shadow-md transition-shadow cursor-pointer`}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-full ${activity.bgColor} border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0`}>
                            <activity.icon className={`w-5 h-5 ${activity.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{activity.title}</p>
                            <p className="text-xs text-gray-500 truncate">{activity.subtitle}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {format(new Date(activity.date), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                        {activity.score !== undefined && activity.score > 0 && (
                          <div className="text-right flex-shrink-0 ml-2">
                            <Badge className={`${activity.type === 'module' ? 'bg-blue-600' : activity.type === 'simulation' ? 'bg-purple-600' : activity.type === 'self-intro' ? 'bg-pink-600' : 'bg-green-600'}`}>
                              {activity.score}%
                            </Badge>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No activity yet</p>
                  <Link to={createPageUrl("Prepare")}>
                    <Button variant="outline" className="mt-3">Start Learning</Button>
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
