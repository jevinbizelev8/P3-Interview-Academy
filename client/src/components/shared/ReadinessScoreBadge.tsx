/**
 * ReadinessScoreBadge Component
 *
 * Ported from founder's MVP codebase
 * Displays interview readiness score with trend indicators and breakdown
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReadinessScore } from '@/hooks/useApi';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ReadinessScoreBadgeProps {
  /** Display size variant */
  size?: 'compact' | 'large';
  /** Show detailed breakdown */
  showDetails?: boolean;
  /** Optional previous score for trend comparison */
  previousScore?: number;
  /** Optional className for customization */
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getScoreColor(score: number) {
  if (score >= 80)
    return {
      bg: 'from-green-500 to-emerald-600',
      text: 'text-green-600',
      badge: 'bg-green-600',
    };
  if (score >= 60)
    return {
      bg: 'from-blue-500 to-blue-600',
      text: 'text-blue-600',
      badge: 'bg-blue-600',
    };
  if (score >= 40)
    return {
      bg: 'from-yellow-500 to-orange-500',
      text: 'text-orange-600',
      badge: 'bg-orange-600',
    };
  return {
    bg: 'from-red-500 to-pink-500',
    text: 'text-red-600',
    badge: 'bg-red-600',
  };
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Interview Ready';
  if (score >= 60) return 'Good Progress';
  if (score >= 40) return 'Keep Practicing';
  return 'Just Starting';
}

// ============================================================================
// Component
// ============================================================================

export default function ReadinessScoreBadge({
  size = 'large',
  showDetails = true,
  previousScore,
  className = '',
}: ReadinessScoreBadgeProps) {
  // Fetch readiness score from P3 API
  const { data: readinessData, isLoading } = useReadinessScore();

  // Use API score or fallback to 0
  const score = readinessData?.score ?? 0;
  const colors = getScoreColor(score);

  // Calculate trend
  const getTrendIcon = () => {
    if (previousScore === undefined || previousScore === score)
      return <Minus className="w-3 h-3" />;
    if (score > previousScore) return <TrendingUp className="w-3 h-3" />;
    return <TrendingDown className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (previousScore === undefined || previousScore === score) return 'bg-gray-500';
    if (score > previousScore) return 'bg-green-500';
    return 'bg-red-500';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        {size === 'compact' ? (
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gray-300" />
            <div>
              <div className="h-3 w-16 bg-gray-300 rounded mb-1" />
              <div className="h-3 w-20 bg-gray-300 rounded" />
            </div>
          </div>
        ) : (
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <div className="h-24 bg-gray-300 rounded" />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Compact variant
  if (size === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-r ${colors.bg} flex items-center justify-center shadow-lg`}
        >
          <span className="text-white font-bold text-sm">{Math.round(score)}</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700">Readiness</p>
          <p className="text-xs text-gray-500">{getScoreLabel(score)}</p>
        </div>
      </div>
    );
  }

  // Large variant
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">
                Interview Readiness
              </p>
              <div className="flex items-center gap-2">
                <p className={`text-4xl font-bold ${colors.text}`}>
                  {Math.round(score)}%
                </p>
                {previousScore !== undefined && previousScore !== score && (
                  <Badge
                    className={`${getTrendColor()} text-white flex items-center gap-1`}
                  >
                    {getTrendIcon()}
                    {Math.abs(Math.round(score - previousScore))}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{getScoreLabel(score)}</p>
            </div>
            <div
              className={`w-16 h-16 rounded-full bg-gradient-to-r ${colors.bg} flex items-center justify-center shadow-lg`}
            >
              <Target className="w-8 h-8 text-white" />
            </div>
          </div>

          <Progress value={score} className="h-3 mb-3" />

          {showDetails && readinessData?.breakdown && (
            <div className="space-y-2 mt-4 pt-4 border-t border-purple-200">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-500">Learning</p>
                  <p className="font-semibold">
                    {readinessData.breakdown.learning || 0}% (25% weight)
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Practice</p>
                  <p className="font-semibold">
                    {readinessData.breakdown.practice || 0}% (40% weight)
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Profile</p>
                  <p className="font-semibold">
                    {readinessData.breakdown.profile || 0}% (15% weight)
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Consistency</p>
                  <p className="font-semibold">
                    {readinessData.breakdown.consistency || 0}% (10% weight)
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Your score updates automatically as you complete activities
              </p>
            </div>
          )}

          {showDetails && !readinessData?.breakdown && (
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
