import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Lightbulb, ArrowLeft, Play, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/auth-utils";
import type { InterviewScenario } from "@shared/schema";

// Language mapping
const languageNames = {
  'en': 'English',
  'ms': 'Bahasa Malaysia', 
  'id': 'Bahasa Indonesia',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'fil': 'Filipino',
  'my': 'Myanmar',
  'km': 'Khmer',
  'lo': 'Lao',
  'zh': 'Chinese (Singapore)',
  'zh-sg': 'Chinese (Singapore)' // Handle both formats
};

const getLanguageName = (code: string) => languageNames[code as keyof typeof languageNames] || 'English';

// Translations for the briefing interface
const translations = {
  'en': {
    title: 'Interview Preparation Session',
    subtitle: "You're about to begin a subject interview simulation. Take your time and respond naturally.",
    scenarioBrief: 'Scenario Brief',
    personalizedInterview: 'Personalized Interview',
    position: 'Position:',
    company: 'Company:',
    interviewStage: 'Interview Stage:',
    duration: 'Duration:',
    dynamicGeneration: 'Dynamic Generation:',
    dynamicGenerationText: 'Questions will be generated in real-time specifically for this {role} role at {company}. Each question adapts to your responses and focuses on actual job requirements and company culture.',
    yourBackground: 'Your Background',
    experiencedProfessional: 'Experienced professional',
    keyObjectives: 'Key Objectives',
    assessCandidate: 'Assess candidate suitability for {role} role at {company}',
    yourInterviewer: 'Your Interviewer',
    aiInterviewer: 'AI Interviewer',
    professionalAssistant: 'Professional Interview Assistant',
    interviewStyle: 'Interview Style:',
    professionalEngaging: 'Professional and engaging',
    personality: 'Personality:',
    thoughtfulSupportive: 'Thoughtful and supportive',
    sessionInformation: 'Session Information',
    questions: 'Questions:',
    estimatedTime: 'Estimated time:',
    interviewLanguage: 'Interview Language:',
    autoSave: 'Auto-save:',
    enabled: 'Enabled',
    interviewLanguageLabel: 'Interview Language',
    startInterview: 'Start Interview',
    backToScenarios: 'Back to Scenarios',
    minutes: 'minutes'
  },
  'ms': {
    title: 'Sesi Persediaan Temuduga',
    subtitle: 'Anda akan memulakan simulasi temuduga subjek. Luangkan masa anda dan jawab secara semula jadi.',
    scenarioBrief: 'Ringkasan Senario',
    personalizedInterview: 'Temuduga Dipersonalisasi',
    position: 'Jawatan:',
    company: 'Syarikat:',
    interviewStage: 'Peringkat Temuduga:',
    duration: 'Tempoh:',
    dynamicGeneration: 'Penjanaan Dinamik:',
    dynamicGenerationText: 'Soalan akan dijana secara masa nyata khusus untuk peranan {role} di {company}. Setiap soalan disesuaikan dengan jawapan anda dan memberi tumpuan kepada keperluan kerja sebenar dan budaya syarikat.',
    yourBackground: 'Latar Belakang Anda',
    experiencedProfessional: 'Profesional berpengalaman',
    keyObjectives: 'Objektif Utama',
    assessCandidate: 'Menilai kesesuaian calon untuk peranan {role} di {company}',
    yourInterviewer: 'Penemuduga Anda',
    aiInterviewer: 'Penemuduga AI',
    professionalAssistant: 'Pembantu Temuduga Profesional',
    interviewStyle: 'Gaya Temuduga:',
    professionalEngaging: 'Profesional dan menarik',
    personality: 'Personaliti:',
    thoughtfulSupportive: 'Berfikir dan menyokong',
    sessionInformation: 'Maklumat Sesi',
    questions: 'Soalan:',
    estimatedTime: 'Anggaran masa:',
    interviewLanguage: 'Bahasa Temuduga:',
    autoSave: 'Auto-simpan:',
    enabled: 'Diaktifkan',
    interviewLanguageLabel: 'Bahasa Temuduga',
    startInterview: 'Mulakan Temuduga',
    backToScenarios: 'Kembali ke Senario',
    minutes: 'minit'
  },
  'th': {
    title: 'เซสชันเตรียมตัวสัมภาษณ์',
    subtitle: 'คุณกำลังจะเริ่มการจำลองการสัมภาษณ์งาน กรุณาใช้เวลาของคุณและตอบอย่างเป็นธรรมชาติ',
    scenarioBrief: 'สรุปสถานการณ์',
    personalizedInterview: 'การสัมภาษณ์ที่ปรับเปลี่ยนได้',
    position: 'ตำแหน่ง:',
    company: 'บริษัท:',
    interviewStage: 'ขั้นตอนการสัมภาษณ์:',
    duration: 'ระยะเวลา:',
    dynamicGeneration: 'การสร้างแบบไดนามิก:',
    dynamicGenerationText: 'คำถามจะถูกสร้างขึ้นแบบเรียลไทม์โดยเฉพาะสำหรับตำแหน่ง {role} ที่ {company} คำถามแต่ละข้อจะปรับตามคำตอบของคุณและมุ่งเน้นไปที่ความต้องการงานจริงและวัฒนธรรมบริษัท',
    yourBackground: 'ประวัติของคุณ',
    experiencedProfessional: 'ผู้เชี่ยวชาญที่มีประสบการณ์',
    keyObjectives: 'วัตถุประสงค์หลัก',
    assessCandidate: 'ประเมินความเหมาะสมของผู้สมัครสำหรับตำแหน่ง {role} ที่ {company}',
    yourInterviewer: 'ผู้สัมภาษณ์ของคุณ',
    aiInterviewer: 'ผู้สัมภาษณ์ AI',
    professionalAssistant: 'ผู้ช่วยการสัมภาษณ์มืออาชีพ',
    interviewStyle: 'สไตล์การสัมภาษณ์:',
    professionalEngaging: 'เป็นมืออาชีพและน่าสนใจ',
    personality: 'บุคลิกภาพ:',
    thoughtfulSupportive: 'ใส่ใจและให้การสนับสนุน',
    sessionInformation: 'ข้อมูลเซสชัน',
    questions: 'คำถาม:',
    estimatedTime: 'เวลาโดยประมาณ:',
    interviewLanguage: 'ภาษาการสัมภาษณ์:',
    autoSave: 'บันทึกอัตโนมัติ:',
    enabled: 'เปิดใช้งาน',
    interviewLanguageLabel: 'ภาษาการสัมภาษณ์',
    startInterview: 'เริ่มการสัมภาษณ์',
    backToScenarios: 'กลับไปยังสถานการณ์',
    minutes: 'นาที'
  },
  'id': {
    title: 'Sesi Persiapan Wawancara',
    subtitle: 'Anda akan memulai simulasi wawancara subjek. Luangkan waktu Anda dan jawab secara alami.',
    scenarioBrief: 'Ringkasan Skenario',
    personalizedInterview: 'Wawancara yang Dipersonalisasi',
    position: 'Posisi:',
    company: 'Perusahaan:',
    interviewStage: 'Tahap Wawancara:',
    duration: 'Durasi:',
    dynamicGeneration: 'Generasi Dinamis:',
    dynamicGenerationText: 'Pertanyaan akan dihasilkan secara real-time khusus untuk peran {role} di {company}. Setiap pertanyaan menyesuaikan dengan jawaban Anda dan berfokus pada persyaratan kerja aktual dan budaya perusahaan.',
    yourBackground: 'Latar Belakang Anda',
    experiencedProfessional: 'Profesional berpengalaman',
    keyObjectives: 'Tujuan Utama',
    assessCandidate: 'Menilai kesesuaian kandidat untuk peran {role} di {company}',
    yourInterviewer: 'Pewawancara Anda',
    aiInterviewer: 'Pewawancara AI',
    professionalAssistant: 'Asisten Wawancara Profesional',
    interviewStyle: 'Gaya Wawancara:',
    professionalEngaging: 'Profesional dan menarik',
    personality: 'Kepribadian:',
    thoughtfulSupportive: 'Perhatian dan mendukung',
    sessionInformation: 'Informasi Sesi',
    questions: 'Pertanyaan:',
    estimatedTime: 'Estimasi waktu:',
    interviewLanguage: 'Bahasa Wawancara:',
    autoSave: 'Simpan otomatis:',
    enabled: 'Diaktifkan',
    interviewLanguageLabel: 'Bahasa Wawancara',
    startInterview: 'Mulai Wawancara',
    backToScenarios: 'Kembali ke Skenario',
    minutes: 'menit'
  }
};

