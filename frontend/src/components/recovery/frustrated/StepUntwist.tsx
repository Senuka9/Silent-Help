'use client';

/**
 * Step 2 — Untwist the Narrative (cognitive reframing).
 *
 * Frame: a "courtroom / detective" aesthetic. The user's hot thought is
 * put into a spot-lit witness box and questioned. For high/medium-high
 * tiers we also do cognitive defusion (literally peeling the emotion
 * label off the thought card) before reappraisal.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Gavel, ArrowRight, Search, Sparkles } from 'lucide-react';
import type { StressTier } from '@/lib/emotion-theme';
import type { UntwistData } from '@/lib/recovery-frustrated';
import { REAPPRAISAL_STARTERS } from '@/lib/recovery-frustrated';

type Phase = 'thought' | 'reality' | 'defusion' | 'reappraisal';

const THOUGHT_STARTERS = [
    'This is impossible.',
    'They always do this to me.',
    "I can't handle one more thing.",
    'Nothing I do works.',
    'This is so unfair.',
];

const EMOTION_LABELS = [
    'hot frustration',
    'burning anger',
    'that tight-jaw feeling',
    'the exploding feeling',
    'the I-give-up feeling',
];

export function StepUntwist({
    stressTier,
    accent,
    initial,
    onComplete,
}: {
    stressTier: StressTier;
    accent: string;
    initial: UntwistData;
    onComplete: (d: UntwistData) => void;
}) {
    const isHigh = stressTier === 'high' || stressTier === 'medium-high';
    const [data, setData] = useState<UntwistData>(initial);
    const [phase, setPhase] = useState<Phase>('thought');

    const update = (patch: Partial<UntwistData>) => setData((d) => ({ ...d, ...patch }));

    const phaseOrder: Phase[] = isHigh
        ? ['thought', 'reality', 'defusion', 'reappraisal']
        : ['thought', 'reality', 'reappraisal'];
    const idx = phaseOrder.indexOf(phase);
    const next = () => {
        if (idx >= phaseOrder.length - 1) onComplete(data);
        else setPhase(phaseOrder[idx + 1]);
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse at 50% 30%, rgba(251,191,36,0.08) 0%, transparent 45%), radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.55) 0%, transparent 70%)',
                }}
            />

            <header className="relative z-10 flex flex-col items-center gap-3">
                <div className="text-xs uppercase tracking-[0.26em] text-white/55">
                    Step 2 · Untwist the narrative
                </div>
                <h2 className="text-balance text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Put the thought on the stand
                </h2>
                <div className="mt-2 flex items-center gap-2">
                    {phaseOrder.map((_, i) => (
                        <motion.div
                            key={i}
                            layout
                            className="h-1.5 rounded-full"
                            animate={{
                                width: i === idx ? 40 : 14,
                                backgroundColor:
                                    i <= idx ? accent : 'rgba(255,255,255,0.18)',
                            }}
                            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                        />
                    ))}
                </div>
            </header>

            <AnimatePresence mode="wait">
                {phase === 'thought' && (
                    <Pane key="thought">
                        <ThoughtEntry
                            value={data.thought}
                            onChange={(v) => update({ thought: v })}
                            accent={accent}
                            onNext={next}
                        />
                    </Pane>
                )}
                {phase === 'reality' && (
                    <Pane key="reality">
                        <RealityTest
                            thought={data.thought}
                            answers={data.realityTest}
                            onAnswer={(patch) =>
                                update({ realityTest: { ...data.realityTest, ...patch } })
                            }
                            accent={accent}
                            onNext={next}
                        />
                    </Pane>
                )}
                {phase === 'defusion' && (
                    <Pane key="defusion">
                        <Defusion
                            thought={data.thought}
                            label={data.defusionLabel}
                            onChange={(v) => update({ defusionLabel: v })}
                            accent={accent}
                            onNext={next}
                        />
                    </Pane>
                )}
                {phase === 'reappraisal' && (
                    <Pane key="reappraisal">
                        <Reappraisal
                            thought={data.thought}
                            value={data.reappraisal}
                            onChange={(v) => update({ reappraisal: v })}
                            accent={accent}
                            onNext={next}
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
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mt-10 w-full max-w-xl"
        >
            {children}
        </motion.div>
    );
}

/* ────────── Thought entry (witness box) ────────── */

