import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Phone, Users, TrendingUp, Code, Building } from "lucide-react";
import type { InterviewType, JobDescription } from "@shared/schema";
import JobDescriptionUpload from "@/components/JobDescriptionUpload";
import TechnicalCategorySelector from "@/components/TechnicalCategorySelector";
import LanguageSelector from "@/components/LanguageSelector";

const interviewTypes = [
  { value: 'phone-screening' as InterviewType, label: 'Stage 1: Phone/Initial Screening (HR)', icon: Phone, description: 'Basic qualifications, culture fit, salary expectations' },
  { value: 'functional-team' as InterviewType, label: 'Stage 2: Functional/Team Interview', icon: Users, description: 'Team dynamics, collaboration, role-specific skills' },
  { value: 'hiring-manager' as InterviewType, label: 'Stage 3: Hiring Manager Interview', icon: TrendingUp, description: 'Leadership assessment, strategic thinking, team fit' },
  { value: 'subject-matter-expertise' as InterviewType, label: 'Stage 4: Subject-Matter Expertise Interview', icon: Code, description: 'Deep technical skills, problem solving, expertise' },
  { value: 'executive-final' as InterviewType, label: 'Stage 5: Executive/Final Round', icon: Building, description: 'Vision alignment, cultural impact, final decision' },
];

