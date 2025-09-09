import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings,
  Play,
  Pause,
  RotateCcw,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface VoiceControlsProps {
  isRecording: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  voiceEnabled: boolean;
  speechRate: number;
  selectedVoice: string;
  language: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onToggleVoice: () => void;
  onSpeechRateChange: (rate: number) => void;
  onVoiceChange: (voiceId: string) => void;
  onStopSpeech: () => void;
  onTestVoice: () => void;
  className?: string;
}

export default function VoiceControls({
  isRecording,
  isListening,
  isSpeaking,
  voiceEnabled,
  speechRate,
  selectedVoice,
  language,
  onStartRecording,
  onStopRecording,
  onToggleVoice,
  onSpeechRateChange,
  onVoiceChange,
  onStopSpeech,
  onTestVoice,
  className = ''
}: VoiceControlsProps) {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [microphoneStatus, setMicrophoneStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [audioLevel, setAudioLevel] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);

  // Initialize available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      
      // Filter voices by language preference
      const filteredVoices = voices.filter(voice => {
        if (language === 'en') return voice.lang.startsWith('en');
        return voice.lang.startsWith(language);
      });
      
      setAvailableVoices(filteredVoices.length > 0 ? filteredVoices : voices);
    };

    loadVoices();
    
    // Some browsers load voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [language]);

  // Check microphone permissions
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicrophoneStatus(result.state);
        
        result.onchange = () => {
          setMicrophoneStatus(result.state);
        };
      } catch (error) {
        console.log('Permissions API not supported');
      }
    };

    checkMicrophonePermission();
  }, []);

  // Audio level monitoring
  useEffect(() => {
    if (isRecording && voiceEnabled) {
      startAudioLevelMonitoring();
    } else {
      stopAudioLevelMonitoring();
    }

    return () => stopAudioLevelMonitoring();
  }, [isRecording, voiceEnabled]);

  const startAudioLevelMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStreamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
          setAudioLevel(average / 255 * 100);
          requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopAudioLevelMonitoring = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(track => track.stop());
      microphoneStreamRef.current = null;
    }
    
    analyserRef.current = null;
    setAudioLevel(0);
  };

  const handleStartRecording = async () => {
    if (microphoneStatus === 'denied') {
      alert('Microphone access is denied. Please enable microphone permissions to use voice input.');
      return;
    }
    onStartRecording();
  };

  const getVoiceStatusIcon = () => {
    if (!voiceEnabled) return <VolumeX className="w-4 h-4" />;
    if (isSpeaking) return <Volume2 className="w-4 h-4 animate-pulse" />;
    return <Volume2 className="w-4 h-4" />;
  };

  const getMicrophoneStatusIcon = () => {
    if (microphoneStatus === 'denied') return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (microphoneStatus === 'granted') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (isRecording) return <Loader2 className="w-4 h-4 animate-spin" />;
    return <Mic className="w-4 h-4" />;
  };

  return (
    <div className={className}>
      {/* Main Voice Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            {/* Voice Toggle */}
            <div className="flex items-center space-x-4">
              <Button
                variant={voiceEnabled ? "default" : "outline"}
                size="sm"
                onClick={onToggleVoice}
              >
                {getVoiceStatusIcon()}
                <span className="ml-2">Voice {voiceEnabled ? 'On' : 'Off'}</span>
              </Button>

              {/* Speech Control */}
              {isSpeaking && (
                <Button variant="outline" size="sm" onClick={onStopSpeech}>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Speaking
                </Button>
              )}

              {/* Settings Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center space-x-2">
              <Badge variant={microphoneStatus === 'granted' ? 'default' : 'secondary'}>
                {getMicrophoneStatusIcon()}
                <span className="ml-1 text-xs">Mic</span>
              </Badge>
              
              {voiceEnabled && (
                <Badge variant={availableVoices.length > 0 ? 'default' : 'secondary'}>
                  <Volume2 className="w-3 h-3 mr-1" />
                  <span className="text-xs">{availableVoices.length} voices</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Audio Level Indicator */}
          {isRecording && voiceEnabled && (
            <div className="mt-4">
              <div className="flex items-center space-x-2 mb-2">
                <Mic className="w-4 h-4" />
                <span className="text-sm">Audio Level</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${Math.min(audioLevel, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Recording Button */}
          {voiceEnabled && (
            <div className="flex justify-center mt-4">
              <Button
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                onMouseDown={handleStartRecording}
                onMouseUp={onStopRecording}
                onMouseLeave={onStopRecording}
                disabled={microphoneStatus === 'denied'}
                className="px-8 py-4 text-lg"
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-6 h-6 mr-3 animate-pulse" />
                    Release to Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6 mr-3" />
                    Hold to Record Voice Response
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice Settings Panel */}
      {showSettings && voiceEnabled && (
        <Card className="mt-4">
          <CardContent className="py-4 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Voice Settings</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                ✕
              </Button>
            </div>

            {/* Speech Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Speech Rate</label>
                <span className="text-sm text-gray-500">{speechRate.toFixed(1)}x</span>
              </div>
              <Slider
                value={[speechRate]}
                onValueChange={(values) => onSpeechRateChange(values[0])}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Slower</span>
                <span>Faster</span>
              </div>
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Voice</label>
              <Select value={selectedVoice} onValueChange={onVoiceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      <div className="flex items-center justify-between w-full">
                        <span>{voice.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {voice.lang}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Test Voice */}
            <div className="flex justify-center">
              <Button variant="outline" onClick={onTestVoice}>
                <Play className="w-4 h-4 mr-2" />
                Test Voice Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Microphone Permission Help */}
      {microphoneStatus === 'denied' && (
        <Card className="mt-4 border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">
                  Microphone Access Denied
                </h4>
                <p className="text-sm text-red-700 mb-3">
                  To use voice input, please enable microphone permissions for this website.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Refresh & Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}