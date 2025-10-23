import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Zap, ArrowRight, X } from "lucide-react";
import { useCreditBalance } from "@/hooks/useCredits";
import { format, addMonths } from "date-fns";

interface PaywallProps {
  open: boolean;
  onClose: () => void;
  creditsNeeded?: number;
  featureName?: string;
}

export function Paywall({
  open,
  onClose,
  creditsNeeded = 1,
  featureName = "this feature",
}: PaywallProps) {
  const [, setLocation] = useLocation();
  const { balance } = useCreditBalance();

  const handleViewPlans = () => {
    onClose();
    setLocation("/billing");
  };

  // Calculate next renewal date (1 month from now for demo)
  const nextRenewalDate = format(addMonths(new Date(), 1), "MMMM d, yyyy");

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-md">
            {/* Gradient Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-t-lg"
            />

            {/* Icon */}
            <div className="relative flex justify-center pt-8 pb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center"
              >
                <AlertCircle className="w-12 h-12 text-orange-600" />
              </motion.div>
            </div>

            <DialogHeader className="text-center space-y-3">
              <DialogTitle className="text-2xl font-bold">
                You've Run Out of Credits
              </DialogTitle>
              <DialogDescription className="text-base text-gray-600">
                You need {creditsNeeded} credit{creditsNeeded !== 1 ? "s" : ""} to use {featureName}.
                {balance && (
                  <span className="block mt-1">
                    Your current balance: <span className="font-semibold text-gray-900">{balance.totalCredits} credits</span>
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            {/* Alert Box */}
            <Alert className="bg-orange-50 border-orange-200">
              <Zap className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-sm text-gray-700">
                {balance && balance.monthlyCredits > 0 ? (
                  <>
                    Your monthly credits will reset on{" "}
                    <span className="font-semibold text-gray-900">{nextRenewalDate}</span>.
                    You can also upgrade your plan or purchase top-up credits that never expire.
                  </>
                ) : (
                  <>
                    Upgrade to a paid plan or purchase top-up credits to continue using all features.
                  </>
                )}
              </AlertDescription>
            </Alert>

            {/* Options Cards */}
            <div className="space-y-3 my-4">
              {/* Upgrade Plan Option */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-4 border-2 border-purple-200 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 cursor-pointer"
                onClick={handleViewPlans}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Upgrade Your Plan</h4>
                    <p className="text-sm text-gray-600">
                      Get 100-280 monthly credits from $10/month
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-purple-600" />
                </div>
              </motion.div>

              {/* Top-Up Option */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-4 border-2 border-orange-200 rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50 cursor-pointer"
                onClick={handleViewPlans}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Buy Top-Up Credits</h4>
                    <p className="text-sm text-gray-600">
                      Purchase credits that never expire (from $10)
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-orange-600" />
                </div>
              </motion.div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
              <Button
                onClick={handleViewPlans}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                View Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
