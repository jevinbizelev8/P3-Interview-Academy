import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Trophy, Target, Zap, Star, Crown } from "lucide-react";
import { motion } from "framer-motion";

const SAMPLE_BADGES = [
  { name: "First Steps", icon: Target, color: "from-blue-500 to-blue-600", description: "Completed your first simulation" },
  { name: "Prepared Pro", icon: Award, color: "from-purple-500 to-purple-600", description: "Completed all learning modules" },
  { name: "Practice Master", icon: Trophy, color: "from-yellow-500 to-orange-500", description: "Completed 10 simulations" },
  { name: "Streak Warrior", icon: Zap, color: "from-red-500 to-pink-500", description: "7-day practice streak" },
  { name: "High Performer", icon: Star, color: "from-green-500 to-emerald-500", description: "Scored 90+ on a simulation" },
  { name: "Interview Ready", icon: Crown, color: "from-indigo-500 to-purple-500", description: "Achieved 80% readiness score" }
];

export default function BadgeGallery({ badges = [], userBadges = [] }) {
  return (
    <Card className="border-none shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          Achievement Gallery
        </CardTitle>
        <p className="text-sm text-gray-600">Unlock badges by completing milestones and challenges</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {SAMPLE_BADGES.map((badge, index) => {
            const isEarned = badges.length > index;
            const Icon = badge.icon;
            
            return (
              <motion.div
                key={badge.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div
                  className={`w-20 h-20 mx-auto mb-2 rounded-2xl bg-gradient-to-r ${badge.color} 
                    flex items-center justify-center shadow-lg ${
                      !isEarned && 'grayscale opacity-40'
                    } transition-all hover:scale-110`}
                >
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <p className="text-xs font-semibold mb-1">{badge.name}</p>
                <p className="text-xs text-gray-500">{badge.description}</p>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}