
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, Zap, Target, TrendingUp, Award, Star, 
  ArrowRight, Sparkles, Users, BookOpen, Video, CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const PLANS = {
  STARTER: {
    name: "Starter",
    price: { monthly: 0, "3-month": 0, "6-month": 0 },
    credits: 50,
    creditsRenewal: "one-time",
    features: [
      "50 credits (one-time)",
      "Access to Learning Hub",
      "1 AI Interview Simulation",
      "Basic performance analytics",
      "Email support"
    ],
    color: "from-blue-500 to-blue-600",
    popular: false,
    cta: "Start Free"
  },
  PRO: {
    name: "Pro",
    price: { monthly: 10, "3-month": 9, "6-month": 8 },
    credits: 100,
    creditsRenewal: "monthly",
    savings: { "3-month": "10%", "6-month": "20%" },
    features: [
      "100 credits per month",
      "Up to 10 AI simulations/month",
      "Resume AI analysis & optimization",
      "Self-intro script wizard & video assessment",
      "Performance analytics & insights",
      "Reflection journal with AI coaching",
      "Badge system & gamification",
      "Priority email support"
    ],
    color: "from-purple-500 to-purple-600",
    popular: true,
    cta: "Get Started"
  },
  ADVANCED: {
    name: "Advanced",
    price: { monthly: 28, "3-month": 25, "6-month": 20 },
    credits: 280,
    creditsRenewal: "monthly",
    savings: { "3-month": "10.7%", "6-month": "28.6%" },
    features: [
      "280 credits per month",
      "Up to 28 AI simulations/month",
      "Everything in Pro, plus:",
      "Advanced analytics & trend tracking",
      "Detailed model answers for all questions",
      "Actual interview tracker & follow-ups",
      "Priority chat support",
      "Early access to new features"
    ],
    color: "from-pink-500 to-orange-600",
    popular: false,
    cta: "Go Advanced"
  }
};

const CREDIT_COSTS = [
  { feature: "AI Interview Simulation", credits: 15 },
  { feature: "Resume AI Analysis", credits: 5 },
  { feature: "Self-Intro Video Assessment", credits: 5 },
  { feature: "Script Polishing", credits: 3 },
  { feature: "Video Recording", credits: 3 }
];

const TOP_UPS = [
  { credits: 100, price: 10, popular: false },
  { credits: 500, price: 45, popular: true, savings: "10%" },
  { credits: 2000, price: 160, popular: false, savings: "20%" }
];

