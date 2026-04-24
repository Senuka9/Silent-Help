'use client';

/**
 * Step 2 — Flip the Narrative (Cognitive Reappraisal).
 *
 * Split-screen: left = threat card (red border, pulsing), right = challenge
 * card (green glow, steady). User reads the type-indexed old story on the
 * threat side, optionally edits it, then taps "see it differently" — the
 * threat card fractures and the challenge card rises to take its place.
 *
 * At high pressure level we also show a Probability Check: two sliders
 * (before/after), and the delta is visualized as a glowing "relief gap".
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, AlertTriangle, Sparkles } from 'lucide-react';
import type {
    PressureLevel,
    PressureType,
    ReframeData,
} from '@/lib/recovery-pressure';
import { REFRAME_MATRIX } from '@/lib/recovery-pressure';

type SubPhase = 'split' | 'flipped' | 'probability';

export function StepReframe({
    level,
    type,
    accent,
    initial,
    onComplete,
}: {
    level: PressureLevel;
    type: PressureType;
    accent: string;
    initial: ReframeData;
    onComplete: (d: ReframeData) => void;
}) {
    const matrix = REFRAME_MATRIX[type];
    const [oldStory, setOldStory] = useState(initial.oldStory || matrix.threat);
    const [acceptedReframe, setAccepted] = useState(
        initial.acceptedReframe || matrix.challenge,
    );
    const [phase, setPhase] = useState<SubPhase>('split');
    const [truer, setTruer] = useState(initial.truerThanBefore);
    const [probBefore, setProbBefore] = useState<number>(initial.probBefore ?? 70);
    const [probAfter, setProbAfter] = useState<number>(initial.probAfter ?? 25);

    const flip = () => setPhase('flipped');
    const continueFlow = () => {
        if (level === 'high') setPhase('probability');
        else finish();
    };
    const finish = () => {
        onComplete({
            oldStory,
            acceptedReframe,
            truerThanBefore: truer,
            probBefore: level === 'high' ? probBefore : null,
            probAfter: level === 'high' ? probAfter : null,
        });
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
            <header className="flex flex-col items-center gap-3">
                <div className="text-xs uppercase tracking-[0.26em] text-white/55">
                    Step 2 · Flip the story
                </div>
                <h2 className="text-balance text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Same situation. Different story.
                </h2>
            </header>

            <AnimatePresence mode="wait">
                {phase === 'split' && (
                    <Split
                        key="split"
                        accent={accent}
                        oldStory={oldStory}
                        setOldStory={setOldStory}
                        challenge={acceptedReframe}
                        onFlip={flip}
                    />
                )}
                {phase === 'flipped' && (
                    <Flipped
                        key="flipped"
                        accent={accent}
                        reframe={acceptedReframe}
                        setReframe={setAccepted}
                        truer={truer}
                        setTruer={setTruer}
                        onContinue={continueFlow}
                    />
                )}
                {phase === 'probability' && (
                    <Probability
                        key="prob"
                        accent={accent}
                        before={probBefore}
                        after={probAfter}
                        setBefore={setProbBefore}
                        setAfter={setProbAfter}
                        onDone={finish}
                    />
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
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mt-10 w-full max-w-3xl"
        >
            {children}
        </motion.div>
    );
}

function Split({
    accent,
    oldStory,
    setOldStory,
    challenge,
    onFlip,
}: {
    accent: string;
    oldStory: string;
    setOldStory: (v: string) => void;
    challenge: string;
    onFlip: () => void;
}) {
    return (
        <Pane>
            <div className="grid items-stretch gap-3 sm:grid-cols-[1fr,auto,1fr]">
                {/* Threat */}
                <motion.div
                    animate={{
                        boxShadow: [
                            '0 0 0 rgba(239,68,68,0.0)',
                            '0 0 24px rgba(239,68,68,0.45)',
                            '0 0 0 rgba(239,68,68,0.0)',
                        ],
                    }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative rounded-3xl border border-red-500/40 bg-red-500/[0.04] p-5"
                >
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-red-300/80">
                        <AlertTriangle className="h-3 w-3" /> Threat story
                    </div>
                    <textarea
                        value={oldStory}
                        onChange={(e) => setOldStory(e.target.value)}
                        rows={4}
                        className="mt-3 w-full resize-none bg-transparent text-sm text-white/90 focus:outline-none"
                    />
                </motion.div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                    <motion.div
                        animate={{ x: [0, 8, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                        className="rounded-full border border-white/15 bg-white/[0.04] p-2"
                    >
                        <ArrowRight className="h-4 w-4 text-white/60" />
                    </motion.div>
                </div>

                {/* Challenge preview (static) */}
                <div
                    className="rounded-3xl border bg-white/[0.04] p-5"
                    style={{
                        borderColor: `${accent}55`,
                        boxShadow: `0 0 26px ${accent}22`,
                    }}
                >
                    <div
                        className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em]"
                        style={{ color: accent }}
                    >
                        <Sparkles className="h-3 w-3" /> Challenge story
                    </div>
                    <p className="mt-3 text-sm italic text-white/85">{challenge}</p>
                </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-2">
                <button
                    onClick={onFlip}
                    className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                    style={{ backgroundColor: accent, color: '#0b0c12' }}
                >
                    See it differently <ArrowRight className="h-4 w-4" />
                </button>
                <div className="text-[11px] italic text-white/45">
                    you can edit either side
                </div>
            </div>
        </Pane>
    );
}

function Flipped({
    accent,
    reframe,
    setReframe,
    truer,
    setTruer,
    onContinue,
}: {
    accent: string;
    reframe: string;
    setReframe: (v: string) => void;
    truer: boolean;
    setTruer: (v: boolean) => void;
    onContinue: () => void;
}) {
    return (
        <Pane>
            <div className="mx-auto max-w-lg">
                {/* Threat fragments flying away */}
                <div className="relative h-6">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div
                            key={i}
                            aria-hidden
                            initial={{ opacity: 0.8, y: 0, rotate: 0 }}
                            animate={{
                                opacity: 0,
                                y: -40 - i * 10,
                                x: (i - 2) * 30,
                                rotate: (Math.random() - 0.5) * 120,
                            }}
                            transition={{ duration: 1.2, delay: i * 0.05 }}
                            className="absolute left-1/2 top-0 h-1 w-8 rounded-full bg-red-400/70"
                            style={{ filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.5))' }}
                        />
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="rounded-3xl border p-6"
                    style={{
                        borderColor: `${accent}66`,
                        background: `radial-gradient(circle at 20% 20%, ${accent}22, transparent 70%)`,
                        boxShadow: `0 0 40px ${accent}33`,
                    }}
                >
                    <div
                        className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em]"
                        style={{ color: accent }}
                    >
                        <Sparkles className="h-3 w-3" /> Your challenge story
                    </div>
                    <textarea
                        value={reframe}
                        onChange={(e) => setReframe(e.target.value)}
                        rows={3}
                        className="mt-3 w-full resize-none bg-transparent text-base italic text-white/95 focus:outline-none"
                    />
                </motion.div>

                <div className="mt-6 flex flex-col items-center gap-3">
                    <p className="text-sm text-white/70">
                        Does this feel slightly truer than before?
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setTruer(false)}
                            className={`rounded-full border px-4 py-2 text-xs transition ${
                                truer === false
                                    ? 'border-white/30 bg-white/10 text-white'
                                    : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25'
                            }`}
                        >
                            Not yet
                        </button>
                        <button
                            onClick={() => setTruer(true)}
                            className={`rounded-full border px-4 py-2 text-xs transition ${
                                truer === true
                                    ? 'border-white/30 bg-white/15 text-white'
                                    : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25'
                            }`}
                            style={
                                truer
                                    ? { boxShadow: `0 0 16px ${accent}66` }
                                    : undefined
                            }
                        >
                            A little truer
                        </button>
                    </div>
                    <button
                        onClick={onContinue}
                        className="mt-2 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                        style={{ backgroundColor: accent, color: '#0b0c12' }}
                    >
                        Continue <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </Pane>
    );
}

