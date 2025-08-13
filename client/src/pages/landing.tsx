import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeaLionLogo } from "@/components/ui/sealion-logo";
import { BookOpen, Target, Award, ArrowRight, Users, Globe, Zap, Star, CheckCircle } from "lucide-react";

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

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "Software Engineer at Meta",
    content: "The AI coaching helped me land my dream job. The questions were incredibly realistic and the feedback was spot-on.",
    rating: 5
  },
  {
    name: "Ahmad Rahman",
    role: "Data Scientist at Grab",
    content: "Being able to practice in Bahasa Malaysia made such a difference. The platform understands local context perfectly.",
    rating: 5
  },
  {
    name: "Maria Santos",
    role: "Product Manager at Shopee",
    content: "The STAR method evaluation transformed how I structure my responses. Highly recommended!",
    rating: 5
  }
];

export default function Landing() {
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
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Reviews</a>
              <Link href="/prepare" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Prepare
              </Link>
              <Link href="/perform" className="text-gray-600 hover:text-purple-600 transition-colors font-medium">
                Perform
              </Link>
              <Link href="/practice">
                <Button>Start Practice</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
              Now Supporting 10 Southeast Asian Languages
            </Badge>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Master Your Next
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Interview</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Transform your interview skills with AI-powered coaching, dynamic question generation, 
              and comprehensive feedback using the proven P³ framework: Prepare, Practice, Perform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/practice">
                <Button size="lg" className="text-lg px-8 py-3">
                  Start Free Practice
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Watch Demo
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              No signup required • Instant feedback • Multi-language support
            </p>
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
                  ) : (
                    <Link href={`/${module.id}`}>
                      <Button variant="outline" className="w-full group-hover:scale-105 transition-transform">
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

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Stories</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join thousands of professionals who've transformed their interview skills with P³ Interview Academy.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                  <SeaLionLogo size={16} className="text-blue-400" />
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
                <SeaLionLogo size={14} className="text-blue-400" />
                <span>SeaLion AI</span>
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}