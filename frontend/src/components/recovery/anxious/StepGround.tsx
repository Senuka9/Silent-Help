'use client';

/**
 * Step 1 — Interrupt the Alarm (Body First).
 *
 * Sub-phases, in sequence, tuned to the user's stress tier:
 *   a. Extended-exhale breathing sphere (4s in · 2s hold · 6s out) to
 *      kick the parasympathetic nervous system on.
 *   b. 5-4-3-2-1 sensory grounding — tap-to-log 5 sights, 4 feels,
 *      3 sounds, 2 smells, 1 taste.
 *   c. (high / medium-high only) Progressive Muscle Relaxation —
 *      7 muscle groups, tense 5s → release 10s.
 *
 * Everything animates with framer-motion. The component is stateless
 * toward the parent: it calls `onComplete({ breaths, sensoryItems, pmrCompleted })`
 * when the user finishes or chooses to move on.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, Hand, Ear, Wind, Coffee, Sparkles, ArrowRight, Check } from 'lucide-react';
import type { StressTier } from '@/lib/emotion-theme';
import type { SensoryItem } from '@/lib/recovery-anxious';

type Phase = 'breathe' | 'ground' | 'pmr';

const BREATH_CYCLES_BY_TIER: Record<StressTier, number> = {
    'low': 3,
    'medium-low': 4,
    'medium-high': 5,
    'high': 6,
};

const SENSES: {
    key: SensoryItem['sense'];
    count: number;
    label: string;
    prompt: string;
    icon: React.ElementType;
}[] = [
    { key: 'see', count: 5, label: 'See', prompt: 'Name something you can see', icon: Eye },
    { key: 'feel', count: 4, label: 'Feel', prompt: 'Name something you can touch or feel', icon: Hand },
    { key: 'hear', count: 3, label: 'Hear', prompt: 'Name something you can hear', icon: Ear },
    { key: 'smell', count: 2, label: 'Smell', prompt: 'Name something you can smell', icon: Wind },
    { key: 'taste', count: 1, label: 'Taste', prompt: 'Name something you can taste', icon: Coffee },
];

const PMR_GROUPS = [
    { key: 'feet', label: 'Feet & calves', cy: 0.92 },
    { key: 'thighs', label: 'Thighs & glutes', cy: 0.76 },
    { key: 'abs', label: 'Belly & lower back', cy: 0.62 },
    { key: 'chest', label: 'Chest & shoulders', cy: 0.48 },
    { key: 'arms', label: 'Arms & hands', cy: 0.4 },
    { key: 'neck', label: 'Neck & jaw', cy: 0.26 },
    { key: 'face', label: 'Face & forehead', cy: 0.16 },
];

export function StepGround({
    stressTier,
    accent,
    onComplete,
}: {
    stressTier: StressTier;
    accent: string;
    onComplete: (result: {
        breathsCompleted: number;
        sensoryItems: SensoryItem[];
        pmrCompleted: boolean;
    }) => void;
}) {
    const includePmr = stressTier === 'high' || stressTier === 'medium-high';
    const [phase, setPhase] = useState<Phase>('breathe');
    const [breaths, setBreaths] = useState(0);
    const [sensoryItems, setSensoryItems] = useState<SensoryItem[]>([]);
    const [pmrCompleted, setPmrCompleted] = useState(false);

    const advance = () => {
        if (phase === 'breathe') {
            setPhase('ground');
        } else if (phase === 'ground') {
            if (includePmr) setPhase('pmr');
            else onComplete({ breathsCompleted: breaths, sensoryItems, pmrCompleted });
        } else if (phase === 'pmr') {
            onComplete({ breathsCompleted: breaths, sensoryItems, pmrCompleted });
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
            <PhaseHeader phase={phase} includePmr={includePmr} accent={accent} />

            <AnimatePresence mode="wait">
                {phase === 'breathe' && (
                    <motion.div
                        key="breathe"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.5 }}
                        className="mt-10 w-full max-w-xl"
                    >
                        <BreathingSphere
                            accent={accent}
                            cyclesGoal={BREATH_CYCLES_BY_TIER[stressTier]}
                            onCycle={() => setBreaths((b) => b + 1)}
                            onDone={advance}
                        />
                    </motion.div>
                )}

                {phase === 'ground' && (
                    <motion.div
                        key="ground"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.5 }}
                        className="mt-10 w-full max-w-3xl"
                    >
                        <FiveFourThreeTwoOne
                            accent={accent}
                            items={sensoryItems}
                            onChange={setSensoryItems}
                            onDone={advance}
                        />
                    </motion.div>
                )}

                {phase === 'pmr' && (
                    <motion.div
                        key="pmr"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.5 }}
                        className="mt-10 w-full max-w-xl"
                    >
                        <ProgressiveMuscleRelaxation
                            accent={accent}
                            onDone={() => {
                                setPmrCompleted(true);
                                advance();
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─────────────────────── Phase header ─────────────────────── */

