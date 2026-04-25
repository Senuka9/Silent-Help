'use client';

/**
 * Step 1 — Trap the Heat (physical reset).
 *
 * Goal: interrupt the body's stress cycle. For high/medium-high tiers we use
 * the DBT TIPP protocol to bypass the thinking brain. For low tiers we go
 * straight to paced breathing (no forced ice dive).
 *
 * Phases:
 *   chooser   — high/med pick one of three TIPP tiles.
 *   temperature / tension / breathing — the chosen activity.
 *   discharge — 10s rapid-tap particle burst (high only, after their first tile).
 *   checkin   — "Still explosive, or slightly cooler?" adaptive loop.
 *
 * The visual arc is intentional: the screen starts hot red/amber and
 * progressively cools to ice-blue as the user completes activities.
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Snowflake,
    Hand,
    Wind,
    Zap,
    CheckCircle2,
    Flame,
} from 'lucide-react';
import type { StressTier } from '@/lib/emotion-theme';
import type { TippChoice, TippResults } from '@/lib/recovery-frustrated';

type Phase =
    | 'chooser'
    | 'temperature'
    | 'tension'
    | 'breathing'
    | 'discharge'
    | 'checkin';

const HEAT_RED = '#f97316'; // orange-500 (hot)
const COOL_BLUE = '#38bdf8'; // sky-400 (cooled)

export function StepHeat({
    stressTier,
    accent,
    initial,
    onComplete,
}: {
    stressTier: StressTier;
    accent: string;
    initial: TippResults;
    onComplete: (r: TippResults) => void;
}) {
    const isHigh = stressTier === 'high' || stressTier === 'medium-high';
    const isLow = stressTier === 'low';

    const [results, setResults] = useState<TippResults>(initial);
    // Low tier: skip TIPP tile chooser — go straight into paced breathing.
    const [phase, setPhase] = useState<Phase>(isLow ? 'breathing' : 'chooser');

    /** How far along the cooling gradient we are, 0 (hot) → 1 (cool). */
    const coolProgress = Math.min(
        1,
        results.completed.length / (isHigh ? 3 : 2) + (results.checkIn === 'cooler' ? 0.2 : 0),
    );

    const finishActivity = (choice: TippChoice) => {
        setResults((r) => ({
            ...r,
            completed: r.completed.includes(choice) ? r.completed : [...r.completed, choice],
        }));
        // High tier: offer a Quick Discharge once, after their first activity.
        if (isHigh && results.completed.length === 0) {
            setPhase('discharge');
        } else {
            setPhase('checkin');
        }
    };

    const finishDischarge = (taps: number) => {
        setResults((r) => ({ ...r, dischargeTaps: taps }));
        setPhase('checkin');
    };

    const answerCheckIn = (answer: 'explosive' | 'cooler') => {
        const nextPasses = results.passes + 1;
        const next: TippResults = {
            ...results,
            checkIn: answer,
            passes: nextPasses,
        };
        setResults(next);
        // If still explosive AND we haven't already looped once, offer another TIPP pass.
        if (answer === 'explosive' && nextPasses < 2 && !isLow) {
            setPhase('chooser');
        } else {
            onComplete(next);
        }
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
            {/* Temperature-cooling background overlay — subtle, behind content */}
            <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(circle at 50% 30%, ${HEAT_RED}22 0%, transparent 60%)`,
                }}
                animate={{ opacity: 1 - coolProgress * 0.85 }}
                transition={{ duration: 1.2 }}
            />
            <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(circle at 50% 30%, ${COOL_BLUE}33 0%, transparent 65%)`,
                }}
                animate={{ opacity: coolProgress }}
                transition={{ duration: 1.2 }}
            />

            <header className="relative z-10 flex flex-col items-center gap-3">
                <div className="text-xs uppercase tracking-[0.26em] text-white/55">
                    Step 1 · Trap the heat
                </div>
                <h2 className="text-balance text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Move the energy out of your body
                </h2>
                <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
                    <Flame
                        className="h-3.5 w-3.5"
                        style={{ color: HEAT_RED, opacity: 1 - coolProgress }}
                    />
                    <div className="relative h-1.5 w-44 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{
                                background: `linear-gradient(90deg, ${HEAT_RED}, ${COOL_BLUE})`,
                            }}
                            animate={{ width: `${coolProgress * 100}%` }}
                            transition={{ type: 'spring', stiffness: 100, damping: 22 }}
                        />
                    </div>
                    <Snowflake
                        className="h-3.5 w-3.5"
                        style={{ color: COOL_BLUE, opacity: coolProgress }}
                    />
                </div>
            </header>

            <AnimatePresence mode="wait">
                {phase === 'chooser' && (
                    <Pane key="chooser">
                        <TippChooser accent={accent} onPick={(c) => setPhase(c)} />
                    </Pane>
                )}
                {phase === 'temperature' && (
                    <Pane key="temperature">
                        <Temperature onDone={() => finishActivity('temperature')} />
                    </Pane>
                )}
                {phase === 'tension' && (
                    <Pane key="tension">
                        <MuscleTension onDone={() => finishActivity('tension')} />
                    </Pane>
                )}
                {phase === 'breathing' && (
                    <Pane key="breathing">
                        <PacedBreathing
                            stressTier={stressTier}
                            onDone={() => finishActivity('breathing')}
                        />
                    </Pane>
                )}
                {phase === 'discharge' && (
                    <Pane key="discharge">
                        <QuickDischarge onDone={finishDischarge} />
                    </Pane>
                )}
                {phase === 'checkin' && (
                    <Pane key="checkin">
                        <PostTippCheckIn
                            accent={accent}
                            onAnswer={answerCheckIn}
                            isFirstPass={results.passes === 0}
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mt-10 w-full max-w-2xl"
        >
            {children}
        </motion.div>
    );
}

