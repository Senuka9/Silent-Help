'use client';

/**
 * Step 2 — Repurpose the Narrative (gentle cognitive reappraisal).
 *
 * User picks one of three paths:
 *   - Reconstrual  → re-see the event with a little more light (no erasure)
 *   - Repurposing  → what does this sadness tell you that you care about?
 *                    The answer quietly seeds Step 6 (values).
 *   - Prewritten   → accept a pre-written, compassion-first reframe.
 *                    Auto-offered at very-low energy.
 *
 * The screen warms from cool lavender into amber as the user types, so
 * the colour shift is the feedback, not a big checkmark.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sun, Compass, HandHeart, ArrowRight } from 'lucide-react';
import type { EnergyTier } from '@/lib/recovery-sad';
import {
    PREWRITTEN_REFRAME,
    type ReappraisalStyle,
    type ReframeData,
} from '@/lib/recovery-sad';

const REPURPOSING_PROMPTS = [
    'connection', 'honesty', 'creativity', 'growth', 'kindness', 'rest',
];

export function StepReframe({
    energy,
    accent,
    initial,
    onComplete,
}: {
    energy: EnergyTier;
    accent: string;
    initial: ReframeData;
    onComplete: (d: ReframeData) => void;
}) {
    const [style, setStyle] = useState<ReappraisalStyle | null>(initial.style);
    const [reframe, setReframe] = useState(initial.reframe);
    const [surfacedValue, setSurfacedValue] = useState(initial.surfacedValue);

    const warmth = Math.min(1, (reframe.trim().length / 40));

    const submit = (finalStyle: ReappraisalStyle, finalText: string, value = '') => {
        onComplete({ style: finalStyle, reframe: finalText, surfacedValue: value });
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
            {/* Cool → warm gradient shift */}
            <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(ellipse at 50% 40%, ${accent}${Math.round(
                        (0.08 + warmth * 0.14) * 255,
                    )
                        .toString(16)
                        .padStart(2, '0')} 0%, transparent 60%)`,
                }}
            />
            <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(ellipse at 50% 80%, rgba(251,191,36,${
                        0.04 + warmth * 0.25
                    }) 0%, transparent 55%)`,
                }}
            />

            <header className="relative z-10 flex flex-col items-center gap-2">
                <div className="text-xs uppercase tracking-[0.26em] text-white/55">
                    Step 2 · Repurpose the story
                </div>
                <h2 className="text-balance text-center text-3xl font-light tracking-tight text-white sm:text-4xl">
                    Let&apos;s look at this gently.
                </h2>
                <p className="mt-2 max-w-md text-center text-sm text-white/65">
                    Not to erase the sadness — just to add a little light.
                </p>
            </header>

            <AnimatePresence mode="wait">
                {style === null && (
                    <Pane key="chooser">
                        <StyleChooser
                            accent={accent}
                            showPrewritten={energy !== 'full'}
                            onPick={(s) => {
                                setStyle(s);
                                if (s === 'prewritten') {
                                    setReframe(PREWRITTEN_REFRAME);
                                }
                            }}
                        />
                    </Pane>
                )}

                {style === 'reconstrual' && (
                    <Pane key="reconstrual">
                        <ReconstrualPane
                            value={reframe}
                            onChange={setReframe}
                            accent={accent}
                            onBack={() => setStyle(null)}
                            onSubmit={() => reframe.trim() && submit('reconstrual', reframe)}
                        />
                    </Pane>
                )}

                {style === 'repurposing' && (
                    <Pane key="repurposing">
                        <RepurposingPane
                            value={reframe}
                            onChange={setReframe}
                            surfacedValue={surfacedValue}
                            onValueChange={setSurfacedValue}
                            accent={accent}
                            onBack={() => setStyle(null)}
                            onSubmit={() =>
                                reframe.trim() && submit('repurposing', reframe, surfacedValue)
                            }
                        />
                    </Pane>
                )}

                {style === 'prewritten' && (
                    <Pane key="prewritten">
                        <PrewrittenPane
                            accent={accent}
                            onBack={() => setStyle(null)}
                            onAccept={() => submit('prewritten', PREWRITTEN_REFRAME)}
                        />
                    </Pane>
                )}
            </AnimatePresence>
        </div>
    );
}

function Pane({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mt-10 w-full max-w-xl"
        >
            {children}
        </motion.div>
    );
}

