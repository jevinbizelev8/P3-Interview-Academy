
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Lightbulb, ArrowRight, ArrowLeft, CheckCircle2,
  Loader2, Copy, Check, Video, Play, StopCircle, Download, Pencil, Upload
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import CreditCostBadge from "../shared/CreditCostBadge";

import { awardXP, calculateReadinessScore, updateStreak, XP_VALUES } from "../utils/scoring";

const SCRIPT_POLISHING_COST = 3;
const VIDEO_RECORDING_COST = 3;
const VIDEO_ASSESSMENT_COST = 5;

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
      "Mention your company if it's recognisable",
      "Keep it to 1-2 sentences"
    ]
  },
  {
    id: 2,
    title: "What Do You Do?",
    subtitle: "Key Skills & Achievements",
    prompt: "Highlight your expertise and one quantifiable achievement",
    example: "I specialise in React and Node.js, and recently led the migration of our monolith to microservices, which improved system reliability by 40% and reduced deployment time from hours to minutes.",
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

export default function SelfIntroScriptingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [scriptData, setScriptData] = useState({
    who: "",
    what: "",
    why: "",
    closingHook: "",
    finalScript: ""
  });
  const [aiCoaching, setAiCoaching] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [finalAssessment, setFinalAssessment] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [currentCredits, setCurrentCredits] = useState(null);

  const [isEditingScript, setIsEditingScript] = useState(false);
  const [editedScript, setEditedScript] = useState("");
  const [uploadedVideoFile, setUploadedVideoFile] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = React.useRef(null);
  const chunksRef = React.useRef([]);
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);

  const queryClient = useQueryClient();

  // Load saved draft
  const { data: savedDraft } = useQuery({
    queryKey: ['selfIntroDraft'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return null; // No user, no draft to load
      const drafts = await base44.entities.SelfIntroDraft.filter({ created_by: user.email });
      if (drafts.length > 0) {
        return drafts[0];
      }
      return null;
    }
  });

  // Load draft data on mount
  React.useEffect(() => {
    if (savedDraft) {
      setScriptData({
        who: savedDraft.who || "",
        what: savedDraft.what || "",
        why: savedDraft.why || "",
        closingHook: savedDraft.closingHook || "",
        finalScript: savedDraft.finalScript || ""
      });
    }
  }, [savedDraft]);

  // Auto-save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      if (!user) return; // Cannot save draft if not logged in
      const drafts = await base44.entities.SelfIntroDraft.filter({ created_by: user.email });
      
      const draftDataToSave = {
        who: data.who,
        what: data.what,
        why: data.why,
        closingHook: data.closingHook,
        finalScript: data.finalScript,
        last_updated: new Date().toISOString(),
        created_by: user.email // Ensure created_by is set for new drafts
      };

      if (drafts.length > 0) {
        return await base44.entities.SelfIntroDraft.update(drafts[0].id, draftDataToSave);
      } else {
        return await base44.entities.SelfIntroDraft.create(draftDataToSave);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['selfIntroDraft']);
    }
  });

  // Auto-save when scriptData changes
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (scriptData.who || scriptData.what || scriptData.why || scriptData.closingHook || scriptData.finalScript) {
        // Only trigger save if user is logged in
        base44.auth.me().then(user => {
          if (user) {
            saveDraftMutation.mutate(scriptData);
          }
        }).catch(console.error);
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [scriptData]);

  // Fetch credits
  React.useEffect(() => {
    const fetchCredits = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          const subs = await base44.entities.Subscription.filter({ user_id: user.id });
          if (subs.length > 0) {
            setCurrentCredits(subs[0].current_credits);
          }
        }
      } catch (error) {
        console.error("Error fetching credits:", error);
      }
    };
    fetchCredits();
  }, []);

  const getAICoaching = async (prompt, context) => {
    setIsProcessing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${prompt}\n\nUser's input: ${context}`,
        response_json_schema: {
          type: "object",
          properties: {
            feedback: { type: "string" },
            suggestions: { type: "array", items: { type: "string" } }
          }
        }
      });
      setAiCoaching(result.feedback);
      return result;
    } catch (error) {
      console.error("Error getting AI coaching:", error);
      setAiCoaching("An error occurred while getting AI coaching. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePolishing = async () => {
    if (currentCredits !== null && currentCredits < SCRIPT_POLISHING_COST) {
      alert(`Insufficient credits! You need ${SCRIPT_POLISHING_COST} credits for script polishing.`);
      return;
    }

    setIsProcessing(true);
    try {
      const user = await base44.auth.me();
      if (!user) {
        alert('You must be logged in to polish your script.');
        setIsProcessing(false);
        return;
      }
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      const subscription = subs[0];

      if (!subscription || subscription.current_credits < SCRIPT_POLISHING_COST) {
        alert(`Insufficient credits! You need ${SCRIPT_POLISHING_COST} credits for script polishing. Please purchase more credits or upgrade your plan.`);
        setIsProcessing(false);
        return;
      }

      const fullScript = `${scriptData.who}\n\n${scriptData.what}\n\n${scriptData.why}\n\n${scriptData.closingHook}`;
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Polish this self-introduction script. Ensure it's 150-200 words, has clarity, good structure, relevance, and concrete results. Provide the polished version and specific improvements made.\n\nScript: ${fullScript}`,
        response_json_schema: {
          type: "object",
          properties: {
            polished_script: { type: "string" },
            improvements: { type: "array", items: { type: "string" } },
            word_count: { type: "number" }
          }
        }
      });
      
      const updatedScript = { ...scriptData, finalScript: result.polished_script };
      setScriptData(updatedScript);
      
      // Save the polished script immediately
      await saveDraftMutation.mutateAsync(updatedScript);
      
      setAiCoaching(`Your script has been polished! Word count: ${result.word_count}. Improvements made: ${result.improvements.join(', ')}`);

      // Deduct credits
      const newBalance = subscription.current_credits - SCRIPT_POLISHING_COST;
      await base44.entities.Subscription.update(subscription.id, {
        current_credits: newBalance
      });

      await base44.entities.CreditLedger.create({
        user_id: user.id,
        transaction_type: "consumption",
        credits_amount: -SCRIPT_POLISHING_COST,
        balance_after: newBalance,
        feature_used: "Script Polishing",
        description: "Self-introduction script polishing"
      });

      setCurrentCredits(newBalance);
    } catch (error) {
      console.error("Error polishing script:", error);
      setAiCoaching("An error occurred while polishing your script. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEditedScript = async () => {
    const updatedScript = { ...scriptData, finalScript: editedScript };
    setScriptData(updatedScript);
    await saveDraftMutation.mutateAsync(updatedScript);
    setIsEditingScript(false);
  };

  const handleUploadedVideoChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.includes('video')) {
      setUploadedVideoFile(selectedFile);
    } else {
      setUploadedVideoFile(null);
      alert('Please select a valid video file.');
    }
  };

  const analyzeUploadedVideo = async () => {
    if (!uploadedVideoFile) return;
    if (currentCredits !== null && currentCredits < VIDEO_ASSESSMENT_COST) {
      alert(`Insufficient credits! You need ${VIDEO_ASSESSMENT_COST} credits for video assessment.`);
      return;
    }

    setIsTranscribing(true);
    try {
      const user = await base44.auth.me();
      if (!user) {
        alert('You must be logged in to analyze videos.');
        setIsTranscribing(false);
        return;
      }

      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      const subscription = subs[0];

      if (!subscription || subscription.current_credits < VIDEO_ASSESSMENT_COST) {
        alert(`Insufficient credits! You need ${VIDEO_ASSESSMENT_COST} credits for video assessment. Please purchase more credits or upgrade your plan.`);
        setIsTranscribing(false);
        return;
      }

      // Upload the video
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadedVideoFile });

      // Get transcript and analysis from the video
      const assessment = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this self-introduction video recording. First, transcribe the spoken content, then evaluate the performance based on content and delivery.

