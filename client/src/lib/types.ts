export interface AudioRecording {
  blob: Blob;
  url: string;
  duration: number;
}

export interface VoiceRecorder {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<AudioRecording>;
  isRecording: boolean;
  isSupported: boolean;
}

export interface SessionState {
  sessionId?: string;
  currentQuestionIndex: number;
  responses: Map<string, any>;
  evaluationScores: Record<string, number>;
}
