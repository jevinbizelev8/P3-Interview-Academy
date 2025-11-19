
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, Download, Zap, TrendingUp, Calendar, 
  CheckCircle2, AlertCircle, ArrowRight, Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

const PLANS = {
  STARTER: { name: "Starter", monthlyCredits: 50, price: { monthly: 0 } },
  PRO: { 
    name: "Pro", 
    monthlyCredits: 100, 
    price: { monthly: 10, "3-month": 9, "6-month": 8 },
    savings: { "3-month": "10%", "6-month": "20%" }
  },
  ADVANCED: { 
    name: "Advanced", 
    monthlyCredits: 280, 
    price: { monthly: 28, "3-month": 25, "6-month": 20 },
    savings: { "3-month": "10.7%", "6-month": "28.6%" }
  }
};

const TOP_UPS = [
  { credits: 100, price: 10 },
  { credits: 500, price: 45, popular: true },
  { credits: 2000, price: 160 }
];

const CREDIT_COSTS = [
  { feature: "AI Interview Simulation", credits: 15, description: "Full AI-powered interview practice session" },
  { feature: "Resume AI Analysis", credits: 5, description: "ATS score and optimization suggestions" },
  { feature: "Self-Intro Video Assessment", credits: 5, description: "AI feedback on recorded introduction" },
  { feature: "Script Polishing", credits: 3, description: "AI-enhanced script refinement" },
  { feature: "Video Recording", credits: 3, description: "Record self-introduction video" }
];

