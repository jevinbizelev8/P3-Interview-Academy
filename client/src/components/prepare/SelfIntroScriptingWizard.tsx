import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sparkles, Video, Play, Square, Loader2, CheckCircle2,
  AlertCircle, Upload, FileVideo, Lightbulb, Edit, Save
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import CreditCostBadge from "../shared/CreditCostBadge";
import { useToast } from "@/hooks/use-toast";

const SCRIPT_POLISHING_COST = 5;
const VIDEO_RECORDING_COST = 10;
const VIDEO_ASSESSMENT_COST = 10;

const STEPS = [
  {
    id: 1,
    title: "Who Are You?",
    subtitle: "Professional Identity",
    prompt: "Start with your current role and experience level",
    example: "I'm a Senior Software Engineer with 6 years of experience in full-stack development, currently leading the platform team at TechCorp.",
    tips: [
      "Lead with your current or most recent role",
      "Include years of experience",
      "Mention your company if it's recognizable",
      "Keep it to 1-2 sentences"
    ]
  },
  {
    id: 2,
    title: "What Do You Do?",
    subtitle: "Key Skills & Achievements",
    prompt: "Highlight your expertise and one quantifiable achievement",
    example: "I specialize in React and Node.js, and recently led the migration of our monolith to microservices, which improved system reliability by 40% and reduced deployment time from hours to minutes.",
    tips: [
      "Focus on your core technical or functional skills",
      "Include ONE specific achievement with metrics",
      "Use action verbs (led, built, improved, increased)",
      "Make the impact clear and quantifiable"
    ]
  },
  {
    id: 3,
    title: "Why This Role/Company?",
    subtitle: "Motivation & Alignment",
    prompt: "Connect your goals with the opportunity",
    example: "I'm excited about this role because I want to work on products that directly impact millions of users, and your company's mission to make technology more accessible really resonates with my personal values.",
    tips: [
      "Research the company's mission and values",
      "Be specific about what excites you",
      "Connect their needs to your strengths",
      "Show genuine enthusiasm"
    ]
  },
  {
    id: 4,
    title: "Closing Hook",
    subtitle: "Memorable Ending",
    prompt: "End with something that invites conversation",
    example: "I'd love to hear more about the challenges your team is facing and how I can contribute to solving them.",
    tips: [
      "Keep it conversational and warm",
      "Open the door for dialogue",
      "Show eagerness to learn more",
      "Avoid clichés"
    ]
  }
];

interface ScriptData {
  who: string;
  what: string;
  why: string;
  closingHook: string;
  finalScript: string;
}

interface VideoAssessment {
  transcript?: string;
  clarity_score: number;
  confidence_score: number;
  structure_score: number;
  overall_score: number;
  strengths: string[];
  improvements: string[];
  ai_feedback: string;
  duration_seconds?: number;
}

