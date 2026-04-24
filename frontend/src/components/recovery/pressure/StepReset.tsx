'use client';

/**
 * Step 1 — Turn Off the Alarm (Physiological Reset).
 *
 * Protocol picked by pressure level:
 *   high   → Physiological sigh (double inhale, long exhale). 60s / 8 cycles.
 *   medium → Box breathing (4-4-4-4). 4 rounds.
 *   low    → Slow breathing. 3 breaths, exhale longer than inhale.
 *
 * PMR (Progressive Muscle Relaxation) is offered as a follow-on option
 * when pressure type is time or self-imposed. Body silhouette lights up
 * 5 muscle groups feet → jaw on a 5s squeeze / 10s release cycle.
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import type {
    PressureLevel,
    PressureType,
    ResetData,
} from '@/lib/recovery-pressure';
import { PMR_GROUPS } from '@/lib/recovery-pressure';

type SubPhase = 'breath' | 'pmr-offer' | 'pmr' | 'done';

export function StepReset({
    level,
    type,
    accent,
    initial,
    onComplete,
}: {
    level: PressureLevel;
    type: PressureType;
    accent: string;
    initial: ResetData;
    onComplete: (d: ResetData) => void;
}) {
    const offerPmr = type === 'time' || type === 'self';
    const [data, setData] = useState<ResetData>(initial);
    const [phase, setPhase] = useState<SubPhase>('breath');

    const finishBreath = (cycles: number, protocol: ResetData['protocol']) => {
        setData((d) => ({ ...d, cyclesCompleted: cycles, protocol }));
        setPhase(offerPmr ? 'pmr-offer' : 'done');
    };

    useEffect(() => {
        if (phase === 'done') onComplete(data);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
            <motion.div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: `radial-gradient(circle, ${accent}22 0%, transparent 65%)` }}
                animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.7, 0.5] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />

            <header className="relative z-10 flex flex-col items-center gap-3">
                <div className="text-xs uppercase tracking-[0.26em] text-white/55">
                    Step 1 · Turn off the alarm
                </div>
                <h2 className="text-balance text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Your body is preparing for something important.
                </h2>
                <p className="mt-1 max-w-md text-center text-sm text-white/65">
                    Let&apos;s tell it you&apos;re safe.
                </p>
            </header>

            <AnimatePresence mode="wait">
                {phase === 'breath' && (
                    <Pane key="breath">
                        {level === 'high' && (
                            <PhysiologicalSigh
                                accent={accent}
                                onDone={(c) => finishBreath(c, 'sigh')}
                            />
                        )}
                        {level === 'medium' && (
                            <BoxBreath
                                accent={accent}
                                onDone={(c) => finishBreath(c, 'box')}
                            />
                        )}
                        {level === 'low' && (
                            <SlowBreath
                                accent={accent}
                                onDone={(c) => finishBreath(c, 'slow')}
                            />
                        )}
                    </Pane>
                )}

                {phase === 'pmr-offer' && (
                    <Pane key="pmr-offer">
                        <PmrOffer
                            accent={accent}
                            onAccept={() => setPhase('pmr')}
                            onSkip={() => setPhase('done')}
                        />
                    </Pane>
                )}

                {phase === 'pmr' && (
                    <Pane key="pmr">
                        <PmrSweep
                            accent={accent}
                            onDone={() => {
                                setData((d) => ({ ...d, pmrCompleted: true }));
                                setPhase('done');
                            }}
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

/* ────────── Physiological sigh (high) ────────── */

type SighPhase = 'in1' | 'in2' | 'out' | 'rest';

