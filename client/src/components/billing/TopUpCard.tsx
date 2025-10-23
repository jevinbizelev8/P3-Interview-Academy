import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, Sparkles, TrendingUp } from "lucide-react";

interface TopUpCardProps {
  credits: number;
  price: number;
  pricePerCredit: number;
  savings?: number;
  isBestValue?: boolean;
  onPurchase?: () => void;
  disabled?: boolean;
}

const getPackageIcon = (credits: number) => {
  if (credits >= 2000) return TrendingUp;
  if (credits >= 500) return Sparkles;
  return Zap;
};

const getPackageGradient = (credits: number) => {
  if (credits >= 2000) return "from-orange-500 to-red-600";
  if (credits >= 500) return "from-yellow-500 to-orange-600";
  return "from-blue-500 to-purple-600";
};

export function TopUpCard({
  credits,
  price,
  pricePerCredit,
  savings,
  isBestValue = false,
  onPurchase,
  disabled = true,
}: TopUpCardProps) {
  const Icon = getPackageIcon(credits);
  const gradient = getPackageGradient(credits);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="h-full"
    >
      <Card
        className={`relative h-full flex flex-col transition-all duration-300 ${
          isBestValue
            ? "ring-2 ring-yellow-400 ring-offset-2 shadow-lg"
            : "hover:shadow-xl"
        }`}
      >
        {/* Best Value Badge */}
        {isBestValue && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md">
              <Sparkles className="w-3 h-3 mr-1" />
              Best Value
            </Badge>
          </div>
        )}

        {/* Savings Badge */}
        {savings && savings > 0 && !isBestValue && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
            <Badge className="bg-green-600 text-white">
              Save {savings}%
            </Badge>
          </div>
        )}

        <CardHeader className="text-center pb-4">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Credits */}
          <CardTitle className="text-3xl font-bold">
            {credits.toLocaleString()} Credits
          </CardTitle>

          {/* Price */}
          <div className="mt-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold">
                ${price}
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              ${pricePerCredit.toFixed(2)} per credit
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 px-6">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${gradient}`} />
              <span>Credits never expire</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${gradient}`} />
              <span>Use for Practice & Prepare sessions</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${gradient}`} />
              <span>Stack with subscription credits</span>
            </div>
            {savings && savings > 0 && (
              <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                <span>Save {savings}% compared to small package</span>
              </div>
            )}
          </div>

          {/* Visual Representation */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
              <span>Credit Value</span>
              <span>{credits} sessions</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-500`}
                style={{ width: `${Math.min((credits / 2000) * 100, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Button
                    disabled={disabled}
                    onClick={onPurchase}
                    className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 text-white shadow-md`}
                  >
                    Purchase Top-Up
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
        </CardFooter>
      </Card>
    </motion.div>
  );
}
