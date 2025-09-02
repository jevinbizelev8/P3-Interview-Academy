import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import LanguageSelector, { ASEAN_LANGUAGES } from '@/components/LanguageSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, CheckCircle, XCircle, Languages } from 'lucide-react';

const TEST_QUESTIONS = [
  "Tell me about your experience with project management and how you handle competing priorities.",
  "Describe a challenging technical problem you solved and the approach you took.",
  "How do you stay updated with the latest developments in your field?"
];

export default function LanguageTest() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});
  const [currentTestIndex, setCurrentTestIndex] = useState(0);

  // Translation test query
  const { data: translations, isLoading, refetch } = useQuery({
    queryKey: ['/api/translate-batch', selectedLanguage, currentTestIndex],
    queryFn: async () => {
      if (selectedLanguage === 'en') return null;
      
      const results = await Promise.allSettled(
        TEST_QUESTIONS.map(async (question) => {
          const response = await apiRequest('POST', '/api/translate', {
            text: question,
            targetLanguage: selectedLanguage
          });
          return response.json();
        })
      );

      return results.map((result, index) => ({
        original: TEST_QUESTIONS[index],
        translated: result.status === 'fulfilled' ? result.value.translatedText : 'Translation failed',
        success: result.status === 'fulfilled'
      }));
    },
    enabled: selectedLanguage !== 'en',
  });

  const testLanguage = async (langCode: string) => {
    setSelectedLanguage(langCode);
    setCurrentTestIndex(prev => prev + 1); // Force refetch
    
    if (langCode === 'en') {
      setTestResults(prev => ({ ...prev, [langCode]: true }));
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/translate', {
        text: "Hello, this is a test message.",
        targetLanguage: langCode
      });
      const result = await response.json();
      setTestResults(prev => ({ 
        ...prev, 
        [langCode]: !!result.translatedText && result.translatedText !== "Hello, this is a test message."
      }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, [langCode]: false }));
    }
  };

  const testAllLanguages = async () => {
    setTestResults({});
    for (const language of ASEAN_LANGUAGES) {
      await testLanguage(language.code);
      // Add small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">ASEAN Language Translation Test</h1>
          <p className="text-gray-600">Test Sea Lion AI translation capabilities across all supported ASEAN languages.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Language Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Language Selection</CardTitle>
              <CardDescription>Choose an ASEAN language to test translation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <LanguageSelector
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
              />
              
              <div className="flex space-x-4">
                <Button onClick={() => testLanguage(selectedLanguage)} disabled={isLoading}>
                  {isLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
                  Test Current Language
                </Button>
                <Button variant="outline" onClick={testAllLanguages}>
                  Test All Languages
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Translation capability status for each language</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {ASEAN_LANGUAGES.map((language) => (
                  <div key={language.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Languages className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{language.displayName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {testResults[language.code] === true && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {testResults[language.code] === false && (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      {testResults[language.code] === undefined && language.code !== selectedLanguage && (
                        <div className="w-5 h-5 rounded-full bg-gray-300" />
                      )}
                      {selectedLanguage === language.code && isLoading && (
                        <Loader className="w-5 h-5 animate-spin text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sample Translations */}
          {translations && selectedLanguage !== 'en' && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Sample Translations ({ASEAN_LANGUAGES.find(l => l.code === selectedLanguage)?.displayName})</CardTitle>
                <CardDescription>Interview questions translated to {selectedLanguage}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {translations.map((item, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <div className="mb-2">
                        <h4 className="font-semibold text-gray-900 mb-1">English:</h4>
                        <p className="text-gray-700">{item.original}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {ASEAN_LANGUAGES.find(l => l.code === selectedLanguage)?.displayName}:
                        </h4>
                        <p className={`${item.success ? 'text-green-700' : 'text-red-700'}`}>
                          {item.translated}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}