/* ────────── Chooser ────────── */

function TippChooser({
    accent,
    onPick,
}: {
    accent: string;
    onPick: (c: TippChoice) => void;
}) {
    const tiles: {
        key: TippChoice;
        title: string;
        blurb: string;
        Icon: typeof Snowflake;
        color: string;
    }[] = [
        {
            key: 'temperature',
            title: 'Ice dive',
            blurb: 'Cold on your face or wrists. Triggers your dive reflex.',
            Icon: Snowflake,
            color: '#38bdf8',
        },
        {
            key: 'tension',
            title: 'Squeeze & release',
            blurb: 'Tense four muscle groups hard. Then let go.',
            Icon: Hand,
            color: '#fb923c',
        },
        {
            key: 'breathing',
            title: 'Paced breathing',
            blurb: 'Long exhale slows your heart. 4 in, 8 out.',
            Icon: Wind,
            color: '#a78bfa',
        },
    ];

    return (
        <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-center text-white/70">
                Pick one. They all bypass the thinking brain and talk straight to your body.
            </p>
            <div className="grid w-full gap-3 sm:grid-cols-3">
                {tiles.map((t, i) => (
                    <motion.button
                        key={t.key}
                        onClick={() => onPick(t.key)}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.06 * i, duration: 0.4 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center transition hover:border-white/25"
                        style={{
                            boxShadow: `inset 0 0 0 1px ${t.color}22`,
                        }}
                    >
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-full"
                            style={{
                                backgroundColor: `${t.color}22`,
                                color: t.color,
                                boxShadow: `0 0 24px ${t.color}55`,
                            }}
                        >
                            <t.Icon className="h-6 w-6" />
                        </div>
                        <div className="text-base font-medium text-white">{t.title}</div>
                        <div className="text-xs text-white/60">{t.blurb}</div>
                    </motion.button>
                ))}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-white/40">
                you&apos;ll only need one — pick whichever feels closest
            </div>
            <div aria-hidden style={{ color: accent, opacity: 0 }}>
                {accent}
            </div>
        </div>
    );
}

/* ────────── Temperature (ice splash) ────────── */

