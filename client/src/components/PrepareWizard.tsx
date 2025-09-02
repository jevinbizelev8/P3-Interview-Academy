import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Calendar,
  Building2,
  User,
  Target,
  Globe,
  Star,
  Sparkles,
  Zap,
  BookOpen,
  Trophy,
  Lightbulb
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import LanguageSelector from "@/components/LanguageSelector";

interface PrepareWizardProps {
  onComplete?: (sessionId: string) => void;
}

interface QuestionPreview {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  expectedAnswerTime: number;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  component: React.ComponentType<any>;
}

export default function PrepareWizard({ onComplete }: PrepareWizardProps) {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    jobPosition: '',
    companyName: '',
    interviewStage: '',
    targetDate: '',
    preferredLanguage: 'en',
    questionDifficulty: 'mixed' as 'beginner' | 'intermediate' | 'advanced' | 'mixed',
    questionCategories: [] as string[],
    questionsPerSession: 15,
    dailyTimeCommitment: 60,
    focusAreas: [] as string[],
    notes: ''
  });

  const steps: WizardStep[] = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Tell us about your interview opportunity',
      icon: User,
      component: BasicInfoStep
    },
    {
      id: 'interview-details',
      title: 'Interview Details',
      description: 'Specify the interview stage and timeline',
      icon: Target,
      component: InterviewDetailsStep
    },
    {
      id: 'language-preferences',
      title: 'Language Preferences',
      description: 'Choose your preferred interview language',
      icon: Globe,
      component: LanguagePreferencesStep
    },
    {
      id: 'question-preferences',
      title: 'Question Preferences',
      description: 'Customize your question settings',
      icon: BookOpen,
      component: QuestionPreferencesStep
    },
    {
      id: 'focus-areas',
      title: 'Focus Areas',
      description: 'Choose what to emphasize in your preparation',
      icon: Star,
      component: FocusAreasStep
    },
    {
      id: 'review',
      title: 'Review & Launch',
      description: 'Confirm your setup and start preparing',
      icon: Trophy,
      component: ReviewStep
    }
  ];

  const createPreparationSessionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/prepare/sessions', data);
      return response.json();
    },
    onSuccess: (session) => {
      toast({
        title: "Preparation Session Created!",
        description: "Your personalized preparation journey is ready to begin."
      });
      
      if (onComplete) {
        onComplete(session.id);
      } else {
        setLocation(`/prepare/dashboard?sessionId=${session.id}`);
      }
    },
    onError: () => {
      toast({
        title: "Setup Failed",
        description: "Failed to create your preparation session. Please try again.",
        variant: "destructive"
      });
    }
  });

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData.component;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const sessionData = {
      jobPosition: formData.jobPosition,
      companyName: formData.companyName || null,
      interviewStage: formData.interviewStage,
      targetInterviewDate: formData.targetDate ? new Date(formData.targetDate) : null,
      preferredLanguage: formData.preferredLanguage,
      status: 'active',
      overallProgress: 0
    };

    createPreparationSessionMutation.mutate(sessionData);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return formData.jobPosition.trim().length > 0;
      case 1: // Interview Details
        return formData.interviewStage.length > 0;
      case 2: // Language Preferences
        return formData.preferredLanguage.length > 0;
      case 3: // Question Preferences
        return formData.questionsPerSession >= 10 && formData.questionsPerSession <= 25;
      case 4: // Focus Areas
        return formData.focusAreas.length > 0;
      case 5: // Review
        return true;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Preparation Wizard
        </h1>
        <p className="text-lg text-gray-600">
          Let's create your personalized interview preparation experience
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-3 mb-4" />
        
        {/* Step Indicators */}
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  isCompleted ? 'bg-green-500 text-white' :
                  isActive ? 'bg-blue-500 text-white' :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-xs text-center max-w-20 leading-tight ${
                  isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <currentStepData.icon className="w-6 h-6 mr-3 text-blue-600" />
            {currentStepData.title}
          </CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <StepComponent 
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex space-x-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {currentStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!isStepValid()}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={!isStepValid() || createPreparationSessionMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {createPreparationSessionMutation.isPending ? (
              "Creating..."
            ) : (
              <>
                Launch Preparation
                <Zap className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// Step Components
function BasicInfoStep({ formData, setFormData }: { formData: any; setFormData: React.Dispatch<React.SetStateAction<any>> }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="jobPosition">Position *</Label>
          <Input
            id="jobPosition"
            placeholder="e.g., Senior Software Engineer"
            value={formData.jobPosition}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, jobPosition: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyName">Company</Label>
          <Input
            id="companyName"
            placeholder="e.g., Google (optional)"
            value={formData.companyName}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, companyName: e.target.value }))}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          placeholder="Any specific requirements, concerns, or goals for your preparation?"
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, notes: e.target.value }))}
        />
      </div>
    </div>
  );
}

