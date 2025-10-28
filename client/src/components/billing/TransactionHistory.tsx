import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowDown,
  ArrowUp,
  Zap,
  Gift,
  Settings,
  Target,
  BookOpen
} from "lucide-react";
import { format } from "date-fns";
import type { CreditTransaction } from "@/hooks/useCredits";

interface TransactionHistoryProps {
  transactions: CreditTransaction[];
  isLoading?: boolean;
}

const getTransactionIcon = (type: string, feature: string | null) => {
  if (type === "consumption") {
    if (feature === "practice-session") return Target;
    if (feature === "prepare-session") return BookOpen;
    return Zap;
  }
  if (type === "allocation") return Gift;
  if (type === "top-up") return ArrowUp;
  if (type === "admin-adjustment") return Settings;
  return Zap;
};

const getTransactionColor = (amount: number) => {
  if (amount < 0) {
    return {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: "text-red-600",
      badge: "bg-red-100 text-red-800",
    };
  }
  return {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "text-green-600",
    badge: "bg-green-100 text-green-800",
  };
};

const getTransactionTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    consumption: "Used",
    allocation: "Allocated",
    "top-up": "Top-Up",
    "admin-adjustment": "Adjustment",
  };
  return labels[type] || type;
};

export function TransactionHistory({ transactions, isLoading }: TransactionHistoryProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Zap className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 mb-1">
                No credit transactions yet
              </p>
              <p className="text-sm text-gray-500">
                Start a Practice or Prepare session to see your credit usage
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-3">
        {transactions.map((transaction, index) => {
          const Icon = getTransactionIcon(transaction.type, transaction.feature);
          const colors = getTransactionColor(transaction.amount);
          const isNegative = transaction.amount < 0;

          return (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className={`${colors.border} border transition-all duration-200 hover:shadow-md`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>

                    {/* Transaction Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {transaction.description}
                          </p>
                          {transaction.feature && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Feature: {transaction.feature}
                            </p>
                          )}
                        </div>

                        {/* Amount Badge */}
                        <Badge className={colors.badge}>
                          {isNegative ? (
                            <ArrowDown className="w-3 h-3 mr-1" />
                          ) : (
                            <ArrowUp className="w-3 h-3 mr-1" />
                          )}
                          {isNegative ? transaction.amount : `+${transaction.amount}`}
                        </Badge>
                      </div>

                      {/* Meta Information */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Type:</span>
                          <span className="text-gray-700">
                            {getTransactionTypeLabel(transaction.type)}
                          </span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-gray-300" />
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Balance:</span>
                          <span className="text-gray-700">
                            {transaction.balanceAfter} credits
                          </span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>
                          {format(new Date(transaction.timestamp), "MMM d, yyyy h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
