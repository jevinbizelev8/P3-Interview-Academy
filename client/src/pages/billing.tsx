import React from "react";
import { motion } from "framer-motion";
import { toast as sonnerToast } from "sonner";
import confetti from "canvas-confetti";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  Zap,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  History,
  Download,
  Settings,
  LogOut,
} from "lucide-react";
import { format, addMonths } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/useCredits";
import { TierCard } from "@/components/billing/TierCard";
import { TopUpCard } from "@/components/billing/TopUpCard";
import { TransactionHistory } from "@/components/billing/TransactionHistory";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { subscriptionApi } from "@/services/subscription-api";

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    balance,
    balanceLoading,
    history,
    historyLoading,
    costs,
    costsLoading,
    creditPercentage,
    isLowCredits,
    isCriticallyLow,
    refetchBalance: refetchCredits,
  } = useCredits();

  // Get user's current plan
  const currentPlan = user?.planType || "FREE";

  // Calculate next renewal date (1 month from now for demo)
  const nextRenewalDate = user?.currentPeriodEnd
    ? format(new Date(user.currentPeriodEnd), "MMMM d, yyyy")
    : format(addMonths(new Date(), 1), "MMMM d, yyyy");

  // Billing cycle state
  const [selectedBillingCycle, setSelectedBillingCycle] = React.useState<"monthly" | "3-month" | "6-month">("monthly");

  // Loading state for checkout operations
  const [isCheckoutLoading, setIsCheckoutLoading] = React.useState(false);

  // Handle success/cancel URL parameters
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const canceled = params.get('canceled');

    if (success === 'true') {
      // 🎉 Celebrate subscription upgrade with confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#667eea', '#764ba2', '#f093fb', '#4facfe'],
      });

      // Enhanced success notification with Sonner
      sonnerToast.success('🎉 Payment Successful!', {
        description: 'Your subscription has been upgraded! Credits added to your account.',
        duration: 5000,
      });

      // Refresh credit balance
      refetchCredits?.();
      // Clean up URL
      window.history.replaceState({}, '', '/billing');
    }

    if (canceled === 'true') {
      sonnerToast.error('Payment Canceled', {
        description: 'Your payment was canceled. No charges have been made.',
        duration: 5000,
      });
      // Clean up URL
      window.history.replaceState({}, '', '/billing');
    }
  }, [toast, refetchCredits]);

  // Handle subscription tier upgrade
  const handleUpgrade = async (tier: 'PRO' | 'ADVANCED') => {
    if (isCheckoutLoading) return;

    try {
      setIsCheckoutLoading(true);
      await subscriptionApi.createCheckoutSession(tier);
      // Redirect happens in API call
    } catch (error) {
      console.error('Error starting checkout:', error);
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : "Failed to start checkout. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
      setIsCheckoutLoading(false);
    }
  };

  // Handle top-up credit purchase
  const handleTopUpPurchase = async (credits: number) => {
    if (isCheckoutLoading) return;

    // Map credits to package type
    const packageTypeMap: Record<number, 'SMALL' | 'POPULAR' | 'BULK'> = {
      100: 'SMALL',
      500: 'POPULAR',
      2000: 'BULK',
    };

    const packageType = packageTypeMap[credits];
    if (!packageType) {
      toast({
        title: "Invalid Package",
        description: "Selected credit package is not available.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCheckoutLoading(true);
      await subscriptionApi.createTopUpCheckout(packageType);
      // Redirect happens in API call
    } catch (error) {
      console.error('Error starting top-up checkout:', error);
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : "Failed to start checkout. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
      setIsCheckoutLoading(false);
    }
  };

  // Handle customer portal access
  const handleManageSubscription = async () => {
    try {
      await subscriptionApi.createCustomerPortal();
      // Redirect happens in API call
    } catch (error) {
      console.error('Error accessing customer portal:', error);
      toast({
        title: "Portal Access Error",
        description: error instanceof Error ? error.message : "Failed to access customer portal. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // Tier configurations with multi-cycle pricing
  const tiers = [
    {
      tier: "FREE" as const,
      credits: 50,
      prices: { monthly: 0, "3-month": 0, "6-month": 0 },
      features: [
        "50 credits per month",
        "Access to all interview stages",
        "Basic AI feedback",
        "Email support",
        "Credits reset monthly",
      ],
    },
    {
      tier: "PRO" as const,
      credits: 100,
      prices: { monthly: 10, "3-month": 9, "6-month": 8 },
      savings: { "3-month": 10, "6-month": 20 },
      features: [
        "100 credits per month",
        "Access to all interview stages",
        "Advanced AI feedback",
        "Priority email support",
        "Detailed performance analytics",
      ],
    },
    {
      tier: "ADVANCED" as const,
      credits: 280,
      prices: { monthly: 28, "3-month": 25, "6-month": 20 },
      savings: { "3-month": 10.7, "6-month": 28.6 },
      features: [
        "280 credits per month",
        "Access to all interview stages",
        "Premium AI feedback",
        "Priority support + chat",
        "Advanced analytics & insights",
        "Early access to new features",
      ],
    },
  ];

  // Top-up packages
  const topUpPackages = [
    { credits: 100, price: 10, pricePerCredit: 0.10, savings: 0 },
    { credits: 500, price: 45, pricePerCredit: 0.09, savings: 10, isBestValue: true },
    { credits: 2000, price: 160, pricePerCredit: 0.08, savings: 20 },
  ];

  // Mock invoices data (will be real in Phase 6)
  const mockInvoices = [
    {
      id: "1",
      invoiceNumber: "INV-2025-001",
      amount: 10,
      status: "paid",
      date: "2025-10-01",
    },
    {
      id: "2",
      invoiceNumber: "INV-2025-002",
      amount: 10,
      status: "paid",
      date: "2025-09-01",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="flex items-center space-x-2 group">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:shadow-md transition-shadow">
                  <span className="text-white font-bold text-sm">P³</span>
                </div>
                <span className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                  Billing
                </span>
              </Link>
            </div>
            <Link href="/dashboard">
              <Button variant="ghost">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Billing & Subscriptions
          </h1>
          <p className="text-gray-600">
            Manage your subscription, credits, and billing information
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Plan Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-2 border-blue-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <Badge className="bg-blue-100 text-blue-800">
                    {currentPlan}
                  </Badge>
                </div>
                <CardTitle className="text-lg">Current Plan</CardTitle>
              </CardHeader>
              <CardContent>
                {balanceLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-3xl font-bold text-gray-900">
                    {currentPlan}
                  </div>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  {currentPlan === "FREE"
                    ? "Free Forever"
                    : `$${tiers.find(t => t.tier === currentPlan)?.prices?.monthly ?? 0}/month`}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Credit Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className={`border-2 ${isCriticallyLow ? "border-red-200" : isLowCredits ? "border-orange-200" : "border-green-100"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Zap className={`w-5 h-5 ${isCriticallyLow ? "text-red-600" : isLowCredits ? "text-orange-600" : "text-green-600"}`} />
                  {isCriticallyLow && (
                    <Badge className="bg-red-100 text-red-800">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Low
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">Credit Balance</CardTitle>
              </CardHeader>
              <CardContent>
                {balanceLoading ? (
                  <div>
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ) : balance ? (
                  <div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {balance.totalCredits}
                    </div>
                    <Progress value={creditPercentage} className="h-2 mb-2" />
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{balance.monthlyCredits} monthly</span>
                      <span>{balance.topUpCredits} top-up</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Error loading balance</div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Next Renewal Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="border-2 border-purple-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <Badge className="bg-purple-100 text-purple-800">
                    Auto-Renew
                  </Badge>
                </div>
                <CardTitle className="text-lg">Next Renewal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-gray-900">
                  {nextRenewalDate}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Credits will reset on this date
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Low Credit Alert */}
        {isLowCredits && !balanceLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className={`${isCriticallyLow ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"}`}>
              <AlertTriangle className={`h-4 w-4 ${isCriticallyLow ? "text-red-600" : "text-orange-600"}`} />
              <AlertDescription className="text-sm">
                {isCriticallyLow ? (
                  <span className="font-medium text-red-900">
                    You're almost out of credits! Consider upgrading your plan or purchasing top-up credits.
                  </span>
                ) : (
                  <span className="font-medium text-orange-900">
                    Your credit balance is running low. You have {balance?.totalCredits} credits remaining.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Tabbed Interface */}
        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Upgrade Plan</span>
            </TabsTrigger>
            <TabsTrigger value="topups" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Buy Credits</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span>Usage History</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Upgrade Plan */}
          <TabsContent value="plans" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choose Your Plan
              </h2>
              <p className="text-gray-600 mb-4">
                Select the perfect plan for your interview preparation journey
              </p>

              {/* Billing Cycle Selector */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                  <Button
                    variant={selectedBillingCycle === "monthly" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedBillingCycle("monthly")}
                    className={selectedBillingCycle === "monthly" ? "bg-gradient-to-r from-purple-600 to-pink-600" : ""}
                  >
                    Monthly
                  </Button>
                  <Button
                    variant={selectedBillingCycle === "3-month" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedBillingCycle("3-month")}
                    className={selectedBillingCycle === "3-month" ? "bg-gradient-to-r from-purple-600 to-pink-600" : ""}
                  >
                    3 Months
                    <Badge className="ml-2 bg-green-500 text-white text-xs">Save 10%</Badge>
                  </Button>
                  <Button
                    variant={selectedBillingCycle === "6-month" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedBillingCycle("6-month")}
                    className={selectedBillingCycle === "6-month" ? "bg-gradient-to-r from-purple-600 to-pink-600" : ""}
                  >
                    6 Months
                    <Badge className="ml-2 bg-green-500 text-white text-xs">Save 20%</Badge>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tiers.map((tier) => (
                  <TierCard
                    key={tier.tier}
                    tier={tier.tier}
                    credits={tier.credits}
                    price={tier.prices[selectedBillingCycle]}
                    isCurrentPlan={currentPlan === tier.tier}
                    features={tier.features}
                    billingCycle={selectedBillingCycle}
                    savings={selectedBillingCycle === "monthly"
                      ? undefined
                      : tier.savings?.[selectedBillingCycle as "3-month" | "6-month"]}
                    onUpgrade={tier.tier === 'FREE' ? undefined : () => handleUpgrade(tier.tier)}
                    disabled={isCheckoutLoading || selectedBillingCycle !== "monthly"}
                  />
                ))}
              </div>
            </div>

            {/* Feature Comparison Alert */}
            <Alert className="bg-blue-50 border-blue-200">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">
                All plans include access to Practice and Prepare modules, AI-powered feedback, and performance tracking.
                Higher tiers provide more credits and priority support.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Tab 2: Buy Credits */}
          <TabsContent value="topups" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Top-Up Credits
              </h2>
              <p className="text-gray-600 mb-6">
                Purchase additional credits that never expire
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topUpPackages.map((pkg) => (
                  <TopUpCard
                    key={pkg.credits}
                    credits={pkg.credits}
                    price={pkg.price}
                    pricePerCredit={pkg.pricePerCredit}
                    savings={pkg.savings}
                    isBestValue={pkg.isBestValue}
                    onPurchase={() => handleTopUpPurchase(pkg.credits)}
                    disabled={isCheckoutLoading}
                  />
                ))}
              </div>
            </div>

            {/* Top-Up Info Alert */}
            <Alert className="bg-gradient-to-r from-yellow-50 to-orange-50 border-orange-200">
              <Sparkles className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-sm text-orange-900">
                <span className="font-semibold">Top-up credits never expire!</span>{" "}
                They stack with your subscription credits and are used after your monthly credits are depleted.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Tab 3: Usage History */}
          <TabsContent value="history" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Transaction History */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Credit Transactions
                  </h2>
                  {!historyLoading && history.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {history.length} transaction{history.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <TransactionHistory transactions={history} isLoading={historyLoading} />
              </div>

              {/* Billing History (Mock) */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Billing History
                  </h2>
                  {mockInvoices.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {mockInvoices.length} invoice{mockInvoices.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {mockInvoices.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <Download className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-900 mb-1">
                            No invoices yet
                          </p>
                          <p className="text-sm text-gray-500">
                            Your billing invoices will appear here
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {mockInvoices.map((invoice) => (
                      <Card key={invoice.id} className="border transition-all duration-200 hover:shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {invoice.invoiceNumber}
                              </p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(invoice.date), "MMM d, yyyy")}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className="bg-green-100 text-green-800">
                                {invoice.status}
                              </Badge>
                              <span className="font-semibold text-gray-900">
                                ${invoice.amount}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Subscription Management Section */}
        <Card className="border-none shadow-xl bg-gradient-to-r from-purple-50 to-pink-50 mt-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              <CardTitle>Subscription Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Plan Details */}
              <div>
                <h3 className="font-semibold mb-4 text-gray-900">Current Plan Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Plan:</span>
                    <Badge className="bg-purple-100 text-purple-800 font-semibold">
                      {currentPlan}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Credits/Month:</span>
                    <span className="font-semibold text-gray-900">
                      {balance?.monthlyCredits || tiers.find(t => t.tier === currentPlan)?.credits || 50}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold text-gray-900">
                      ${tiers.find(t => t.tier === currentPlan)?.prices.monthly || 0}/month
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Billing Cycle:</span>
                    <span className="font-semibold text-gray-900">Monthly</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Status:</span>
                    <Badge className="bg-green-600 text-white">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Next Renewal:</span>
                    <span className="font-semibold text-gray-900">{nextRenewalDate}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="font-semibold mb-4 text-gray-900">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start hover:bg-purple-50 hover:border-purple-300"
                    disabled
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Update Payment Method
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start hover:bg-blue-50 hover:border-blue-300"
                    disabled
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Latest Invoice
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                    disabled
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cancel Subscription
                  </Button>
                  <p className="text-xs text-gray-500 italic mt-4 text-center">
                    Payment features available after Stripe integration
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