function Temperature({ onDone }: { onDone: () => void }) {
    const DURATION = 30;
    const [left, setLeft] = useState(DURATION);
    const [running, setRunning] = useState(false);

    useEffect(() => {
        if (!running) return;
        if (left <= 0) {
            window.setTimeout(onDone, 700);
            return;
        }
        const t = window.setTimeout(() => setLeft((s) => s - 1), 1000);
        return () => window.clearTimeout(t);
    }, [running, left, onDone]);

    const pct = (DURATION - left) / DURATION;

    return (
        <div className="flex flex-col items-center gap-6">
            <p className="max-w-md text-center text-white/70">
                Place something cold on your face or wrists for 30 seconds — ice pack, cold
                water, even a cold drink pressed against your cheek.
            </p>

            <div className="relative h-64 w-64">
                {/* Hot core that cools */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                        background: `radial-gradient(circle, ${HEAT_RED}${running ? `${Math.round(
                            (1 - pct) * 85,
                        )
                            .toString(16)
                            .padStart(2, '0')}` : '55'} 0%, transparent 70%)`,
                    }}
                />
                {/* Ice shards forming */}
                <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
                    {Array.from({ length: 8 }).map((_, i) => {
                        const angle = (i / 8) * Math.PI * 2;
                        const r = 70;
                        const x = 100 + Math.cos(angle) * r;
                        const y = 100 + Math.sin(angle) * r;
                        return (
                            <motion.circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="6"
                                fill={COOL_BLUE}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                    opacity: running ? pct * 0.9 : 0.15,
                                    scale: running ? 0.5 + pct * 0.8 : 0.3,
                                }}
                                transition={{ delay: i * 0.05, duration: 0.6 }}
                                style={{ filter: `drop-shadow(0 0 12px ${COOL_BLUE})` }}
                            />
                        );
                    })}
                    <motion.circle
                        cx="100"
                        cy="100"
                        r="40"
                        fill="none"
                        stroke={COOL_BLUE}
                        strokeWidth="2"
                        animate={{ opacity: running ? 0.3 + pct * 0.5 : 0.2 }}
                    />
                </svg>
                {/* Countdown */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-white/50">
                            {running ? 'Hold on' : 'Ready?'}
                        </div>
                        <div className="text-5xl font-semibold tabular-nums text-white">
                            {running ? left : DURATION}s
                        </div>
                    </div>
                </div>
            </div>

            {!running ? (
                <button
                    onClick={() => setRunning(true)}
                    className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                    style={{ backgroundColor: COOL_BLUE, color: '#0b0c12' }}
                >
                    Start 30s <Snowflake className="h-4 w-4" />
                </button>
            ) : (
                <button
                    onClick={onDone}
                    className="text-xs uppercase tracking-[0.22em] text-white/50 transition hover:text-white/80"
                >
                    Finish early
                </button>
            )}
        </div>
    );
}

/* ────────── Muscle tension ────────── */

const MUSCLE_GROUPS: { id: string; label: string; hint: string }[] = [
    { id: 'fists', label: 'Fists', hint: 'Squeeze your fists as tight as you can.' },
    { id: 'shoulders', label: 'Shoulders', hint: 'Pull your shoulders up to your ears.' },
    { id: 'jaw', label: 'Jaw', hint: 'Clench your jaw and press your tongue to the roof.' },
    { id: 'feet', label: 'Feet', hint: 'Curl your toes and press your feet into the floor.' },
];

