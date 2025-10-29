import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Video, StopCircle, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export default function SelfIntroRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const queryClient = useQueryClient();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        stopCamera();
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const analyzeVideo = async () => {
    if (!recordedBlob) return;
    
    setIsProcessing(true);
    try {
      const file = new File([recordedBlob], `self-intro-${Date.now()}.webm`, { type: 'video/webm' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this self-introduction video transcript. Provide detailed feedback on:
        1. Clarity (0-100): How clear and articulate is the speech?
        2. Confidence (0-100): How confident does the speaker appear?
        3. Structure (0-100): How well-structured is the introduction (opening, body, closing)?
        4. Overall Score (0-100): Average of the three metrics
        5. Strengths: List 3-5 specific strengths
        6. Improvements: List 3-5 specific areas to improve
        7. Detailed Feedback: 2-3 paragraphs of constructive feedback`,
        response_json_schema: {
          type: "object",
          properties: {
            clarity_score: { type: "number" },
            confidence_score: { type: "number" },
            structure_score: { type: "number" },
            overall_score: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            ai_feedback: { type: "string" }
          }
        },
        file_urls: file_url
      });

      await base44.entities.SelfIntro.create({
        video_url: file_url,
        duration_seconds: 120,
        clarity_score: result.clarity_score,
        confidence_score: result.confidence_score,
        structure_score: result.structure_score,
        overall_score: result.overall_score,
        ai_feedback: result.ai_feedback,
        strengths: result.strengths,
        improvements: result.improvements
      });

      setAnalysis(result);
      queryClient.invalidateQueries(['selfIntros']);
    } catch (error) {
      console.error("Error analyzing video:", error);
    }
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-6 h-6 text-blue-600" />
            Record Your Self-Introduction
          </CardTitle>
          <p className="text-sm text-gray-600">
            Introduce yourself in 1-2 minutes. Share your background, key achievements, and career goals.
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video mb-6">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!isRecording && !recordedBlob && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
                <div className="text-center text-white">
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Click "Start Recording" to begin</p>
                </div>
              </div>
            )}
            {isRecording && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                Recording
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {!isRecording && !recordedBlob && (
              <Button
                onClick={startRecording}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Video className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            )}
            {isRecording && (
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="flex-1"
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Stop Recording
              </Button>
            )}
            {recordedBlob && !analysis && (
              <>
                <Button
                  onClick={() => {
                    setRecordedBlob(null);
                    setAnalysis(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Re-record
                </Button>
                <Button
                  onClick={analyzeVideo}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Analyze Video
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold">Overall Score</span>
                    <span className="text-3xl font-bold text-purple-600">{Math.round(analysis.overall_score)}/100</span>
                  </div>
                  <Progress value={analysis.overall_score} className="h-3" />
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Clarity", score: analysis.clarity_score },
                    { label: "Confidence", score: analysis.confidence_score },
                    { label: "Structure", score: analysis.structure_score }
                  ].map((metric) => (
                    <div key={metric.label} className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-2">{metric.label}</p>
                      <p className="text-2xl font-bold text-purple-700">{Math.round(metric.score)}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Strengths
                    </h3>
                    <ul className="space-y-1">
                      {analysis.strengths?.map((strength, index) => (
                        <li key={index} className="text-sm text-green-800 flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Areas to Improve
                    </h3>
                    <ul className="space-y-1">
                      {analysis.improvements?.map((improvement, index) => (
                        <li key={index} className="text-sm text-orange-800 flex items-start gap-2">
                          <span className="text-orange-600 mt-1">•</span>
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-2">Detailed Feedback</h3>
                    <p className="text-sm text-purple-800 leading-relaxed">{analysis.ai_feedback}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}