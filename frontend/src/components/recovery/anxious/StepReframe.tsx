'use client';

/**
 * Step 2 — Pull the Thoughts Out (Cognitive Reset).
 *
 * Three micro-phases:
 *   a. Name the anxious thought.
 *   b. Name the fear underneath it ("what's the worst part?").
 *   c. Reframe — probability-check (felt vs rational) + a "to a friend" prompt.
 *
 * High / medium-high tiers get the probability slider; low tiers skip to the
 * friend-reframe directly so the exercise stays short.
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import type { StressTier } from '@/lib/emotion-theme';
import {
    detectCatastrophizing,
    suggestRationalProbability,
    type ReframeData,
} from '@/lib/recovery-anxious';

type Phase = 'thought' | 'fear' | 'probability' | 'reframe';

const STARTER_THOUGHTS = [
    'What if I mess this up?',
    'Something bad is going to happen.',
    "I won't be able to handle it.",
    'Everyone will be disappointed in me.',
];

export function StepReframe({
    stressTier,
    accent,
    initial,
    onComplete,
}: {
    stressTier: StressTier;
    accent: string;
    initial: ReframeData;
    onComplete: (data: ReframeData) => void;
}) {
    const includeProbability = stressTier === 'high' || stressTier === 'medium-high';
    const [data, setData] = useState<ReframeData>(initial);
    const [phase, setPhase] = useState<Phase>('thought');

    const update = (patch: Partial<ReframeData>) => setData((d) => ({ ...d, ...patch }));

    const next = () => {
        if (phase === 'thought') setPhase('fear');
        else if (phase === 'fear') setPhase(includeProbability ? 'probability' : 'reframe');
        else if (phase === 'probability') setPhase('reframe');
        else onComplete(data);
    };

    const phaseIndex = ['thought', 'fear', 'probability', 'reframe']
        .filter((p) => includeProbability || p !== 'probability')
        .indexOf(phase);
    const totalPhases = includeProbability ? 4 : 3;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
            <header className="flex flex-col items-center gap-3">
                <div className="text-xs uppercase tracking-[0.26em] text-white/50">
                    Step 2 · Pull the thought out
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Untwist it
                </h2>
                <div className="mt-2 flex items-center gap-2">
                    {Array.from({ length: totalPhases }).map((_, i) => (
                        <motion.div
                            key={i}
                            layout
                            className="h-1.5 rounded-full"
                            animate={{
                                width: i === phaseIndex ? 40 : 14,
                                backgroundColor:
                                    i <= phaseIndex ? accent : 'rgba(255,255,255,0.18)',
                            }}
                            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                        />
                    ))}
                </div>
            </header>

            <AnimatePresence mode="wait">
                {phase === 'thought' && (
                    <PhaseContainer key="thought">
                        <ThoughtEntry
                            value={data.thought}
                            onChange={(v) => update({ thought: v })}
                            accent={accent}
                            onSubmit={next}
                        />
                    </PhaseContainer>
                )}
                {phase === 'fear' && (
                    <PhaseContainer key="fear">
                        <FearEntry
                            thought={data.thought}
                            value={data.fear}
                            onChange={(v) => update({ fear: v })}
                            accent={accent}
                            onSubmit={next}
                        />
                    </PhaseContainer>
                )}
                {phase === 'probability' && (
                    <PhaseContainer key="probability">
                        <ProbabilityCheck
                            fear={data.fear || data.thought}
                            felt={data.feltProbability}
                            rational={data.rationalProbability}
                            onFeltChange={(v) => update({ feltProbability: v })}
                            onRationalChange={(v) => update({ rationalProbability: v })}
                            accent={accent}
                            onSubmit={next}
                        />
                    </PhaseContainer>
                )}
                {phase === 'reframe' && (
                    <PhaseContainer key="reframe">
                        <FriendReframe
                            thought={data.thought}
                            value={data.reality}
                            onChange={(v) => update({ reality: v })}
                            accent={accent}
                            onSubmit={next}
                        />
                    </PhaseContainer>
                )}
            </AnimatePresence>
        </div>
    );
}

function PhaseContainer({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 w-full max-w-xl"
        >
            {children}
        </motion.div>
    );
}

/* ────────── a) Thought entry ────────── */

