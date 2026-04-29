'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

const MOODS = [
  { emoji: '😔', label: 'Sad', color: '#818cf8' },
  { emoji: '😰', label: 'Anxious', color: '#38bdf8' },
  { emoji: '😐', label: 'Neutral', color: '#94a3b8' },
  { emoji: '🙂', label: 'Okay', color: '#2dd4bf' },
  { emoji: '😊', label: 'Good', color: '#a3e635' },
  { emoji: '😄', label: 'Great', color: '#fcd34d' },
];

export { MOODS };

const PROMPTS = [
  'What is quietly asking for your attention right now?',
  'What would you tell a friend who felt what you feel?',
  'Name one small thing that worked today.',
  'Where in your body is this showing up?',
];

interface JournalComposerProps {
  content: string;
  setContent: (val: string) => void;
  selectedMood: string | null;
  setSelectedMood: (val: string | null) => void;
  saving: boolean;
  onSave: () => void;
  distortionsLoading: boolean;
  onAnalyseDistortions: () => void;
  wordCount: number;
  promptIdx: number;
  setPromptIdx: (fn: (i: number) => number) => void;
}

export function JournalComposer({
  content,
  setContent,
  selectedMood,
  setSelectedMood,
  saving,
  onSave,
  distortionsLoading,
  onAnalyseDistortions,
  wordCount,
  promptIdx,
  setPromptIdx,
}: JournalComposerProps) {
  const { isListening, transcript, startListening, stopListening, isSupported: isMicSupported } =
    useSpeechRecognition();
  const contentBeforeDictation = useRef('');

  // Sync transcript into content — in an effect so we don't read refs during render
  useEffect(() => {
    if (isListening && transcript) {
      const prefix = contentBeforeDictation.current;
      const needsSpace = prefix && !prefix.endsWith(' ') && !prefix.endsWith('\n');
      const merged = (prefix + (needsSpace ? ' ' : '') + transcript).trimStart();
      if (merged !== content) setContent(merged);
    }
  }, [isListening, transcript, content, setContent]);

  const moodInfo = MOODS.find((m) => m.label === selectedMood);
  const accent = moodInfo?.color ?? '#7dd3fc';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className="mt-8"
    >
      <Card
        className="relative overflow-hidden"
        style={{ boxShadow: `0 20px 60px -40px ${accent}70` }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full opacity-30 blur-3xl"
          style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
        />
        <CardContent className="relative p-6 sm:p-8">
          <div className="mb-3 flex items-center justify-between text-xs text-[color:var(--color-fg-subtle)]">
            <button
              onClick={() => setPromptIdx((i) => (i + 1) % PROMPTS.length)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] transition-colors hover:border-white/20 hover:text-[color:var(--color-fg-muted)]"
            >
              <Sparkles className="h-3 w-3" />
              Prompt · tap for another
            </button>
            <span>{wordCount} words</span>
          </div>
          <div className="mb-4 font-display text-lg italic text-[color:var(--color-fg-muted)]">
            &quot;{PROMPTS[promptIdx]}&quot;
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start here. No one is reading over your shoulder…"
            rows={6}
            className={cn(
              'w-full resize-y rounded-2xl border bg-[color:var(--color-bg)] px-5 py-4 text-base leading-relaxed outline-none transition-colors placeholder:text-[color:var(--color-fg-subtle)]',
              isListening
                ? 'border-[color:var(--color-danger)] ring-2 ring-[color:var(--color-danger)]/30'
                : 'border-white/[0.08] focus:border-white/20',
            )}
          />

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => {
                const selected = selectedMood === m.label;
                return (
                  <button
                    key={m.label}
                    onClick={() => setSelectedMood(selected ? null : m.label)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all',
                      selected
                        ? 'scale-[1.03]'
                        : 'border-white/10 bg-white/[0.02] text-[color:var(--color-fg-muted)] hover:border-white/20 hover:text-[color:var(--color-fg)]',
                    )}
                    style={
                      selected
                        ? {
                            borderColor: m.color,
                            background: `${m.color}14`,
                            color: m.color,
                            boxShadow: `0 0 0 3px ${m.color}10`,
                          }
                        : undefined
                    }
                  >
                    <span>{m.emoji}</span>
                    {m.label}
                  </button>
                );
              })}
            </div>

            <div className="ml-auto flex items-center gap-2">
              {isMicSupported && (
                <Button
                  variant={isListening ? 'danger' : 'ghost'}
                  size="icon"
                  title={isListening ? 'Stop dictating' : 'Dictate'}
                  onClick={() => {
                    if (isListening) {
                      stopListening();
                    } else {
                      contentBeforeDictation.current = content;
                      startListening();
                    }
                  }}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              <Button
                variant="ghost"
                size="lg"
                onClick={onAnalyseDistortions}
                disabled={distortionsLoading || content.trim().length < 10}
                title="Let a CBT lens gently check for distorted thinking patterns"
              >
                {distortionsLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reading…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Check thoughts
                  </>
                )}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={onSave}
                disabled={!content.trim() || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Save entry
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