function Probability({
    accent,
    before,
    after,
    setBefore,
    setAfter,
    onDone,
}: {
    accent: string;
    before: number;
    after: number;
    setBefore: (v: number) => void;
    setAfter: (v: number) => void;
    onDone: () => void;
}) {
    const relief = Math.max(0, before - after);

    return (
        <Pane>
            <div className="mx-auto max-w-xl">
                <p className="text-center text-sm text-white/70">
                    One more check. High pressure inflates your worst-case odds. Let&apos;s
                    actually look at the numbers.
                </p>

                <div className="mt-6 space-y-4">
                    {/* Before */}
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="uppercase tracking-[0.22em] text-white/55">
                                If nothing changes
                            </span>
                            <span className="font-mono text-white/90 tabular-nums">
                                {before}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={before}
                            onChange={(e) => setBefore(Number(e.target.value))}
                            className="mt-3 w-full accent-rose-400"
                        />
                        <div className="mt-1 text-[11px] italic text-white/50">
                            rate: how likely is your fear to happen?
                        </div>
                    </div>

                    {/* Relief gap */}
                    <div className="relative h-12 overflow-hidden rounded-full border border-white/10 bg-white/[0.02]">
                        <motion.div
                            aria-hidden
                            className="absolute inset-y-0 left-0 rounded-full"
                            animate={{ width: `${before}%` }}
                            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                            style={{
                                background:
                                    'linear-gradient(90deg, rgba(239,68,68,0.55), rgba(239,68,68,0.1))',
                            }}
                        />
                        <motion.div
                            aria-hidden
                            className="absolute inset-y-0 left-0 rounded-full"
                            animate={{ width: `${after}%` }}
                            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                            style={{
                                background: `linear-gradient(90deg, ${accent}, ${accent}22)`,
                                boxShadow: `0 0 16px ${accent}66`,
                            }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow">
                            {relief > 0 ? `${relief}% relief` : 'move the second slider'}
                        </div>
                    </div>

                    {/* After */}
                    <div
                        className="rounded-3xl border bg-white/[0.03] p-5"
                        style={{ borderColor: `${accent}44` }}
                    >
                        <div className="flex items-center justify-between text-xs">
                            <span
                                className="uppercase tracking-[0.22em]"
                                style={{ color: accent }}
                            >
                                If you breathe, focus, take one small step
                            </span>
                            <span className="font-mono text-white/90 tabular-nums">
                                {after}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={after}
                            onChange={(e) => setAfter(Number(e.target.value))}
                            className="mt-3 w-full"
                            style={{ accentColor: accent }}
                        />
                        <div className="mt-1 text-[11px] italic text-white/50">
                            rate the new odds
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-center">
                    <button
                        onClick={onDone}
                        className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                        style={{ backgroundColor: accent, color: '#0b0c12' }}
                    >
                        That&apos;s the gap I&apos;m working with <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </Pane>
    );
}