function MuscleTension({ onDone }: { onDone: () => void }) {
    const [groupIdx, setGroupIdx] = useState(0);
    const [sub, setSub] = useState<'tense' | 'release' | null>(null);
    const [secs, setSecs] = useState(5);

    useEffect(() => {
        if (sub === null) return;
        if (secs <= 0) {
            if (sub === 'tense') {
                setSub('release');
                setSecs(8);
            } else {
                // Next muscle group, or finish.
                if (groupIdx >= MUSCLE_GROUPS.length - 1) {
                    window.setTimeout(onDone, 500);
                } else {
                    setGroupIdx((i) => i + 1);
                    setSub('tense');
                    setSecs(5);
                }
            }
            return;
        }
        const t = window.setTimeout(() => setSecs((s) => s - 1), 1000);
        return () => window.clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [secs, sub]);

    const group = MUSCLE_GROUPS[groupIdx];
    const color = sub === 'tense' ? HEAT_RED : sub === 'release' ? COOL_BLUE : '#ffffff';
    const cmd = sub === 'tense' ? 'SQUEEZE' : sub === 'release' ? 'RELEASE' : 'READY';

    return (
        <div className="flex flex-col items-center gap-6">
            <p className="max-w-md text-center text-white/70">{group.hint}</p>

            {/* Body silhouette with the active group glowing */}
            <div className="relative flex h-64 w-48 items-center justify-center">
                <svg viewBox="0 0 100 140" className="h-full w-full">
                    {/* head */}
                    <motion.circle
                        cx="50"
                        cy="18"
                        r="10"
                        stroke="rgba(255,255,255,0.25)"
                        fill="rgba(255,255,255,0.04)"
                        animate={{
                            fill: group.id === 'jaw' && sub ? `${color}33` : 'rgba(255,255,255,0.04)',
                            stroke: group.id === 'jaw' && sub ? color : 'rgba(255,255,255,0.25)',
                        }}
                        style={{ filter: group.id === 'jaw' && sub ? `drop-shadow(0 0 12px ${color})` : undefined }}
                    />
                    {/* shoulders */}
                    <motion.path
                        d="M25 38 Q 50 28 75 38"
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        animate={{
                            stroke: group.id === 'shoulders' && sub ? color : 'rgba(255,255,255,0.25)',
                        }}
                        style={{
                            filter: group.id === 'shoulders' && sub ? `drop-shadow(0 0 10px ${color})` : undefined,
                        }}
                    />
                    {/* torso */}
                    <path
                        d="M32 38 L68 38 L64 90 L36 90 Z"
                        stroke="rgba(255,255,255,0.2)"
                        fill="rgba(255,255,255,0.03)"
                    />
                    {/* arms + fists */}
                    <motion.path
                        d="M25 40 L18 75"
                        stroke="rgba(255,255,255,0.22)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />
                    <motion.path
                        d="M75 40 L82 75"
                        stroke="rgba(255,255,255,0.22)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />
                    <motion.circle
                        cx="18"
                        cy="78"
                        r="5"
                        animate={{
                            fill: group.id === 'fists' && sub ? color : 'rgba(255,255,255,0.1)',
                        }}
                        style={{
                            filter: group.id === 'fists' && sub ? `drop-shadow(0 0 10px ${color})` : undefined,
                        }}
                    />
                    <motion.circle
                        cx="82"
                        cy="78"
                        r="5"
                        animate={{
                            fill: group.id === 'fists' && sub ? color : 'rgba(255,255,255,0.1)',
                        }}
                        style={{
                            filter: group.id === 'fists' && sub ? `drop-shadow(0 0 10px ${color})` : undefined,
                        }}
                    />
                    {/* legs + feet */}
                    <path
                        d="M40 90 L36 125"
                        stroke="rgba(255,255,255,0.22)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />
                    <path
                        d="M60 90 L64 125"
                        stroke="rgba(255,255,255,0.22)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />
                    <motion.circle
                        cx="36"
                        cy="128"
                        r="5"
                        animate={{
                            fill: group.id === 'feet' && sub ? color : 'rgba(255,255,255,0.1)',
                        }}
                        style={{
                            filter: group.id === 'feet' && sub ? `drop-shadow(0 0 10px ${color})` : undefined,
                        }}
                    />
                    <motion.circle
                        cx="64"
                        cy="128"
                        r="5"
                        animate={{
                            fill: group.id === 'feet' && sub ? color : 'rgba(255,255,255,0.1)',
                        }}
                        style={{
                            filter: group.id === 'feet' && sub ? `drop-shadow(0 0 10px ${color})` : undefined,
                        }}
                    />
                </svg>
            </div>

            <div className="text-center">
                <motion.div
                    key={cmd}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-xs uppercase tracking-[0.3em]"
                    style={{ color }}
                >
                    {cmd} · {group.label}
                </motion.div>
                <div className="mt-1 text-4xl font-semibold tabular-nums text-white">
                    {sub ? `${secs}s` : '—'}
                </div>
                <div className="mt-1 text-xs text-white/50">
                    Group {groupIdx + 1} of {MUSCLE_GROUPS.length}
                </div>
            </div>

            {sub === null && (
                <button
                    onClick={() => {
                        setSub('tense');
                        setSecs(5);
                    }}
                    className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                    style={{ backgroundColor: HEAT_RED, color: '#0b0c12' }}
                >
                    Start squeeze
                </button>
            )}
        </div>
    );
}

/* ────────── Paced breathing (4 in / 8 out) ────────── */

function PacedBreathing({
    stressTier,
    onDone,
}: {
    stressTier: StressTier;
    onDone: () => void;
}) {
    const cycles =
        stressTier === 'high' || stressTier === 'medium-high'
            ? 8
            : stressTier === 'medium-low'
              ? 6
              : 4;

    const [cycle, setCycle] = useState(0);
    const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
    const [secs, setSecs] = useState(4);
    const [running, setRunning] = useState(false);

    useEffect(() => {
        if (!running) return;
        if (secs > 0) {
            const t = window.setTimeout(() => setSecs((s) => s - 1), 1000);
            return () => window.clearTimeout(t);
        }
        if (phase === 'in') {
            setPhase('hold');
            setSecs(1);
        } else if (phase === 'hold') {
            setPhase('out');
            setSecs(8);
        } else {
            if (cycle >= cycles - 1) {
                window.setTimeout(onDone, 400);
            } else {
                setCycle((c) => c + 1);
                setPhase('in');
                setSecs(4);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [secs, phase, running]);

    const scale = phase === 'in' ? 1.25 : phase === 'hold' ? 1.2 : 0.7;
    const color = phase === 'out' ? COOL_BLUE : HEAT_RED;
    const copy = phase === 'in' ? 'Breathe in' : phase === 'hold' ? 'Hold' : 'Slow exhale';

    return (
        <div className="flex flex-col items-center gap-6">
            <p className="max-w-md text-center text-white/70">
                4 in, 8 out. The long exhale is what drops your heart rate — not the inhale.
            </p>

            <div className="relative flex h-72 w-72 items-center justify-center">
                <motion.div
                    className="h-40 w-40 rounded-full"
                    animate={{
                        scale,
                        background: `radial-gradient(circle at 30% 30%, ${color}, ${color}33)`,
                        boxShadow: `0 0 60px ${color}88`,
                    }}
                    transition={{
                        duration: phase === 'in' ? 4 : phase === 'hold' ? 1 : 8,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                />
                <div className="absolute text-center">
                    <div
                        className="text-xs uppercase tracking-[0.3em]"
                        style={{ color, textShadow: `0 0 14px ${color}` }}
                    >
                        {running ? copy : 'Ready'}
                    </div>
                    <div className="text-5xl font-semibold tabular-nums text-white">
                        {running ? secs : 4}s
                    </div>
                    <div className="text-xs text-white/50">
                        {running ? `${cycle + 1} / ${cycles}` : `${cycles} breaths`}
                    </div>
                </div>
            </div>

            {!running ? (
                <button
                    onClick={() => {
                        setRunning(true);
                        setSecs(4);
                    }}
                    className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                    style={{ backgroundColor: color, color: '#0b0c12' }}
                >
                    Start paced breathing <Wind className="h-4 w-4" />
                </button>
            ) : (
                <button
                    onClick={onDone}
                    className="text-xs uppercase tracking-[0.22em] text-white/50 transition hover:text-white/80"
                >
                    Finish early
                </button>
            )}
        </div>
    );
}

/* ────────── Quick discharge (high only) ────────── */

const DISCHARGE_DURATION = 10;

function QuickDischarge({ onDone }: { onDone: (taps: number) => void }) {
    const DURATION = DISCHARGE_DURATION;
    const [left, setLeft] = useState(DURATION);
    const [taps, setTaps] = useState(0);
    const [running, setRunning] = useState(false);
    const [sparks, setSparks] = useState<{ id: number; x: number; y: number; dx: number; dy: number }[]>([]);
    const nextSparkId = useRef(1);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!running) return;
        if (left <= 0) {
            window.setTimeout(() => onDone(taps), 500);
            return;
        }
        const t = window.setTimeout(() => setLeft((s) => s - 1), 1000);
        return () => window.clearTimeout(t);
    }, [running, left, onDone, taps]);

    const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
        if (!running) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const point =
            'touches' in e
                ? e.touches[0] ?? e.changedTouches[0]
                : (e as React.MouseEvent);
        const x = point.clientX - rect.left;
        const y = point.clientY - rect.top;
        const id = nextSparkId.current++;
        const dx = ((id * 73) % 200) - 100;
        const dy = 100 + (id * 37) % 80;
        setSparks((s) => [...s, { id, x, y, dx, dy }]);
        setTaps((n) => n + 1);
        window.setTimeout(
            () => setSparks((s) => s.filter((sp) => sp.id !== id)),
            700,
        );
    };

    return (
        <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-center text-white/70">
                10 seconds. Tap anywhere as fast as you can. Every tap sends energy out of your
                body and off the screen.
            </p>

            <div
                ref={containerRef}
                onMouseDown={handleTap}
                onTouchStart={handleTap}
                className={`relative h-72 w-full overflow-hidden rounded-3xl border border-white/10 ${
                    running ? 'cursor-pointer' : ''
                }`}
                style={{
                    background: running
                        ? `radial-gradient(circle at 50% 50%, ${HEAT_RED}33 0%, #0b0c12 70%)`
                        : 'rgba(255,255,255,0.03)',
                    boxShadow: running ? `inset 0 0 60px ${HEAT_RED}55` : undefined,
                }}
            >
                {/* Shake-on-tap overlay */}
                <motion.div
                    animate={
                        taps > 0
                            ? { x: [0, -3, 3, -2, 2, 0] }
                            : {}
                    }
                    key={taps}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    {!running ? (
                        <div className="text-center">
                            <div className="text-xs uppercase tracking-[0.22em] text-white/50">
                                Ready
                            </div>
                            <div className="mt-1 text-sm text-white/70">Tap start, then hammer the screen.</div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="text-[11px] uppercase tracking-[0.3em] text-amber-300">
                                Discharge
                            </div>
                            <div className="mt-1 text-6xl font-semibold tabular-nums text-white">
                                {left}s
                            </div>
                            <div className="mt-1 text-xs text-white/60">
                                {taps} taps
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Sparks */}
                <AnimatePresence>
                    {sparks.map((s) => (
                        <motion.div
                            key={s.id}
                            initial={{ opacity: 1, scale: 0.4, x: s.x - 10, y: s.y - 10 }}
                            animate={{
                                opacity: 0,
                                scale: 2.5,
                                x: s.x - 10 + s.dx,
                                y: s.y - 10 - s.dy,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="pointer-events-none absolute h-5 w-5 rounded-full"
                            style={{
                                background: `radial-gradient(circle, ${HEAT_RED} 0%, #fcd34d 60%, transparent 100%)`,
                                filter: 'drop-shadow(0 0 8px #f97316)',
                            }}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {!running && (
                <button
                    onClick={() => {
                        setRunning(true);
                        setLeft(DURATION);
                        setTaps(0);
                    }}
                    className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                    style={{ backgroundColor: HEAT_RED, color: '#0b0c12' }}
                >
                    <Zap className="h-4 w-4" /> Start discharge
                </button>
            )}
            {running && (
                <button
                    onClick={() => onDone(taps)}
                    className="text-xs uppercase tracking-[0.22em] text-white/50 transition hover:text-white/80"
                >
                    Stop early
                </button>
            )}
        </div>
    );
}

/* ────────── Post-TIPP check-in ────────── */

function PostTippCheckIn({
    accent,
    onAnswer,
    isFirstPass,
}: {
    accent: string;
    onAnswer: (a: 'explosive' | 'cooler') => void;
    isFirstPass: boolean;
}) {
    return (
        <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-center text-white/75">
                {isFirstPass
                    ? 'Check in with your body. No wrong answer — your honesty is what makes the next step work.'
                    : "Second pass in. Listen to your body again."}
            </p>
            <div className="grid w-full gap-3 sm:grid-cols-2">
                <motion.button
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onAnswer('explosive')}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-white/25"
                    style={{ boxShadow: `inset 0 0 0 1px ${HEAT_RED}33` }}
                >
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]" style={{ color: HEAT_RED }}>
                        <Flame className="h-3.5 w-3.5" /> Still explosive
                    </div>
                    <div className="mt-2 text-sm text-white">I still feel like I could snap.</div>
                    <div className="mt-1 text-xs text-white/55">
                        {isFirstPass ? "We'll do one more TIPP pass." : 'We\'ll keep going gently from here.'}
                    </div>
                </motion.button>
                <motion.button
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onAnswer('cooler')}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-white/25"
                    style={{ boxShadow: `inset 0 0 0 1px ${COOL_BLUE}44` }}
                >
                    <div
                        className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]"
                        style={{ color: COOL_BLUE }}
                    >
                        <Snowflake className="h-3.5 w-3.5" /> Slightly cooler
                    </div>
                    <div className="mt-2 text-sm text-white">My body feels a bit calmer.</div>
                    <div className="mt-1 text-xs text-white/55">
                        Good. Now we can talk to the thought.
                    </div>
                </motion.button>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] uppercase tracking-[0.22em] text-white/40">
                <CheckCircle2 className="h-3 w-3" style={{ color: accent }} /> This choice is logged
                so the coach adapts.
            </div>
        </div>
    );
}
