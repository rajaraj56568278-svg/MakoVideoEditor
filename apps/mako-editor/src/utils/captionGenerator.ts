/**
 * Caption Generator — Web Speech API wrapper
 * Uses browser's SpeechRecognition for automatic speech-to-text.
 */
import type { CaptionSegment } from '../types';

export interface CaptionGeneratorOptions {
  language: string;
  onSegment: (segment: CaptionSegment) => void;
  onEnd: () => void;
  onError: (error: string) => void;
  onProgress: (progress: string) => void;
}

export function isSpeechRecognitionAvailable(): boolean {
  return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
}

export function createCaptionGenerator(options: CaptionGeneratorOptions) {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    options.onError('Speech recognition is not available in this browser. Try Chrome or Edge.');
    return { start: () => {}, stop: () => {}, isRunning: () => false };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = options.language;
  recognition.maxAlternatives = 1;

  let startTime = Date.now();
  let running = false;
  let segmentIndex = 0;

  recognition.onresult = (event: any) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        const elapsed = (Date.now() - startTime) / 1000;
        const text = result[0].transcript.trim();
        if (text) {
          const segment: CaptionSegment = {
            id: `caption-${segmentIndex++}`,
            text,
            startTime: Math.max(0, elapsed - 2),
            endTime: elapsed,
            confidence: result[0].confidence || 0.8,
          };
          options.onSegment(segment);
        }
        options.onProgress(`Recognized: "${text}"`);
      }
    }
  };

  recognition.onerror = (event: any) => {
    if (event.error === 'no-speech') {
      options.onProgress('No speech detected — listening...');
      return;
    }
    if (event.error === 'aborted') return;
    options.onError(`Speech recognition error: ${event.error}`);
    running = false;
  };

  recognition.onend = () => {
    if (running) {
      // Auto-restart for continuous recognition
      try { recognition.start(); } catch { running = false; options.onEnd(); }
    } else {
      options.onEnd();
    }
  };

  return {
    start: () => {
      startTime = Date.now();
      running = true;
      try {
        recognition.start();
        options.onProgress('Listening...');
      } catch (e) {
        options.onError('Failed to start speech recognition');
      }
    },
    stop: () => {
      running = false;
      try { recognition.stop(); } catch {}
    },
    isRunning: () => running,
  };
}
