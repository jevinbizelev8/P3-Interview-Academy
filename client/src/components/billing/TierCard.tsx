import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, Zap, Crown, Gift } from "lucide-react";

export type TierType = "FREE" | "PRO" | "ADVANCED";

interface TierCardProps {
  tier: TierType;
  credits: number;
  price: number;
  isCurrentPlan?: boolean;
  features: string[];
  onUpgrade?: () => void;
  disabled?: boolean;
  billingCycle?: "monthly" | "3-month" | "6-month";
  savings?: number;
}

const tierConfig = {
  FREE: {
    name: "Free",
    icon: Gift,
    gradient: "from-gray-400 to-gray-500",
    badgeColor: "bg-gray-100 text-gray-800",
    description: "Perfect for getting started",
  },
  PRO: {
    name: "Pro",
    icon: Zap,
    gradient: "from-purple-500 to-purple-600",
    badgeColor: "bg-purple-100 text-purple-800",
    description: "Great for regular practice",
  },
  ADVANCED: {
    name: "Advanced",
    icon: Crown,
    gradient: "from-pink-500 to-orange-600",
    badgeColor: "bg-gradient-to-r from-pink-100 to-orange-100 text-pink-800",
    description: "Maximum preparation power",
  },
};

export function TierCard({
  tier,
  credits,
  price,
  isCurrentPlan = false,
  features,
  onUpgrade,
  disabled = true,
  billingCycle = "monthly",
  savings,
}: TierCardProps) {
  const config = tierConfig[tier];
  const Icon = config.icon;
  const isFree = tier === "FREE";

  // Helper to get billing cycle label
  const getBillingCycleLabel = () => {
    if (billingCycle === "3-month") return " (billed quarterly)";
    if (billingCycle === "6-month") return " (billed semi-annually)";
    return "";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card
        className={`relative h-full flex flex-col transition-all duration-300 ${
          isCurrentPlan
            ? `ring-2 ring-offset-2 ${tier === "FREE" ? "ring-gray-400" : tier === "PRO" ? "ring-purple-500" : "ring-pink-500"}`
            : "hover:shadow-xl"
        }`}
      >
        {/* Current Plan Badge */}
        {isCurrentPlan && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className={config.badgeColor}>
              Current Plan
            </Badge>
          </div>
        )}

        {/* Best Value Badge for Pro */}
        {tier === "PRO" && !isCurrentPlan && !savings && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-blue-600 text-white">
              Popular Choice
            </Badge>
          </div>
        )}

        {/* Savings Badge */}
        {savings && savings > 0 && !isCurrentPlan && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-green-600 text-white">
              Save {Math.round(savings)}%
            </Badge>
          </div>
        )}

        <CardHeader className="text-center pb-4">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Tier Name */}
          <CardTitle className="text-2xl font-bold">{config.name}</CardTitle>
          <CardDescription className="text-sm">{config.description}</CardDescription>

          {/* Price */}
          <div className="mt-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold">
                ${price}
              </span>
              {!isFree && <span className="text-gray-500">/month</span>}
            </div>
            {!isFree && billingCycle !== "monthly" && (
              <p className="text-xs text-gray-500 mt-1">{getBillingCycleLabel()}</p>
            )}
          </div>

          {/* Credits */}
          <div className="mt-2">
            <span className={`text-sm font-medium bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
              {credits} credits/month
            </span>
          </div>
        </CardHeader>

        <CardContent className="flex-1 px-6">
          {/* Features List */}
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="pt-6">
          {isCurrentPlan ? (
            <Button
              disabled
              variant="outline"
              className="w-full"
            >
              Current Plan
            </Button>
          ) : isFree ? (
            <Button
              disabled
              variant="outline"
              className="w-full"
            >
              Free Forever
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full">
                    <Button
                      disabled={disabled}
                      onClick={onUpgrade}
                      className={`w-full bg-gradient-to-r ${config.gradient} hover:opacity-90 text-white`}
                    >
                      Upgrade to {config.name}
                    </Button>
                  </div>
                </TooltipTrigger>
                {disabled && (
                  <TooltipContent>
                    <p>Payment integration coming soon</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
