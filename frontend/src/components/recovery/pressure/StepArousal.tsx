'use client';

/**
 * Step 3 — Turn Anxiety into Excitement (Arousal Reappraisal).
 *
 * Three micro-phases:
 *   1. Rate where you are on the threat <-> challenge spectrum (before).
 *   2. Say "I am excited" out loud — hold the button 3 seconds while a
 *      waveform animation plays. Simultaneously a tangled knot SVG morphs
 *      into a ribbon bow.
 *   3. Rate again (after). The delta is celebrated.
 *
 * Research backing: Alison Wood Brooks' "Get Excited" studies + challenge-
 * state literature. Saying it out loud matters — the hold button forces
 * the pause.
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { ArousalData, PressureType } from '@/lib/recovery-pressure';

type SubPhase = 'before' | 'speak' | 'after';

export function StepArousal({
    type,
    accent,
    initial,
    onComplete,
}: {
    type: PressureType;
    accent: string;
    initial: ArousalData;
    onComplete: (d: ArousalData) => void;
}) {
    const showChallengeToggle = type === 'performance' || type === 'social';
    const [phase, setPhase] = useState<SubPhase>(
        initial.challengeBefore != null ? 'speak' : 'before',
    );
    const [before, setBefore] = useState<number>(initial.challengeBefore ?? 30);
    const [after, setAfter] = useState<number>(initial.challengeAfter ?? 65);
    const [saidOutLoud, setSaid] = useState(initial.saidOutLoud);

    const finish = () => {
        onComplete({
            saidOutLoud,
            challengeBefore: before,
            challengeAfter: after,
        });
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
            <header className="flex flex-col items-center gap-3">
                <div className="text-xs uppercase tracking-[0.26em] text-white/55">
                    Step 3 · Rename the feeling
                </div>
                <h2 className="text-balance text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    That racing heart? That&apos;s fuel.
                </h2>
                <p className="mt-1 max-w-md text-center text-sm text-white/65">
                    Your body can&apos;t tell the difference between anxious and excited. You
                    get to name it.
                </p>
            </header>

            <AnimatePresence mode="wait">
                {phase === 'before' && (
                    <Pane key="before">
                        <ChallengeSlider
                            label="Right now this feels more like…"
                            value={before}
                            onChange={setBefore}
                            accent={accent}
                            showCtx={showChallengeToggle}
                        />
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={() => setPhase('speak')}
                                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                                style={{ backgroundColor: accent, color: '#0b0c12' }}
                            >
                                Continue <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </Pane>
                )}

                {phase === 'speak' && (
                    <Pane key="speak">
                        <KnotToBow
                            accent={accent}
                            saidOutLoud={saidOutLoud}
                            onSaid={() => {
                                setSaid(true);
                                window.setTimeout(() => setPhase('after'), 1600);
                            }}
                        />
                    </Pane>
                )}

                {phase === 'after' && (
                    <Pane key="after">
                        <ChallengeSlider
                            label="And now, after naming it…"
                            value={after}
                            onChange={setAfter}
                            accent={accent}
                            showCtx={showChallengeToggle}
                        />
                        <div className="mt-4 text-center text-xs italic text-white/65">
                            delta: {after - before >= 0 ? '+' : ''}
                            {after - before} toward challenge
                        </div>
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={finish}
                                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                                style={{ backgroundColor: accent, color: '#0b0c12' }}
                            >
                                Carry this forward <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
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
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mt-10 w-full max-w-xl"
        >
            {children}
        </motion.div>
    );
}

function ChallengeSlider({
    label,
    value,
    onChange,
    accent,
    showCtx,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    accent: string;
    showCtx: boolean;
}) {
    return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-center text-sm text-white/75">{label}</div>
            <div className="mt-4 flex items-center justify-between text-[11px] uppercase tracking-[0.22em]">
                <span className="text-rose-300/80">Threat</span>
                <span style={{ color: accent }}>Challenge</span>
            </div>
            <input
                type="range"
                min={0}
                max={100}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="mt-2 w-full"
                style={{ accentColor: accent }}
            />
            <div className="mt-2 text-center text-xs text-white/65 tabular-nums">
                {value} / 100
            </div>
            {showCtx && (
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-[11px] italic text-white/55">
                    for performance and social pressure, a challenge mindset produces
                    measurably better outcomes than a threat mindset.
                </div>
            )}
        </div>
    );
}

/* ────────── Knot → Bow + say it out loud ────────── */

