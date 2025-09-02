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
  Trophy
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import LanguageSelector from "@/components/LanguageSelector";

interface PrepareWizardProps {
  onComplete?: (sessionId: string) => void;
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
      id: 'preferences',
      title: 'Preparation Preferences',
      description: 'Customize your learning experience',
      icon: Globe,
      component: PreferencesStep
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
      case 2: // Preferences
        return formData.preferredLanguage.length > 0;
      case 3: // Focus Areas
        return formData.focusAreas.length > 0;
      case 4: // Review
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
function BasicInfoStep({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="jobPosition">Position *</Label>
          <Input
            id="jobPosition"
            placeholder="e.g., Senior Software Engineer"
            value={formData.jobPosition}
            onChange={(e) => setFormData(prev => ({ ...prev, jobPosition: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyName">Company</Label>
          <Input
            id="companyName"
            placeholder="e.g., Google (optional)"
            value={formData.companyName}
            onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
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
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
        />
      </div>
    </div>
  );
}

function InterviewDetailsStep({ formData, setFormData }: any) {
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
          onValueChange={(value) => setFormData(prev => ({ ...prev, interviewStage: value }))}
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
            onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dailyTime">Daily Time Commitment (minutes)</Label>
        <Select
          value={formData.dailyTimeCommitment.toString()}
          onValueChange={(value) => setFormData(prev => ({ ...prev, dailyTimeCommitment: parseInt(value) }))}
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

function PreferencesStep({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Preferred Language *</Label>
        <LanguageSelector
          value={formData.preferredLanguage}
          onValueChange={(value) => setFormData(prev => ({ ...prev, preferredLanguage: value }))}
        />
        <p className="text-sm text-gray-600">
          AI-generated content and feedback will be provided in both English and your selected language
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">✨ AI-Powered Features</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Personalized study plans generated by AI</li>
          <li>• Dynamic company research with cultural insights</li>
          <li>• STAR method training with intelligent feedback</li>
          <li>• Multi-language support for 9 Southeast Asian languages</li>
          <li>• Adaptive resource recommendations</li>
        </ul>
      </div>
    </div>
  );
}

function FocusAreasStep({ formData, setFormData }: any) {
  const focusOptions = [
    { id: 'star-method', label: 'STAR Method Mastery', description: 'Perfect your behavioral responses', icon: Star },
    { id: 'company-research', label: 'Company Research', description: 'Deep dive into company culture and values', icon: Building2 },
    { id: 'technical-skills', label: 'Technical Skills', description: 'Prepare for technical questions', icon: Zap },
    { id: 'communication', label: 'Communication Skills', description: 'Improve clarity and confidence', icon: Globe },
    { id: 'leadership', label: 'Leadership Examples', description: 'Showcase leadership experiences', icon: Trophy },
    { id: 'problem-solving', label: 'Problem Solving', description: 'Demonstrate analytical thinking', icon: BookOpen }
  ];

  const toggleFocusArea = (areaId: string) => {
    setFormData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(areaId)
        ? prev.focusAreas.filter(id => id !== areaId)
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
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="font-semibold text-green-900 mb-4 flex items-center">
          <Trophy className="w-5 h-5 mr-2" />
          Your Preparation Setup
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Interview Details</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><strong>Position:</strong> {formData.jobPosition}</li>
              {formData.companyName && <li><strong>Company:</strong> {formData.companyName}</li>}
              <li><strong>Stage:</strong> {formData.interviewStage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>
              {formData.targetDate && <li><strong>Target Date:</strong> {new Date(formData.targetDate).toLocaleDateString()}</li>}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Preferences</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><strong>Language:</strong> {formData.preferredLanguage === 'en' ? 'English' : formData.preferredLanguage}</li>
              <li><strong>Daily Time:</strong> {formData.dailyTimeCommitment} minutes</li>
              <li><strong>Focus Areas:</strong> {formData.focusAreas.length} selected</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">🚀 What happens next?</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
            Your personalized preparation session will be created
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
            AI will generate a custom study plan based on your timeline
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
            Company research will be prepared (if company specified)
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
            Interactive training tools will be available instantly
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
            Progress tracking will monitor your preparation journey
          </li>
        </ul>
      </div>
    </div>
  );
}