// Helper function to suggest appropriate interview stage based on job role
function getSuggestedInterviewStage(position: string): InterviewType {
  const positionLower = position.toLowerCase();
  
  // IMPORTANT: Business Development roles should NEVER get technical questions
  // These are business-focused roles, even in tech/pharma companies
  const businessDevelopmentKeywords = ['business development', 'bd', 'biz dev', 'business dev', 'commercial', 'sales', 'partnerships', 'alliances'];
  if (businessDevelopmentKeywords.some(keyword => positionLower.includes(keyword))) {
    return 'hiring-manager'; // Always use hiring manager for business roles
  }
  
  // Pharmaceutical industry roles (non-technical) should use hiring-manager
  const pharmaBusinessKeywords = ['regulatory affairs', 'clinical research', 'medical affairs', 'market access', 'pharmacovigilance', 'drug development', 'clinical operations'];
  if (pharmaBusinessKeywords.some(keyword => positionLower.includes(keyword))) {
    return 'hiring-manager';
  }
  
  // Pure technical roles (software/IT) should use subject-matter-expertise
  const pureTechnicalKeywords = ['software engineer', 'software developer', 'full stack', 'backend', 'frontend', 'devops engineer', 'system administrator', 'network engineer', 'cybersecurity', 'it specialist'];
  if (pureTechnicalKeywords.some(keyword => positionLower.includes(keyword))) {
    return 'subject-matter-expertise';
  }
  
  // Data roles can be technical
  const dataKeywords = ['data scientist', 'data engineer', 'machine learning', 'ai engineer', 'data analyst'];
  if (dataKeywords.some(keyword => positionLower.includes(keyword))) {
    return 'subject-matter-expertise';
  }
  
  // Executive/C-level roles should use executive-final for actual C-suite
  const executiveKeywords = ['ceo', 'cto', 'cfo', 'cmo', 'coo', 'chief', 'president'];
  if (executiveKeywords.some(keyword => positionLower.includes(keyword))) {
    return 'executive-final';
  }
  
  // Director-level and VP roles use hiring-manager (leadership focused, not technical)
  const leadershipKeywords = ['director', 'vp', 'vice president', 'head of', 'team lead', 'manager'];
  if (leadershipKeywords.some(keyword => positionLower.includes(keyword))) {
    return 'hiring-manager';
  }
  
  // HR/People roles should use functional-team
  const hrKeywords = ['hr', 'human resources', 'people', 'talent', 'recruiting', 'recruiter'];
  if (hrKeywords.some(keyword => positionLower.includes(keyword))) {
    return 'functional-team';
  }
  
  // Business/commercial roles should use hiring-manager
  const businessKeywords = ['marketing', 'product manager', 'strategy', 'consultant', 'analyst', 'coordinator', 'specialist'];
  if (businessKeywords.some(keyword => positionLower.includes(keyword))) {
    return 'hiring-manager';
  }
  
  // Default to hiring-manager for most professional roles (safer than technical)
  return 'hiring-manager';
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState<InterviewType | ''>('');
  const [position, setPosition] = useState('');
  const [company, setCompany] = useState('');
  const [selectedJobDescription, setSelectedJobDescription] = useState<JobDescription | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  // Auto-suggest interview stage when position changes
  const handlePositionChange = (value: string) => {
    setPosition(value);
    if (value && !selectedType) {
      const suggested = getSuggestedInterviewStage(value);
      setSelectedType(suggested);
    }
  };

  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      // Create coaching session with new format
      const sessionPayload = {
        jobPosition: sessionData.position,
        companyName: sessionData.company || null,
        interviewStage: sessionData.interviewType,
        primaryIndustry: sessionData.industry || null,
        specializations: [],
        experienceLevel: 'intermediate' as const,
        companyContext: {
          type: 'enterprise' as const,
          businessModel: '',
          technicalStack: []
        }
      };
      
      const response = await apiRequest('POST', '/api/coaching/sessions', sessionPayload);
      if (!response.ok) {
        throw new Error('Failed to create coaching session');
      }
      const result = await response.json();
      return result.data;
    },
    onSuccess: (session) => {
      toast({
        title: "Coaching Session Created",
        description: "Your personalized AI coaching session is ready!",
      });
      // Redirect to new coaching interface
      setLocation(`/prepare/coaching/${session.id}`);
    },
    onError: (error) => {
      console.error('Session creation error:', error);
      toast({
        title: "Setup Failed",
        description: "Failed to create preparation session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStartSession = () => {
    if (!selectedType || !position || !company) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to continue.",
        variant: "destructive",
      });
      return;
    }

    // For Stage 4 (Subject-Matter Expertise), require industry selection
    if (selectedType === 'subject-matter-expertise' && !selectedIndustry) {
      toast({
        title: "Industry Required",
        description: "Please select your technical industry for Stage 4 preparation.",
        variant: "destructive",
      });
      return;
    }

    createSessionMutation.mutate({
      interviewType: selectedType,
      position,
      company,
      industry: selectedType === 'subject-matter-expertise' ? selectedIndustry : undefined,
      jobDescriptionId: selectedJobDescription?.id || null,
      language: selectedLanguage, // Include selected ASEAN language
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">


      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-100 via-purple-50 to-green-100 rounded-full opacity-30 blur-3xl"></div>
          </div>
          
          <div className="mb-6">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
              <circle cx="60" cy="60" r="58" fill="url(#gradient1)" stroke="url(#gradient2)" strokeWidth="4"/>
              <path d="M40 50L45 55L65 35M75 45L80 50L95 35" stroke="white" strokeWidth="4" fill="none"/>
              <circle cx="45" cy="75" r="3" fill="#F59E0B"/>
              <circle cx="55" cy="75" r="3" fill="#F59E0B"/>
              <circle cx="65" cy="75" r="3" fill="#F59E0B"/>
              <circle cx="75" cy="75" r="3" fill="#F59E0B"/>
              <circle cx="85" cy="75" r="3" fill="#F59E0B"/>
              <rect x="35" y="85" width="50" height="20" rx="10" fill="white" opacity="0.9"/>
              <path d="M45 95H75" stroke="#3B82F6" strokeWidth="3"/>
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6"/>
                  <stop offset="50%" stopColor="#8B5CF6"/>
                  <stop offset="100%" stopColor="#10B981"/>
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E40AF"/>
                  <stop offset="50%" stopColor="#7C3AED"/>
                  <stop offset="100%" stopColor="#059669"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent mb-6">
            AI Interview Coaching
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Get real-time AI coaching through interactive conversation. Practice interview questions with immediate guidance and receive model answers at the end of your session.
          </p>
          
          <div className="flex justify-center items-center space-x-8 mt-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Real-time AI Coaching</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Interactive Conversation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Model Answers</span>
            </div>
          </div>
        </div>

        <Card className="mb-8 shadow-lg border-2 border-gray-100 hover:border-blue-200 transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <CardTitle className="text-2xl text-gray-800 flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2L12 6L16 6L13 9L14 13L10 11L6 13L7 9L4 6L8 6L10 2Z" fill="white"/>
                </svg>
              </div>
              <span>Start AI Coaching Session</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Position and Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  placeholder="e.g., Business Development Director"
                  value={position}
                  onChange={(e) => handlePositionChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="e.g., Microsoft"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            </div>

            {/* Interview Stage Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Interview Stage</Label>
                {position && selectedType && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Recommended for {position}
                  </span>
                )}
              </div>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as InterviewType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select interview stage" />
                </SelectTrigger>
                <SelectContent>
                  {interviewTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Interview Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interviewTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.value;
                
                return (
                  <Card
                    key={type.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-primary-blue bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedType(type.value)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-primary-blue' : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            {type.label}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Technical Industry Selection for Stage 4 */}
            {selectedType === 'subject-matter-expertise' && (
              <div className="space-y-4">
                <TechnicalCategorySelector
                  onCategorySelect={setSelectedIndustry}
                  selectedCategory={selectedIndustry}
                />
              </div>
            )}

            <Button
              className="w-full py-3 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={handleStartSession}
              disabled={createSessionMutation.isPending || !selectedType || !position || !company}
            >
              {createSessionMutation.isPending ? "Starting AI Coach..." : "Start AI Coaching Session"}
            </Button>
          </CardContent>
        </Card>

        {/* Core Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <Card className="text-center hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-200 group">
            <CardContent className="p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="#FFFFFF" opacity="0.9"/>
                  <path d="M20 8v8l6 6" stroke="#3B82F6" strokeWidth="3" fill="none"/>
                  <circle cx="20" cy="20" r="2" fill="#3B82F6"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Real-time AI Coaching</h3>
              <p className="text-gray-600 leading-relaxed text-base">
                Get immediate guidance and feedback as you practice. Our AI coach provides instant suggestions to improve your responses.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-200 group">
            <CardContent className="p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="8" y="12" width="24" height="16" rx="4" fill="#FFFFFF" opacity="0.9"/>
                  <circle cx="16" cy="20" r="2" fill="#10B981"/>
                  <circle cx="24" cy="20" r="2" fill="#10B981"/>
                  <path d="M12 26c2-2 4-2 8 0s6 2 8 0" stroke="#10B981" strokeWidth="2" fill="none"/>
                  <path d="M14 8l6-4 6 4" stroke="#10B981" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Interactive Conversation</h3>
              <p className="text-gray-600 leading-relaxed text-base">
                Practice through natural conversation flow. Ask questions, get clarification, and receive personalized coaching throughout.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-200 group">
            <CardContent className="p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="8" y="5" width="24" height="30" rx="4" fill="#FFFFFF" opacity="0.95"/>
                  <path d="M12 12H28M12 18H26M12 24H22" stroke="#9333EA" strokeWidth="2.5"/>
                  <circle cx="30" cy="15" r="5" fill="#F59E0B"/>
                  <path d="M27 15L29 17L33 13" stroke="#fff" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Model Answers</h3>
              <p className="text-gray-600 leading-relaxed text-base">
                Receive comprehensive model answers at the end of your session showing you exactly how to structure perfect responses.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer Section */}
        <footer className="mt-24 pt-12 border-t border-gray-200">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P³</span>
              </div>
              <span className="text-lg font-semibold text-gray-700">Interview Academy</span>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Empowering professionals with AI-driven interview preparation across all career stages
            </p>
            <div className="flex justify-center space-x-6 text-xs text-gray-400">
              <span>5 Interview Stages</span>
              <span>•</span>
              <span>75+ Expert Questions</span>
              <span>•</span>
              <span>AI-Powered Feedback</span>
              <span>•</span>
              <span>5-Star Evaluation</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
