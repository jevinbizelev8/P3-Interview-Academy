import { Badge } from "@/components/ui/badge";
import { Save, Languages, Loader } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import type { Question } from "@shared/schema";

interface QuestionInterfaceProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  selectedLanguage?: string;
}

export default function QuestionInterface({ question, currentIndex, totalQuestions, selectedLanguage = 'en' }: QuestionInterfaceProps) {
  const [translatedQuestion, setTranslatedQuestion] = useState<string>('');

  // Translation query
  const { data: translation, isLoading: isTranslating } = useQuery({
    queryKey: ['/api/translate', question.question, selectedLanguage],
    queryFn: async () => {
      if (!selectedLanguage || selectedLanguage === 'en') {
        return null;
      }
      const response = await apiRequest('POST', '/api/translate', {
        text: question.question,
        targetLanguage: selectedLanguage
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-900">
          Question {currentIndex} of {totalQuestions}
        </h4>
        <div className="flex items-center space-x-2 text-sm text-neutral-gray">
          <Save className="w-4 h-4" />
          <span>Auto-save enabled</span>
        </div>
      </div>
      
      {/* Question Content - English */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">Q</span>
          </div>
          <p className="text-gray-900 font-medium">{question.question}</p>
        </div>
      </div>

      {/* Translated Question Content */}
      {selectedLanguage !== 'en' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Languages className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              {isTranslating ? (
                <div className="flex items-center space-x-2">
                  <Loader className="w-4 h-4 animate-spin text-green-600" />
                  <span className="text-green-700 text-sm">Translating...</span>
                </div>
              ) : translatedQuestion ? (
                <p className="text-gray-900 font-medium">{translatedQuestion}</p>
              ) : (
                <p className="text-gray-500 text-sm italic">Translation not available</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Question Tags */}
      <div className="flex flex-wrap gap-2">
        {question.tags && Array.isArray(question.tags) && question.tags.map((tag: string) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}