export default function Landing() {
  const [billingCycle, setBillingCycle] = useState("monthly");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
        
        <nav className="relative z-10 border-b border-purple-100 bg-white/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to={createPageUrl("Landing")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-lg">P³ Interview Academy</h1>
                <p className="text-xs text-purple-600 font-medium">Prepare → Practice → Perform</p>
              </div>
            </Link>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/auth'}
              >
                Sign In
              </Button>
              <Button
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => window.location.href = '/auth'}
              >
                Start Free
              </Button>
            </div>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none px-4 py-1">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Interview Preparation
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Master Every Interview
              </span>
              <br />
              <span className="text-gray-900">With AI Coaching</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
              Transform from nervous candidate to confident professional through our proven P³ Framework: 
              <span className="font-semibold text-purple-700"> Prepare, Practice, Perform</span>
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg"
                onClick={() => window.location.href = '/auth'}
              >
                Start Free - 50 Credits
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                Watch Demo
              </Button>
            </div>

            <div className="mt-10 flex gap-8 justify-center text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Start in 30 seconds
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Cancel anytime
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How P³ Framework Works</h2>
            <p className="text-xl text-gray-600">Three proven stages to interview success</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: "1. Prepare",
                subtitle: "Build Your Foundation",
                description: "Master all 5 interview stages with interactive modules. Script and record your perfect self-introduction with AI guidance. Optimize your resume with AI-powered analysis.",
                color: "from-blue-500 to-blue-600"
              },
              {
                icon: Target,
                title: "2. Practice",
                subtitle: "AI Simulations",
                description: "Experience realistic interviews with our AI Avatar. Practice with voice or text. Get instant, detailed feedback on every response using STAR methodology.",
                color: "from-purple-500 to-purple-600"
              },
              {
                icon: TrendingUp,
                title: "3. Perform",
                subtitle: "Track & Improve",
                description: "Monitor your readiness score and performance trends. Earn badges and Rewards Points. Track real interviews and build unstoppable momentum.",
                color: "from-pink-500 to-pink-600"
              }
            ].map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="border-none shadow-lg hover:shadow-xl transition-all h-full">
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                    <p className="text-lg font-semibold text-purple-600 mb-3">{step.subtitle}</p>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-20 bg-gradient-to-br from-gray-50 to-purple-50" id="pricing">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 mb-8">Choose the plan that fits your needs. Upgrade, downgrade, or cancel anytime.</p>
            
            <Tabs value={billingCycle} onValueChange={setBillingCycle} className="inline-block">
              <TabsList className="bg-white p-1 shadow-lg">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="3-month">
                  3 Months
                  <Badge className="ml-2 bg-green-100 text-green-700 text-xs">Save 10-28%</Badge>
                </TabsTrigger>
                <TabsTrigger value="6-month">
                  6 Months
                  <Badge className="ml-2 bg-green-100 text-green-700 text-xs">Save 20-28%</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {Object.values(PLANS).map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                viewport={{ once: true }}
                className={plan.popular ? "relative md:scale-105" : ""}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-0 right-0 flex justify-center">
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none px-4 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <Card className={`border-none shadow-xl hover:shadow-2xl transition-all ${
                  plan.popular ? 'border-2 border-purple-500' : ''
                }`}>
                  <div className={`h-2 bg-gradient-to-r ${plan.color}`}></div>
                  <CardHeader className="pb-8 pt-6">
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-5xl font-bold">
                        ${plan.price[billingCycle]}
                      </span>
                      {plan.price[billingCycle] > 0 && (
                        <span className="text-gray-500">
                          /month{billingCycle !== 'monthly' && <span className="text-xs block">billed {billingCycle}</span>}
                        </span>
                      )}
                    </div>
                    {plan.savings && plan.savings[billingCycle] && billingCycle !== 'monthly' && (
                      <Badge className="bg-green-100 text-green-700 mb-4">
                        Save {plan.savings[billingCycle]}
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <Zap className="w-4 h-4 text-yellow-600" />
                      <span className="font-semibold">{plan.credits} credits{plan.creditsRenewal === 'monthly' ? '/month' : ' total'}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white`}
                      size="lg"
                      onClick={() => window.location.href = '/auth'}
                    >
                      {plan.cta}
                    </Button>
                    <ul className="space-y-3 mt-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">Need more credits? Purchase top-ups anytime:</p>
            <div className="flex gap-4 justify-center flex-wrap">
              {TOP_UPS.map((topup) => (
                <Card key={topup.credits} className={`border-2 ${topup.popular ? 'border-purple-500' : 'border-gray-200'} hover:shadow-lg transition-all`}>
                  <CardContent className="p-4 text-center">
                    {topup.popular && (
                      <Badge className="mb-2 bg-purple-100 text-purple-700">Best Value</Badge>
                    )}
                    <p className="text-2xl font-bold text-purple-700">{topup.credits} Credits</p>
                    <p className="text-3xl font-bold my-2">${topup.price}</p>
                    {topup.savings && (
                      <Badge className="bg-green-100 text-green-700 text-xs">Save {topup.savings}</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Credit Usage */}
      <div className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How Credits Work</h2>
            <p className="text-xl text-gray-600">Simple, transparent pricing for every feature</p>
          </div>

          <Card className="border-none shadow-xl">
            <CardContent className="p-8">
              <div className="space-y-4">
                {CREDIT_COSTS.map((item) => (
                  <div key={item.feature} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-gray-900">{item.feature}</span>
                    </div>
                    <Badge className="bg-purple-600 text-white">{item.credits} credits</Badge>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-green-900 mb-2">Credit Renewal Policy</h3>
                    <ul className="space-y-1 text-sm text-green-800">
                      <li>• Credits renew automatically each billing cycle</li>
                      <li>• Unused credits do not roll over to the next period</li>
                      <li>• Top-up credits can be purchased anytime and don't expire</li>
                      <li>• Starter plan gets 50 credits one-time only</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Showcase */}
      <div className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features to Land Your Dream Job</h2>
            <p className="text-xl text-gray-600">Everything you need to ace any interview</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Video,
                title: "AI Interview Simulations",
                description: "Practice with realistic AI Avatar that asks role-specific questions with voice interaction",
                color: "from-purple-500 to-purple-600"
              },
              {
                icon: Sparkles,
                title: "Self-Intro Wizard",
                description: "7-step guided journey to craft, polish, and record your perfect elevator pitch",
                color: "from-blue-500 to-blue-600"
              },
              {
                icon: Target,
                title: "Resume AI Optimizer",
                description: "Get ATS scores, JD matching, and line-by-line suggestions to improve your resume",
                color: "from-pink-500 to-pink-600"
              },
              {
                icon: TrendingUp,
                title: "Performance Analytics",
                description: "Track your readiness score, identify weak areas, and monitor improvement over time",
                color: "from-green-500 to-emerald-600"
              },
              {
                icon: Award,
                title: "Gamification & Badges",
                description: "Earn Rewards Points, maintain streaks, unlock achievements, and stay motivated",
                color: "from-yellow-500 to-orange-500"
              },
              {
                icon: Users,
                title: "Reflection Journal",
                description: "Deepen learning with AI-guided reflection and personalized resource recommendations",
                color: "from-indigo-500 to-purple-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border-none shadow-lg hover:shadow-xl transition-all h-full">
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Land Your Dream Job?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of successful candidates who mastered their interviews with P³
            </p>
            <Button
              size="lg"
              className="bg-white text-purple-700 hover:bg-gray-100 px-12 py-6 text-lg font-bold shadow-2xl"
              onClick={() => window.location.href = '/auth'}
            >
              Start Free - Get 50 Credits
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-6 h-6 text-purple-400" />
                <span className="font-bold text-lg">P³ Academy</span>
              </div>
              <p className="text-gray-400 text-sm">Master interviews with AI-powered coaching</p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>How It Works</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Terms of Service</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>About</li>
                <li>Privacy Policy</li>
                <li>Blog</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            © 2025 P³ Interview Academy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
