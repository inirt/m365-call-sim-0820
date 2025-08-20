
import { useState, useRef, useEffect, useCallback } from 'react';

// For browser compatibility
interface CustomWindow extends Window {
  SpeechRecognition: new () => ISpeechRecognition;
  webkitSpeechRecognition: new () => ISpeechRecognition;
}
declare let window: CustomWindow;

interface ISpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: (event: any) => void;
  onend: () => void;
  onstart: () => void;
  onerror: (event: any) => void;
  start: () => void;
  stop: () => void;
}

interface UseSpeechProps {
    onResult: (text: string) => void;
    onError: (error: string) => void;
}

export function useSpeech({ onResult, onError } : UseSpeechProps) {
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true); // Assume supported initially
  const lastTTSRef = useRef("");

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      console.warn("Speech Recognition API is only available in secure contexts (HTTPS or localhost).");
      if (onError) onError("insecure-context");
      setIsSpeechSupported(false);
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn("Speech Recognition API is not supported in this browser.");
      if (onError) onError("not-supported");
      setIsSpeechSupported(false);
      return;
    }
    
    const rec = new SpeechRecognitionAPI();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = true; // Keep listening until explicitly stopped
    
    rec.onstart = () => {
      setIsListening(true);
    };
    
    rec.onend = () => {
      setIsListening(false);
    };

    rec.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (onError) onError(event.error);
      setIsListening(false);
    };

    rec.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript + ' ';
        }
      }
      if (transcript && onResult) {
        onResult(transcript.trim());
      }
    };

    recognitionRef.current = rec;
  }, [onResult, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error("Speech recognition could not be started: ", e);
      setIsListening(false); // Ensure state is correct on error
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.error("Speech recognition could not be stopped: ", e);
    }
    // onend will fire and set isListening to false
  }, [isListening]);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      console.warn("Speech Synthesis API is not supported in this browser.");
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    lastTTSRef.current = text;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }, []);
  
  const replayLast = useCallback(() => {
    if (lastTTSRef.current) {
      speak(lastTTSRef.current);
    }
  }, [speak]);

  return { isListening, startListening, stopListening, speak, replayLast, isSpeechSupported };
}