function ThoughtEntry({
    value,
    onChange,
    accent,
    onSubmit,
}: {
    value: string;
    onChange: (v: string) => void;
    accent: string;
    onSubmit: () => void;
}) {
    const isCatastrophizing = detectCatastrophizing(value);
    return (
        <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-center text-white/70">
                What anxious thought keeps looping? Write it exactly as it sounds in your head.
            </p>

            {/* Starter chips */}
            {value.trim().length === 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                    {STARTER_THOUGHTS.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => onChange(s)}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 transition hover:border-white/25"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            <motion.textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={3}
                autoFocus
                placeholder="The thought…"
                initial={{ boxShadow: `0 0 0 0 ${accent}00` }}
                animate={{ boxShadow: `0 0 40px 0 ${accent}22` }}
                className="w-full rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-base text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />

            <AnimatePresence>
                {isCatastrophizing && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-xs text-amber-200"
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        That looks like anxiety making it bigger than it is. Keep going — you&apos;ll
                        untangle it.
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={onSubmit}
                disabled={!value.trim()}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{ backgroundColor: accent, color: '#0b0c12' }}
            >
                Next <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    );
}

/* ────────── b) Fear drilldown ────────── */

function FearEntry({
    thought,
    value,
    onChange,
    accent,
    onSubmit,
}: {
    thought: string;
    value: string;
    onChange: (v: string) => void;
    accent: string;
    onSubmit: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-5">
            {/* The original thought, shown in a "card" that visually folds open */}
            <motion.div
                initial={{ rotateX: -60, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/80"
            >
                <div className="text-xs uppercase tracking-[0.2em] text-white/45">Your thought</div>
                <div className="mt-1 italic">&ldquo;{thought}&rdquo;</div>
            </motion.div>

            <p className="max-w-md text-center text-white/70">
                Now go one layer deeper. What&apos;s the fear <em>underneath</em> the thought —
                the thing you&apos;re really afraid of?
            </p>

            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={3}
                autoFocus
                placeholder="What's the worst part, really?"
                className="w-full rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-base text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />

            <button
                onClick={onSubmit}
                disabled={!value.trim()}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{ backgroundColor: accent, color: '#0b0c12' }}
            >
                Next <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    );
}

/* ────────── c) Probability check (high / medium-high) ────────── */

function ProbabilityCheck({
    fear,
    felt,
    rational,
    onFeltChange,
    onRationalChange,
    accent,
    onSubmit,
}: {
    fear: string;
    felt: number;
    rational: number;
    onFeltChange: (v: number) => void;
    onRationalChange: (v: number) => void;
    accent: string;
    onSubmit: () => void;
}) {
    const [stage, setStage] = useState<'felt' | 'rational'>('felt');

    useEffect(() => {
        if (stage === 'rational' && rational === 10) {
            onRationalChange(suggestRationalProbability(felt));
        }
    }, [stage, rational, felt, onRationalChange]);

    const gap = Math.max(0, felt - rational);

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-white/45">The fear</div>
                <div className="mt-1 text-sm italic text-white/80">
                    &ldquo;{fear || 'your fear'}&rdquo;
                </div>
            </div>

            <AnimatePresence mode="wait">
                {stage === 'felt' && (
                    <motion.div
                        key="felt"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full"
                    >
                        <p className="text-center text-white/70">
                            Right now, how likely does this actually feel?
                        </p>
                        <ProbSlider
                            value={felt}
                            onChange={onFeltChange}
                            color="#fb7185"
                            label="Felt likelihood"
                        />
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => setStage('rational')}
                                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                                style={{ backgroundColor: accent, color: '#0b0c12' }}
                            >
                                Now check the facts <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
                {stage === 'rational' && (
                    <motion.div
                        key="rational"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full"
                    >
                        <p className="text-center text-white/70">
                            Step back and look at the evidence. Realistically, what are the odds?
                        </p>

                        <ProbSlider
                            value={rational}
                            onChange={onRationalChange}
                            color={accent}
                            label="Rational estimate"
                        />

                        {/* Gap visualization */}
                        <div className="mt-6 space-y-3">
                            <StackedBar label="Felt" pct={felt} color="#fb7185" />
                            <StackedBar label="Rational" pct={rational} color={accent} />
                        </div>

                        {gap > 10 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/75"
                            >
                                Anxiety was inflating the threat by{' '}
                                <span className="font-semibold text-white">{gap}%</span>. That gap
                                is the fear talking, not reality.
                            </motion.div>
                        )}

                        <div className="mt-5 flex justify-center">
                            <button
                                onClick={onSubmit}
                                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                                style={{ backgroundColor: accent, color: '#0b0c12' }}
                            >
                                Continue <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ProbSlider({
    value,
    onChange,
    color,
    label,
}: {
    value: number;
    onChange: (v: number) => void;
    color: string;
    label: string;
}) {
    return (
        <div className="mt-5">
            <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-white/50">{label}</span>
                <span
                    className="text-4xl font-semibold tabular-nums"
                    style={{ color }}
                >
                    {value}
                    <span className="text-xl text-white/50">%</span>
                </span>
            </div>
            <input
                type="range"
                min={0}
                max={100}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="mt-3 w-full accent-current"
                style={{ color }}
            />
        </div>
    );
}

function StackedBar({ label, pct, color }: { label: string; pct: number; color: string }) {
    return (
        <div>
            <div className="flex justify-between text-xs text-white/60">
                <span>{label}</span>
                <span className="tabular-nums">{pct}%</span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-white/5">
                <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color, boxShadow: `0 0 14px ${color}66` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: 'spring', stiffness: 200, damping: 26 }}
                />
            </div>
        </div>
    );
}

/* ────────── d) Friend reframe ────────── */

function FriendReframe({
    thought,
    value,
    onChange,
    accent,
    onSubmit,
}: {
    thought: string;
    value: string;
    onChange: (v: string) => void;
    accent: string;
    onSubmit: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-5">
            <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-white/45">Original thought</div>
                <div className="mt-1 text-sm italic text-white/80">&ldquo;{thought}&rdquo;</div>
            </div>

            <div className="flex items-center gap-2 text-white/70">
                <RefreshCw className="h-4 w-4" style={{ color: accent }} />
                <span>
                    If a friend told you this same thing, what would you say to them?
                </span>
            </div>

            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={3}
                autoFocus
                placeholder="The kinder, truer version…"
                className="w-full rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-base text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />

            <button
                onClick={onSubmit}
                disabled={!value.trim()}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{ backgroundColor: accent, color: '#0b0c12' }}
            >
                Keep going <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    );
}
