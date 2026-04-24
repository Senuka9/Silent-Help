'use client';

/**
 * Step 4 — The Tiny Brave Step (Behavioral Activation).
 *
 * Sub-phases:
 *   a. Name the goal at the top of the ladder (the thing anxiety is
 *      trying to stop you from doing).
 *   b. Name the tiny first rung — something so small it feels almost silly.
 *      Visualized as an "exposure ladder" with the user at the bottom and
 *      their goal at the top.
 *   c. (high / medium-high only) Self-soothing hug — a 20-second animated
 *      timer where two arms wrap around a silhouette. Proprioceptive
 *      self-compassion, evidence-based anxiety down-regulator.
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Heart, CheckCircle2 } from 'lucide-react';
import type { StressTier } from '@/lib/emotion-theme';
import type { BraveStepData } from '@/lib/recovery-anxious';

type Phase = 'goal' | 'tiny' | 'ladder' | 'hug';

const GOAL_STARTERS = [
    'Send that message',
    'Go to the event',
    'Make the call',
    'Speak up',
    'Leave the house',
];

const TINY_STARTERS = [
    'Open the app, read last message',
    'Write the first sentence',
    'Put my shoes on',
    'Stand up and stretch',
    'Say hi to one person',
];

export function StepBraveStep({
    stressTier,
    accent,
    initial,
    onComplete,
}: {
    stressTier: StressTier;
    accent: string;
    initial: BraveStepData;
    onComplete: (data: BraveStepData) => void;
}) {
    const includeHug = stressTier === 'high' || stressTier === 'medium-high';
    const [phase, setPhase] = useState<Phase>('goal');
    const [data, setData] = useState<BraveStepData>(initial);

    const update = (patch: Partial<BraveStepData>) => setData((d) => ({ ...d, ...patch }));

    const totalPhases = includeHug ? 4 : 3;
    const phaseIndex =
        phase === 'goal' ? 0 : phase === 'tiny' ? 1 : phase === 'ladder' ? 2 : 3;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
            <header className="flex flex-col items-center gap-3">
                <div className="text-xs uppercase tracking-[0.26em] text-white/50">
                    Step 4 · The tiny brave step
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    One rung up
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
                {phase === 'goal' && (
                    <Frame key="goal">
                        <GoalEntry
                            value={data.goal}
                            onChange={(v) => update({ goal: v })}
                            accent={accent}
                            onNext={() => setPhase('tiny')}
                        />
                    </Frame>
                )}
                {phase === 'tiny' && (
                    <Frame key="tiny">
                        <TinyEntry
                            goal={data.goal}
                            value={data.tinyStep}
                            onChange={(v) => update({ tinyStep: v })}
                            accent={accent}
                            onNext={() => setPhase('ladder')}
                        />
                    </Frame>
                )}
                {phase === 'ladder' && (
                    <Frame key="ladder">
                        <Ladder
                            goal={data.goal}
                            tinyStep={data.tinyStep}
                            accent={accent}
                            onNext={() => {
                                if (includeHug) setPhase('hug');
                                else onComplete(data);
                            }}
                        />
                    </Frame>
                )}
                {phase === 'hug' && (
                    <Frame key="hug">
                        <SelfSoothingHug
                            accent={accent}
                            onDone={() => {
                                update({ selfSoothed: true });
                                onComplete({ ...data, selfSoothed: true });
                            }}
                        />
                    </Frame>
                )}
            </AnimatePresence>
        </div>
    );
}

function Frame({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.45 }}
            className="mt-10 w-full max-w-xl"
        >
            {children}
        </motion.div>
    );
}

/* ────────── a) Goal entry ────────── */