function ThoughtEntry({
    value,
    onChange,
    accent,
    onNext,
}: {
    value: string;
    onChange: (v: string) => void;
    accent: string;
    onNext: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-center text-white/70">
                What&apos;s the hot thought running through your head right now? Don&apos;t soften
                it yet — put it in the witness box exactly as it is.
            </p>

            {!value.trim() && (
                <div className="flex flex-wrap justify-center gap-2">
                    {THOUGHT_STARTERS.map((s) => (
                        <button
                            key={s}
                            onClick={() => onChange(s)}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 transition hover:border-white/25"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            <motion.div
                initial={{ rotate: -1, scale: 0.96, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full overflow-hidden rounded-3xl border-2 border-amber-400/25 p-1"
                style={{
                    background:
                        'linear-gradient(180deg, rgba(120,53,15,0.35) 0%, rgba(30,20,10,0.8) 100%)',
                    boxShadow: '0 0 60px rgba(251,191,36,0.15)',
                }}
            >
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(ellipse at 50% -20%, rgba(251,191,36,0.25) 0%, transparent 60%)',
                    }}
                />
                <div className="relative rounded-[20px] bg-[#1a120a]/80 p-5">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-amber-300/80">
                        <Gavel className="h-3 w-3" /> Witness box
                    </div>
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        rows={3}
                        autoFocus
                        placeholder="The thought, word for word…"
                        className="mt-2 w-full resize-none bg-transparent text-lg italic text-amber-50/95 placeholder:text-amber-100/35 focus:outline-none"
                    />
                </div>
            </motion.div>

            <button
                onClick={onNext}
                disabled={!value.trim()}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{ backgroundColor: accent, color: '#0b0c12' }}
            >
                Question the witness <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    );
}

/* ────────── Reality test ────────── */

const REALITY_QUESTIONS: {
    key: 'hundredPercentTrue' | 'onlyNegative' | 'matterLater';
    q: string;
    hint: string;
}[] = [
    {
        key: 'hundredPercentTrue',
        q: 'Is this definitely, 100% true right now?',
        hint: "Not 'feels true' — proveably true, with evidence you could show a friend.",
    },
    {
        key: 'onlyNegative',
        q: 'Am I only focusing on what went wrong?',
        hint: "Scan — is there anything neutral or good I'm editing out?",
    },
    {
        key: 'matterLater',
        q: 'Will this matter in an hour? A day? A year?',
        hint: "If the answer is 'no', it's smaller than it feels right now.",
    },
];

function RealityTest({
    thought,
    answers,
    onAnswer,
    accent,
    onNext,
}: {
    thought: string;
    answers: UntwistData['realityTest'];
    onAnswer: (patch: Partial<UntwistData['realityTest']>) => void;
    accent: string;
    onNext: () => void;
}) {
    const allAnswered = REALITY_QUESTIONS.every((q) => answers[q.key] !== null);

    return (
        <div className="flex flex-col items-center gap-5">
            <div className="w-full rounded-2xl border border-amber-400/20 bg-amber-950/30 p-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-amber-200/70">
                    <Search className="h-3 w-3" /> Under investigation
                </div>
                <div className="mt-1 text-sm italic text-amber-50/90">&ldquo;{thought}&rdquo;</div>
            </div>

            <p className="text-center text-sm text-white/65">
                Three questions. Be honest — the jury (you) is watching.
            </p>

            <div className="flex w-full flex-col gap-3">
                {REALITY_QUESTIONS.map((q, i) => {
                    const v = answers[q.key];
                    return (
                        <motion.div
                            key={q.key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 * i, duration: 0.4 }}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                        >
                            <div className="text-sm font-medium text-white">{q.q}</div>
                            <div className="mt-1 text-xs text-white/50">{q.hint}</div>
                            <div className="mt-3 flex gap-2">
                                {(['yes', 'no', 'maybe'] as const).map((opt) => {
                                    const selected = v === opt;
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => onAnswer({ [q.key]: opt } as never)}
                                            className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.2em] transition ${
                                                selected
                                                    ? 'border-white/40 bg-white/10 text-white'
                                                    : 'border-white/10 bg-transparent text-white/60 hover:border-white/25'
                                            }`}
                                            style={
                                                selected
                                                    ? { boxShadow: `0 0 18px ${accent}55` }
                                                    : undefined
                                            }
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <button
                onClick={onNext}
                disabled={!allAnswered}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{ backgroundColor: accent, color: '#0b0c12' }}
            >
                Verdict reached <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    );
}

/* ────────── Defusion (high / medium-high) ────────── */

function Defusion({
    thought,
    label,
    onChange,
    accent,
    onNext,
}: {
    thought: string;
    label: string;
    onChange: (v: string) => void;
    accent: string;
    onNext: () => void;
}) {
    const [detached, setDetached] = useState(false);

    return (
        <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-center text-white/70">
                Name the feeling underneath, then peel it off the thought. You are not the
                frustration — you&apos;re the one watching it pass through.
            </p>

            {!label.trim() && (
                <div className="flex flex-wrap justify-center gap-2">
                    {EMOTION_LABELS.map((s) => (
                        <button
                            key={s}
                            onClick={() => onChange(s)}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 transition hover:border-white/25"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            <input
                value={label}
                onChange={(e) => onChange(e.target.value)}
                placeholder="hot frustration, burning anger…"
                className="w-full rounded-2xl border border-white/15 bg-white/[0.04] p-3 text-center text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />

            {/* Composite card: thought + detachable label */}
            <div className="relative h-64 w-full">
                <motion.div
                    className="absolute inset-x-0 top-0 mx-auto max-w-md rounded-2xl border border-white/15 bg-white/[0.04] p-5"
                    animate={{
                        boxShadow: detached
                            ? `0 0 40px ${accent}33`
                            : '0 0 30px rgba(0,0,0,0.3)',
                    }}
                >
                    <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">
                        The thought
                    </div>
                    <div className="mt-1 text-sm italic text-white/85">&ldquo;{thought}&rdquo;</div>

                    {/* Emotion chip (detaches on click) */}
                    {label.trim() && (
                        <motion.button
                            onClick={() => setDetached(true)}
                            initial={false}
                            animate={
                                detached
                                    ? { y: 120, x: 140, rotate: 12, opacity: 0.6, scale: 0.9 }
                                    : { y: 0, x: 0, rotate: 0, opacity: 1, scale: 1 }
                            }
                            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                            className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
                            style={{
                                background: `linear-gradient(90deg, #f97316, #ef4444)`,
                                color: '#fff',
                                boxShadow: '0 0 20px rgba(249,115,22,0.5)',
                            }}
                        >
                            {detached ? '☁' : '✋'} there&apos;s that {label} again
                        </motion.button>
                    )}
                </motion.div>

                {detached && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="absolute inset-x-0 bottom-0 text-center text-xs italic text-white/55"
                    >
                        good. the feeling is separate from the facts.
                    </motion.div>
                )}
            </div>

            <button
                onClick={onNext}
                disabled={!detached}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{ backgroundColor: accent, color: '#0b0c12' }}
            >
                {detached ? (
                    <>
                        Now reframe <ArrowRight className="h-4 w-4" />
                    </>
                ) : (
                    'Tap the emotion chip to peel it off'
                )}
            </button>
        </div>
    );
}

/* ────────── Reappraisal ────────── */

function Reappraisal({
    thought,
    value,
    onChange,
    accent,
    onNext,
}: {
    thought: string;
    value: string;
    onChange: (v: string) => void;
    accent: string;
    onNext: () => void;
}) {
    const [submitted, setSubmitted] = useState(false);

    const submit = () => {
        if (!value.trim()) return;
        setSubmitted(true);
        window.setTimeout(onNext, 1100);
    };

    return (
        <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-center text-white/70">
                Rewrite the hot thought in realistic language. Not sugar-coated —{' '}
                <span className="italic text-white">realistic</span>. Keep the difficulty, drop
                the catastrophe.
            </p>

            <div className="grid w-full gap-3 sm:grid-cols-2">
                {/* Hot (catastrophic) card */}
                <motion.div
                    animate={
                        submitted
                            ? { opacity: 0.2, scale: 0.96 }
                            : { x: [0, -2, 2, -1, 1, 0] }
                    }
                    transition={
                        submitted
                            ? { duration: 0.5 }
                            : { duration: 1.2, repeat: Infinity, repeatDelay: 1.5 }
                    }
                    className="rounded-2xl border border-rose-500/30 bg-rose-950/25 p-4"
                    style={{ boxShadow: 'inset 0 0 0 1px rgba(244,63,94,0.25)' }}
                >
                    <div className="text-[10px] uppercase tracking-[0.22em] text-rose-300/70">
                        Catastrophic
                    </div>
                    <div className="mt-1 text-sm italic text-rose-50/85">&ldquo;{thought}&rdquo;</div>
                </motion.div>

                {/* Realistic card */}
                <motion.div
                    animate={submitted ? { y: -8, scale: 1.03 } : { y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 160, damping: 18 }}
                    className="rounded-2xl border border-sky-400/30 bg-sky-950/25 p-4"
                    style={{ boxShadow: submitted ? '0 0 40px rgba(56,189,248,0.35)' : undefined }}
                >
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-sky-300/80">
                        <Sparkles className="h-3 w-3" /> Realistic
                    </div>
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        rows={3}
                        placeholder="This is difficult, but…"
                        className="mt-1 w-full resize-none bg-transparent text-sm italic text-sky-50/95 placeholder:text-sky-100/35 focus:outline-none"
                        disabled={submitted}
                    />
                </motion.div>
            </div>

            {!value.trim() && (
                <div className="flex flex-wrap justify-center gap-2">
                    {REAPPRAISAL_STARTERS.map((s) => (
                        <button
                            key={s}
                            onClick={() => onChange(s)}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 transition hover:border-white/25"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            <button
                onClick={submit}
                disabled={!value.trim() || submitted}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{ backgroundColor: accent, color: '#0b0c12' }}
            >
                I got this out <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    );
}