function PhaseHeader({
    phase,
    includePmr,
    accent,
}: {
    phase: Phase;
    includePmr: boolean;
    accent: string;
}) {
    const phases = useMemo(() => {
        const base: { key: Phase; title: string }[] = [
            { key: 'breathe', title: 'Breathe' },
            { key: 'ground', title: '5-4-3-2-1' },
        ];
        if (includePmr) base.push({ key: 'pmr', title: 'Release tension' });
        return base;
    }, [includePmr]);

    const index = phases.findIndex((p) => p.key === phase);

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="text-xs uppercase tracking-[0.26em] text-white/50">
                Step 1 · Interrupt the alarm
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {phases[index]?.title ?? 'Ground'}
            </h2>
            <div className="mt-2 flex items-center gap-2">
                {phases.map((p, i) => (
                    <motion.div
                        key={p.key}
                        layout
                        className="h-1.5 rounded-full"
                        animate={{
                            width: i === index ? 40 : 14,
                            backgroundColor: i <= index ? accent : 'rgba(255,255,255,0.18)',
                        }}
                        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                    />
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────── a) Breathing sphere ─────────────────────── */

type BreathPhase = 'inhale' | 'hold' | 'exhale';
const PHASE_DURATIONS: Record<BreathPhase, number> = { inhale: 4, hold: 2, exhale: 6 };

function BreathingSphere({
    accent,
    cyclesGoal,
    onCycle,
    onDone,
}: {
    accent: string;
    cyclesGoal: number;
    onCycle: () => void;
    onDone: () => void;
}) {
    const [phase, setPhase] = useState<BreathPhase>('inhale');
    const [cycle, setCycle] = useState(0);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        const next: Record<BreathPhase, BreathPhase> = {
            inhale: 'hold',
            hold: 'exhale',
            exhale: 'inhale',
        };
        timerRef.current = window.setTimeout(() => {
            setPhase((p) => {
                const np = next[p];
                if (np === 'inhale') {
                    onCycle();
                    setCycle((c) => {
                        const nc = c + 1;
                        if (nc >= cyclesGoal) {
                            window.setTimeout(onDone, 600);
                        }
                        return nc;
                    });
                }
                return np;
            });
        }, PHASE_DURATIONS[phase] * 1000);
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, [phase, cyclesGoal, onCycle, onDone]);

    const scale = phase === 'inhale' ? 1.4 : phase === 'hold' ? 1.4 : 0.72;
    const label = phase === 'inhale' ? 'Breathe in' : phase === 'hold' ? 'Hold' : 'Long exhale';

    return (
        <div className="flex flex-col items-center gap-8">
            <div className="relative flex h-80 w-80 items-center justify-center">
                {/* Ambient glow */}
                <motion.div
                    className="absolute inset-0 rounded-full blur-3xl"
                    style={{ background: `radial-gradient(circle, ${accent}88 0%, transparent 70%)` }}
                    animate={{ scale: scale * 0.92, opacity: phase === 'exhale' ? 0.5 : 0.85 }}
                    transition={{ duration: PHASE_DURATIONS[phase], ease: 'easeInOut' }}
                />
                {/* Outer ring */}
                <motion.div
                    className="absolute h-64 w-64 rounded-full border-2"
                    style={{ borderColor: accent }}
                    animate={{ scale }}
                    transition={{ duration: PHASE_DURATIONS[phase], ease: 'easeInOut' }}
                />
                {/* Sphere */}
                <motion.div
                    className="h-48 w-48 rounded-full"
                    style={{
                        background: `radial-gradient(circle at 30% 30%, ${accent}, ${accent}44)`,
                        boxShadow: `0 0 80px ${accent}55`,
                    }}
                    animate={{ scale }}
                    transition={{ duration: PHASE_DURATIONS[phase], ease: 'easeInOut' }}
                />
                {/* Center label */}
                <div className="absolute text-center">
                    <div className="text-2xl font-medium text-white">{label}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.2em] text-white/60">
                        {cycle}/{cyclesGoal}
                    </div>
                </div>
            </div>
            <p className="max-w-sm text-center text-sm text-white/70">
                Let your exhale be longer than your inhale. That&apos;s the signal your body needs to
                come down from alert.
            </p>
            <button
                onClick={onDone}
                className="text-xs uppercase tracking-[0.2em] text-white/50 transition hover:text-white/80"
            >
                Skip to grounding
            </button>
        </div>
    );
}

/* ─────────────────────── b) 5-4-3-2-1 sensory grounding ─────────────────────── */

function FiveFourThreeTwoOne({
    accent,
    items,
    onChange,
    onDone,
}: {
    accent: string;
    items: SensoryItem[];
    onChange: (items: SensoryItem[]) => void;
    onDone: () => void;
}) {
    const [activeIdx, setActiveIdx] = useState(() => {
        // Resume at the first unfinished sense
        for (let i = 0; i < SENSES.length; i++) {
            const s = SENSES[i];
            const already = items.filter((it) => it.sense === s.key).length;
            if (already < s.count) return i;
        }
        return SENSES.length - 1;
    });
    const [draft, setDraft] = useState('');

    const active = SENSES[activeIdx];
    const activeItems = items.filter((i) => i.sense === active.key);
    const activeRemaining = active.count - activeItems.length;

    const totalFilled = items.length;
    const totalNeeded = SENSES.reduce((s, x) => s + x.count, 0);
    const pct = Math.round((totalFilled / totalNeeded) * 100);

    const submit = () => {
        if (!draft.trim()) return;
        const next = [...items, { sense: active.key, value: draft.trim() }];
        onChange(next);
        setDraft('');
        const nextActiveItems = next.filter((i) => i.sense === active.key);
        if (nextActiveItems.length >= active.count) {
            // Move to next sense
            const nextIdx = activeIdx + 1;
            if (nextIdx >= SENSES.length) {
                window.setTimeout(onDone, 500);
            } else {
                window.setTimeout(() => setActiveIdx(nextIdx), 350);
            }
        }
    };

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Progress */}
            <div className="flex items-center gap-3">
                <div className="h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: accent }}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: 'spring', stiffness: 220, damping: 28 }}
                    />
                </div>
                <span className="text-xs uppercase tracking-[0.18em] text-white/50">
                    {totalFilled}/{totalNeeded}
                </span>
            </div>

            {/* Sense tile row */}
            <div className="flex flex-wrap items-center justify-center gap-3">
                {SENSES.map((s, i) => {
                    const filled = items.filter((it) => it.sense === s.key).length;
                    const isActive = i === activeIdx;
                    const isDone = filled >= s.count;
                    const Icon = s.icon;
                    return (
                        <motion.div
                            key={s.key}
                            layout
                            onClick={() => !isDone && setActiveIdx(i)}
                            className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border px-4 py-3 text-center transition ${
                                isActive
                                    ? 'border-white/30 bg-white/10'
                                    : isDone
                                      ? 'border-white/15 bg-white/[0.04]'
                                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                            }`}
                            animate={{ scale: isActive ? 1.04 : 1 }}
                        >
                            <Icon
                                className="h-5 w-5"
                                style={{ color: isDone || isActive ? accent : 'rgba(255,255,255,0.55)' }}
                            />
                            <div className="text-xs text-white/90">
                                {s.count} {s.label}
                            </div>
                            <div className="flex gap-0.5">
                                {Array.from({ length: s.count }).map((_, j) => (
                                    <motion.div
                                        key={j}
                                        className="h-1 w-3 rounded-full"
                                        animate={{
                                            backgroundColor:
                                                j < filled ? accent : 'rgba(255,255,255,0.14)',
                                        }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Active prompt + input */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${active.key}-${activeItems.length}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35 }}
                    className="mt-4 w-full max-w-xl"
                >
                    <div className="text-center text-sm uppercase tracking-[0.22em] text-white/50">
                        {activeRemaining > 0
                            ? `${activeRemaining} more to ${active.label.toLowerCase()}`
                            : `${active.label} complete`}
                    </div>
                    <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 backdrop-blur">
                        <span className="text-white/50">
                            <active.icon className="h-5 w-5" />
                        </span>
                        <input
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && submit()}
                            placeholder={active.prompt}
                            className="flex-1 bg-transparent text-base text-white placeholder:text-white/30 focus:outline-none"
                        />
                        <button
                            onClick={submit}
                            disabled={!draft.trim()}
                            className="flex h-9 w-9 items-center justify-center rounded-full transition disabled:opacity-30"
                            style={{ backgroundColor: accent, color: '#0b0c12' }}
                            aria-label="Add"
                        >
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Recently added items — flow list */}
            {items.length > 0 && (
                <div className="mt-2 flex max-w-2xl flex-wrap justify-center gap-2">
                    {items.slice(-8).map((it, i) => (
                        <motion.div
                            key={`${it.sense}-${i}-${it.value}`}
                            initial={{ opacity: 0, scale: 0.85, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.35 }}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/80"
                        >
                            <span className="mr-1 text-white/45">{it.sense}</span>
                            {it.value}
                        </motion.div>
                    ))}
                </div>
            )}

            <button
                onClick={onDone}
                className="mt-2 text-xs uppercase tracking-[0.2em] text-white/50 transition hover:text-white/80"
            >
                Move on
            </button>
        </div>
    );
}

/* ─────────────────────── c) Progressive Muscle Relaxation ─────────────────────── */

type PmrState = 'rest' | 'tense' | 'release';
const TENSE_SEC = 5;
const RELEASE_SEC = 10;

function ProgressiveMuscleRelaxation({
    accent,
    onDone,
}: {
    accent: string;
    onDone: () => void;
}) {
    const [groupIdx, setGroupIdx] = useState(0);
    const [state, setState] = useState<PmrState>('tense');
    const [secondsLeft, setSecondsLeft] = useState(TENSE_SEC);

    useEffect(() => {
        if (state === 'rest') return;
        const t = window.setTimeout(() => {
            if (secondsLeft > 0) {
                setSecondsLeft((s) => s - 1);
                return;
            }
            if (state === 'tense') {
                setState('release');
                setSecondsLeft(RELEASE_SEC);
                return;
            }
            if (groupIdx + 1 >= PMR_GROUPS.length) {
                setState('rest');
                window.setTimeout(onDone, 800);
                return;
            }
            setGroupIdx((i) => i + 1);
            setState('tense');
            setSecondsLeft(TENSE_SEC);
        }, 1000);
        return () => window.clearTimeout(t);
    }, [state, secondsLeft, groupIdx, onDone]);

    const group = PMR_GROUPS[groupIdx];

    return (
        <div className="flex flex-col items-center gap-6">
            <p className="max-w-md text-center text-sm text-white/70">
                Tense each group for 5 seconds, then let it fall soft for 10. Breathe through it.
            </p>

            {/* Body silhouette */}
            <div className="relative flex h-[420px] w-48 items-center justify-center">
                <svg viewBox="0 0 100 200" className="h-full w-full">
                    {/* head */}
                    <circle cx="50" cy="20" r="13" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" />
                    {/* body */}
                    <path
                        d="M30 35 L70 35 L72 95 L68 160 L58 195 L42 195 L32 160 L28 95 Z"
                        fill="rgba(255,255,255,0.04)"
                        stroke="rgba(255,255,255,0.18)"
                    />
                    {/* arms */}
                    <path
                        d="M30 40 L14 90 L20 135 M70 40 L86 90 L80 135"
                        stroke="rgba(255,255,255,0.18)"
                        strokeWidth="2"
                        fill="none"
                    />
                    {/* active group highlight */}
                    <motion.circle
                        cx="50"
                        cy={group.cy * 200}
                        animate={{
                            r: state === 'tense' ? 22 : state === 'release' ? 30 : 0,
                            opacity: state === 'rest' ? 0 : state === 'tense' ? 0.65 : 0.35,
                        }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        fill={state === 'tense' ? '#fb7185' : accent}
                        style={{ filter: `drop-shadow(0 0 18px ${state === 'tense' ? '#fb7185' : accent})` }}
                    />
                </svg>
            </div>

            {/* Instruction + countdown */}
            <div className="flex flex-col items-center gap-2">
                <div className="text-xs uppercase tracking-[0.22em] text-white/50">{group.label}</div>
                <motion.div
                    key={`${groupIdx}-${state}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-semibold text-white"
                    style={{ color: state === 'tense' ? '#fb7185' : accent }}
                >
                    {state === 'tense' ? 'Tense…' : state === 'release' ? 'Let go' : 'Done'}
                </motion.div>
                {state !== 'rest' && (
                    <div className="text-sm text-white/60">{secondsLeft}s</div>
                )}
            </div>

            {/* Progress dots */}
            <div className="mt-2 flex gap-1.5">
                {PMR_GROUPS.map((_, i) => (
                    <motion.div
                        key={i}
                        className="h-1.5 w-5 rounded-full"
                        animate={{
                            backgroundColor:
                                i < groupIdx
                                    ? accent
                                    : i === groupIdx
                                      ? 'rgba(255,255,255,0.55)'
                                      : 'rgba(255,255,255,0.15)',
                        }}
                    />
                ))}
            </div>

            <button
                onClick={onDone}
                className="mt-1 text-xs uppercase tracking-[0.2em] text-white/50 transition hover:text-white/80"
            >
                Skip to next step
                <Check className="ml-1 inline h-3 w-3" />
            </button>
            <Sparkles className="hidden" />
        </div>
    );
}
