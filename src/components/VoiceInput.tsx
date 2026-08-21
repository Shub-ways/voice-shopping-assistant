'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';
import { parseVoiceCommands } from '@/lib/nlp/intentParser';
import { SupportedLanguage, ParsedCommand } from '@/types';

interface VoiceInputProps {
  language: SupportedLanguage;
  onCommand: (command: ParsedCommand) => void;
}

export function VoiceInput({ language, onCommand }: VoiceInputProps) {
  const [interimText, setInterimText] = useState('');

  const handleResult = useCallback(
    (transcript: string) => {
      // parseVoiceCommands splits "add mango, banana and apple" into 3 commands
      const commands = parseVoiceCommands(transcript, language);
      commands.forEach((cmd) => onCommand(cmd));
      setTimeout(() => setInterimText(''), 1500);
    },
    [language, onCommand]
  );

  const handleInterim = useCallback((text: string) => {
    setInterimText(text);
  }, []);

  const { voiceState, transcript, error, isSupported, startListening, stopListening } =
    useVoiceRecognition({
      language,
      onResult: handleResult,
      onInterim: handleInterim,
    });

  const isListening = voiceState === 'listening';
  const isProcessing = voiceState === 'processing';

  const buttonLabel =
    isListening  ? 'Listening… tap to stop'  :
    isProcessing ? 'Processing…'              :
    voiceState === 'error' ? 'Error — tap to retry' :
    'Tap to speak';

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Waveform */}
      <AnimatePresence>
        {(isListening || isProcessing) && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.5 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <WaveformVisualizer voiceState={voiceState} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main mic button */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: isListening ? 1 : 1.05 }}
        onClick={isListening ? stopListening : startListening}
        disabled={!isSupported || isProcessing}
        aria-label={buttonLabel}
        className={clsx(
          'relative flex items-center justify-center w-20 h-20 rounded-full shadow-xl transition-colors duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2',
          {
            'bg-emerald-500 hover:bg-emerald-600 focus-visible:ring-emerald-400': isListening,
            'bg-violet-600 hover:bg-violet-700 focus-visible:ring-violet-400':
              !isListening && voiceState !== 'error',
            'bg-red-500 hover:bg-red-600 focus-visible:ring-red-400': voiceState === 'error',
            'opacity-50 cursor-not-allowed': !isSupported || isProcessing,
          }
        )}
      >
        {/* Ripple ring when listening */}
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />
            <span className="absolute inset-2 rounded-full bg-emerald-400 animate-ping opacity-20 delay-150" />
          </>
        )}

        {isProcessing ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : isListening ? (
          <MicOff className="w-8 h-8 text-white" />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}
      </motion.button>

      {/* Label */}
      <p
        className={clsx('text-sm font-medium transition-colors', {
          'text-emerald-400': isListening,
          'text-amber-400':   isProcessing,
          'text-red-400':     voiceState === 'error',
          'text-slate-400':   voiceState === 'idle',
        })}
      >
        {buttonLabel}
      </p>

      {/* Interim transcript */}
      <AnimatePresence>
        {(interimText || transcript) && (
          <motion.div
            key={interimText || transcript}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="px-4 py-2 bg-white/10 backdrop-blur rounded-xl border border-white/10 max-w-xs text-center"
          >
            <p className="text-sm text-slate-200 italic">
              &ldquo;{interimText || transcript}&rdquo;
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-300">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!isSupported && (
        <p className="text-xs text-amber-400 text-center max-w-xs">
          ⚠️ Voice recognition requires Chrome or Edge. Other browsers may not support it.
        </p>
      )}
    </div>
  );
}