function StyleChooser({
    accent,
    showPrewritten,
    onPick,
}: {
    accent: string;
    showPrewritten: boolean;
    onPick: (s: ReappraisalStyle) => void;
}) {
    const tiles: {
        key: ReappraisalStyle;
        title: string;
        line: string;
        Icon: typeof Sun;
    }[] = [
        {
            key: 'reconstrual',
            title: 'See it differently',
            line: 'Is there another way to look at what happened — without pretending?',
            Icon: Sun,
        },
        {
            key: 'repurposing',
            title: 'Find what it tells me',
            line: 'What does this sadness say about what I actually care about?',
            Icon: Compass,
        },
        ...(showPrewritten
            ? [
                  {
                      key: 'prewritten' as const,
                      title: 'Hear it from me',
                      line: "I'll say a kind thing. You just have to let it in.",
                      Icon: HandHeart,
                  },
              ]
            : []),
    ];

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="grid w-full gap-3 sm:grid-cols-3">
                {tiles.map((t, i) => (
                    <motion.button
                        key={t.key}
                        onClick={() => onPick(t.key)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.45 }}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex flex-col items-center gap-2 rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-center transition hover:border-white/25"
                        style={{ boxShadow: `inset 0 0 0 1px ${accent}22` }}
                    >
                        <div
                            className="flex h-11 w-11 items-center justify-center rounded-full"
                            style={{
                                backgroundColor: `${accent}22`,
                                color: accent,
                                boxShadow: `0 0 22px ${accent}44`,
                            }}
                        >
                            <t.Icon className="h-5 w-5" />
                        </div>
                        <div className="text-base font-medium text-white">{t.title}</div>
                        <div className="text-xs text-white/60">{t.line}</div>
                    </motion.button>
                ))}
            </div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                pick whichever feels lightest
            </div>
        </div>
    );
}

function ReconstrualPane({
    value,
    onChange,
    accent,
    onBack,
    onSubmit,
}: {
    value: string;
    onChange: (v: string) => void;
    accent: string;
    onBack: () => void;
    onSubmit: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-4">
            <p className="max-w-md text-center text-sm text-white/70">
                Write the softer version of the story. Not a lie — just a truer whole picture
                that includes the kindness you&apos;d offer a friend.
            </p>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={5}
                autoFocus
                placeholder="A gentler way to see it…"
                className="w-full resize-none rounded-3xl border border-white/15 bg-white/[0.04] p-4 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />
            <div className="flex items-center gap-2">
                <button
                    onClick={onBack}
                    className="text-[11px] uppercase tracking-[0.22em] text-white/50 transition hover:text-white/80"
                >
                    Back
                </button>
                <button
                    onClick={onSubmit}
                    disabled={!value.trim()}
                    className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                    style={{ backgroundColor: accent, color: '#1a1023' }}
                >
                    Keep this <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

function RepurposingPane({
    value,
    onChange,
    surfacedValue,
    onValueChange,
    accent,
    onBack,
    onSubmit,
}: {
    value: string;
    onChange: (v: string) => void;
    surfacedValue: string;
    onValueChange: (v: string) => void;
    accent: string;
    onBack: () => void;
    onSubmit: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-4">
            <p className="max-w-md text-center text-sm text-white/70">
                Sadness usually points at something we care about. What does yours seem to be
                pointing at right now?
            </p>

            <div className="flex flex-wrap justify-center gap-2">
                {REPURPOSING_PROMPTS.map((v) => {
                    const selected = surfacedValue === v;
                    return (
                        <button
                            key={v}
                            onClick={() => onValueChange(v)}
                            className={`rounded-full border px-3 py-1.5 text-xs capitalize transition ${
                                selected
                                    ? 'border-white/30 bg-white/10 text-white'
                                    : 'border-white/10 bg-white/[0.03] text-white/75 hover:border-white/25'
                            }`}
                            style={selected ? { boxShadow: `0 0 18px ${accent}55` } : undefined}
                        >
                            {v}
                        </button>
                    );
                })}
            </div>

            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                placeholder={`Because I care about ${surfacedValue || '…'}, this sadness is telling me…`}
                className="w-full resize-none rounded-3xl border border-white/15 bg-white/[0.04] p-4 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />

            <div className="flex items-center gap-2">
                <button
                    onClick={onBack}
                    className="text-[11px] uppercase tracking-[0.22em] text-white/50 transition hover:text-white/80"
                >
                    Back
                </button>
                <button
                    onClick={onSubmit}
                    disabled={!value.trim()}
                    className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                    style={{ backgroundColor: accent, color: '#1a1023' }}
                >
                    Honor that <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

function PrewrittenPane({
    accent,
    onBack,
    onAccept,
}: {
    accent: string;
    onBack: () => void;
    onAccept: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-5">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative w-full max-w-md rounded-3xl border border-white/15 bg-white/[0.04] p-6 text-center"
                style={{ boxShadow: `0 0 40px ${accent}22` }}
            >
                <motion.div
                    aria-hidden
                    className="absolute left-1/2 top-0 h-1 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
                    animate={{ scaleX: [0.6, 1.2, 0.6], opacity: [0.4, 0.9, 0.4] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/45">
                    from me to you
                </div>
                <p className="mt-3 text-lg font-light leading-relaxed text-white/90">
                    {PREWRITTEN_REFRAME}
                </p>
            </motion.div>
            <p className="max-w-md text-center text-xs text-white/50">
                Read it once more, out loud if you can. Then take it.
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={onBack}
                    className="text-[11px] uppercase tracking-[0.22em] text-white/50 transition hover:text-white/80"
                >
                    Back
                </button>
                <button
                    onClick={onAccept}
                    className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                    style={{ backgroundColor: accent, color: '#1a1023' }}
                >
                    I let it in <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
