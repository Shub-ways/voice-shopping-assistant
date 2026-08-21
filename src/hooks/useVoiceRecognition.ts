'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SupportedLanguage, VoiceRecognitionState, VoiceState } from '@/types';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UseVoiceRecognitionOptions {
  language: SupportedLanguage;
  onResult: (transcript: string) => void;
  onInterim?: (transcript: string) => void;
}

export function useVoiceRecognition({
  language,
  onResult,
  onInterim,
}: UseVoiceRecognitionOptions) {
  const [state, setState] = useState<VoiceRecognitionState>({
    voiceState: 'idle',
    transcript: '',
    interimTranscript: '',
    error: null,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);

  // Defer browser support check to client-side only.
  // Starting with false ensures server and client render the same initial HTML,
  // preventing React hydration mismatches.
  const [isSupported, setIsSupported] = useState(false);
  useEffect(() => {
    setIsSupported(
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    );
  }, []);

  const createRecognition = useCallback((): SpeechRecognition | null => {
    if (!isSupported) return null;

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setState((prev) => ({
        ...prev,
        voiceState: 'listening' as VoiceState,
        error: null,
        interimTranscript: '',
      }));
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (interimTranscript) {
        setState((prev) => ({ ...prev, interimTranscript }));
        onInterim?.(interimTranscript);
      }

      if (finalTranscript) {
        setState((prev) => ({
          ...prev,
          transcript: finalTranscript,
          interimTranscript: '',
          voiceState: 'processing' as VoiceState,
        }));
        onResult(finalTranscript.trim());
        // Reset back to idle after showing "Processing..." briefly
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            voiceState: 'idle' as VoiceState,
            transcript: '',
          }));
        }, 1500);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      isListeningRef.current = false;
      
      // 'aborted' is intentional (e.g. stop clicked or re-initialized)
      if (event.error === 'aborted') {
        setState((prev) => ({
          ...prev,
          voiceState: 'idle' as VoiceState,
          error: null,
        }));
        return;
      }

      // 'no-speech' is a normal transient pause — auto-recover to idle
      if (event.error === 'no-speech') {
        setState((prev) => ({
          ...prev,
          voiceState: 'idle' as VoiceState,
          error: null,
          interimTranscript: '',
        }));
        return;
      }

      const errorMessages: Record<string, string> = {
        'not-allowed':      'Microphone permission denied. Please allow mic access.',
        'network':          'Network error. Check your connection.',
        'audio-capture':    'No microphone found.',
      };
      const msg = errorMessages[event.error] ?? `Error: ${event.error}`;
      setState((prev) => ({
        ...prev,
        voiceState: 'error' as VoiceState,
        error: msg,
      }));

      // Auto-clear transient errors after 3 seconds
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          voiceState: prev.voiceState === 'error' ? 'idle' : prev.voiceState,
          error: null,
        }));
      }, 3000);
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setState((prev) => ({
        ...prev,
        voiceState: prev.voiceState === 'processing' ? 'processing' : prev.voiceState === 'error' ? 'error' : 'idle',
        interimTranscript: '',
      }));
    };

    return recognition;
  }, [language, onResult, onInterim, isSupported]);

  // Re-create recognition when language changes
  useEffect(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
    }
    recognitionRef.current = createRecognition();
  }, [createRecognition]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setState((prev) => ({
        ...prev,
        error: 'Voice recognition is not supported in this browser. Please use Chrome.',
        voiceState: 'error',
      }));
      return;
    }

    if (isListeningRef.current) return;

    try {
      // Create fresh instance to avoid "already started" or stale state issues
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
      const fresh = createRecognition();
      recognitionRef.current = fresh;
      fresh?.start();
    } catch (err) {
      console.error('Failed to start voice recognition:', err);
      setState((prev) => ({
        ...prev,
        voiceState: 'error',
        error: 'Could not access microphone.',
      }));
    }
  }, [isSupported, createRecognition]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch { /* ignore */ }
  }, []);

  const resetState = useCallback(() => {
    setState({
      voiceState: 'idle',
      transcript: '',
      interimTranscript: '',
      error: null,
    });
  }, []);

  return {
    ...state,
    isSupported,
    startListening,
    stopListening,
    resetState,
  };
}
