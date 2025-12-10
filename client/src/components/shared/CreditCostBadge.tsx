/**
 * CreditCostBadge Component
 *
 * Ported from founder's MVP codebase
 * Displays credit cost for actions in a styled badge
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

// ============================================================================
// Type Definitions
// ============================================================================

export interface CreditCostBadgeProps {
  /** Number of credits */
  credits: number;
  /** Custom label (defaults to "credits") */
  label?: string;
  /** Size variant */
  size?: 'default' | 'sm' | 'lg';
  /** Optional className for customization */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export default function CreditCostBadge({
  credits,
  label = 'credits',
  size = 'default',
  className = '',
}: CreditCostBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    default: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <Badge
      className={`
        bg-gradient-to-r from-yellow-500 to-orange-500
        text-white
        border-none
        flex items-center gap-1
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <Zap className={iconSizes[size]} />
      <span>
        {credits} {label}
      </span>
    </Badge>
  );
}