function GoalEntry({
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
                What&apos;s one thing anxiety has been trying to stop you from doing? Name it —
                the real thing, not the watered-down version.
            </p>

            {value.trim().length === 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                    {GOAL_STARTERS.map((s) => (
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
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoFocus
                placeholder="The thing at the top of the ladder…"
                className="w-full rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-center text-lg text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />

            <button
                onClick={onNext}
                disabled={!value.trim()}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{ backgroundColor: accent, color: '#0b0c12' }}
            >
                Next <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    );
}

/* ────────── b) Tiny step entry ────────── */

function TinyEntry({
    goal,
    value,
    onChange,
    accent,
    onNext,
}: {
    goal: string;
    value: string;
    onChange: (v: string) => void;
    accent: string;
    onNext: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-5">
            <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-white/45">Your goal</div>
                <div className="mt-1 text-sm italic text-white/80">&ldquo;{goal}&rdquo;</div>
            </div>

            <p className="max-w-md text-center text-white/70">
                What&apos;s one <em>tiny</em> step toward that — so small it feels almost silly?
                Lower the bar. The step before the step.
            </p>

            {value.trim().length === 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                    {TINY_STARTERS.map((s) => (
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
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoFocus
                placeholder="The one tiny step…"
                className="w-full rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-center text-base text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />

            <button
                onClick={onNext}
                disabled={!value.trim()}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{ backgroundColor: accent, color: '#0b0c12' }}
            >
                Show the ladder <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    );
}

/* ────────── c) Exposure ladder visual ────────── */

function Ladder({
    goal,
    tinyStep,
    accent,
    onNext,
}: {
    goal: string;
    tinyStep: string;
    accent: string;
    onNext: () => void;
}) {
    // 5 rungs, bottom = where you are, rung 1 = tiny step, top = goal
    const rungs = [
        { label: 'Where you are now', active: false, dim: true },
        { label: tinyStep, active: true, dim: false },
        { label: '…', active: false, dim: true },
        { label: '…', active: false, dim: true },
        { label: goal, active: false, dim: false, isGoal: true },
    ];

    return (
        <div className="flex flex-col items-center gap-6">
            <p className="max-w-md text-center text-white/70">
                This is brave. Not easy — <span className="text-white">brave</span>. You don&apos;t
                have to do the whole thing today. Just the rung one up.
            </p>

            <div className="relative w-full max-w-sm py-4">
                {/* Side rails */}
                <div className="pointer-events-none absolute inset-y-4 left-6 w-0.5 rounded-full bg-white/15" />
                <div className="pointer-events-none absolute inset-y-4 right-6 w-0.5 rounded-full bg-white/15" />

                <div className="flex flex-col-reverse gap-3">
                    {rungs.map((r, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
                            className={`relative mx-4 flex items-center gap-3 rounded-xl border px-4 py-3 ${
                                r.active
                                    ? 'border-white/30 bg-white/10 shadow-[0_0_30px] shadow-white/5'
                                    : r.dim
                                      ? 'border-dashed border-white/10 bg-white/[0.02]'
                                      : 'border-white/15 bg-white/[0.04]'
                            }`}
                            style={
                                r.active
                                    ? { boxShadow: `0 0 40px ${accent}33`, borderColor: `${accent}77` }
                                    : undefined
                            }
                        >
                            <div
                                className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-semibold ${
                                    r.active ? 'text-[#0b0c12]' : 'text-white/60'
                                }`}
                                style={{
                                    backgroundColor: r.active
                                        ? accent
                                        : r.isGoal
                                          ? `${accent}33`
                                          : 'rgba(255,255,255,0.08)',
                                }}
                            >
                                {i + 1}
                            </div>
                            <div className="flex-1">
                                {r.isGoal && (
                                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                                        Your goal
                                    </div>
                                )}
                                {r.active && (
                                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                                        Your tiny brave step
                                    </div>
                                )}
                                <div
                                    className={`text-sm ${
                                        r.dim ? 'text-white/35 italic' : 'text-white'
                                    }`}
                                >
                                    {r.label}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <button
                onClick={onNext}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                style={{ backgroundColor: accent, color: '#0b0c12' }}
            >
                I&apos;ll take the step <CheckCircle2 className="h-4 w-4" />
            </button>
        </div>
    );
}

/* ────────── d) Self-soothing hug (high / medium-high) ────────── */

const HUG_SECONDS = 20;

function SelfSoothingHug({
    accent,
    onDone,
}: {
    accent: string;
    onDone: () => void;
}) {
    const [left, setLeft] = useState(HUG_SECONDS);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (!started) return;
        if (left <= 0) {
            window.setTimeout(onDone, 600);
            return;
        }
        const t = window.setTimeout(() => setLeft((s) => s - 1), 1000);
        return () => window.clearTimeout(t);
    }, [left, started, onDone]);

    const pct = (HUG_SECONDS - left) / HUG_SECONDS;

    return (
        <div className="flex flex-col items-center gap-6">
            <p className="max-w-md text-center text-white/70">
                Before you go — wrap your arms around yourself for 20 seconds. Squeeze gently.
                This is proprioceptive self-soothing; your nervous system actually responds.
            </p>

            <div className="relative flex h-64 w-64 items-center justify-center">
                {/* Pulsing glow */}
                <motion.div
                    className="absolute inset-0 rounded-full blur-3xl"
                    style={{ background: `radial-gradient(circle, ${accent}88 0%, transparent 70%)` }}
                    animate={{
                        scale: started ? [1, 1.15, 1] : 1,
                        opacity: started ? [0.5, 0.85, 0.5] : 0.4,
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />

                <svg viewBox="0 0 100 100" className="h-full w-full">
                    {/* Silhouette head + torso */}
                    <circle cx="50" cy="30" r="10" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" />
                    <path
                        d="M35 42 L65 42 L62 80 L38 80 Z"
                        fill="rgba(255,255,255,0.05)"
                        stroke="rgba(255,255,255,0.25)"
                    />
                    {/* Left arm */}
                    <motion.path
                        d="M35 42 Q 18 52 22 70 Q 40 72 48 64"
                        stroke={accent}
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: started ? 1 : 0.2 }}
                        transition={{ duration: 1.4, ease: 'easeOut' }}
                        style={{ filter: `drop-shadow(0 0 8px ${accent})` }}
                    />
                    {/* Right arm */}
                    <motion.path
                        d="M65 42 Q 82 52 78 70 Q 60 72 52 64"
                        stroke={accent}
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: started ? 1 : 0.2 }}
                        transition={{ duration: 1.4, ease: 'easeOut', delay: 0.1 }}
                        style={{ filter: `drop-shadow(0 0 8px ${accent})` }}
                    />
                    {/* Heart */}
                    <motion.g
                        animate={
                            started
                                ? { scale: [1, 1.12, 1] }
                                : { scale: 1 }
                        }
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ transformOrigin: '50px 60px' }}
                    >
                        <path
                            d="M50 56 l -4 -4 a 2.5 2.5 0 0 1 4 -2 a 2.5 2.5 0 0 1 4 2 l -4 4 z"
                            fill={accent}
                            opacity={started ? 0.95 : 0.4}
                        />
                    </motion.g>
                </svg>

                {/* Countdown ring */}
                <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full -rotate-90">
                    <circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="1"
                    />
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="none"
                        stroke={accent}
                        strokeWidth="1.5"
                        pathLength={1}
                        strokeDasharray="1 1"
                        animate={{ strokeDashoffset: started ? 1 - pct : 1 }}
                        transition={{ duration: 1, ease: 'linear' }}
                    />
                </svg>
            </div>

            <div className="text-center">
                <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                    {started ? 'Keep squeezing' : 'Ready when you are'}
                </div>
                <div className="mt-1 text-4xl font-semibold tabular-nums text-white">
                    {started ? left : HUG_SECONDS}s
                </div>
            </div>

            {!started ? (
                <button
                    onClick={() => setStarted(true)}
                    className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                    style={{ backgroundColor: accent, color: '#0b0c12' }}
                >
                    <Heart className="h-4 w-4" /> Start the hug
                </button>
            ) : (
                <button
                    onClick={onDone}
                    className="text-xs uppercase tracking-[0.2em] text-white/50 transition hover:text-white/80"
                >
                    Finish early
                </button>
            )}
        </div>
    );
}