export default function SelfIntroScriptingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [scriptData, setScriptData] = useState<ScriptData>({
    who: "",
    what: "",
    why: "",
    closingHook: "",
    finalScript: ""
  });
  const [aiCoaching, setAiCoaching] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [finalAssessment, setFinalAssessment] = useState<VideoAssessment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [editedScript, setEditedScript] = useState("");
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Load saved draft
  const { data: savedDrafts } = useQuery({
    queryKey: ['selfIntroDraft'],
    queryFn: async () => {
      const response = await fetch('/api/prepare/self-intro/draft', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to load draft');
      }
      return response.json();
    }
  });

  // Load draft data on mount
  useEffect(() => {
    if (savedDrafts?.data) {
      const drafts = savedDrafts.data;
      setScriptData({
        who: drafts.find((d: any) => d.step_number === 1)?.step_data?.who || "",
        what: drafts.find((d: any) => d.step_number === 2)?.step_data?.what || "",
        why: drafts.find((d: any) => d.step_number === 3)?.step_data?.why || "",
        closingHook: drafts.find((d: any) => d.step_number === 4)?.step_data?.closingHook || "",
        finalScript: drafts.find((d: any) => d.step_number === 5)?.step_data?.finalScript || ""
      });
    }
  }, [savedDrafts]);

  // Auto-save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (data: { stepNumber: number; stepData: any }) => {
      const response = await fetch('/api/prepare/self-intro/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to save draft');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selfIntroDraft'] });
    }
  });

  // Auto-save when scriptData changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (scriptData.who || scriptData.what || scriptData.why || scriptData.closingHook || scriptData.finalScript) {
        saveDraftMutation.mutate({
          stepNumber: currentStep,
          stepData: scriptData
        });
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [scriptData, currentStep]);

  const handlePolishing = async () => {
    setIsProcessing(true);
    try {
      const fullScript = `${scriptData.who}\n\n${scriptData.what}\n\n${scriptData.why}\n\n${scriptData.closingHook}`;

      const response = await fetch('/api/prepare/self-intro/polish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ script: fullScript }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to polish script');
      }

      const data = await response.json();
      const updatedScript = { ...scriptData, finalScript: data.data.polished_script };
      setScriptData(updatedScript);

      setAiCoaching(`Your script has been polished! Word count: ${data.data.word_count}. Improvements made: ${data.data.improvements?.join(', ') || 'Various improvements'}`);

      toast({
        title: "Script Polished",
        description: `Your script has been improved (${data.data.word_count} words)`,
      });
    } catch (error) {
      console.error("Error polishing script:", error);
      toast({
        title: "Polishing Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEditedScript = async () => {
    const updatedScript = { ...scriptData, finalScript: editedScript };
    setScriptData(updatedScript);
    await saveDraftMutation.mutateAsync({
      stepNumber: 5,
      stepData: { finalScript: editedScript }
    });
    setIsEditingScript(false);
    toast({
      title: "Script Saved",
      description: "Your edited script has been saved",
    });
  };

  const handleUploadedVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.includes('video')) {
      setUploadedVideoFile(selectedFile);
    } else {
      setUploadedVideoFile(null);
      toast({
        title: "Invalid File",
        description: "Please select a valid video file",
        variant: "destructive",
      });
    }
  };

  const analyzeUploadedVideo = async () => {
    if (!uploadedVideoFile) return;

    setIsTranscribing(true);
    try {
      // Upload video
      const formData = new FormData();
      formData.append('video', uploadedVideoFile);

      const uploadResponse = await fetch('/api/prepare/self-intro/upload-video', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video');
      }

      const uploadData = await uploadResponse.json();

      // Analyze video
      const analyzeResponse = await fetch('/api/prepare/self-intro/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoPath: uploadData.data.videoPath,
          script: scriptData.finalScript
        }),
        credentials: 'include',
      });

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze video');
      }

      const analyzeData = await analyzeResponse.json();
      setFinalAssessment(analyzeData.data);

      toast({
        title: "Analysis Complete",
        description: `Overall Score: ${Math.round(analyzeData.data.overall_score)}/100`,
      });
    } catch (error) {
      console.error("Error analyzing uploaded video:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.src = '';
      }

      // Prefer MP4 over WebM
      let mimeType = 'video/webm';
      const preferredTypes = [
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp8',
        'video/webm;codecs=vp9',
        'video/webm',
      ];

      for (const type of preferredTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);

        if (videoRef.current) {
          const url = URL.createObjectURL(blob);
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
          videoRef.current.load();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: "Recording Started",
        description: "Read your script naturally",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera and microphone access",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopCamera();
      toast({
        title: "Recording Stopped",
        description: "You can now analyze your video",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const analyzeRecording = async () => {
    if (!recordedBlob) return;

    setIsProcessing(true);
    try {
      // Upload video
      const fileType = recordedBlob.type;
      const fileExtension = fileType.includes('mp4') ? 'mp4' :
                           fileType.includes('webm') ? 'webm' : 'bin';

      const file = new File([recordedBlob], `self-intro.${fileExtension}`, { type: fileType });
      const formData = new FormData();
      formData.append('video', file);

      const uploadResponse = await fetch('/api/prepare/self-intro/upload-video', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video');
      }

      const uploadData = await uploadResponse.json();

      // Analyze video
      const analyzeResponse = await fetch('/api/prepare/self-intro/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoPath: uploadData.data.videoPath,
          script: scriptData.finalScript
        }),
        credentials: 'include',
      });

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze video');
      }

      const analyzeData = await analyzeResponse.json();
      setFinalAssessment(analyzeData.data);

      toast({
        title: "Analysis Complete",
        description: `Overall Score: ${Math.round(analyzeData.data.overall_score)}/100`,
      });
    } catch (error) {
      console.error("Error analyzing video:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadVideo = () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const fileExtension = recordedBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const a = document.createElement('a');
    a.href = url;
    a.download = `self-introduction.${fileExtension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(scriptData.finalScript);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Script copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Copy Failed",
        description: "Could not copy script to clipboard",
        variant: "destructive",
      });
    }
  };

  const nextStep = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const goToStep = (stepNumber: number) => {
    setCurrentStep(stepNumber);
  };

  const progress = (currentStep / 7) * 100;

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle>Script Your Self-Introduction</CardTitle>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Step {currentStep} of 7</span>
              <span className="font-semibold">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[...Array(7)].map((_, index) => {
              const stepNum = index + 1;
              const stepLabel = stepNum <= 4 ? STEPS[stepNum - 1].title :
                                stepNum === 5 ? "Polish" :
                                stepNum === 6 ? "Record" : "Assess";

              return (
                <button
                  key={stepNum}
                  onClick={() => goToStep(stepNum)}
                  className="focus:outline-none"
                >
                  <Badge
                    variant={currentStep === stepNum ? "default" : "outline"}
                    className={`whitespace-nowrap cursor-pointer transition-all hover:shadow-md ${
                      currentStep === stepNum
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'hover:bg-purple-50 hover:border-purple-300'
                    }`}
                  >
                    {stepNum}. {stepLabel}
                  </Badge>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-[400px]"
            >
              {/* Steps 1-4: Who, What, Why, Closing Hook */}
              {currentStep >= 1 && currentStep <= 4 && (
                <div className="space-y-4">
                  <Alert className="bg-blue-50 border-blue-200">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                    <AlertDescription className="text-blue-900">
                      <strong>{STEPS[currentStep - 1].title}</strong> - {STEPS[currentStep - 1].subtitle}
                      <br /><br />
                      {STEPS[currentStep - 1].prompt}
                    </AlertDescription>
                  </Alert>

                  <div>
                    <label className="block font-semibold mb-2">
                      {STEPS[currentStep - 1].title}
                    </label>
                    <Textarea
                      placeholder={STEPS[currentStep - 1].example}
                      value={scriptData[currentStep === 1 ? 'who' : currentStep === 2 ? 'what' : currentStep === 3 ? 'why' : 'closingHook']}
                      onChange={(e) => setScriptData({
                        ...scriptData,
                        [currentStep === 1 ? 'who' : currentStep === 2 ? 'what' : currentStep === 3 ? 'why' : 'closingHook']: e.target.value
                      })}
                      className="min-h-24"
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h5 className="font-semibold text-gray-700 mb-2">Tips:</h5>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {STEPS[currentStep - 1].tips.map((tip, index) => <li key={index}>{tip}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              {/* Step 5: Polish Script */}
              {currentStep === 5 && (
                <Card className="border-none shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl">✨ Polish Your Script</CardTitle>
                        <p className="text-gray-600">Let AI polish your script for clarity, structure, and impact</p>
                      </div>
                      <CreditCostBadge credits={SCRIPT_POLISHING_COST} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Card className="bg-gray-50">
                      <CardHeader>
                        <CardTitle className="text-base">Your Draft Script</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 text-sm">
                          <p><strong>WHO:</strong> {scriptData.who || "Not provided yet"}</p>
                          <p><strong>WHAT:</strong> {scriptData.what || "Not provided yet"}</p>
                          <p><strong>WHY:</strong> {scriptData.why || "Not provided yet"}</p>
                          <p><strong>CLOSING:</strong> {scriptData.closingHook || "Not provided yet"}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Button
                      onClick={handlePolishing}
                      disabled={isProcessing || !scriptData.who || !scriptData.what || !scriptData.why || !scriptData.closingHook}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Polishing Your Script...
                        </>
                      ) : (
                        <>
                          Polish My Script with AI ({SCRIPT_POLISHING_COST} credits)
                        </>
                      )}
                    </Button>

                    {scriptData.finalScript && (
                      <Card className="bg-green-50 border-green-200">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base text-green-900">✨ Your Polished Script</CardTitle>
                            <Button
                              onClick={copyToClipboard}
                              size="sm"
                              variant="outline"
                              className="border-green-300 hover:bg-green-100"
                            >
                              {isCopied ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4 mr-2" />
                                  Copy Script
                                </>
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {aiCoaching && <p className="text-sm leading-relaxed text-green-900 mb-3">{aiCoaching}</p>}
                          <div className="bg-white rounded-lg p-4 border border-green-200">
                            <p className="text-sm leading-relaxed text-green-900 whitespace-pre-line">{scriptData.finalScript}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 6: Record Video */}
              {currentStep === 6 && (
                <Card className="border-none shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl">📹 Record Your Video</CardTitle>
                        <p className="text-gray-600">Record your self-introduction using your polished script</p>
                      </div>
                      <CreditCostBadge credits={VIDEO_RECORDING_COST} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid lg:grid-cols-2 gap-4">
                      {/* Video Recording/Playback Area */}
                      <div className="space-y-3">
                        <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video relative">
                          <video
                            ref={videoRef}
                            autoPlay={isRecording}
                            playsInline
                            muted={isRecording}
                            controls={recordedBlob && !isRecording}
                            className="w-full h-full object-cover"
                          />
                          {!isRecording && !recordedBlob && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                              <div className="text-center text-white">
                                <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Click "Start Recording" to begin</p>
                              </div>
                            </div>
                          )}
                          {isRecording && (
                            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
                              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                              <span className="text-sm font-medium">Recording</span>
                            </div>
                          )}
                        </div>

                        {/* Recording Controls */}
                        <div className="flex gap-2">
                          {!isRecording && !recordedBlob && (
                            <Button
                              onClick={startRecording}
                              className="flex-1 bg-red-600 hover:bg-red-700"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Start Recording
                            </Button>
                          )}

                          {isRecording && (
                            <Button
                              onClick={stopRecording}
                              className="flex-1 bg-gray-600 hover:bg-gray-700"
                            >
                              <Square className="w-4 h-4 mr-2" />
                              Stop Recording
                            </Button>
                          )}

                          {recordedBlob && !isRecording && (
                            <>
                              <Button
                                onClick={downloadVideo}
                                variant="outline"
                                className="flex-1"
                              >
                                <FileVideo className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                              <Button
                                onClick={() => {
                                  setRecordedBlob(null);
                                  if (videoRef.current) {
                                    videoRef.current.src = '';
                                    videoRef.current.srcObject = null;
                                  }
                                  startRecording();
                                }}
                                variant="outline"
                                className="flex-1"
                              >
                                <Video className="w-4 h-4 mr-2" />
                                Re-record
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Editable Script Display Area */}
                      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 h-fit lg:sticky lg:top-4">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                              <Lightbulb className="w-5 h-5" />
                              Your Polished Script
                            </CardTitle>
                            {!isEditingScript && (
                              <Button
                                onClick={() => {
                                  setEditedScript(scriptData.finalScript || "");
                                  setIsEditingScript(true);
                                }}
                                size="sm"
                                variant="outline"
                                className="border-blue-300 hover:bg-blue-100"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {isEditingScript ? (
                            <div className="space-y-3">
                              <Textarea
                                value={editedScript}
                                onChange={(e) => setEditedScript(e.target.value)}
                                className="min-h-[300px] bg-white"
                                placeholder="Edit your script here..."
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={handleSaveEditedScript}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                  <Save className="w-4 h-4 mr-2" />
                                  Save Changes
                                </Button>
                                <Button
                                  onClick={() => setIsEditingScript(false)}
                                  variant="outline"
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="bg-white rounded-lg p-4 border-2 border-blue-300 shadow-sm max-h-[400px] overflow-y-auto">
                                <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-line">
                                  {scriptData.finalScript || "Complete the script polishing step first to see your script here."}
                                </p>
                              </div>
                              <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                                <p className="text-xs text-blue-800">
                                  <strong>💡 Tip:</strong> Read naturally and maintain eye contact with the camera.
                                </p>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 7: Assess Video */}
              {currentStep === 7 && (
                <Card className="border-none shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl">🎯 AI Video Assessment</CardTitle>
                        <p className="text-gray-600">Get detailed feedback on your video performance</p>
                      </div>
                      <CreditCostBadge credits={VIDEO_ASSESSMENT_COST} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Option 1: Analyze Recorded Video */}
                    {recordedBlob && !finalAssessment && (
                      <div>
                        <h3 className="font-semibold text-lg mb-3">Analyze Recorded Video</h3>
                        <Button
                          onClick={analyzeRecording}
                          disabled={isProcessing || isTranscribing}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Analyzing Video...
                            </>
                          ) : (
                            <>
                              Analyze Recorded Video ({VIDEO_ASSESSMENT_COST} credits)
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Divider */}
                    {!finalAssessment && (recordedBlob || uploadedVideoFile) && (
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-white text-gray-500">OR</span>
                        </div>
                      </div>
                    )}

                    {/* Option 2: Upload Pre-recorded Video */}
                    {!finalAssessment && (
                      <div>
                        <h3 className="font-semibold text-lg mb-3">Upload Your Video</h3>
                        <p className="text-sm text-gray-600 mb-4">Already recorded a video? Upload it for AI assessment.</p>

                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleUploadedVideoChange}
                            className="hidden"
                            id="video-upload"
                          />
                          <label htmlFor="video-upload" className="cursor-pointer block p-4">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">
                              {uploadedVideoFile ? uploadedVideoFile.name : "Click to upload your recorded video"}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI, or WebM (max 100MB)</p>
                          </label>
                        </div>

                        {uploadedVideoFile && (
                          <Button
                            onClick={analyzeUploadedVideo}
                            disabled={isProcessing || isTranscribing}
                            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600"
                          >
                            {isTranscribing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                Analyze Uploaded Video ({VIDEO_ASSESSMENT_COST} credits)
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Assessment Results */}
                    {finalAssessment && (
                      <div className="space-y-4">
                        {/* Transcript Display */}
                        {finalAssessment.transcript && (
                          <Card className="bg-gray-50 border-gray-200">
                            <CardHeader>
                              <CardTitle className="text-base">📝 Transcript</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                {finalAssessment.transcript}
                              </p>
                            </CardContent>
                          </Card>
                        )}

                        {/* Overall Score */}
                        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                          <CardHeader>
                            <CardTitle className="text-center">Overall Score</CardTitle>
                          </CardHeader>
                          <CardContent className="text-center">
                            <div className="text-6xl font-bold text-green-700 mb-2">
                              {Math.round(finalAssessment.overall_score)}
                            </div>
                            <p className="text-green-600">out of 100</p>
                          </CardContent>
                        </Card>

                        {/* Individual Scores */}
                        <div className="grid md:grid-cols-3 gap-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Clarity</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-3xl font-bold text-blue-600">
                                {Math.round(finalAssessment.clarity_score)}
                              </div>
                              <Progress value={finalAssessment.clarity_score} className="mt-2" />
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Confidence</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-3xl font-bold text-purple-600">
                                {Math.round(finalAssessment.confidence_score)}
                              </div>
                              <Progress value={finalAssessment.confidence_score} className="mt-2" />
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Structure</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-3xl font-bold text-pink-600">
                                {Math.round(finalAssessment.structure_score)}
                              </div>
                              <Progress value={finalAssessment.structure_score} className="mt-2" />
                            </CardContent>
                          </Card>
                        </div>

                        {/* Strengths */}
                        <Card className="bg-green-50 border-green-200">
                          <CardHeader>
                            <CardTitle className="text-green-900">✨ Strengths</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {finalAssessment.strengths?.map((strength, index) => (
                                <li key={index} className="flex items-start gap-2 text-green-800">
                                  <CheckCircle2 className="w-5 h-5 mt-0.5 text-green-600 flex-shrink-0" />
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>

                        {/* Improvements */}
                        <Card className="bg-orange-50 border-orange-200">
                          <CardHeader>
                            <CardTitle className="text-orange-900">💡 Areas for Improvement</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {finalAssessment.improvements?.map((improvement, index) => (
                                <li key={index} className="flex items-start gap-2 text-orange-800">
                                  <AlertCircle className="w-5 h-5 mt-0.5 text-orange-600 flex-shrink-0" />
                                  {improvement}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>

                        {/* Detailed Feedback */}
                        <Card className="bg-blue-50 border-blue-200">
                          <CardHeader>
                            <CardTitle className="text-blue-900">📋 Detailed Feedback</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-blue-800 leading-relaxed">{finalAssessment.ai_feedback}</p>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-6 pt-6 border-t">
            <Button
              onClick={prevStep}
              disabled={currentStep === 1}
              variant="outline"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button
              onClick={nextStep}
              disabled={
                (currentStep === 1 && !scriptData.who) ||
                (currentStep === 2 && !scriptData.what) ||
                (currentStep === 3 && !scriptData.why) ||
                (currentStep === 4 && !scriptData.closingHook) ||
                (currentStep === 5 && !scriptData.finalScript) ||
                (currentStep === 6 && !recordedBlob && !uploadedVideoFile) ||
                currentStep === 7
              }
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {currentStep === 7 ? "Complete!" : (
                <>
                  Next
                  <Sparkles className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
