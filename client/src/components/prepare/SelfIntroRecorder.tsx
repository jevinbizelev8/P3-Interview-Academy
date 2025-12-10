import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Video, StopCircle, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface VideoAnalysis {
  clarity_score: number;
  confidence_score: number;
  structure_score: number;
  overall_score: number;
  strengths: string[];
  improvements: string[];
  ai_feedback: string;
  transcript?: string;
  duration_seconds?: number;
}

export default function SelfIntroRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [browserSupported, setBrowserSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Check browser support on mount
  React.useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setBrowserSupported(false);
      toast({
        title: "Browser Not Supported",
        description: "Your browser doesn't support video recording. Please use Chrome, Edge, or Firefox.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Check for supported MIME types (prefer MP4, fallback to WebM)
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

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);

        // Set recorded video for playback
        if (videoRef.current) {
          const url = URL.createObjectURL(blob);
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
          videoRef.current.load();
        }

        stopCamera();
      };

      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: "Recording Started",
        description: "Introduce yourself in 1-2 minutes",
      });
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera and microphone access to record your video.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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

  const analyzeVideo = async () => {
    if (!recordedBlob) return;

    setIsProcessing(true);
    try {
      // Determine file extension based on blob type
      const fileType = recordedBlob.type;
      const fileExtension = fileType.includes('mp4') ? 'mp4' :
                           fileType.includes('webm') ? 'webm' : 'bin';

      const file = new File([recordedBlob], `self-intro-${Date.now()}.${fileExtension}`, {
        type: fileType
      });

      // Upload video using FormData
      const formData = new FormData();
      formData.append('video', file);

      const uploadResponse = await fetch('/api/prepare/self-intro/upload-video', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload video');
      }

      const uploadData = await uploadResponse.json();

      // Analyze the uploaded video
      const analyzeResponse = await fetch('/api/prepare/self-intro/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoPath: uploadData.data.videoPath,
        }),
        credentials: 'include',
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.error || 'Failed to analyze video');
      }

      const analyzeData = await analyzeResponse.json();
      setAnalysis(analyzeData.data);

      toast({
        title: "Analysis Complete",
        description: `Overall Score: ${Math.round(analyzeData.data.overall_score)}/100`,
      });
    } catch (error) {
      console.error("Error analyzing video:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An error occurred during analysis",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setAnalysis(null);
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.srcObject = null;
    }
  };

  if (!browserSupported) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Browser Not Supported</strong>
          <br />
          Video recording requires a modern browser. Please use Chrome, Edge, or Firefox.
        </AlertDescription>
      </Alert>
    );
  }

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
              autoPlay={isRecording}
              muted={isRecording}
              playsInline
              controls={!!(recordedBlob && !isRecording)}
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
                  onClick={resetRecording}
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
                    <span className="text-3xl font-bold text-purple-600">
                      {Math.round(analysis.overall_score)}/100
                    </span>
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

                {analysis.transcript && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Transcript</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">{analysis.transcript}</p>
                  </div>
                )}

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

                <Button
                  onClick={resetRecording}
                  variant="outline"
                  className="w-full mt-6"
                >
                  Record New Video
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
