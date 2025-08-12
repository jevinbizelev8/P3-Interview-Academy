import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { Mic, MicOff, Square, Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function VoiceRecorder({
  value,
  onChange,
  placeholder = "Start speaking or click the microphone button...",
  className
}: VoiceRecorderProps) {
  const [isRecordingSession, setIsRecordingSession] = useState(false);
  const [hasStartedRecording, setHasStartedRecording] = useState(false);
  
  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    finalTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error
  } = useSpeechToText({
    continuous: true,
    interimResults: true,
    language: 'en-US'
  });

  // Track recording session state more precisely
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Update the parent component when transcript changes
  useEffect(() => {
    if (finalTranscript && isRecordingSession) {
      const newValue = value + finalTranscript;
      onChange(newValue);
    }
  }, [finalTranscript, isRecordingSession]);

  const handleStartRecording = () => {
    setIsRecordingSession(true);
    setHasStartedRecording(true);
    setRecordingStartTime(Date.now());
    resetTranscript();
    startListening();
  };

  // Update recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecordingSession && recordingStartTime) {
      interval = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - recordingStartTime) / 1000));
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingSession, recordingStartTime]);

  const handleStopRecording = () => {
    stopListening();
    setIsRecordingSession(false);
    setRecordingStartTime(null);
  };

  const handlePauseResume = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleReset = () => {
    stopListening();
    setIsRecordingSession(false);
    setHasStartedRecording(false);
    setRecordingStartTime(null);
    setRecordingDuration(0);
    resetTranscript();
    onChange('');
  };

  const displayText = isRecordingSession 
    ? value + finalTranscript + (interimTranscript ? ` ${interimTranscript}` : '')
    : value;

  if (!isSupported) {
    return (
      <div className={cn("space-y-4", className)}>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-32"
        />
        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Speech recognition is not supported in this browser. Please use text input instead.
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Text Display Area */}
      <div className="relative">
        <Textarea
          value={displayText}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "min-h-32 resize-none",
            isRecordingSession && "bg-blue-50 border-blue-300"
          )}
          readOnly={isRecordingSession}
        />
        
        {/* Live transcript indicator with enhanced styling */}
        {isRecordingSession && interimTranscript && (
          <div className="absolute bottom-2 right-2 bg-gradient-to-r from-blue-100 to-blue-50 border border-blue-300 rounded-lg px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-700 font-medium">Live:</span>
            </div>
            <span className="text-xs text-blue-600 italic block mt-1 max-w-48 truncate">{interimTranscript}</span>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isRecordingSession ? (
            <Button
              onClick={handleStartRecording}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Mic className="w-4 h-4" />
              Start Recording
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePauseResume}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isListening ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Resume
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleStopRecording}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
              >
                <Square className="w-4 h-4" />
                Stop
              </Button>
            </div>
          )}

          {hasStartedRecording && (
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          )}
        </div>

        {/* Enhanced Status Indicator */}
        <div className="flex items-center gap-3">
          {isListening && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-700">Recording</span>
              {recordingDuration > 0 && (
                <span className="text-xs text-red-600">
                  {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </span>
              )}
            </div>
          )}
          
          {isRecordingSession && !isListening && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium text-yellow-700">Paused</span>
            </div>
          )}
          
          {!isRecordingSession && hasStartedRecording && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700">Stopped</span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 rounded-lg p-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="font-medium">{displayText.trim().split(/\s+/).filter(word => word.length > 0).length}</span>
            <span>words</span>
          </span>
          {recordingDuration > 0 && (
            <span className="flex items-center gap-1">
              <span className="font-medium">{Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</span>
              <span>duration</span>
            </span>
          )}
        </div>
        {isRecordingSession && (
          <div className="flex items-center gap-1 text-blue-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Live transcription</span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          Error: {error}
        </div>
      )}

      {/* Instructions */}
      {!hasStartedRecording && (
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="font-medium mb-1">Voice Recording Tips:</p>
          <ul className="text-xs space-y-1">
            <li>• Speak clearly and at a normal pace</li>
            <li>• Ensure your microphone is enabled</li>
            <li>• You can pause/resume recording as needed</li>
            <li>• Text will appear in real-time as you speak</li>
          </ul>
        </div>
      )}
    </div>
  );
}