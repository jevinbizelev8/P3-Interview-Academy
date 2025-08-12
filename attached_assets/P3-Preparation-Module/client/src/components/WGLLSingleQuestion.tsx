import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronLeft, ChevronRight, Star, CheckCircle, Target, BookOpen, Lightbulb } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface Question {
  id: string;
  question: string;
  tags?: string[];
}

interface WGLLData {
  modelAnswer: string;
  keySuccessFactors?: string[];
  expertTips?: string[];
}

interface WGLLSingleQuestionProps {
  questions: Question[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  interviewType: string;
}

export default function WGLLSingleQuestion({ 
  questions, 
  currentIndex, 
  onIndexChange, 
  interviewType 
}: WGLLSingleQuestionProps) {
  const currentQuestion = questions[currentIndex];
  
  const { data: wgllData, isLoading, error } = useQuery<WGLLData>({
    queryKey: ['/api/wgll', currentQuestion?.id],
    enabled: !!currentQuestion?.id,
  });

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">No questions available</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">What Good Looks Like (WGLL)</h1>
            <p className="text-gray-600">Expert model answers and professional guidance</p>
          </div>
          <Badge variant="outline" className="text-sm">
            Question {currentIndex + 1} of {questions.length}
          </Badge>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Interview Question</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-800 text-lg leading-relaxed">{currentQuestion.question}</p>
          {currentQuestion.tags && currentQuestion.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {currentQuestion.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* WGLL Content */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Expert Analysis</h3>
              <p className="text-gray-600">Creating personalised WGLL content with AI...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Content Generation Error</h3>
              <p className="text-gray-600">Unable to generate WGLL content. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      ) : wgllData ? (
        <div className="space-y-6">
          {/* Expert Model Answer */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <CardTitle>Expert Model Answer</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
                <ReactMarkdown
                  components={{
                    h2: ({children}) => <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{children}</h2>,
                    h3: ({children}) => <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">{children}</h3>,
                    p: ({children}) => <p className="mb-4 leading-relaxed text-base">{children}</p>,
                    ul: ({children}) => <ul className="list-disc ml-6 mb-4 space-y-2">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal ml-6 mb-4 space-y-2">{children}</ol>,
                    strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                    li: ({children}) => <li className="leading-relaxed text-base">{children}</li>,
                    br: () => <br className="mb-2" />
                  }}
                >
                  {(() => {
                    // Smart text formatting for better readability
                    let formattedText = wgllData.modelAnswer;
                    
                    // If it doesn't have proper markdown formatting, add intelligent breaks
                    if (!formattedText.includes('##') && !formattedText.includes('\n\n')) {
                      formattedText = formattedText
                        .replace(/([.!?])\s+([A-Z][a-z])/g, '$1\n\n$2') // Break after sentences
                        .replace(/:\s*([A-Z])/g, ':\n\n$1') // Break after colons
                        .replace(/([0-9]+\.)\s*/g, '• ') // Convert numbered lists to bullet points
                        .replace(/(\n|^)([0-9]+\.)\s*/g, '$1• ') // Handle numbered lists at line beginnings
                        .replace(/\s*Key\s/g, '\n\n**Key ') // Highlight key points
                        .replace(/\s*Important\s/g, '\n\n**Important ') // Highlight important points
                        .replace(/\s*Additionally,\s*/g, '\n\nAdditionally, ') // Break paragraphs
                        .replace(/\s*Furthermore,\s*/g, '\n\nFurthermore, ') // Break paragraphs
                        .replace(/\s*Moreover,\s*/g, '\n\nMoreover, ') // Break paragraphs
                        .replace(/\s*However,\s*/g, '\n\nHowever, ') // Break paragraphs
                        .replace(/\n\n+/g, '\n\n') // Clean up multiple breaks
                        .replace(/\*\*/g, '**'); // Ensure bold formatting
                    }
                    
                    return formattedText;
                  })()}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {/* Key Success Factors */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <CardTitle>Key Success Factors</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {(wgllData?.keySuccessFactors && wgllData.keySuccessFactors.length > 0 
                  ? wgllData.keySuccessFactors 
                  : [
                    `Demonstrate deep ${currentQuestion.industry?.replace(/([A-Z])/g, ' $1').trim() || 'technical'} expertise and knowledge`,
                    'Use industry-specific terminology and concepts confidently',
                    'Provide quantifiable examples and measurable results',
                    'Show real-world application experience and practical skills',
                    'Communicate technical concepts clearly to different audiences',
                    'Display problem-solving abilities relevant to the role'
                  ]).map((factor: string, index: number) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-800 leading-relaxed">{factor}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Expert Tips */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-orange-500" />
                <CardTitle>Expert Tips</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {(wgllData?.expertTips && wgllData.expertTips.length > 0 
                  ? wgllData.expertTips 
                  : [
                    `Stay current with latest ${currentQuestion.industry?.replace(/([A-Z])/g, ' $1').trim() || 'industry'} trends and technologies`,
                    'Prepare specific STAR method examples with concrete metrics',
                    'Practice explaining complex technical concepts simply',
                    'Research the company\'s technical challenges and solutions'
                  ]).map((tip: string, index: number) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Lightbulb className="w-4 h-4 text-orange-500" />
                    </div>
                    <span className="text-gray-800 leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg border p-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Question</span>
        </Button>

        <div className="text-sm text-gray-600">
          {currentIndex + 1} of {questions.length}
        </div>

        <Button
          onClick={handleNext}
          disabled={currentIndex === questions.length - 1}
          className="flex items-center space-x-2"
        >
          <span>Next Question</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}