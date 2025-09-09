import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Mic, 
  Volume2, 
  Monitor, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  PlayCircle,
  Settings,
  Info
} from 'lucide-react';

import { voiceCompatibilityTester, type BrowserCapabilities, type CompatibilityTestResult } from '@/utils/voice-compatibility';

interface VoiceCompatibilityTestProps {
  onTestComplete?: (result: CompatibilityTestResult) => void;
  autoRun?: boolean;
  className?: string;
}

export default function VoiceCompatibilityTest({
  onTestComplete,
  autoRun = false,
  className = ''
}: VoiceCompatibilityTestProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');
  const [results, setResults] = useState<CompatibilityTestResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Auto-run test on mount if requested
  useEffect(() => {
    if (autoRun) {
      runCompatibilityTest();
    }
  }, [autoRun]);

  const runCompatibilityTest = async () => {
    setIsRunning(true);
    setTestProgress(0);
    setCurrentTest('Initializing...');

    const testSteps = [
      'Detecting browser information...',
      'Testing Web Speech API...',
      'Testing MediaRecorder API...',
      'Testing AudioContext...',
      'Testing WebAssembly support...',
      'Checking permissions...',
      'Analyzing language support...',
      'Generating recommendations...'
    ];

    try {
      // Simulate progressive testing
      for (let i = 0; i < testSteps.length; i++) {
        setCurrentTest(testSteps[i]);
        setTestProgress((i / testSteps.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const result = await voiceCompatibilityTester.runCompatibilityTest();
      setResults(result);
      setTestProgress(100);
      setCurrentTest('Test completed!');
      onTestComplete?.(result);

    } catch (error) {
      console.error('Compatibility test failed:', error);
      setCurrentTest('Test failed');
    } finally {
      setIsRunning(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getOverallStatusIcon = (rating: string) => {
    switch (rating) {
      case 'excellent': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'good': return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
      case 'limited': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'poor': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getOverallStatusColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'limited': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCapabilityIcon = (supported: boolean) => {
    return supported ? 
      <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
      <XCircle className="w-4 h-4 text-red-500" />;
  };

  const renderCapabilityDetail = (
    title: string,
    capabilities: any,
    icon: React.ReactNode
  ) => {
    const isExpanded = expandedSections.has(title);

    return (
      <Collapsible key={title}>
        <CollapsibleTrigger
          className="flex items-center justify-between w-full p-3 hover:bg-gray-50 rounded-lg"
          onClick={() => toggleSection(title)}
        >
          <div className="flex items-center space-x-3">
            {icon}
            <span className="font-medium">{title}</span>
          </div>
          {isExpanded ? 
            <ChevronDown className="w-4 h-4" /> : 
            <ChevronRight className="w-4 h-4" />
          }
        </CollapsibleTrigger>
        
        <CollapsibleContent className="px-3 pb-3">
          <div className="pl-7 space-y-2">
            {Object.entries(capabilities).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <div className="flex items-center space-x-2">
                  {typeof value === 'boolean' ? (
                    getCapabilityIcon(value)
                  ) : Array.isArray(value) ? (
                    <Badge variant="outline">{value.length} items</Badge>
                  ) : (
                    <span className="text-gray-600">{String(value)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="w-5 h-5 mr-2" />
            Voice Feature Compatibility Test
          </CardTitle>
          {!results && (
            <p className="text-sm text-gray-600">
              Test your browser's support for voice features including speech recognition, 
              text-to-speech, and audio processing capabilities.
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Test Progress */}
          {isRunning && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>{currentTest}</span>
                <span>{Math.round(testProgress)}%</span>
              </div>
              <Progress value={testProgress} className="h-2" />
            </div>
          )}

          {/* Test Button */}
          {!isRunning && !results && (
            <div className="text-center">
              <Button onClick={runCompatibilityTest} size="lg" className="px-8">
                <PlayCircle className="w-5 h-5 mr-2" />
                Run Compatibility Test
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isRunning && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mr-3" />
              <span>Running compatibility tests...</span>
            </div>
          )}

          {/* Test Results */}
          {results && (
            <div className="space-y-6">
              {/* Overall Result */}
              <Alert className={getOverallStatusColor(results.overall)}>
                <div className="flex items-center">
                  {getOverallStatusIcon(results.overall)}
                  <div className="ml-3">
                    <h3 className="font-semibold capitalize">
                      {results.overall} Compatibility
                    </h3>
                    <AlertDescription className="mt-1">
                      Your browser has <strong>{results.overall}</strong> support for voice features.
                      {results.overall === 'excellent' && ' All features should work seamlessly.'}
                      {results.overall === 'good' && ' Most features will work well with minor limitations.'}
                      {results.overall === 'limited' && ' Some features may not work or require fallbacks.'}
                      {results.overall === 'poor' && ' Voice features will be significantly limited.'}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>

              {/* Browser Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Browser Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Browser:</span>
                      <span className="ml-2">{results.capabilities.name}</span>
                    </div>
                    <div>
                      <span className="font-medium">Version:</span>
                      <span className="ml-2">{results.capabilities.version}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Capabilities */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Feature Support</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {renderCapabilityDetail(
                    'Web Speech API',
                    results.capabilities.webSpeechAPI,
                    <Volume2 className="w-4 h-4" />
                  )}
                  
                  {renderCapabilityDetail(
                    'Media Recorder',
                    results.capabilities.mediaRecorder,
                    <Mic className="w-4 h-4" />
                  )}
                  
                  {renderCapabilityDetail(
                    'Audio Context',
                    results.capabilities.audioContext,
                    <Settings className="w-4 h-4" />
                  )}
                  
                  {renderCapabilityDetail(
                    'WebAssembly',
                    results.capabilities.webAssembly,
                    <Monitor className="w-4 h-4" />
                  )}
                </CardContent>
              </Card>

              {/* Language Support */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Language Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Speech Recognition</h4>
                      <div className="flex flex-wrap gap-1">
                        {results.capabilities.languages.speechRecognition.slice(0, 6).map(lang => (
                          <Badge key={lang} variant="outline" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                        {results.capabilities.languages.speechRecognition.length > 6 && (
                          <Badge variant="secondary" className="text-xs">
                            +{results.capabilities.languages.speechRecognition.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Text-to-Speech</h4>
                      <div className="flex flex-wrap gap-1">
                        {results.capabilities.languages.speechSynthesis.slice(0, 6).map(lang => (
                          <Badge key={lang} variant="outline" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                        {results.capabilities.languages.speechSynthesis.length > 6 && (
                          <Badge variant="secondary" className="text-xs">
                            +{results.capabilities.languages.speechSynthesis.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {results.recommendations.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <div>
                    <h3 className="font-semibold mb-2">Recommendations</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {results.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </Alert>
              )}

              {/* Issues */}
              {results.issues.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <div>
                    <h3 className="font-semibold mb-2">Potential Issues</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {results.issues.map((issue, index) => (
                        <li key={index} className="text-sm">{issue}</li>
                      ))}
                    </ul>
                  </div>
                </Alert>
              )}

              {/* Fallback Strategies */}
              {results.fallbackStrategies.length > 0 && (
                <Alert>
                  <Settings className="h-4 w-4" />
                  <div>
                    <h3 className="font-semibold mb-2">Fallback Strategies</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {results.fallbackStrategies.map((strategy, index) => (
                        <li key={index} className="text-sm">{strategy}</li>
                      ))}
                    </ul>
                  </div>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="outline" onClick={() => setResults(null)}>
                  Run New Test
                </Button>
                
                <div className="text-sm text-gray-500">
                  Test completed successfully
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}