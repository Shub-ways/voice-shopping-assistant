import { parseVoiceCommands } from '@/lib/nlp/intentParser';
import { ParsedCommand, SupportedLanguage } from '@/types';

export async function interpretCommand(
  transcript: string,
  language: SupportedLanguage
): Promise<ParsedCommand[]> {
  try {
    const response = await fetch('/api/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, language }),
    });

    if (response.ok) {
      const result = await response.json() as { commands?: ParsedCommand[] };
      if (result.commands?.length) return result.commands;
    }
  } catch {
    // The offline parser remains available when the interpreter is unavailable.
  }

  return parseVoiceCommands(transcript, language);
}