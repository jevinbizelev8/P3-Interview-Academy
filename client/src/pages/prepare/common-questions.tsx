import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNavigation } from "@/components/prepare/breadcrumb-navigation";
import { FooterNavigation } from "@/components/prepare/footer-navigation";
import MainNav from '@/components/navigation/main-nav';
import { 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Star,
  Users,
  Briefcase,
  Target,
  MessageCircle
} from "lucide-react";

interface Question {
  id: string;
  category: string;
  question: string;
  tips: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  icon: any;
}

const questionCategories = [
  { id: "behavioral", name: "Behavioral", icon: Users, color: "bg-blue-100 text-blue-800" },
  { id: "situational", name: "Situational", icon: Target, color: "bg-purple-100 text-purple-800" },
  { id: "experience", name: "Experience", icon: Briefcase, color: "bg-green-100 text-green-800" },
  { id: "motivation", name: "Motivation", icon: Star, color: "bg-orange-100 text-orange-800" },
  { id: "communication", name: "Communication", icon: MessageCircle, color: "bg-pink-100 text-pink-800" }
];

const questions: Question[] = [
  {
    id: "1",
    category: "behavioral",
    question: "Tell me about a time you had to work with a difficult team member.",
    tips: [
      "Focus on your professional approach to resolving conflict",
      "Highlight your communication and empathy skills",
      "Show how you maintained team productivity",
      "End with a positive outcome or learning"
    ],
    difficulty: "Medium",
    icon: Users
  },
  {
    id: "2",
    category: "behavioral",
    question: "Describe a situation where you had to meet a tight deadline.",
    tips: [
      "Demonstrate your time management and prioritization skills",
      "Show how you handled pressure professionally",
      "Include specific steps you took to ensure success",
      "Mention any tools or methods you used"
    ],
    difficulty: "Easy",
    icon: Users
  },
  {
    id: "3",
    category: "situational",
    question: "How would you handle a situation where you disagreed with your manager's decision?",
    tips: [
      "Show respect for hierarchy while expressing your perspective",
      "Demonstrate professional communication skills",
      "Focus on finding common ground and solutions",
      "Show willingness to support final decisions"
    ],
    difficulty: "Hard",
    icon: Target
  },
  {
    id: "4",
    category: "experience",
    question: "What's your greatest professional achievement?",
    tips: [
      "Choose an achievement relevant to the role you're applying for",
      "Use specific metrics and measurable outcomes",
      "Show the impact of your contribution on the organization",
      "Explain the skills and qualities that led to success"
    ],
    difficulty: "Medium",
    icon: Briefcase
  },
  {
    id: "5",
    category: "motivation",
    question: "Why do you want to work for our company?",
    tips: [
      "Research the company's mission, values, and recent achievements",
      "Connect your personal values with the company's culture",
      "Mention specific aspects that attract you to the role",
      "Show enthusiasm for contributing to their goals"
    ],
    difficulty: "Easy",
    icon: Star
  },
  {
    id: "6",
    category: "communication",
    question: "How do you handle constructive feedback?",
    tips: [
      "Show openness to learning and growth",
      "Provide an example of acting on feedback",
      "Demonstrate emotional maturity and professionalism",
      "Explain how feedback helps you improve"
    ],
    difficulty: "Medium",
    icon: MessageCircle
  }
];

export default function CommonQuestions() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.title = "Common Questions - P³ Interview Academy";
  }, []);

  const filteredQuestions = selectedCategory === "all" 
    ? questions 
    : questions.filter(q => q.category === selectedCategory);

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Hard": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <MainNav currentModule="prepare" />
      <BreadcrumbNavigation currentPage="Common Questions" />

      {/* Header */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Common Interview Questions
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Practice with our curated collection of frequently asked interview questions 
              across different categories, complete with expert tips and strategies.
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              size="sm"
            >
              All Questions ({questions.length})
            </Button>
            {questionCategories.map((category) => {
              const count = questions.filter(q => q.category === category.id).length;
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  size="sm"
                  className="flex items-center"
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {category.name} ({count})
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Questions */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {filteredQuestions.map((question) => {
              const isExpanded = expandedQuestions.has(question.id);
              const category = questionCategories.find(c => c.id === question.category);
              
              return (
                <Card key={question.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Badge className={category?.color}>
                            {category?.name}
                          </Badge>
                          <Badge className={`ml-2 ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg leading-relaxed">
                          {question.question}
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleQuestion(question.id)}
                        className="ml-4"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Expert Tips:</h4>
                        <ul className="space-y-2">
                          {question.tips.map((tip, index) => (
                            <li key={index} className="flex items-start text-sm text-gray-600">
                              <span className="text-blue-600 mr-2 mt-1">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 pt-4 border-t flex gap-3">
                          <Link href="/practice">
                            <Button size="sm" variant="outline">
                              Practice This Question
                            </Button>
                          </Link>
                          <Button size="sm" variant="ghost">
                            View STAR Examples
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {filteredQuestions.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
              <p className="text-gray-600">Try selecting a different category.</p>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Practice?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Take your preparation to the next level with our AI-powered practice sessions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/practice">
              <Button size="lg">
                Start Practice Session
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              View More Resources
            </Button>
          </div>
        </div>
      </section>

      <FooterNavigation />
    </div>
  );
}