export default function Billing() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const response = await fetch('/api/subscription/status');
      if (!response.ok) throw new Error('Failed to fetch subscription');
      const result = await response.json();
      return result.success ? result.data : null;
    }
  });

  const { data: creditHistory = [] } = useQuery({
    queryKey: ['creditHistory'],
    queryFn: async () => {
      const response = await fetch('/api/subscription/topup-history?limit=20');
      if (!response.ok) throw new Error('Failed to fetch credit history');
      const result = await response.json();
      return result.success ? result.data.history : [];
    }
  });

  const { data: topUpPackages = [] } = useQuery({
    queryKey: ['topUpPackages'],
    queryFn: async () => {
      const response = await fetch('/api/subscription/topup-packages');
      if (!response.ok) throw new Error('Failed to fetch top-up packages');
      const result = await response.json();
      return result.success ? result.data.packages : [];
    }
  });

  // Placeholder for invoices - will be implemented later
  const invoices = [];

  const upgradePlan = useMutation({
    mutationFn: async ({ planType }) => {
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: planType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = result.data.url;
    }
  });

  const purchaseTopUp = useMutation({
    mutationFn: async ({ packageType }) => {
      const response = await fetch('/api/subscription/create-topup-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageType: packageType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create top-up checkout');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to create top-up checkout');
      }

      // Redirect to Stripe Checkout
      window.location.href = result.data.url;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const currentPlan = PLANS[subscription?.plan_type] || PLANS.STARTER;
  const creditUsagePercent = subscription?.monthlyCredits ? ((subscription?.monthlyCredits - subscription?.creditBalance) / subscription?.monthlyCredits) * 100 : 0;
  const isLowCredit = creditUsagePercent < 20;

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Billing & Credits
            </span>
          </h1>
          <p className="text-xl text-gray-600">Manage your subscription and credit balance</p>
        </motion.div>

        {isLowCredit && subscription?.current_credits > 0 && (
          <Alert className="mb-6 bg-orange-50 border-orange-200">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <AlertDescription className="text-orange-900">
              <strong>Low Credits Warning:</strong> You have {subscription.current_credits} credits remaining. 
              Consider purchasing a top-up or upgrading your plan.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-14 h-14 bg-gradient-to-r ${currentPlan.price.monthly > 0 ? 'from-purple-600 to-pink-600' : 'from-gray-400 to-gray-500'} rounded-xl flex items-center justify-center shadow-lg`}>
                  <CreditCard className="w-7 h-7 text-white" />
                </div>
                <Badge className={currentPlan.price.monthly > 0 ? 'bg-purple-600' : 'bg-gray-600'}>
                  {subscription?.plan_type || 'STARTER'}
                </Badge>
              </div>
              <h3 className="text-2xl font-bold mb-1">{currentPlan.name} Plan</h3>
              <p className="text-3xl font-bold text-purple-700">
                ${currentPlan.price[subscription?.billing_cycle] || 0}
                <span className="text-sm text-gray-600">/month</span>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {subscription?.billing_cycle === 'monthly' ? 'Billed monthly' : 
                 subscription?.billing_cycle === '3-month' ? 'Billed quarterly' : 
                 'Billed semi-annually'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <Badge className={isLowCredit ? 'bg-orange-600' : 'bg-green-600'}>
                  {Math.round(creditUsagePercent)}% Available
                </Badge>
              </div>
              <h3 className="text-2xl font-bold mb-1">Credits Balance</h3>
               <p className="text-3xl font-bold text-yellow-700">
                 {subscription?.creditBalance || 0}
                 <span className="text-sm text-gray-600"> / {subscription?.monthlyCredits || 50}</span>
               </p>
              <Progress value={creditUsagePercent} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-gradient-to-br from-blue-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <Badge className={subscription?.subscriptionStatus === 'active' ? 'bg-green-600' : 'bg-gray-600'}>
                  {subscription?.subscriptionStatus === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <h3 className="text-2xl font-bold mb-1">Current Plan</h3>
              <p className="text-lg font-semibold text-blue-700">
                {subscription?.planType || 'STARTER'}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {subscription?.monthlyCredits || 50} monthly credits
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="upgrade" className="mb-8">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-white shadow-lg p-1">
            <TabsTrigger value="upgrade">Upgrade Plan</TabsTrigger>
            <TabsTrigger value="topup">Buy Credits</TabsTrigger>
            <TabsTrigger value="history">Usage History</TabsTrigger>
          </TabsList>

          <TabsContent value="upgrade">
            <div className="grid md:grid-cols-3 gap-6">
              {Object.keys(PLANS).map((planKey) => {
                const plan = PLANS[planKey];
                const isCurrent = subscription?.planType === planKey;
                
                return (
                  <Card key={planKey} className={`border-none shadow-lg ${isCurrent ? 'border-2 border-purple-500' : ''}`}>
                    <div className={`h-2 bg-gradient-to-r ${plan.name === 'Pro' ? 'from-purple-500 to-purple-600' : plan.name === 'Advanced' ? 'from-pink-500 to-orange-600' : 'from-blue-500 to-blue-600'}`}></div>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle>{plan.name}</CardTitle>
                        {isCurrent && <Badge className="bg-purple-600">Current Plan</Badge>}
                      </div>
                      <div className="text-3xl font-bold mb-2">
                        ${plan.price[subscription?.billing_cycle || 'monthly']}
                        <span className="text-sm text-gray-600">/month</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Zap className="w-4 h-4 text-yellow-600" />
                        <span>{plan.monthlyCredits} credits/month</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!isCurrent && planKey !== 'STARTER' && (
                        <Button
                          onClick={() => upgradePlan.mutate({
                            planType: planKey
                          })}
                          disabled={upgradePlan.isPending}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                          {upgradePlan.isPending ? 'Processing...' : `Upgrade to ${plan.name}`}
                        </Button>
                      )}
                      {isCurrent && planKey !== 'STARTER' && (
                        <Button variant="outline" className="w-full" disabled>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Active Plan
                        </Button>
                      )}
                      {planKey === 'STARTER' && !isCurrent && (
                        <Button variant="outline" className="w-full" disabled>
                          Not Available
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="topup">
            <div className="grid md:grid-cols-3 gap-6">
              {topUpPackages?.map((pkg) => {
                const packageType = pkg.credits === 100 ? 'SMALL' : pkg.credits === 500 ? 'POPULAR' : 'BULK';
                const isPopular = packageType === 'POPULAR';

                return (
                  <Card key={pkg.credits} className={`border-none shadow-lg hover:shadow-xl transition-all ${isPopular ? 'border-2 border-purple-500' : ''}`}>
                    <CardHeader>
                      {isPopular && (
                        <Badge className="bg-purple-600 text-white mb-2 w-fit">Best Value</Badge>
                      )}
                      <CardTitle className="text-3xl font-bold text-purple-700">
                        {pkg.credits} Credits
                      </CardTitle>
                      <div className="text-4xl font-bold my-3">
                        ${pkg.price}
                      </div>
                      {pkg.savings && (
                        <Badge className="bg-green-100 text-green-700">
                          Save {pkg.savings}%
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => purchaseTopUp.mutate({ packageType })}
                        disabled={purchaseTopUp.isPending}
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                      >
                        {purchaseTopUp.isPending ? 'Processing...' : 'Purchase Top-Up'}
                      </Button>
                      <p className="text-xs text-gray-500 mt-3 text-center">
                        ${(pkg.price / pkg.credits).toFixed(2)} per credit
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Alert className="mt-6 bg-blue-50 border-blue-200">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Top-up credits never expire</strong> and can be used alongside your monthly allocation.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="history">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Credit Usage History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {creditHistory.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {creditHistory.map((txn) => (
                        <div key={txn.id} className={`p-4 rounded-lg border-2 ${
                          txn.transaction_type === 'consumption' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm">
                              {txn.transaction_type === 'consumption' ? '−' : '+'}{Math.abs(txn.credits_amount)} credits
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Balance: {txn.balance_after}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{txn.description}</p>
                          {txn.feature_used && (
                            <p className="text-xs text-gray-500">Feature: {txn.feature_used}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {format(new Date(txn.created_date), 'MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No credit transactions yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-blue-600" />
                    Billing History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {invoices.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {invoices.map((invoice) => (
                        <div key={invoice.id} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">{invoice.invoice_number}</span>
                            <Badge className={
                              invoice.status === 'paid' ? 'bg-green-600' :
                              invoice.status === 'pending' ? 'bg-yellow-600' :
                              'bg-red-600'
                            }>
                              {invoice.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl font-bold text-purple-700">${invoice.amount}</span>
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4 mr-1" />
                              PDF
                            </Button>
                          </div>
                          <p className="text-xs text-gray-600">
                            {format(new Date(invoice.created_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Download className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No invoices yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Card className="border-none shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Credit Usage Guide
            </CardTitle>
            <p className="text-sm text-gray-600">Understand how credits are consumed across different features.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {CREDIT_COSTS.map((item) => (
                <div key={item.feature} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 block">{item.feature}</span>
                      <span className="text-xs text-gray-600">{item.description}</span>
                    </div>
                  </div>
                  <Badge className="bg-purple-600 text-white">{item.credits} credits</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle>Subscription Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Current Plan Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-semibold">{currentPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Credits/Month:</span>
                    <span className="font-semibold">{subscription?.monthly_credits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold">${currentPlan.price[subscription?.billing_cycle || 'monthly']}/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={subscription?.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}>
                      {subscription?.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Next Renewal:</span>
                    <span className="font-semibold">
                      {subscription?.next_renewal_date 
                        ? format(new Date(subscription.next_renewal_date), 'MMM d, yyyy')
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Update Payment Method
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Download Latest Invoice
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                    Cancel Subscription
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