export default function PreInterviewBriefing() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get job context from session storage
  const [jobContext, setJobContext] = useState(() => {
    const jobContextStr = sessionStorage.getItem('jobContext');
    return jobContextStr ? JSON.parse(jobContextStr) : { jobPosition: '', companyName: '', interviewLanguage: 'en' };
  });

  // Get current language and translations
  const currentLanguage = jobContext.interviewLanguage || 'en';
  const t = translations[currentLanguage as keyof typeof translations] || translations['en'];
  
  console.log('PreInterviewBriefing rendering with scenarioId:', scenarioId);

  const { data: scenario, isLoading, error } = useQuery<InterviewScenario>({
    queryKey: [`/api/practice/scenarios/${scenarioId}`, jobContext.jobPosition, jobContext.companyName],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (jobContext.jobPosition?.trim()) params.append('jobPosition', jobContext.jobPosition.trim());
      if (jobContext.companyName?.trim()) params.append('companyName', jobContext.companyName.trim());
      
      const response = await fetch(`/api/practice/scenarios/${scenarioId}?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [error, toast]);

  const handleStartInterview = async () => {
    try {
      if (!scenarioId) {
        toast({
          title: "Error",
          description: "Scenario ID is missing",
          variant: "destructive",
        });
        return;
      }

      // Get job context from session storage
      const jobContextStr = sessionStorage.getItem('jobContext');
      const jobContext = jobContextStr ? JSON.parse(jobContextStr) : { jobPosition: '', companyName: '', interviewLanguage: 'en' };
      
      // Create new interview session
      const response = await fetch("/api/practice/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scenarioId: scenarioId,
          status: "in_progress",
          currentQuestion: 1,
          totalQuestions: 15,
          userJobPosition: jobContext.jobPosition,
          userCompanyName: jobContext.companyName,
          interviewLanguage: jobContext.interviewLanguage || 'en',
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create interview session");
      }

      const session = await response.json();
      setLocation(`/practice/interview/${session.id}`);
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: "Error",
        description: "Failed to start interview session. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="bg-gray-200 rounded-xl h-48"></div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !scenario) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Scenario Not Found</h2>
            <p className="text-gray-600 mb-6">
              The interview scenario you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => setLocation("/practice")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Scenarios
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/90 rounded-xl p-8 text-primary-foreground mb-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">{t.title}</h2>
          <p className="text-lg opacity-90">
            {t.subtitle}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Scenario Brief */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 text-primary mr-2" />
                {t.scenarioBrief}
              </h3>
              <div className="prose prose-sm text-gray-700 max-w-none">
                {/* Show personalized job context if available, otherwise show scenario defaults */}
                {jobContext.jobPosition || jobContext.companyName ? (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <h4 className="text-green-800 font-medium mb-2">✓ {t.personalizedInterview}</h4>
                      <p><strong>{t.position}</strong> {jobContext.jobPosition || scenario.jobRole}</p>
                      <p><strong>{t.company}</strong> {jobContext.companyName || 'Not specified'}</p>
                      <p><strong>{t.interviewStage}</strong> {scenario.interviewStage.replace('-', ' ')}</p>
                      <p><strong>{t.duration}</strong> 15-20 {t.minutes}</p>
                      <p className="text-sm text-green-700 mt-2">
                        <strong>✨ {t.dynamicGeneration}</strong> {t.dynamicGenerationText.replace('{role}', jobContext.jobPosition).replace('{company}', jobContext.companyName)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p><strong>{t.position}</strong> {scenario.jobRole}</p>
                    <p><strong>{t.company}</strong> {scenario.companyBackground}</p>
                    <p><strong>{t.interviewStage}</strong> {scenario.interviewStage.replace('-', ' ')}</p>
                    <p><strong>{t.duration}</strong> 15-20 {t.minutes}</p>
                  </>
                )}
                
                <h4 className="text-lg font-medium text-gray-900 mt-4 mb-2">{t.yourBackground}</h4>
                <p>{scenario.candidateBackground}</p>
                
                <h4 className="text-lg font-medium text-gray-900 mt-4 mb-2">{t.keyObjectives}</h4>
                <div dangerouslySetInnerHTML={{
                  __html: scenario.keyObjectives
                    .split('\n')
                    .filter((line: string) => line.trim())
                    .map((line: string) => `<p>• ${line.replace(/^[•-]\s*/, '')}</p>`)
                    .join('')
                }} />
              </div>
            </CardContent>
          </Card>

          {/* Interview Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
                Interview Tips
              </h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>Use the STAR method for behavioural questions</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>Speak clearly and at a moderate pace</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>Prepare specific examples from your experience</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>Show enthusiasm and genuine interest</span>
                </li>
                {jobContext.jobPosition && jobContext.companyName && (
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    <span>Questions are dynamically generated - each interview will be unique and tailored to your specific role</span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Interviewer Profile */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.yourInterviewer}</h3>
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                  <span className="text-lg font-medium text-gray-600">
                    {scenario.interviewerName ? scenario.interviewerName.split(' ').map(n => n[0]).join('') : 'AI'}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{scenario.interviewerName || t.aiInterviewer}</h4>
                  <p className="text-sm text-gray-600">{scenario.interviewerTitle || t.professionalAssistant}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>{t.interviewStyle}</strong> {scenario.interviewerStyle || t.professionalEngaging}</p>
                <p><strong>{t.personality}</strong> {scenario.personalityTraits || t.thoughtfulSupportive}</p>
              </div>
            </CardContent>
          </Card>

          {/* Session Controls */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.sessionInformation}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.questions}</span>
                  <span className="font-medium">15 questions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.estimatedTime}</span>
                  <span className="font-medium">15-20 {t.minutes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.interviewLanguage}</span>
                  <span className="font-medium">{getLanguageName(jobContext.interviewLanguage || 'en')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.autoSave}</span>
                  <span className="font-medium text-green-600">{t.enabled}</span>
                </div>
              </div>
              
              {/* Language Selection */}
              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    {t.interviewLanguageLabel}
                  </label>
                  <Select 
                    value={jobContext.interviewLanguage || 'en'}
                    onValueChange={(value) => {
                      const newContext = { ...jobContext, interviewLanguage: value };
                      setJobContext(newContext);
                      sessionStorage.setItem('jobContext', JSON.stringify(newContext));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                      <SelectItem value="ms">🇲🇾 Bahasa Malaysia</SelectItem>
                      <SelectItem value="id">🇮🇩 Bahasa Indonesia</SelectItem>
                      <SelectItem value="th">🇹🇭 Thai</SelectItem>
                      <SelectItem value="vi">🇻🇳 Vietnamese</SelectItem>
                      <SelectItem value="fil">🇵🇭 Filipino</SelectItem>
                      <SelectItem value="my">🇲🇲 Myanmar</SelectItem>
                      <SelectItem value="km">🇰🇭 Khmer</SelectItem>
                      <SelectItem value="lo">🇱🇦 Lao</SelectItem>
                      <SelectItem value="zh-sg">🇸🇬 Chinese (Singapore)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <Button 
                  onClick={handleStartInterview}
                  className="w-full"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {t.startInterview}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/practice")}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t.backToScenarios}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
