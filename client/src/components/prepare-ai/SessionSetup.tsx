import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Briefcase, 
  Globe, 
  Mic, 
  Brain, 
  Play,
  Settings,
  CheckCircle
} from 'lucide-react';

// Interview stages with descriptions
const INTERVIEW_STAGES = [
  { 
    value: 'behavioral', 
    label: 'Behavioral Interview', 
    description: 'STAR method questions about past experiences',
    color: 'blue'
  },
  { 
    value: 'technical', 
    label: 'Technical Interview', 
    description: 'Problem-solving and technical knowledge',
    color: 'green' 
  },
  { 
    value: 'phone_screening', 
    label: 'Phone Screening', 
    description: 'Initial screening conversation',
    color: 'purple'
  },
  { 
    value: 'functional', 
    label: 'Functional Interview', 
    description: 'Role-specific skills and expertise',
    color: 'orange'
  },
  { 
    value: 'hiring_manager', 
    label: 'Hiring Manager', 
    description: 'Leadership and cultural fit assessment',
    color: 'red'
  },
  { 
    value: 'executive', 
    label: 'Executive Interview', 
    description: 'Strategic thinking and leadership',
    color: 'indigo'
  }
];

// Supported ASEAN languages
const LANGUAGES = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'ms', label: 'Bahasa Malaysia', flag: '🇲🇾' },
  { value: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { value: 'th', label: 'ภาษาไทย (Thai)', flag: '🇹🇭' },
  { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { value: 'tl', label: 'Filipino', flag: '🇵🇭' },
  { value: 'my', label: 'မြန်မာဘာသာ (Burmese)', flag: '🇲🇲' },
  { value: 'km', label: 'ភាសាខ្មែរ (Khmer)', flag: '🇰🇭' },
  { value: 'lo', label: 'ພາສາລາວ (Lao)', flag: '🇱🇦' },
  { value: 'bn', label: 'বাংলা (Bengali)', flag: '🇧🇩' }
];

// Common job titles for quick selection
const COMMON_JOB_TITLES = [
  'Software Engineer',
  'Data Scientist', 
  'Product Manager',
  'Marketing Manager',
  'Sales Executive',
  'Business Analyst',
  'DevOps Engineer',
  'UX/UI Designer',
  'Financial Analyst',
  'Project Manager',
  'Operations Manager',
  'Customer Success Manager'
];

interface SessionConfig {
  jobTitle: string;
  companyName: string;
  interviewStage: string;
  language: string;
  voiceEnabled: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  industry?: string;
}

interface SessionSetupProps {
  onStartSession: (config: SessionConfig) => void;
  isLoading?: boolean;
  initialConfig?: Partial<SessionConfig>;
}

export default function SessionSetup({ 
  onStartSession, 
  isLoading = false,
  initialConfig
}: SessionSetupProps) {
  // Safe handling of initialConfig prop
  const safeInitialConfig = initialConfig || {};
  
  const [config, setConfig] = useState<SessionConfig>({
    jobTitle: safeInitialConfig.jobTitle || '',
    companyName: safeInitialConfig.companyName || '',
    interviewStage: safeInitialConfig.interviewStage || 'behavioral',
    language: safeInitialConfig.language || 'en',
    voiceEnabled: safeInitialConfig.voiceEnabled ?? true,
    difficulty: safeInitialConfig.difficulty || 'intermediate',
    industry: safeInitialConfig.industry || ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleConfigChange = (key: keyof SessionConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleStartSession = () => {
    if (!config.jobTitle.trim() || !config.companyName.trim()) {
      alert('Please fill in job title and company name');
      return;
    }
    onStartSession(config);
  };

  const selectedStage = INTERVIEW_STAGES.find(stage => stage.value === config.interviewStage);
  const selectedLanguage = LANGUAGES.find(lang => lang.value === config.language);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Setup Your AI Interview Practice</CardTitle>
          <p className="text-gray-600">
            Configure your personalized interview preparation session with voice-enabled AI coaching
          </p>
        </CardHeader>
      </Card>

      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="w-5 h-5 mr-2" />
            Job Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <div className="space-y-2">
              <Input
                id="jobTitle"
                value={config.jobTitle}
                onChange={(e) => handleConfigChange('jobTitle', e.target.value)}
                placeholder="e.g. Software Engineer, Product Manager"
                className="w-full"
              />
              {/* Quick Selection */}
              <div className="flex flex-wrap gap-2">
                {COMMON_JOB_TITLES.slice(0, 6).map((title) => (
                  <Badge
                    key={title}
                    variant={config.jobTitle === title ? "default" : "secondary"}
                    className="cursor-pointer hover:bg-blue-100"
                    onClick={() => handleConfigChange('jobTitle', title)}
                  >
                    {title}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-gray-400" />
              <Input
                id="companyName"
                value={config.companyName}
                onChange={(e) => handleConfigChange('companyName', e.target.value)}
                placeholder="e.g. Google, Grab, Shopee"
                className="flex-1"
              />
            </div>
          </div>

          {/* Interview Stage */}
          <div className="space-y-2">
            <Label>Interview Stage</Label>
            <Select
              value={config.interviewStage}
              onValueChange={(value) => handleConfigChange('interviewStage', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVIEW_STAGES.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    <div className="flex items-center space-x-3 py-1">
                      <Badge variant="outline" className={`text-${stage.color}-600 border-${stage.color}-300`}>
                        {stage.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStage && (
              <p className="text-sm text-gray-600">
                {selectedStage.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Language & Voice Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Language & Voice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language Selection */}
          <div className="space-y-2">
            <Label>Interview Language</Label>
            <Select
              value={config.language}
              onValueChange={(value) => handleConfigChange('language', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <div className="flex items-center space-x-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600">
              AI questions and feedback will be provided in {selectedLanguage?.label || 'English'}
            </p>
          </div>

          {/* Voice Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-2">
              <Mic className="w-5 h-5" />
              <div>
                <Label htmlFor="voiceEnabled">Voice Input/Output</Label>
                <p className="text-sm text-gray-600">Enable voice-based interaction</p>
              </div>
            </div>
            <Switch
              id="voiceEnabled"
              checked={config.voiceEnabled}
              onCheckedChange={(checked) => handleConfigChange('voiceEnabled', checked)}
            />
          </div>

          {config.voiceEnabled && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Voice Features Enabled</span>
              </div>
              <ul className="text-sm text-blue-700 space-y-1 ml-6">
                <li>• Voice-to-text for your responses</li>
                <li>• Text-to-speech for AI questions</li>
                <li>• Real-time audio level monitoring</li>
                <li>• Multi-language voice support</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowAdvanced(!showAdvanced)}>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Advanced Settings
            </div>
            <span className="text-sm text-gray-500">
              {showAdvanced ? 'Hide' : 'Show'}
            </span>
          </CardTitle>
        </CardHeader>
        
        {showAdvanced && (
          <CardContent className="space-y-4">
            {/* Difficulty Level */}
            <div className="space-y-2">
              <Label>Difficulty Level</Label>
              <Select
                value={config.difficulty}
                onValueChange={(value) => handleConfigChange('difficulty', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">
                    <div className="space-y-1">
                      <div className="font-medium">Beginner</div>
                      <div className="text-sm text-gray-600">Basic questions, gentle feedback</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="intermediate">
                    <div className="space-y-1">
                      <div className="font-medium">Intermediate</div>
                      <div className="text-sm text-gray-600">Moderate complexity, balanced feedback</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="advanced">
                    <div className="space-y-1">
                      <div className="font-medium">Advanced</div>
                      <div className="text-sm text-gray-600">Complex scenarios, detailed evaluation</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Industry (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="industry">Industry (Optional)</Label>
              <Input
                id="industry"
                value={config.industry}
                onChange={(e) => handleConfigChange('industry', e.target.value)}
                placeholder="e.g. Technology, Finance, Healthcare"
                className="w-full"
              />
              <p className="text-sm text-gray-600">
                Helps AI generate industry-specific questions
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Session Summary */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <h3 className="font-medium text-blue-900 mb-3">Session Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Position:</span>
              <span className="ml-2 text-blue-800">
                {config.jobTitle || 'Not specified'} at {config.companyName || 'Company'}
              </span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Stage:</span>
              <span className="ml-2 text-blue-800">{selectedStage?.label}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Language:</span>
              <span className="ml-2 text-blue-800">{selectedLanguage?.label}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Voice:</span>
              <span className="ml-2 text-blue-800">{config.voiceEnabled ? 'Enabled' : 'Text only'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Start Button */}
      <div className="text-center">
        <Button
          onClick={handleStartSession}
          size="lg"
          disabled={isLoading || !config.jobTitle.trim() || !config.companyName.trim()}
          className="px-8 py-3 text-lg"
        >
          {isLoading ? (
            <>
              <Settings className="w-5 h-5 mr-2 animate-spin" />
              Setting up your session...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Start AI Interview Practice
            </>
          )}
        </Button>
        
        <p className="text-sm text-gray-600 mt-2">
          Your AI interviewer will generate personalized questions based on your configuration
        </p>
      </div>
    </div>
  );
}