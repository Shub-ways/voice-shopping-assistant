'use client';

import { useEffect, useRef } from 'react';
import { VoiceState } from '@/types';

interface WaveformVisualizerProps {
  voiceState: VoiceState;
  barCount?: number;
}

const BAR_COUNT = 20;

export function WaveformVisualizer({
  voiceState,
  barCount = BAR_COUNT,
}: WaveformVisualizerProps) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (voiceState !== 'listening') {
      // Cancel animation and stop stream
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      analyserRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      // Reset bars to idle state
      barsRef.current.forEach((bar, i) => {
        if (bar) {
          const idle = 20 + Math.sin(i * 0.8) * 8;
          bar.style.height = `${idle}px`;
          bar.style.opacity = '0.4';
        }
      });
      return;
    }

    // Connect to real microphone for live waveform
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        function draw() {
          analyser.getByteFrequencyData(dataArray);
          barsRef.current.forEach((bar, i) => {
            if (!bar) return;
            const idx = Math.floor((i / barCount) * dataArray.length);
            const value = dataArray[idx] / 255;
            const height = 8 + value * 52;
            bar.style.height = `${height}px`;
            bar.style.opacity = `${0.4 + value * 0.6}`;
          });
          animFrameRef.current = requestAnimationFrame(draw);
        }

        draw();
      } catch {
        // Fallback: animated random bars if mic permission denied
        function drawFallback() {
          barsRef.current.forEach((bar, i) => {
            if (!bar) return;
            const height = 8 + Math.abs(Math.sin(Date.now() / 200 + i * 0.5)) * 52;
            bar.style.height = `${height}px`;
            bar.style.opacity = '0.7';
          });
          animFrameRef.current = requestAnimationFrame(drawFallback);
        }
        drawFallback();
      }
    })();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [voiceState, barCount]);

  const colors: Record<VoiceState, string> = {
    listening:  'bg-emerald-400',
    processing: 'bg-amber-400',
    idle:       'bg-slate-500',
    error:      'bg-red-400',
  };

  const barColor = colors[voiceState];

  return (
    <div className="flex items-center justify-center gap-[3px] h-16 px-2">
      {Array.from({ length: barCount }, (_, i) => (
        <div
          key={i}
          ref={(el) => { barsRef.current[i] = el; }}
          className={`w-1.5 rounded-full transition-all duration-75 ease-out ${barColor}`}
          style={{
            height: `${20 + Math.sin(i * 0.8) * 8}px`,
            opacity: 0.4,
          }}
        />
      ))}
    </div>
  );
}