function InterviewDetailsStep({ formData, setFormData }: { formData: any; setFormData: React.Dispatch<React.SetStateAction<any>> }) {
  const interviewStages = [
    { value: 'phone-screening', label: 'Phone/Initial Screening' },
    { value: 'functional-team', label: 'Functional/Team Interview' },
    { value: 'hiring-manager', label: 'Hiring Manager Interview' },
    { value: 'subject-matter-expertise', label: 'Subject-Matter Expertise' },
    { value: 'executive-final', label: 'Executive/Final Round' }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="interviewStage">Interview Stage *</Label>
        <Select
          value={formData.interviewStage}
          onValueChange={(value) => setFormData((prev: any) => ({ ...prev, interviewStage: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select interview stage" />
          </SelectTrigger>
          <SelectContent>
            {interviewStages.map((stage) => (
              <SelectItem key={stage.value} value={stage.value}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetDate">Target Interview Date</Label>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <Input
            id="targetDate"
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, targetDate: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dailyTime">Daily Time Commitment (minutes)</Label>
        <Select
          value={formData.dailyTimeCommitment.toString()}
          onValueChange={(value) => setFormData((prev: any) => ({ ...prev, dailyTimeCommitment: parseInt(value) }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 minutes</SelectItem>
            <SelectItem value="60">1 hour</SelectItem>
            <SelectItem value="90">1.5 hours</SelectItem>
            <SelectItem value="120">2 hours</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function LanguagePreferencesStep({ formData, setFormData }: { formData: any; setFormData: React.Dispatch<React.SetStateAction<any>> }) {
  const [questionPreview, setQuestionPreview] = useState<QuestionPreview | null>(null);
  
  // Fetch sample question when language changes
  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const response = await apiRequest('GET', `/api/prepare/questions/stage/phone-screening?count=1&language=${formData.preferredLanguage}`);
        const result = await response.json();
        if (result.success && result.data.questions.length > 0) {
          setQuestionPreview(result.data.questions[0]);
        }
      } catch (error) {
        console.error('Error fetching question preview:', error);
      }
    };

    if (formData.preferredLanguage !== 'en') {
      fetchPreview();
    }
  }, [formData.preferredLanguage]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Preferred Interview Language *</Label>
        <LanguageSelector
          value={formData.preferredLanguage}
          onValueChange={(value: string) => setFormData((prev: any) => ({ ...prev, preferredLanguage: value }))}
        />
        <p className="text-sm text-gray-600">
          Questions and feedback will be provided in both English and your selected language
        </p>
      </div>

      {/* Language Preview */}
      {questionPreview && formData.preferredLanguage !== 'en' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h4 className="font-semibold text-emerald-900 mb-3">✨ Sample Question Preview</h4>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 border border-emerald-200">
              <p className="text-sm font-medium text-gray-600 mb-1">English</p>
              <p className="text-gray-900">{questionPreview.question}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-emerald-200">
              <p className="text-sm font-medium text-gray-600 mb-1">
                {formData.preferredLanguage.toUpperCase()}
              </p>
              <p className="text-gray-500 italic">Translation will be provided during the session</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">🌏 Multilingual Interview Features</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Questions displayed in both English and your preferred language</li>
          <li>• Cultural context and tips for Southeast Asian interviews</li>
          <li>• AI feedback considers language-specific nuances</li>
          <li>• Professional translations by SeaLion AI</li>
          <li>• Practice with 9 supported ASEAN languages</li>
        </ul>
      </div>
    </div>
  );
}

function QuestionPreferencesStep({ formData, setFormData }: { formData: any; setFormData: React.Dispatch<React.SetStateAction<any>> }) {
  const [availableQuestions, setAvailableQuestions] = useState<any>(null);

  useEffect(() => {
    const fetchQuestionStats = async () => {
      try {
        const response = await apiRequest('GET', '/api/prepare/questions/statistics');
        const result = await response.json();
        if (result.success) {
          setAvailableQuestions(result.data);
        }
      } catch (error) {
        console.error('Error fetching question statistics:', error);
      }
    };

    fetchQuestionStats();
  }, []);

  const handleCategoryToggle = (category: string) => {
    const current = formData.questionCategories || [];
    const updated = current.includes(category)
      ? current.filter((c: string) => c !== category)
      : [...current, category];
    setFormData((prev: any) => ({ ...prev, questionCategories: updated }));
  };

  const categories = [
    { id: 'behavioral', name: 'Behavioral', description: 'Past experiences and situations', icon: Target },
    { id: 'situational', name: 'Situational', description: 'Hypothetical scenarios', icon: Lightbulb },
    { id: 'technical', name: 'Technical', description: 'Job-specific expertise', icon: BookOpen },
    { id: 'company-specific', name: 'Company-Specific', description: 'About the company and role', icon: Building2 },
    { id: 'general', name: 'General', description: 'Standard interview questions', icon: Globe }
  ];

  return (
    <div className="space-y-6">
      {/* Question Count */}
      <div className="space-y-3">
        <Label htmlFor="questionsPerSession">Number of Questions per Session *</Label>
        <Select
          value={formData.questionsPerSession.toString()}
          onValueChange={(value: string) => setFormData((prev: any) => ({ ...prev, questionsPerSession: parseInt(value) }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 questions (Quick session)</SelectItem>
            <SelectItem value="15">15 questions (Standard)</SelectItem>
            <SelectItem value="20">20 questions (Extended)</SelectItem>
            <SelectItem value="25">25 questions (Comprehensive)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-600">
          Recommended: 15 questions for a balanced preparation session
        </p>
      </div>

      {/* Question Difficulty */}
      <div className="space-y-3">
        <Label>Question Difficulty</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: 'beginner', label: 'Beginner', desc: 'Entry-level questions', color: 'green' },
            { value: 'intermediate', label: 'Intermediate', desc: 'Mid-level questions', color: 'yellow' },
            { value: 'advanced', label: 'Advanced', desc: 'Senior-level questions', color: 'red' },
            { value: 'mixed', label: 'Mixed', desc: 'All difficulty levels', color: 'blue' }
          ].map((option) => (
            <Card
              key={option.value}
              className={`cursor-pointer transition-all hover:shadow-md ${
                formData.questionDifficulty === option.value ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => setFormData((prev: any) => ({ ...prev, questionDifficulty: option.value }))}
            >
              <CardContent className="p-3 text-center">
                <div className={`w-8 h-8 rounded-full mx-auto mb-2 ${
                  option.color === 'green' ? 'bg-green-100' :
                  option.color === 'yellow' ? 'bg-yellow-100' :
                  option.color === 'red' ? 'bg-red-100' : 'bg-blue-100'
                }`} />
                <p className="font-semibold text-sm">{option.label}</p>
                <p className="text-xs text-gray-600">{option.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Question Categories */}
      <div className="space-y-3">
        <Label>Question Categories (Optional)</Label>
        <p className="text-sm text-gray-600 mb-3">
          Select specific types of questions to focus on, or leave empty for all categories
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = formData.questionCategories.includes(category.id);
            
            return (
              <Card
                key={category.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => handleCategoryToggle(category.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Question Bank Statistics */}
      {availableQuestions && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">📊 Available Questions</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{availableQuestions.totalQuestions}</p>
              <p className="text-gray-600">Total Questions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {Object.keys(availableQuestions.questionsByStage).length}
              </p>
              <p className="text-gray-600">Interview Stages</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {Object.keys(availableQuestions.questionsByCategory).length}
              </p>
              <p className="text-gray-600">Categories</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function FocusAreasStep({ formData, setFormData }: { formData: any; setFormData: React.Dispatch<React.SetStateAction<any>> }) {
  const focusOptions = [
    { id: 'star-method', label: 'STAR Method Mastery', description: 'Perfect your behavioral responses', icon: Star },
    { id: 'company-research', label: 'Company Research', description: 'Deep dive into company culture and values', icon: Building2 },
    { id: 'technical-skills', label: 'Technical Skills', description: 'Prepare for technical questions', icon: Zap },
    { id: 'communication', label: 'Communication Skills', description: 'Improve clarity and confidence', icon: Globe },
    { id: 'leadership', label: 'Leadership Examples', description: 'Showcase leadership experiences', icon: Trophy },
    { id: 'problem-solving', label: 'Problem Solving', description: 'Demonstrate analytical thinking', icon: BookOpen }
  ];

  const toggleFocusArea = (areaId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(areaId)
        ? prev.focusAreas.filter((id: any) => id !== areaId)
        : [...prev.focusAreas, areaId]
    }));
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-600 mb-4">
        Select the areas you'd like to focus on during your preparation. Choose at least one.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {focusOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = formData.focusAreas.includes(option.id);
          
          return (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => toggleFocusArea(option.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{option.label}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ReviewStep({ formData }: any) {
  const getLanguageName = (code: string) => {
    const languageMap: Record<string, string> = {
      'en': 'English',
      'ms': 'Bahasa Malaysia',
      'id': 'Bahasa Indonesia',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'tl': 'Filipino',
      'my': 'Myanmar',
      'km': 'Khmer',
      'zh-sg': 'Chinese (Singapore)'
    };
    return languageMap[code] || code.toUpperCase();
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels = {
      'beginner': 'Beginner Level',
      'intermediate': 'Intermediate Level',
      'advanced': 'Advanced Level',
      'mixed': 'Mixed Difficulty'
    };
    return labels[difficulty as keyof typeof labels] || difficulty;
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="font-semibold text-green-900 mb-4 flex items-center">
          <Trophy className="w-5 h-5 mr-2" />
          Your Enhanced Preparation Setup
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Interview Details</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><strong>Position:</strong> {formData.jobPosition}</li>
              {formData.companyName && <li><strong>Company:</strong> {formData.companyName}</li>}
              <li><strong>Stage:</strong> {formData.interviewStage.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</li>
              {formData.targetDate && <li><strong>Target Date:</strong> {new Date(formData.targetDate).toLocaleDateString()}</li>}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Language & Questions</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><strong>Language:</strong> {getLanguageName(formData.preferredLanguage)}</li>
              <li><strong>Questions:</strong> {formData.questionsPerSession} per session</li>
              <li><strong>Difficulty:</strong> {getDifficultyLabel(formData.questionDifficulty)}</li>
              {formData.questionCategories.length > 0 && (
                <li><strong>Categories:</strong> {formData.questionCategories.length} selected</li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Learning Preferences</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><strong>Daily Time:</strong> {formData.dailyTimeCommitment} minutes</li>
              <li><strong>Focus Areas:</strong> {formData.focusAreas.length} selected</li>
              {formData.notes && <li><strong>Notes:</strong> Added</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Enhanced Features Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">✨ Enhanced Features Enabled</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
              <span><strong>77+ Professional Questions</strong> across all interview stages</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
              <span><strong>Multilingual Support</strong> with cultural context</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
              <span><strong>Question Categorization</strong> and difficulty levels</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
              <span><strong>STAR Method Integration</strong> with expert guidance</span>
            </li>
          </ul>
          
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
              <span><strong>Dynamic Question Generation</strong> using SeaLion AI</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
              <span><strong>Cultural Tips & Context</strong> for ASEAN interviews</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
              <span><strong>Enhanced Progress Tracking</strong> with detailed analytics</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
              <span><strong>Personalized Study Plans</strong> based on your goals</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
        <h3 className="font-semibold text-emerald-900 mb-3">🚀 What happens next?</h3>
        <ul className="text-sm text-emerald-800 space-y-2">
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-emerald-600" />
            Your enhanced preparation session with {formData.questionsPerSession} questions will be created
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-emerald-600" />
            Questions will be displayed in both English and {getLanguageName(formData.preferredLanguage)}
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-emerald-600" />
            Cultural context and tips will be provided for each question
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-emerald-600" />
            Progress tracking will monitor your preparation journey with detailed insights
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-emerald-600" />
            AI-powered feedback will help you improve using the STAR method
          </li>
        </ul>
      </div>
    </div>
  );
}