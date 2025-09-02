import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  Languages, 
  Loader, 
  Clock, 
  Star, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  Target,
  Lightbulb,
  Globe,
  CheckCircle,
  AlertCircle,
  Info,
  Bookmark,
  BookmarkCheck
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import type { Question } from "@shared/schema";

interface QuestionData {
  id: string;
  question: string;
  category: 'behavioral' | 'situational' | 'technical' | 'company-specific' | 'general';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  interviewStage: string;
  tags: string[];
  expectedAnswerTime: number; // minutes
  starMethodRelevant: boolean;
  culturalContext?: string;
  industrySpecific?: string[];
}

interface EnhancedQuestionInterfaceProps {
  question: QuestionData;
  currentIndex: number;
  totalQuestions: number;
  selectedLanguage?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
  sessionProgress?: number;
  timeSpent?: number;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
    case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'behavioral': return <Target className="w-4 h-4" />;
    case 'situational': return <Lightbulb className="w-4 h-4" />;
    case 'technical': return <BookOpen className="w-4 h-4" />;
    case 'company-specific': return <Globe className="w-4 h-4" />;
    default: return <Info className="w-4 h-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'behavioral': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'situational': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'technical': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'company-specific': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function EnhancedQuestionInterface({
  question,
  currentIndex,
  totalQuestions,
  selectedLanguage = 'en',
  onPrevious,
  onNext,
  onBookmark,
  isBookmarked = false,
  sessionProgress = 0,
  timeSpent = 0
}: EnhancedQuestionInterfaceProps) {
  const [translatedQuestion, setTranslatedQuestion] = useState<string>('');
  const [showCulturalHints, setShowCulturalHints] = useState(false);

  // Translation query
  const { data: translation, isLoading: isTranslating } = useQuery({
    queryKey: ['/api/translate', question.question, selectedLanguage],
    queryFn: async () => {
      if (!selectedLanguage || selectedLanguage === 'en') {
        return null;
      }
      const response = await apiRequest('POST', '/api/translate', {
        text: question.question,
        targetLanguage: selectedLanguage,
        context: {
          contentType: 'question',
          culturalContext: question.culturalContext,
          category: question.category
        }
      });
      const result = await response.json();
      return result.translatedText;
    },
    enabled: selectedLanguage !== 'en' && !!question.question,
    staleTime: 5 * 60 * 1000, // Cache translations for 5 minutes
  });

  useEffect(() => {
    if (translation) {
      setTranslatedQuestion(translation);
    } else if (selectedLanguage === 'en') {
      setTranslatedQuestion('');
    }
  }, [translation, selectedLanguage]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <div className="text-sm font-medium text-gray-900">
                Question {currentIndex} of {totalQuestions}
              </div>
              <Badge className={getDifficultyColor(question.difficulty)}>
                {question.difficulty}
              </Badge>
              <Badge className={getCategoryColor(question.category)}>
                <div className="flex items-center space-x-1">
                  {getCategoryIcon(question.category)}
                  <span>{question.category}</span>
                </div>
              </Badge>
              {question.starMethodRelevant && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  <Star className="w-3 h-3 mr-1" />
                  STAR Method
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                {question.expectedAnswerTime}min suggested
              </div>
              {timeSpent > 0 && (
                <div className="text-sm text-blue-600">
                  Spent: {formatTime(timeSpent)}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onBookmark}
                className={isBookmarked ? "text-yellow-600" : "text-gray-400"}
              >
                {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Overall Progress</span>
              <span>{Math.round(sessionProgress)}% complete</span>
            </div>
            <Progress value={sessionProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Main Question Card */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            Interview Question
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* English Question */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-blue-900">English</h3>
                  <Badge variant="outline" className="text-xs">Original</Badge>
                </div>
                <p className="text-gray-900 font-medium text-lg leading-relaxed">
                  {question.question}
                </p>
              </div>
            </div>
          </div>

          {/* Translated Question */}
          {selectedLanguage !== 'en' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Languages className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-emerald-900">Local Language</h3>
                    <Badge variant="outline" className="text-xs text-emerald-600">
                      {selectedLanguage.toUpperCase()}
                    </Badge>
                  </div>
                  {isTranslating ? (
                    <div className="flex items-center space-x-3 py-4">
                      <Loader className="w-5 h-5 animate-spin text-emerald-600" />
                      <span className="text-emerald-700">Translating to your language...</span>
                    </div>
                  ) : translatedQuestion ? (
                    <p className="text-gray-900 font-medium text-lg leading-relaxed">
                      {translatedQuestion}
                    </p>
                  ) : (
                    <div className="flex items-center space-x-2 py-4">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <span className="text-gray-600">Translation not available for this question</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Question Metadata and Hints */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Question Tags */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Focus Areas
              </h4>
              <div className="flex flex-wrap gap-2">
                {question.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag.replace('-', ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Interview Stage */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Interview Stage
              </h4>
              <Badge variant="outline" className="text-sm">
                {question.interviewStage.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </Badge>
            </div>
          </div>

          {/* Cultural Context Hints */}
          {question.culturalContext && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <button
                onClick={() => setShowCulturalHints(!showCulturalHints)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-amber-900">Cultural Context & Tips</span>
                </div>
                <ChevronRight 
                  className={`w-4 h-4 text-amber-600 transition-transform ${showCulturalHints ? 'rotate-90' : ''}`}
                />
              </button>
              
              {showCulturalHints && (
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <p className="text-amber-800 text-sm leading-relaxed">
                    💡 {question.culturalContext}
                  </p>
                  {question.starMethodRelevant && (
                    <div className="mt-3 p-3 bg-white rounded border border-amber-200">
                      <p className="text-xs font-medium text-amber-900 mb-1">STAR Method Reminder:</p>
                      <p className="text-xs text-amber-700">
                        Structure your answer: <strong>Situation</strong> → <strong>Task</strong> → <strong>Action</strong> → <strong>Result</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={currentIndex === 1}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Question</span>
            </Button>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Save className="w-4 h-4" />
              <span>Auto-save enabled</span>
            </div>

            <Button
              onClick={onNext}
              disabled={currentIndex === totalQuestions}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <span>Next Question</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Recommended Time</p>
              <p className="text-lg font-bold text-blue-600">{question.expectedAnswerTime} min</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Question Type</p>
              <p className="text-lg font-bold text-emerald-600 capitalize">{question.category}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Difficulty</p>
              <p className="text-lg font-bold text-purple-600 capitalize">{question.difficulty}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}