import type { AudioRecording, VoiceRecorder } from './types';

export class WebAudioRecorder implements VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  public isRecording = false;
  public isSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  async startRecording(): Promise<void> {
    if (!this.isSupported) {
      throw new Error('Audio recording is not supported in this browser');
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording = true;
    } catch (error) {
      throw new Error('Failed to start recording: ' + (error as Error).message);
    }
  }

  async stopRecording(): Promise<AudioRecording> {
    if (!this.mediaRecorder || !this.isRecording) {
      throw new Error('No active recording to stop');
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      this.mediaRecorder!.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const duration = Date.now() - startTime;

        // Clean up
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }

        this.isRecording = false;
        this.mediaRecorder = null;

        resolve({ blob, url, duration });
      };

      this.mediaRecorder!.onerror = (event) => {
        reject(new Error('Recording failed: ' + event));
      };

      this.mediaRecorder!.stop();
    });
  }
}

export const audioRecorder = new WebAudioRecorder();