function PhysiologicalSigh({
    accent,
    onDone,
}: {
    accent: string;
    onDone: (cycles: number) => void;
}) {
    const [phase, setPhase] = useState<SighPhase>('rest');
    const [cycle, setCycle] = useState(0);
    const [running, setRunning] = useState(false);
    const target = 8;

    useEffect(() => {
        if (!running) return;
        const durations: Record<SighPhase, number> = {
            in1: 1800,
            in2: 600,
            out: 5200,
            rest: 500,
        };
        const t = window.setTimeout(() => {
            setPhase((p) => {
                if (p === 'rest') return 'in1';
                if (p === 'in1') return 'in2';
                if (p === 'in2') return 'out';
                // after out → rest, increment cycle
                setCycle((c) => {
                    const next = c + 1;
                    if (next >= target) {
                        setRunning(false);
                        window.setTimeout(() => onDone(next), 500);
                    }
                    return next;
                });
                return 'rest';
            });
        }, durations[phase]);
        return () => window.clearTimeout(t);
    }, [phase, running, onDone]);

    const scale =
        phase === 'in1' ? 1.25 : phase === 'in2' ? 1.4 : phase === 'out' ? 0.7 : 0.9;
    const label =
        phase === 'in1'
            ? 'breathe in…'
            : phase === 'in2'
              ? '…and one more sip'
              : phase === 'out'
                ? 'long slow exhale'
                : running
                  ? 'ready'
                  : 'double-inhale, long exhale';

    return (
        <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-center text-sm text-white/70">
                The physiological sigh is the fastest way to calm the nervous system.
                Two inhales through the nose, one long exhale through the mouth.
            </p>

            <div className="relative flex h-72 w-72 items-center justify-center">
                <motion.div
                    className="h-44 w-44 rounded-full"
                    animate={{
                        scale,
                        background: `radial-gradient(circle at 30% 30%, ${accent}, ${accent}22)`,
                        boxShadow: `0 0 60px ${accent}88`,
                    }}
                    transition={{
                        duration:
                            phase === 'out' ? 5.2 : phase === 'in1' ? 1.8 : phase === 'in2' ? 0.6 : 0.5,
                        ease: phase === 'out' ? [0.45, 0, 0.35, 1] : 'easeInOut',
                    }}
                />
                <div className="absolute text-center">
                    <div
                        className="text-[11px] uppercase tracking-[0.3em]"
                        style={{ color: accent }}
                    >
                        {label}
                    </div>
                    <div className="mt-1 text-xs text-white/55 tabular-nums">
                        {cycle} / {target} cycles
                    </div>
                </div>
            </div>

            {!running ? (
                <button
                    onClick={() => {
                        setRunning(true);
                        setPhase('in1');
                    }}
                    className="rounded-full px-5 py-2.5 text-sm font-medium transition"
                    style={{ backgroundColor: accent, color: '#0b0c12' }}
                >
                    <Zap className="mr-1 inline h-4 w-4" /> Begin sigh
                </button>
            ) : (
                <button
                    onClick={() => onDone(cycle)}
                    className="text-[11px] uppercase tracking-[0.22em] text-white/50 transition hover:text-white/80"
                >
                    I&apos;ve got enough · continue
                </button>
            )}
        </div>
    );
}

/* ────────── Box breathing (medium) ────────── */

type BoxPhase = 'in' | 'hold1' | 'out' | 'hold2';

