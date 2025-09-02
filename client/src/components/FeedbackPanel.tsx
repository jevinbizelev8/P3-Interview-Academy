import { CheckCircle, AlertTriangle, Languages, Loader } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface FeedbackPanelProps {
  feedback: {
    overall: string;
    items: Array<{ type: 'positive' | 'improvement'; message: string }>;
    starCompliance?: {
      situation: number;
      task: number;
      action: number;
      result: number;
      overallFlow: number;
    };
    strengths?: string[];
    improvements?: string[];
    specificAdvice?: string;
  };
  selectedLanguage?: string;
}

export default function FeedbackPanel({ feedback, selectedLanguage = 'en' }: FeedbackPanelProps) {
  if (!feedback || !feedback.items?.length) return null;

  // Translation queries for feedback text
  const { data: translatedOverall, isLoading: overallTranslating } = useQuery({
    queryKey: ['/api/translate', feedback.overall, selectedLanguage],
    queryFn: async () => {
      if (!selectedLanguage || selectedLanguage === 'en') return null;
      const response = await apiRequest('POST', '/api/translate', {
        text: feedback.overall,
        targetLanguage: selectedLanguage
      });
      const result = await response.json();
      return result.translatedText;
    },
    enabled: selectedLanguage !== 'en' && !!feedback.overall,
    staleTime: 5 * 60 * 1000,
  });

  // Translation queries for all feedback content
  const { data: translatedContent, isLoading: contentTranslating } = useQuery({
    queryKey: ['/api/translate-feedback', 
      [
        ...(feedback.strengths || []),
        ...(feedback.improvements || []),
        ...(feedback.items?.map(item => item.message) || [])
      ].join('|'), 
      selectedLanguage
    ],
    queryFn: async () => {
      if (!selectedLanguage || selectedLanguage === 'en') return null;
      
      // Collect all text to translate
      const allTexts = [
        ...(feedback.strengths || []),
        ...(feedback.improvements || []),
        ...(feedback.items?.map(item => item.message) || [])
      ];
      
      if (allTexts.length === 0) return null;
      
      const translations = await Promise.all(
        allTexts.map(async (text) => {
          try {
            const response = await apiRequest('POST', '/api/translate', {
              text: text,
              targetLanguage: selectedLanguage
            });
            const result = await response.json();
            return result.translatedText;
          } catch (error) {
            return text;
          }
        })
      );
      
      // Split translations back into categories
      let index = 0;
      const translatedStrengths = feedback.strengths?.map(() => translations[index++]) || [];
      const translatedImprovements = feedback.improvements?.map(() => translations[index++]) || [];
      const translatedItems = feedback.items?.map((item) => ({
        ...item,
        translatedMessage: translations[index++]
      })) || [];
      
      return { 
        strengths: translatedStrengths,
        improvements: translatedImprovements,
        items: translatedItems
      };
    },
    enabled: selectedLanguage !== 'en' && (
      (feedback.strengths?.length || 0) + 
      (feedback.improvements?.length || 0) + 
      (feedback.items?.length || 0)
    ) > 0,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-4 mb-6">
      {/* English Feedback */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-success-green rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h5 className="font-semibold text-gray-900 mb-3">{feedback.overall}</h5>
            
            {/* STAR Component Scores */}
            {feedback.starCompliance && (
              <div className="mb-4 p-3 bg-white/60 rounded border">
                <h6 className="font-medium text-gray-800 mb-2">STAR Method Analysis</h6>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Situation:</span>
                    <span className="font-medium">{feedback.starCompliance.situation}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Task:</span>
                    <span className="font-medium">{feedback.starCompliance.task}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Action:</span>
                    <span className="font-medium">{feedback.starCompliance.action}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Result:</span>
                    <span className="font-medium">{feedback.starCompliance.result}/5</span>
                  </div>
                  <div className="flex justify-between col-span-2 pt-1 border-t">
                    <span>Overall Flow:</span>
                    <span className="font-medium">{feedback.starCompliance.overallFlow}/5</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Strengths and Improvements */}
            <div className="space-y-2 text-sm">
              {feedback.strengths?.map((strength, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success-green flex-shrink-0" />
                  <span className="text-gray-700">{strength}</span>
                </div>
              ))}
              {feedback.improvements?.map((improvement, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-warning-yellow flex-shrink-0" />
                  <span className="text-gray-700">{improvement}</span>
                </div>
              ))}
              {feedback.items?.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  {item.type === 'positive' ? (
                    <CheckCircle className="w-4 h-4 text-success-green flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-warning-yellow flex-shrink-0" />
                  )}
                  <span className="text-gray-700">{item.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Translated Feedback */}
      {selectedLanguage !== 'en' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Languages className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              {overallTranslating ? (
                <div className="flex items-center space-x-2 mb-3">
                  <Loader className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-blue-700 text-sm">Translating feedback...</span>
                </div>
              ) : translatedOverall ? (
                <h5 className="font-semibold text-gray-900 mb-3">{translatedOverall}</h5>
              ) : (
                <h5 className="font-semibold text-gray-500 mb-3 italic">Translation not available</h5>
              )}
              
              {/* STAR Component Scores - Labels translated */}
              {feedback.starCompliance && (
                <div className="mb-4 p-3 bg-white/60 rounded border">
                  <h6 className="font-medium text-gray-800 mb-2">
                    {selectedLanguage === 'ms' ? 'Analisis Metodologi STAR' :
                     selectedLanguage === 'id' ? 'Analisis Metode STAR' :
                     selectedLanguage === 'th' ? 'การวิเคราะห์วิธี STAR' :
                     selectedLanguage === 'vi' ? 'Phân tích Phương pháp STAR' :
                     selectedLanguage === 'tl' ? 'Pagsusuri ng Pamamaraang STAR' :
                     selectedLanguage === 'my' ? 'STAR နည်းလမ်းခွဲခြမ်းစိတ်ဖြာခြင်း' :
                     selectedLanguage === 'km' ? 'ការវិភាគវិធីសាស្រ្ត STAR' :
                     selectedLanguage === 'lo' ? 'ການວິເຄາະວິທີການ STAR' :
                     selectedLanguage === 'zh-sg' ? 'STAR方法分析' : 
                     'STAR Method Analysis'}
                  </h6>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>{selectedLanguage === 'ms' ? 'Situasi:' :
                            selectedLanguage === 'id' ? 'Situasi:' :
                            selectedLanguage === 'th' ? 'สถานการณ์:' :
                            selectedLanguage === 'vi' ? 'Tình huống:' :
                            selectedLanguage === 'tl' ? 'Sitwasyon:' :
                            selectedLanguage === 'my' ? 'အခြေအနေ:' :
                            selectedLanguage === 'km' ? 'ស្ថានការណ៍:' :
                            selectedLanguage === 'lo' ? 'ສະຖານະການ:' :
                            selectedLanguage === 'zh-sg' ? '情况:' : 
                            'Situation:'}</span>
                      <span className="font-medium">{feedback.starCompliance.situation}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{selectedLanguage === 'ms' ? 'Tugas:' :
                            selectedLanguage === 'id' ? 'Tugas:' :
                            selectedLanguage === 'th' ? 'งาน:' :
                            selectedLanguage === 'vi' ? 'Nhiệm vụ:' :
                            selectedLanguage === 'tl' ? 'Gawain:' :
                            selectedLanguage === 'my' ? 'အလုပ်:' :
                            selectedLanguage === 'km' ? 'កិច្ចការ:' :
                            selectedLanguage === 'lo' ? 'ວຽກງານ:' :
                            selectedLanguage === 'zh-sg' ? '任务:' : 
                            'Task:'}</span>
                      <span className="font-medium">{feedback.starCompliance.task}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{selectedLanguage === 'ms' ? 'Tindakan:' :
                            selectedLanguage === 'id' ? 'Tindakan:' :
                            selectedLanguage === 'th' ? 'การกระทำ:' :
                            selectedLanguage === 'vi' ? 'Hành động:' :
                            selectedLanguage === 'tl' ? 'Aksyon:' :
                            selectedLanguage === 'my' ? 'လုပ်ဆောင်ချက်:' :
                            selectedLanguage === 'km' ? 'សកម្មភាព:' :
                            selectedLanguage === 'lo' ? 'ການປະຕິບັດ:' :
                            selectedLanguage === 'zh-sg' ? '行动:' : 
                            'Action:'}</span>
                      <span className="font-medium">{feedback.starCompliance.action}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{selectedLanguage === 'ms' ? 'Hasil:' :
                            selectedLanguage === 'id' ? 'Hasil:' :
                            selectedLanguage === 'th' ? 'ผลลัพธ์:' :
                            selectedLanguage === 'vi' ? 'Kết quả:' :
                            selectedLanguage === 'tl' ? 'Resulta:' :
                            selectedLanguage === 'my' ? 'ရလဒ်:' :
                            selectedLanguage === 'km' ? 'លទ្ធផល:' :
                            selectedLanguage === 'lo' ? 'ຜົນລັບ:' :
                            selectedLanguage === 'zh-sg' ? '结果:' : 
                            'Result:'}</span>
                      <span className="font-medium">{feedback.starCompliance.result}/5</span>
                    </div>
                    <div className="flex justify-between col-span-2 pt-1 border-t">
                      <span>{selectedLanguage === 'ms' ? 'Aliran Keseluruhan:' :
                            selectedLanguage === 'id' ? 'Alur Keseluruhan:' :
                            selectedLanguage === 'th' ? 'กระแสโดยรวม:' :
                            selectedLanguage === 'vi' ? 'Luồng Tổng thể:' :
                            selectedLanguage === 'tl' ? 'Kabuuang Daloy:' :
                            selectedLanguage === 'my' ? 'အလုံးစုံစီးဆင်းမှု:' :
                            selectedLanguage === 'km' ? 'លំហូរទូទៅ:' :
                            selectedLanguage === 'lo' ? 'ການໄຫລໂດຍລວມ:' :
                            selectedLanguage === 'zh-sg' ? '整体流程:' : 
                            'Overall Flow:'}</span>
                      <span className="font-medium">{feedback.starCompliance.overallFlow}/5</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Translated Strengths and Improvements */}
              <div className="space-y-2 text-sm">
                {contentTranslating ? (
                  <div className="flex items-center space-x-2">
                    <Loader className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-blue-700 text-sm">Translating feedback...</span>
                  </div>
                ) : translatedContent ? (
                  <>
                    {translatedContent.strengths?.map((strength, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success-green flex-shrink-0" />
                        <span className="text-gray-700">{strength}</span>
                      </div>
                    ))}
                    {translatedContent.improvements?.map((improvement, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-warning-yellow flex-shrink-0" />
                        <span className="text-gray-700">{improvement}</span>
                      </div>
                    ))}
                    {translatedContent.items?.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        {item.type === 'positive' ? (
                          <CheckCircle className="w-4 h-4 text-success-green flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-warning-yellow flex-shrink-0" />
                        )}
                        <span className="text-gray-700">{item.translatedMessage}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <span className="text-gray-500 text-sm italic">Translation not available</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