function KnotToBow({
    accent,
    saidOutLoud,
    onSaid,
}: {
    accent: string;
    saidOutLoud: boolean;
    onSaid: () => void;
}) {
    const HOLD_MS = 3000;
    const [holding, setHolding] = useState(false);
    const [held, setHeld] = useState(saidOutLoud);
    const [progress, setProgress] = useState(0);
    const holdStart = useRef<number | null>(null);

    useEffect(() => {
        if (!holding) return;
        holdStart.current = performance.now();
        let raf = 0;
        const tick = (t: number) => {
            if (!holdStart.current) return;
            const elapsed = t - holdStart.current;
            const p = Math.min(1, elapsed / HOLD_MS);
            setProgress(p);
            if (p >= 1) {
                setHeld(true);
                setHolding(false);
                onSaid();
                return;
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [holding, onSaid]);

    const release = () => {
        if (!held) {
            setHolding(false);
            setProgress(0);
        }
    };

    return (
        <div className="flex flex-col items-center gap-5">
            {/* Knot → Bow morph */}
            <div className="relative h-48 w-48">
                <svg viewBox="0 0 100 100" className="h-full w-full">
                    <defs>
                        <linearGradient id="bowGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={accent} />
                            <stop offset="100%" stopColor="#fcd34d" />
                        </linearGradient>
                    </defs>
                    {/* Knot (tangled path) */}
                    <motion.path
                        d="M30 50 C 35 30, 55 70, 50 50 C 45 30, 65 70, 70 50 C 75 30, 55 70, 50 50 C 45 30, 25 70, 30 50 Z"
                        fill="none"
                        stroke="rgba(239,68,68,0.8)"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        animate={{
                            opacity: 1 - progress,
                            rotate: progress * 360,
                            scale: 1 - progress * 0.5,
                        }}
                        transition={{ duration: 0.2 }}
                        style={{ transformOrigin: '50% 50%' }}
                    />
                    {/* Bow (appears) */}
                    <motion.g
                        animate={{
                            opacity: progress,
                            scale: 0.4 + progress * 0.7,
                            rotate: (1 - progress) * -90,
                        }}
                        transition={{ duration: 0.2 }}
                        style={{ transformOrigin: '50% 50%' }}
                    >
                        <path
                            d="M50 50 Q 28 32, 22 50 Q 28 68, 50 50 Z"
                            fill="url(#bowGrad)"
                        />
                        <path
                            d="M50 50 Q 72 32, 78 50 Q 72 68, 50 50 Z"
                            fill="url(#bowGrad)"
                        />
                        <circle cx="50" cy="50" r="5" fill={accent} />
                        <path
                            d="M45 54 L 40 68 M55 54 L 60 68"
                            stroke={accent}
                            strokeWidth="2"
                            strokeLinecap="round"
                            fill="none"
                        />
                    </motion.g>
                </svg>

                {/* Waveform while holding */}
                {holding && (
                    <div className="absolute inset-x-0 -bottom-4 flex items-center justify-center gap-1">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="w-1 rounded-full"
                                style={{ backgroundColor: accent }}
                                animate={{ height: [4, 16 + Math.random() * 12, 4] }}
                                transition={{
                                    duration: 0.45,
                                    repeat: Infinity,
                                    delay: i * 0.04,
                                    ease: 'easeInOut',
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <motion.p
                animate={{
                    scale: held ? [1, 1.08, 1] : 1,
                    color: held ? accent : '#ffffffcc',
                }}
                transition={{ duration: 0.8 }}
                className="text-center text-2xl font-light italic"
            >
                &ldquo;I am excited.&rdquo;
            </motion.p>

            {!held ? (
                <>
                    <button
                        onMouseDown={() => setHolding(true)}
                        onMouseUp={release}
                        onMouseLeave={release}
                        onTouchStart={() => setHolding(true)}
                        onTouchEnd={release}
                        onTouchCancel={release}
                        className="relative flex h-14 w-60 select-none items-center justify-center overflow-hidden rounded-full border text-sm font-medium transition"
                        style={{
                            borderColor: `${accent}66`,
                            backgroundColor: holding ? `${accent}22` : 'rgba(255,255,255,0.03)',
                            color: '#fff',
                        }}
                    >
                        <motion.div
                            aria-hidden
                            className="absolute inset-y-0 left-0"
                            animate={{ width: `${progress * 100}%` }}
                            transition={{ duration: 0.08 }}
                            style={{
                                background: `linear-gradient(90deg, ${accent}, ${accent}55)`,
                            }}
                        />
                        <span className="relative z-10">
                            {holding ? 'hold & say it…' : 'Press & say it out loud'}
                        </span>
                    </button>
                    <p className="max-w-xs text-center text-[11px] italic text-white/50">
                        saying it aloud matters — the research is on voice, not thought.
                    </p>
                </>
            ) : (
                <div
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-sm"
                    style={{
                        backgroundColor: `${accent}22`,
                        color: accent,
                        boxShadow: `0 0 22px ${accent}44`,
                    }}
                >
                    <Sparkles className="h-4 w-4" /> notice how that felt
                </div>
            )}
        </div>
    );
}
