import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Trophy, Target, Zap, Star, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Badge type matching database schema
interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  category: string;
  xpReward: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

interface UserBadge {
  badge: Badge;
  progress: number;
  earnedDate: Date | null;
  isClaimed: boolean;
}

interface BadgeGalleryProps {
  userId?: string;
}

// Icon mapping from Lucide
const ICON_MAP: Record<string, typeof Award> = {
  Award,
  Trophy,
  Target,
  Zap,
  Star,
  Crown,
};

// Rarity colors
const RARITY_COLORS: Record<string, string> = {
  common: "from-blue-500 to-blue-600",
  uncommon: "from-purple-500 to-purple-600",
  rare: "from-yellow-500 to-orange-500",
  epic: "from-red-500 to-pink-500",
  legendary: "from-indigo-500 to-purple-500",
};

export default function BadgeGallery({ userId }: BadgeGalleryProps) {
  const { toast } = useToast();

  // Fetch user badges with progress
  const { data: badgesData, isLoading, error } = useQuery({
    queryKey: ['user-badges', userId],
    queryFn: async () => {
      const response = await fetch('/api/gamification/user-badges', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch badges');
      }

      const result = await response.json();
      return result.data;
    },
  });

  if (error) {
    toast({
      title: "Error loading badges",
      description: "Unable to load your achievements. Please try again.",
      variant: "destructive",
    });
  }

  const userBadges: UserBadge[] = badgesData?.badges || [];
  const stats = badgesData?.stats || { totalEarned: 0, totalAvailable: 0, completionPercentage: 0 };

  return (
    <Card className="border-none shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Achievement Gallery
          </div>
          <div className="text-sm font-normal text-gray-600">
            {stats.totalEarned} / {stats.totalAvailable} Earned ({Math.round(stats.completionPercentage)}%)
          </div>
        </CardTitle>
        <p className="text-sm text-gray-600">Unlock badges by completing milestones and challenges</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="text-center animate-pulse">
                <div className="w-20 h-20 mx-auto mb-2 rounded-2xl bg-gray-200" />
                <div className="h-4 w-16 mx-auto mb-1 bg-gray-200 rounded" />
                <div className="h-3 w-20 mx-auto bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {userBadges.map((userBadge, index) => {
              const { badge, earnedDate } = userBadge;
              const isEarned = !!earnedDate;
              const Icon = ICON_MAP[badge.iconName] || Award;
              const colorGradient = RARITY_COLORS[badge.rarity] || RARITY_COLORS.common;

              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center group cursor-pointer"
                  title={badge.description}
                >
                  <div
                    className={`w-20 h-20 mx-auto mb-2 rounded-2xl bg-gradient-to-r ${colorGradient}
                      flex items-center justify-center shadow-lg ${
                        !isEarned && 'grayscale opacity-40'
                      } transition-all hover:scale-110 group-hover:shadow-2xl`}
                  >
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-xs font-semibold mb-1">{badge.name}</p>
                  <p className="text-xs text-gray-500 truncate">{badge.description}</p>
                  {isEarned && (
                    <p className="text-xs text-green-600 mt-1">
                      +{badge.xpReward} XP
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {!isLoading && userBadges.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No badges available yet</p>
            <p className="text-sm text-gray-400 mt-2">Complete activities to earn your first badge!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