function BoxBreath({
    accent,
    onDone,
}: {
    accent: string;
    onDone: (cycles: number) => void;
}) {
    const [phase, setPhase] = useState<BoxPhase>('in');
    const [round, setRound] = useState(0);
    const [running, setRunning] = useState(false);
    const target = 4;

    useEffect(() => {
        if (!running) return;
        const t = window.setTimeout(() => {
            setPhase((p) => {
                if (p === 'in') return 'hold1';
                if (p === 'hold1') return 'out';
                if (p === 'out') return 'hold2';
                // hold2 → back to in, increment round
                setRound((r) => {
                    const next = r + 1;
                    if (next >= target) {
                        setRunning(false);
                        window.setTimeout(() => onDone(next), 500);
                    }
                    return next;
                });
                return 'in';
            });
        }, 4000);
        return () => window.clearTimeout(t);
    }, [phase, running, onDone]);

    // Which sides of the box are "drawn"
    const sideOrder: BoxPhase[] = ['in', 'hold1', 'out', 'hold2'];
    const idx = sideOrder.indexOf(phase);

    return (
        <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-center text-sm text-white/70">
                Four seconds in, four hold, four out, four hold. The box keeps everything
                even.
            </p>

            <div className="relative h-64 w-64">
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                    {[0, 1, 2, 3].map((i) => {
                        const active = running && idx === i;
                        const drawn = running && idx >= i;
                        const coords: [number, number, number, number][] = [
                            [15, 85, 85, 85], // top (in) — start bottom-left go right
                            [85, 85, 85, 15], // right (hold1)
                            [85, 15, 15, 15], // bottom (out)
                            [15, 15, 15, 85], // left (hold2)
                        ];
                        const [x1, y1, x2, y2] = coords[i];
                        return (
                            <motion.line
                                key={i}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke={drawn ? accent : 'rgba(255,255,255,0.15)'}
                                strokeWidth="3"
                                strokeLinecap="round"
                                initial={false}
                                animate={{
                                    pathLength: drawn ? 1 : 0,
                                    opacity: drawn ? 1 : 0.3,
                                    filter: active
                                        ? `drop-shadow(0 0 10px ${accent})`
                                        : 'none',
                                }}
                                transition={{ duration: 4, ease: 'linear' }}
                            />
                        );
                    })}
                    {/* Pulse at current corner */}
                    {running && (
                        <motion.circle
                            cx={(() => {
                                const pts = [
                                    [15, 85],
                                    [85, 85],
                                    [85, 15],
                                    [15, 15],
                                ];
                                return pts[idx][0];
                            })()}
                            cy={(() => {
                                const pts = [
                                    [15, 85],
                                    [85, 85],
                                    [85, 15],
                                    [15, 15],
                                ];
                                return pts[idx][1];
                            })()}
                            r="3"
                            fill={accent}
                            animate={{ r: [3, 6, 3] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            style={{ filter: `drop-shadow(0 0 8px ${accent})` }}
                        />
                    )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div
                        className="text-[11px] uppercase tracking-[0.3em]"
                        style={{ color: accent }}
                    >
                        {phase === 'in'
                            ? 'breathe in · 4'
                            : phase === 'hold1'
                              ? 'hold · 4'
                              : phase === 'out'
                                ? 'breathe out · 4'
                                : 'hold · 4'}
                    </div>
                    <div className="mt-1 text-xs text-white/55 tabular-nums">
                        round {round} / {target}
                    </div>
                </div>
            </div>

            {!running ? (
                <button
                    onClick={() => {
                        setRunning(true);
                        setPhase('in');
                    }}
                    className="rounded-full px-5 py-2.5 text-sm font-medium transition"
                    style={{ backgroundColor: accent, color: '#0b0c12' }}
                >
                    Begin box breathing
                </button>
            ) : (
                <button
                    onClick={() => onDone(round)}
                    className="text-[11px] uppercase tracking-[0.22em] text-white/50 transition hover:text-white/80"
                >
                    I&apos;ve got enough · continue
                </button>
            )}
        </div>
    );
}

/* ────────── Slow breath (low) ────────── */

function SlowBreath({
    accent,
    onDone,
}: {
    accent: string;
    onDone: (cycles: number) => void;
}) {
    const [phase, setPhase] = useState<'in' | 'out'>('in');
    const [breaths, setBreaths] = useState(0);
    const [running, setRunning] = useState(false);
    const target = 3;

    useEffect(() => {
        if (!running) return;
        const t = window.setTimeout(
            () => {
                if (phase === 'in') setPhase('out');
                else {
                    setPhase('in');
                    setBreaths((b) => {
                        const next = b + 1;
                        if (next >= target) {
                            setRunning(false);
                            window.setTimeout(() => onDone(next), 500);
                        }
                        return next;
                    });
                }
            },
            phase === 'in' ? 4000 : 6000,
        );
        return () => window.clearTimeout(t);
    }, [phase, running, onDone]);

    return (
        <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-center text-sm text-white/70">
                Just three breaths — in for four, out for six. Longer exhale flips the
                switch on the nervous system.
            </p>

            <div className="flex h-64 w-64 items-center justify-center">
                <motion.div
                    className="h-36 w-36 rounded-full"
                    animate={{
                        scale: running && phase === 'in' ? 1.25 : running ? 0.75 : 1,
                        background: `radial-gradient(circle at 30% 30%, ${accent}, ${accent}22)`,
                        boxShadow: `0 0 48px ${accent}66`,
                    }}
                    transition={{
                        duration: phase === 'in' ? 4 : 6,
                        ease: [0.45, 0, 0.35, 1],
                    }}
                />
            </div>

            <div className="text-center">
                <div
                    className="text-[11px] uppercase tracking-[0.3em]"
                    style={{ color: accent }}
                >
                    {running ? (phase === 'in' ? 'in · 4' : 'out · 6') : 'ready'}
                </div>
                <div className="mt-1 text-xs text-white/55 tabular-nums">
                    breath {breaths} / {target}
                </div>
            </div>

            {!running ? (
                <button
                    onClick={() => {
                        setRunning(true);
                        setPhase('in');
                    }}
                    className="rounded-full px-5 py-2.5 text-sm font-medium transition"
                    style={{ backgroundColor: accent, color: '#0b0c12' }}
                >
                    Begin
                </button>
            ) : (
                <button
                    onClick={() => onDone(breaths)}
                    className="text-[11px] uppercase tracking-[0.22em] text-white/50 transition hover:text-white/80"
                >
                    continue
                </button>
            )}
        </div>
    );
}

/* ────────── PMR offer ────────── */

function PmrOffer({
    accent,
    onAccept,
    onSkip,
}: {
    accent: string;
    onAccept: () => void;
    onSkip: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-5">
            <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 160, damping: 14 }}
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{
                    background: `radial-gradient(circle, ${accent}, ${accent}44)`,
                    boxShadow: `0 0 40px ${accent}77`,
                }}
            >
                <CheckCircle2 className="h-7 w-7 text-[#0b0c12]" />
            </motion.div>
            <p className="max-w-md text-center text-sm text-white/70">
                Good. Your breath is doing its work. Because this is{' '}
                <em>time or self-imposed</em> pressure, tension tends to pool in the body.
                Want a quick sweep to release it?
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={onSkip}
                    className="text-[11px] uppercase tracking-[0.22em] text-white/50 transition hover:text-white/80"
                >
                    Skip
                </button>
                <button
                    onClick={onAccept}
                    className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                    style={{ backgroundColor: accent, color: '#0b0c12' }}
                >
                    Try PMR · 75s <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

/* ────────── PMR sweep ────────── */

function PmrSweep({ accent, onDone }: { accent: string; onDone: () => void }) {
    const [idx, setIdx] = useState(0);
    const [mode, setMode] = useState<'squeeze' | 'release'>('squeeze');
    const group = PMR_GROUPS[idx];

    useEffect(() => {
        const t = window.setTimeout(
            () => {
                if (mode === 'squeeze') {
                    setMode('release');
                } else {
                    if (idx >= PMR_GROUPS.length - 1) {
                        onDone();
                    } else {
                        setIdx((i) => i + 1);
                        setMode('squeeze');
                    }
                }
            },
            mode === 'squeeze' ? 5000 : 10000,
        );
        return () => window.clearTimeout(t);
    }, [idx, mode, onDone]);

    return (
        <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-center text-sm text-white/70">
                Squeeze for 5, then fully release for 10. Let the tension leave before we
                move up.
            </p>

            <div className="relative h-72 w-36">
                <svg viewBox="0 0 100 180" className="h-full w-full">
                    <path
                        d="M50 15 a10 10 0 1 1 -0.01 0 M40 35 Q 50 31 60 35 L 64 60 Q 70 62 72 72 L 70 100 Q 62 104 60 112 L 58 160 L 48 165 L 42 160 L 40 112 Q 38 104 30 100 L 28 72 Q 30 62 36 60 Z"
                        fill="rgba(255,255,255,0.04)"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="0.8"
                    />
                    {PMR_GROUPS.map((g, i) => {
                        const active = i === idx;
                        const done = i < idx;
                        return (
                            <motion.circle
                                key={g.id}
                                cx={50}
                                cy={g.y}
                                r={active ? 8 : 4}
                                animate={{
                                    fill: active
                                        ? mode === 'squeeze'
                                            ? `${accent}`
                                            : `${accent}66`
                                        : done
                                          ? `${accent}55`
                                          : 'rgba(255,255,255,0.15)',
                                    scale: active && mode === 'squeeze' ? [1, 1.3, 1] : 1,
                                }}
                                transition={{
                                    scale: {
                                        duration: 1.2,
                                        repeat: mode === 'squeeze' && active ? Infinity : 0,
                                        ease: 'easeInOut',
                                    },
                                }}
                                style={
                                    active
                                        ? { filter: `drop-shadow(0 0 10px ${accent})` }
                                        : undefined
                                }
                            />
                        );
                    })}
                </svg>
            </div>

            <div className="text-center">
                <div
                    className="text-[11px] uppercase tracking-[0.3em]"
                    style={{ color: accent }}
                >
                    {mode === 'squeeze' ? 'squeeze' : 'release'} · {group.label}
                </div>
                <div className="mt-1 text-xs text-white/55 tabular-nums">
                    {idx + 1} / {PMR_GROUPS.length}
                </div>
            </div>

            <button
                onClick={onDone}
                className="text-[11px] uppercase tracking-[0.22em] text-white/50 transition hover:text-white/80"
            >
                continue
            </button>
        </div>
    );
}
