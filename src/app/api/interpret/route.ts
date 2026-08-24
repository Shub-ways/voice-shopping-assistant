import { NextResponse } from 'next/server';
import { ParsedCommand, SupportedLanguage, VoiceIntent } from '@/types';

const ALLOWED_INTENTS: VoiceIntent[] = ['ADD', 'REMOVE', 'CHECK', 'UNCHECK', 'SEARCH', 'CLEAR', 'UNKNOWN'];

function isValidCommand(value: unknown): value is Omit<ParsedCommand, 'raw'> {
  if (!value || typeof value !== 'object') return false;
  const command = value as Record<string, unknown>;
  return typeof command.intent === 'string' && ALLOWED_INTENTS.includes(command.intent as VoiceIntent);
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI interpreter is not configured' }, { status: 503 });
  }

  const body = await request.json() as { transcript?: string; language?: SupportedLanguage };
  if (!body.transcript?.trim()) {
    return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
  }

  const prompt = `You are a grocery shopping command parser. Convert the transcript into JSON only.
Intent must be one of ADD, REMOVE, CHECK, UNCHECK, SEARCH, CLEAR, UNKNOWN.
Return {"commands":[{ "intent": string, "item"?: string, "quantity"?: number, "unit"?: string, "searchQuery"?: string, "maxPrice"?: number, "filters"?: string[], "confidence": number }]}.
Use one command per product. Translate ordinary item names into concise canonical English (for example Hindi "केले" becomes "bananas" and "किताबें" becomes "books"), but preserve brand names, size, and dietary descriptors. Split spoken lists such as "apples and bananas". Do not invent an item. Use confidence from 0 to 1. Language: ${body.language ?? 'en-US'}.
Transcript: ${JSON.stringify(body.transcript)}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json' },
      }),
    }
  );

  if (!response.ok) {
    console.error(`Gemini interpreter rejected the request with HTTP ${response.status}`);
    return NextResponse.json({ error: `Gemini rejected the request (HTTP ${response.status}). Check GEMINI_API_KEY.` }, { status: 502 });
  }

  const result = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!generatedText) return NextResponse.json({ error: 'Interpreter returned no result' }, { status: 502 });

  try {
    const parsed = JSON.parse(generatedText) as { commands?: unknown[] };
    const commands = (parsed.commands ?? [])
      .filter(isValidCommand)
      .map((command) => ({ ...command, raw: body.transcript }));
    return NextResponse.json({ commands });
  } catch {
    return NextResponse.json({ error: 'Interpreter returned invalid JSON' }, { status: 502 });
  }
}