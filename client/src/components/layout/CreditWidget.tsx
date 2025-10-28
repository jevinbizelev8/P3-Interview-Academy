import { Link } from "wouter";
import { motion } from "framer-motion";
import { Zap, TrendingDown, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCreditBalance } from "@/hooks/useCredits";
import { Skeleton } from "@/components/ui/skeleton";

export function CreditWidget() {
  const { balance, isLoading, error } = useCreditBalance();

  if (error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/billing">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">Error</span>
              </motion.div>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Failed to load credit balance</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isLoading || !balance) {
    return (
      <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 flex items-center gap-2">
        <Skeleton className="w-4 h-4 rounded-full" />
        <Skeleton className="w-12 h-4" />
      </div>
    );
  }

  const { totalCredits, monthlyCredits, topUpCredits } = balance;
  const isLowCredits = totalCredits < (monthlyCredits * 0.2);
  const isCriticallyLow = totalCredits < 10;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/billing">
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${
                isCriticallyLow
                  ? "bg-gradient-to-r from-red-500 to-orange-500 border-red-600"
                  : isLowCredits
                  ? "bg-gradient-to-r from-orange-400 to-yellow-500 border-orange-500"
                  : "bg-gradient-to-r from-yellow-400 to-orange-500 border-yellow-500"
              }`}
            >
              {/* Icon */}
              <motion.div
                animate={isCriticallyLow ? { rotate: [0, -10, 10, -10, 0] } : {}}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                {isCriticallyLow ? (
                  <TrendingDown className="w-4 h-4 text-white" />
                ) : (
                  <Zap className="w-4 h-4 text-white" />
                )}
              </motion.div>

              {/* Credit Count */}
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-white">
                  {totalCredits}
                </span>
                <span className="text-xs font-medium text-white/90">
                  credits
                </span>
              </div>

              {/* Low Credits Badge */}
              {isCriticallyLow && (
                <Badge className="bg-white/20 text-white border-white/30 text-xs px-1.5 py-0">
                  Low
                </Badge>
              )}
            </motion.div>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-semibold text-sm">Credit Balance</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-400">Monthly Credits:</span>
                <span className="font-medium text-gray-200">{monthlyCredits}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-400">Top-Up Credits:</span>
                <span className="font-medium text-gray-200">{topUpCredits}</span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-700">
                <span className="text-gray-300 font-medium">Total:</span>
                <span className="font-bold text-white">{totalCredits}</span>
              </div>
            </div>
            {isCriticallyLow && (
              <div className="pt-2 border-t border-gray-700">
                <p className="text-xs text-orange-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Running low! Click to view plans.
                </p>
              </div>
            )}
            <div className="text-xs text-gray-400 pt-1">
              Click to manage billing
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
