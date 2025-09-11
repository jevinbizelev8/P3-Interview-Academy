import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeaLionLogo } from "@/components/ui/sealion-logo";
import { BookOpen, Target, Award, ArrowRight, Users, Globe, Zap, Star, CheckCircle, LogIn, UserPlus, Shield, TrendingUp, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import AuthenticatedLanding from "@/components/AuthenticatedLanding";
import AuthModal from "@/components/AuthModal";
import MainNav from "@/components/navigation/main-nav";
import professionalInterviewImage from "@assets/generated_images/Professional_interview_scene_0e52b9e3.png";
import aiCoachingImage from "@assets/generated_images/AI_coaching_dashboard_732a8dd4.png";
import careerSuccessImage from "@assets/generated_images/Career_success_celebration_559e261d.png";

const FEATURES = [
  {
    icon: Zap,
    title: "AI-Powered Coaching",
    description: "Dynamic question generation powered by SeaLion AI, tailored to your specific job role and company"
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description: "Practice in 10 Southeast Asian languages with culturally appropriate responses"
  },
  {
    icon: Target,
    title: "STAR Method Evaluation",
    description: "Comprehensive feedback using Situation, Task, Action, Result framework"
  },
  {
    icon: Users,
    title: "Real Interview Scenarios",
    description: "From phone screening to executive interviews across multiple industries"
  }
];

const MODULES = [
  {
    id: "prepare",
    icon: BookOpen,
    title: "Prepare",
    description: "Build your foundation with comprehensive interview preparation resources",
    features: ["Interview fundamentals", "Industry insights", "Common question patterns", "Best practices"],
    color: "bg-blue-500",
    textColor: "text-blue-500",
    status: "Available"
  },
  {
    id: "practice",
    icon: Target,
    title: "Practice",
    description: "Simulate real interviews with AI-powered coaching and instant feedback",
    features: ["Dynamic scenarios", "Multi-language support", "Real-time feedback", "Performance tracking"],
    color: "bg-green-500",
    textColor: "text-green-500",
    status: "Available Now"
  },
  {
    id: "perform",
    icon: Award,
    title: "Perform",
    description: "Master advanced techniques and achieve interview excellence",
    features: ["Advanced strategies", "Executive presence", "Negotiation skills", "Career planning"],
    color: "bg-purple-500",
    textColor: "text-purple-500",
    status: "Available"
  }
];

const TARGET_AUDIENCES = [
  {
    title: "Fresh Graduates",
    description: "Starting your career journey",
    benefits: ["Build confidence for first job interviews", "Learn professional interview etiquette", "Practice common entry-level questions", "Develop the STAR method for storytelling"],
    icon: "🎓",
    audience: "Recent university graduates entering the job market"
  },
  {
    title: "Career Switchers", 
    description: "Transitioning to new industries",
    benefits: ["Practice explaining career transitions", "Learn industry-specific terminology", "Address skill gaps confidently", "Prepare for career change questions"],
    icon: "🔄",
    audience: "Mid-career professionals exploring new opportunities"
  },
  {
    title: "Southeast Asian Professionals",
    description: "Practicing in your native language",
    benefits: ["Interview preparation in 10 local languages", "Culturally relevant business contexts", "Regional company-specific scenarios", "Local market insights and expectations"],
    icon: "🌏",
    audience: "Professionals across Malaysia, Singapore, Thailand, Indonesia, and more"
  }
];

export default function Landing() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Always show login/signup landing page first
  // Users will access authenticated features through protected routes
  // This ensures the landing page always prompts for authentication

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P³</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Interview Academy</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#modules" className="text-gray-600 hover:text-gray-900 transition-colors">Modules</a>
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Who Uses P³</a>
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-9 w-20 rounded"></div>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setShowAuthModal(true)}>
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                  <Button onClick={() => setShowAuthModal(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Get Started
                  </Button>
                  {isAuthenticated && (
                    <Link href="/dashboard">
                      <Button variant="secondary">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        My Dashboard
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
              <Shield className="w-4 h-4 mr-2" />
              Secure • Personal • Progress Tracking
            </Badge>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Master Your Next
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Interview</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Transform your interview skills with personalized AI-powered coaching, comprehensive progress tracking, 
              and detailed performance analytics using the proven P³ framework: Prepare, Practice, Perform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-3" onClick={() => setShowAuthModal(true)}>
                <UserPlus className="mr-2 w-5 h-5" />
                Create Free Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-3" onClick={() => setShowAuthModal(true)}>
                <LogIn className="mr-2 w-5 h-5" />
                Login to Continue
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              <Shield className="inline w-4 h-4 mr-1" />
              Secure login • Personal progress tracking • 10 Southeast Asian languages
            </p>
          </div>
        </div>
      </section>

      {/* Visual Showcase Section */}
      <section className="py-16 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src={professionalInterviewImage} 
                alt="Professional interview scene with diverse professionals" 
                className="rounded-lg shadow-2xl w-full"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Experience Real Interview Scenarios
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Practice with AI-powered simulations that mirror real-world interview experiences. 
                Our platform creates dynamic scenarios tailored to your specific role and company.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Realistic interview environments</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Industry-specific question sets</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Multi-stage interview preparation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose P³ Interview Academy?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform combines cutting-edge AI technology with proven interview methodologies 
              to deliver personalized coaching that adapts to your needs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Technology Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                AI-Powered Coaching Technology
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Experience the future of interview preparation with our advanced SeaLion AI technology. 
                Get personalized coaching that adapts to your learning style and career goals.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Zap className="w-5 h-5 text-blue-500 mr-3" />
                  <span className="text-gray-700">Real-time response analysis</span>
                </div>
                <div className="flex items-center">
                  <Globe className="w-5 h-5 text-purple-500 mr-3" />
                  <span className="text-gray-700">10 Southeast Asian languages</span>
                </div>
                <div className="flex items-center">
                  <Target className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">STAR method evaluation</span>
                </div>
              </div>
            </div>
            <div>
              <img 
                src={aiCoachingImage} 
                alt="AI-powered coaching dashboard interface" 
                className="rounded-lg shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">The P³ Learning Framework</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A comprehensive three-stage approach designed to take you from interview anxiety to interview excellence.
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {MODULES.map((module, index) => (
              <Card key={module.id} className="relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${module.color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
                      <module.icon className={`w-6 h-6 ${module.textColor}`} />
                    </div>
                    <Badge 
                      variant={module.status === "Available Now" ? "default" : "secondary"}
                      className={module.status === "Available Now" ? "bg-green-100 text-green-800" : ""}
                    >
                      {module.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">{module.title}</CardTitle>
                  <CardDescription className="text-gray-600">{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {module.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {module.id === "practice" ? (
                    <Link href="/practice">
                      <Button className="w-full group-hover:scale-105 transition-transform">
                        Start Practicing
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  ) : module.id === "prepare" ? (
                    <Link href="/prepare">
                      <Button variant="outline" className="w-full group-hover:scale-105 transition-transform bg-[#1e9df1] text-[#ffffff]">
                        View Module
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/${module.id}`}>
                      <Button variant="outline" className="w-full group-hover:scale-105 transition-transform bg-[#1e9df1] text-[#ffffff]">
                        View Module
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audiences Section */}
      <section id="testimonials" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Who Benefits from P³ Interview Academy?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Designed for professionals at every career stage who want to master their interview skills and land their dream jobs.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {TARGET_AUDIENCES.map((audience, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-3">{audience.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{audience.title}</h3>
                    <p className="text-sm text-gray-600 font-medium">{audience.description}</p>
                  </div>
                  <div className="space-y-3">
                    {audience.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 italic">{audience.audience}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Visual */}
      <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Join Thousands of Success Stories
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Our graduates have landed positions at top companies across Southeast Asia. 
                Transform your career with confidence through proven interview preparation.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 mr-3" />
                  <span className="text-gray-700">95% success rate for users</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-blue-500 mr-3" />
                  <span className="text-gray-700">10,000+ interviews practiced</span>
                </div>
                <div className="flex items-center">
                  <Award className="w-5 h-5 text-purple-500 mr-3" />
                  <span className="text-gray-700">Top companies hiring our graduates</span>
                </div>
              </div>
            </div>
            <div>
              <img 
                src={careerSuccessImage} 
                alt="Career success celebration with diverse professionals" 
                className="rounded-lg shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Ace Your Next Interview?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Start practicing today with AI-powered coaching and multi-language support.
          </p>
          <Link href="/practice">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Begin Your Journey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P³</span>
                </div>
                <span className="text-xl font-bold">Interview Academy</span>
              </div>
              <p className="text-gray-400 mb-4">
                Empowering professionals across Southeast Asia with AI-powered interview preparation 
                and multi-language support.
              </p>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-sm text-gray-500">Powered by</span>
                <a 
                  href="https://sea-lion.ai/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  <SeaLionLogo size={16} />
                  <span>SeaLion AI</span>
                </a>
              </div>
              <div className="flex space-x-4">
                <Badge variant="outline" className="text-gray-400 border-gray-600">10 Languages</Badge>
                <Badge variant="outline" className="text-gray-400 border-gray-600">AI-Powered</Badge>
                <Badge variant="outline" className="text-gray-400 border-gray-600">STAR Method</Badge>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/prepare" className="hover:text-white transition-colors">Prepare Module</Link></li>
                <li><Link href="/practice" className="hover:text-white transition-colors">Practice Module</Link></li>
                <li><Link href="/perform" className="hover:text-white transition-colors">Perform Module</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 P³ Interview Academy. All rights reserved.</p>
            <p className="text-sm mt-2 flex items-center justify-center space-x-2">
              <span>AI capabilities powered by</span>
              <a 
                href="https://sea-lion.ai/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <SeaLionLogo size={14} />
                <span>SeaLion AI</span>
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
}