Provide detailed assessment:
1. Transcript: Full transcription of what was said
2. Clarity Score (0-100): How clearly the person communicated
3. Confidence Score (0-100): Level of confidence demonstrated in delivery
4. Structure Score (0-100): How well organized the self-introduction was (WHO-WHAT-WHY-CLOSING)
5. Overall Score (0-100): Overall performance quality
6. Strengths (array): 3-5 things done well
7. Improvements (array): 3-5 specific areas for improvement
8. AI Feedback (string): Detailed 2-3 paragraph feedback on content and delivery
9. Duration: Video duration in seconds

${scriptData.finalScript ? `Expected Script (for comparison):\n${scriptData.finalScript}` : ''}`,
        response_json_schema: {
          type: "object",
          properties: {
            transcript: { type: "string" },
            clarity_score: { type: "number" },
            confidence_score: { type: "number" },
            structure_score: { type: "number" },
            overall_score: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            ai_feedback: { type: "string" },
            duration_seconds: { type: "number" }
          }
        },
        file_urls: [file_url]
      });

      const selfIntro = await base44.entities.SelfIntro.create({
        video_url: file_url,
        transcript: assessment.transcript || "",
        duration_seconds: assessment.duration_seconds || 0,
        clarity_score: assessment.clarity_score,
        confidence_score: assessment.confidence_score,
        structure_score: assessment.structure_score,
        overall_score: assessment.overall_score,
        ai_feedback: assessment.ai_feedback,
        strengths: assessment.strengths,
        improvements: assessment.improvements
      });

      // Deduct credits
      const newBalance = subscription.current_credits - VIDEO_ASSESSMENT_COST;
      await base44.entities.Subscription.update(subscription.id, {
        current_credits: newBalance
      });

      await base44.entities.CreditLedger.create({
        user_id: user.id,
        transaction_type: "consumption",
        credits_amount: -VIDEO_ASSESSMENT_COST,
        balance_after: newBalance,
        feature_used: "Video AI Assessment",
        description: "Self-introduction uploaded video assessment"
      });

      setCurrentCredits(newBalance);

      // Award XP
      await awardXP(user.id, XP_VALUES.SELF_INTRO_COMPLETE, "Completed self-introduction video assessment", selfIntro.id);
      await updateStreak(user.id);
      await calculateReadinessScore(user.id);

      setFinalAssessment(assessment);
    } catch (error) {
      console.error("Error analyzing uploaded video:", error);
      alert(`An error occurred during analysis: ${error.message}. Please try again.`);
    } finally {
      setIsTranscribing(false);
    }
  };


  const startRecording = async () => {
    if (currentCredits !== null && currentCredits < VIDEO_RECORDING_COST) {
      alert(`Insufficient credits! You need ${VIDEO_RECORDING_COST} credits for video recording.`);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.src = null; // Clear any previous blob URL
      }

      // Check for supported MIME types and prefer MP4
      let mimeType = 'video/webm'; // Default to webm as a fallback
      const preferredTypes = [
        'video/mp4;codecs=avc1', // H.264
        'video/mp4',             // Generic MP4
        'video/webm;codecs=vp8',
        'video/webm;codecs=vp9',
        'video/webm',            // Generic WebM
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
        const blob = new Blob(chunksRef.current, { type: mimeType }); // Use the determined mimeType
        setRecordedBlob(blob);
        
        // Set the recorded video as the source for playback
        if (videoRef.current) {
          const url = URL.createObjectURL(blob);
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
          videoRef.current.load(); // Load the new source
          videoRef.current.muted = false; // Unmute for playback
        }

        // Deduct credits for recording
        try {
          const user = await base44.auth.me();
          if (!user) { // Ensure user is logged in before deducting
            console.error("User not logged in, cannot deduct credits for recording.");
            return;
          }
          const subs = await base44.entities.Subscription.filter({ user_id: user.id });
          const subscription = subs[0];

          if (!subscription || subscription.current_credits < VIDEO_RECORDING_COST) {
            alert(`Insufficient credits! You need ${VIDEO_RECORDING_COST} credits for video recording.`);
            return;
          }

          const newBalance = subscription.current_credits - VIDEO_RECORDING_COST;
          
          await base44.entities.Subscription.update(subscription.id, {
            current_credits: newBalance
          });

          await base44.entities.CreditLedger.create({
            user_id: user.id,
            transaction_type: "consumption",
            credits_amount: -VIDEO_RECORDING_COST,
            balance_after: newBalance,
            feature_used: "Video Recording",
            description: "Self-introduction video recording"
          });

          setCurrentCredits(newBalance);
        } catch (error) {
          console.error("Error deducting credits for recording:", error);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to access camera. Please ensure you've granted camera permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current && !recordedBlob) { // Only clear srcObject if no blob is available for playback
        videoRef.current.srcObject = null;
      }
    }
  };

  const analyzeRecording = async () => {
    if (!recordedBlob) return;
    if (currentCredits !== null && currentCredits < VIDEO_ASSESSMENT_COST) {
      alert(`Insufficient credits! You need ${VIDEO_ASSESSMENT_COST} credits for video assessment.`);
      return;
    }

    setIsProcessing(true);
    try {
      const user = await base44.auth.me();
      if (!user) { // Ensure user is logged in before deducting
        console.error("User not logged in, cannot deduct credits for assessment.");
        setIsProcessing(false);
        return;
      }
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      const subscription = subs[0];

      if (!subscription || subscription.current_credits < VIDEO_ASSESSMENT_COST) {
        alert(`Insufficient credits! You need ${VIDEO_ASSESSMENT_COST} credits for video assessment.`);
        setIsProcessing(false);
        return;
      }

      // Determine file extension based on the recordedBlob's type
      const fileType = recordedBlob.type;
      const fileExtension = fileType.includes('mp4') ? 'mp4' : fileType.includes('webm') ? 'webm' : 'bin';
      
      const file = new File([recordedBlob], `self-intro.${fileExtension}`, { type: fileType });
      
      // Upload the video
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      let assessment;
      let descriptionForLedger = "Self-introduction video assessment";

      if (fileExtension === 'webm') {
        // If the file is webm, we need to handle it differently for AI analysis.
        // The LLM cannot directly analyze webm, so we'll use text-based analysis of the script.
        assessment = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this self-introduction script and provide detailed feedback. Since the recorded video is in WebM format which is not directly supported for AI video analysis, please provide scores and feedback based on the script quality, structure, and content.
The script used was:
${scriptData.finalScript}

Provide:
1. Clarity Score (0-100): How clear and well-structured the script is, assuming it was delivered well.
2. Confidence Score (0-100): Estimated confidence based on the strength and assertiveness of the script content.
3. Structure Score (0-100): How well the script follows the WHO-WHAT-WHY-CLOSING structure.
4. Overall Score (0-100): Overall quality assessment of the script's content and structure.
5. Strengths (array): 3-5 strong points about the script.
6. Improvements (array): 3-5 suggestions for improving the script's content, structure, or potential delivery.
7. AI Feedback (string): Detailed 2-3 paragraph feedback on the script.
8. Duration: Estimate the speaking duration in seconds, assuming a normal speaking pace (e.g., 150 words ~ 60 seconds).`,
          response_json_schema: {
            type: "object",
            properties: {
              transcript: { type: "string" }, // Add transcript field, even if it's generated from script for webm
              clarity_score: { type: "number" },
              confidence_score: { type: "number" },
              structure_score: { type: "number" },
              overall_score: { type: "number" },
              strengths: { type: "array", items: { type: "string" } },
              improvements: { type: "array", items: { type: "string" } },
              ai_feedback: { type: "string" },
              duration_seconds: { type: "number" }
            }
          }
        });
        descriptionForLedger = "Self-introduction script assessment (video recorded in unsupported format)";
      } else {
        // For MP4 (or other directly supported formats), perform full video analysis
        assessment = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyse this self-introduction video. Provide scores (0-100) for clarity, confidence, structure, and overall performance. Also provide strengths, improvements, detailed feedback, and a full transcript of the spoken content. The script used was:\n\n${scriptData.finalScript}`,
          response_json_schema: {
            type: "object",
            properties: {
              transcript: { type: "string" }, // Add this
              clarity_score: { type: "number" },
              confidence_score: { type: "number" },
              structure_score: { type: "number" },
              overall_score: { type: "number" },
              strengths: { type: "array", items: { type: "string" } },
              improvements: { type: "array", items: { type: "string" } },
              ai_feedback: { type: "string" },
              duration_seconds: { type: "number" }
            }
          },
          file_urls: [file_url] // This enables video analysis
        });
      }

      const selfIntro = await base44.entities.SelfIntro.create({
        video_url: file_url,
        transcript: assessment.transcript || "",
        duration_seconds: assessment.duration_seconds || 0,
        clarity_score: assessment.clarity_score,
        confidence_score: assessment.confidence_score,
        structure_score: assessment.structure_score,
        overall_score: assessment.overall_score,
        ai_feedback: assessment.ai_feedback,
        strengths: assessment.strengths,
        improvements: assessment.improvements
      });

      // Deduct credits for assessment
      const newBalance = subscription.current_credits - VIDEO_ASSESSMENT_COST;
      await base44.entities.Subscription.update(subscription.id, {
        current_credits: newBalance
      });

      await base44.entities.CreditLedger.create({
        user_id: user.id,
        transaction_type: "consumption",
        credits_amount: -VIDEO_ASSESSMENT_COST,
        balance_after: newBalance,
        feature_used: "Video AI Assessment",
        description: descriptionForLedger
      });

      setCurrentCredits(newBalance);

      // Award XP
      await awardXP(user.id, XP_VALUES.SELF_INTRO_COMPLETE, "Completed self-introduction video", selfIntro.id);
      await updateStreak(user.id);
      await calculateReadinessScore(user.id);

      setFinalAssessment(assessment);
    } catch (error) {
      console.error("Error analysing video:", error);
      alert("An error occurred during analysis. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadVideo = () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const fileExtension = recordedBlob.type.includes('mp4') ? 'mp4' : recordedBlob.type.includes('webm') ? 'webm' : 'bin';
    const a = document.createElement('a');
    a.href = url;
    a.download = `self-introduction.${fileExtension}`; // Dynamic extension
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(scriptData.finalScript);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      const textArea = document.createElement("textarea");
      textArea.value = scriptData.finalScript;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Fallback copy failed:", err);
        alert("Failed to copy script. Please copy manually.");
      }
      document.body.removeChild(textArea);
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

  const goToStep = (stepNumber) => {
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
                  <Alert className={`bg-${currentStep === 2 ? 'purple' : 'blue'}-50 border-${currentStep === 2 ? 'purple' : 'blue'}-200`}>
                    <Lightbulb className={`w-5 h-5 text-${currentStep === 2 ? 'purple' : 'blue'}-600`} />
                    <AlertDescription className={`text-${currentStep === 2 ? 'purple' : 'blue'}-900`}>
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
                      onChange={(e) => setScriptData({ ...scriptData, [currentStep === 1 ? 'who' : currentStep === 2 ? 'what' : currentStep === 3 ? 'why' : 'closingHook']: e.target.value })}
                      className="min-h-24"
                    />
                  </div>

                  {((currentStep === 1 && scriptData.who) || (currentStep === 2 && scriptData.what) || (currentStep === 3 && scriptData.why) || (currentStep === 4 && scriptData.closingHook)) && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <AlertDescription className="text-green-900">
                        {currentStep === 1 && "Great start! Remember to keep it concise and relevant."}
                        {currentStep === 2 && "Excellent! Quantifiable achievements make your story compelling."}
                        {currentStep === 3 && "Spot on! Showing alignment is crucial for a good fit."}
                        {currentStep === 4 && "Perfect! A strong closing hook invites dialogue."}
                      </AlertDescription>
                    </Alert>
                  )}
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
                        <p className="text-gray-600">Let's polish your full script! The AI will check for clarity, structure, relevance, and ensure it includes concrete results.</p>
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
                      disabled={isProcessing || !scriptData.who || !scriptData.what || !scriptData.why || !scriptData.closingHook || (currentCredits !== null && currentCredits < SCRIPT_POLISHING_COST)}
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
                                  <Check className="w-4 h-4 mr-2 text-green-600" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy Script
                                </>
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm leading-relaxed text-green-900 mb-3">{aiCoaching && aiCoaching}</p>
                          <div className="bg-white rounded-lg p-4 border border-green-200">
                            <p className="text-sm leading-relaxed text-green-900 whitespace-pre-line">{scriptData.finalScript}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 6: Record Video - UPDATED WITH EDITABLE SCRIPT */}
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
                              disabled={currentCredits !== null && currentCredits < VIDEO_RECORDING_COST}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Start Recording ({VIDEO_RECORDING_COST} credits)
                            </Button>
                          )}
                          
                          {isRecording && (
                            <Button
                              onClick={stopRecording}
                              className="flex-1 bg-gray-600 hover:bg-gray-700"
                            >
                              <StopCircle className="w-4 h-4 mr-2" />
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
                                <Download className="w-4 h-4 mr-2" />
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

                        {recordedBlob && !isRecording && (
                          <Alert className="bg-green-50 border-green-200">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <AlertDescription className="text-green-900">
                              <strong>Video recorded successfully!</strong> You can replay it above or proceed to the assessment step.
                            </AlertDescription>
                          </Alert>
                        )}
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
                                <Pencil className="w-4 h-4 mr-2" />
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
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
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
                                  <strong>💡 Tip:</strong> Read naturally and maintain eye contact with the camera. Take your time and speak clearly.
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

              {/* Step 7: Assess Video - UPDATED WITH UPLOAD OPTION */}
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
                          disabled={isProcessing || isTranscribing || (currentCredits !== null && currentCredits < VIDEO_ASSESSMENT_COST)}
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
                        <p className="text-sm text-gray-600 mb-4">Already recorded a video? Upload it for AI assessment based on voice transcript.</p>
                        
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
                            disabled={isProcessing || isTranscribing || (currentCredits !== null && currentCredits < VIDEO_ASSESSMENT_COST)}
                            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600"
                          >
                            {isTranscribing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Transcribing & Analyzing...
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
                                  <Lightbulb className="w-5 h-5 mt-0.5 text-orange-600 flex-shrink-0" />
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
              <ArrowLeft className="w-4 h-4 mr-2" />
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
                (currentStep === 6 && !recordedBlob) ||
                currentStep === 7
              }
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {currentStep === 7 ? "Complete!" : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

