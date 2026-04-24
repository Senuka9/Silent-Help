'use client';

/**
 * Step 1 — Pause & Breathe.
 *
 * Per stress bucket:
 *   high   → physiological sigh (inhale → top-up inhale → long exhale), ~60s total
 *            animation: expanding circle that pulses twice, then shrinks slowly
 *   medium → box breathing 4-4-4-4 × 4 rounds
 *            animation: a square whose four sides draw one at a time
 *   low    → 3 deep breaths
 *            animation: simple expand / contract circle
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StressBucket } from '@/lib/recovery-overwhelmed';

type Phase = {
    key: string;
    label: string;
    /** duration in ms */
    ms: number;
    /** visual scale target for circular animations */
    scale?: number;
    /** which box side to draw, 0..3, for box animation */
    side?: 0 | 1 | 2 | 3;
    /** whether to emit a subtle pulse */
    pulse?: boolean;
};

function buildHighPhases(): Phase[] {
    // Physiological sigh – 4 rounds of ~15s each (~60s)
    const round: Phase[] = [
        { key: 'in1', label: 'Breathe in through your nose', ms: 4000, scale: 1.25, pulse: true },
        { key: 'in2', label: 'A quick second inhale', ms: 1500, scale: 1.42, pulse: true },
        { key: 'out', label: 'Long, slow exhale through your mouth', ms: 8000, scale: 0.85 },
        { key: 'rest', label: 'Rest…', ms: 1500, scale: 0.95 },
    ];
    return [...round, ...round, ...round, ...round];
}

function buildMediumPhases(): Phase[] {
    // Box breathing 4-4-4-4 × 4
    const round: Phase[] = [
        { key: 'in', label: 'Breathe in', ms: 4000, side: 0 },
        { key: 'hold', label: 'Hold', ms: 4000, side: 1 },
        { key: 'out', label: 'Breathe out', ms: 4000, side: 2 },
        { key: 'rest', label: 'Rest', ms: 4000, side: 3 },
    ];
    return [...round, ...round, ...round, ...round];
}

function buildLowPhases(): Phase[] {
    // 3 deep breaths
    const round: Phase[] = [
        { key: 'in', label: 'Breathe in', ms: 5000, scale: 1.3 },
        { key: 'out', label: 'Breathe out', ms: 7000, scale: 0.85 },
    ];
    return [...round, ...round, ...round];
}

export default function StepBreathe({
    bucket,
    onComplete,
}: {
    bucket: StressBucket;
    onComplete: () => void;
}) {
    const phases = useMemo(() => {
        if (bucket === 'high') return buildHighPhases();
        if (bucket === 'medium') return buildMediumPhases();
        return buildLowPhases();
    }, [bucket]);

    const [idx, setIdx] = useState(0);
    const [done, setDone] = useState(false);
    const advanceRef = useRef<number | null>(null);
    const doneTriggeredRef = useRef(false);

    useEffect(() => {
        if (idx >= phases.length) {
            setDone(true);
            return;
        }
        const t = window.setTimeout(() => setIdx((i) => i + 1), phases[idx].ms);
        advanceRef.current = t;
        return () => {
            if (advanceRef.current) window.clearTimeout(advanceRef.current);
        };
    }, [idx, phases]);

    // Auto-advance to next step after completion (1s fade)
    useEffect(() => {
        if (!done || doneTriggeredRef.current) return;
        doneTriggeredRef.current = true;
        const t = window.setTimeout(onComplete, 1200);
        return () => window.clearTimeout(t);
    }, [done, onComplete]);

    const current = phases[idx];
    const progress = Math.min(1, idx / phases.length);

    return (
        <div className="relative flex w-full flex-col items-center gap-10 py-10">
            <AnimatePresence>
                {!done && (
                    <motion.p
                        key="body-text"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-lg text-center text-base text-[color:var(--color-fg-muted)] sm:text-lg"
                    >
                        Let your body settle first. Nothing else matters right now.
                    </motion.p>
                )}
            </AnimatePresence>

            <div className="relative flex h-[260px] w-[260px] items-center justify-center sm:h-[320px] sm:w-[320px]">
                {bucket === 'medium' ? (
                    <BoxAnimation phase={current} idx={idx} />
                ) : (
                    <CircleAnimation phase={current} done={done} />
                )}
            </div>

            <AnimatePresence mode="wait">
                {!done && current && (
                    <motion.div
                        key={`label-${idx}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.45 }}
                        className="text-center"
                    >
                        <div className="font-display text-2xl italic text-[color:var(--color-fg)] sm:text-3xl">
                            {current.label}
                        </div>
                    </motion.div>
                )}
                {done && (
                    <motion.div
                        key="done"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-center"
                    >
                        <div className="font-display text-2xl italic text-[color:var(--color-fg)]">
                            Good. Your body is listening.
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress dots */}
            <div className="flex gap-1.5" aria-hidden>
                {Array.from({ length: phases.length }).map((_, i) => (
                    <span
                        key={i}
                        className="h-1 w-1 rounded-full transition-all"
                        style={{
                            background: i <= idx ? '#a78bfa' : 'rgba(255,255,255,0.12)',
                            width: i === idx ? 14 : 4,
                            boxShadow: i === idx ? '0 0 10px rgba(167,139,250,0.6)' : 'none',
                        }}
                    />
                ))}
            </div>

            <div
                className="h-1 w-48 overflow-hidden rounded-full bg-white/5"
                aria-hidden
            >
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg,#a78bfa,#818cf8)' }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
}

/* ───────────── Circle animation (high + low) ───────────── */

function CircleAnimation({ phase, done }: { phase: Phase | undefined; done: boolean }) {
    const scale = phase?.scale ?? 1;
    const duration = phase ? phase.ms / 1000 : 1;

    return (
        <>
            {/* Outer glow */}
            <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                    background:
                        'radial-gradient(circle, rgba(167,139,250,0.32) 0%, rgba(129,140,248,0.12) 45%, transparent 70%)',
                }}
                animate={{ scale: done ? 0.9 : scale, opacity: done ? 0.6 : 1 }}
                transition={{ duration, ease: [0.4, 0, 0.2, 1] }}
            />
            {/* Ring */}
            <motion.div
                className="absolute inset-6 rounded-full border"
                style={{ borderColor: 'rgba(167,139,250,0.45)', boxShadow: '0 0 60px -12px rgba(167,139,250,0.5)' }}
                animate={{ scale: done ? 0.85 : scale }}
                transition={{ duration, ease: [0.4, 0, 0.2, 1] }}
            />
            {/* Inner orb */}
            <motion.div
                className="absolute inset-14 rounded-full"
                style={{
                    background:
                        'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.18), rgba(167,139,250,0.35) 55%, rgba(129,140,248,0.22))',
                    boxShadow: 'inset 0 2px 20px rgba(255,255,255,0.12), 0 0 40px rgba(167,139,250,0.4)',
                }}
                animate={{ scale: done ? 0.7 : scale }}
                transition={{ duration, ease: [0.4, 0, 0.2, 1] }}
            />
            {/* Pulse rings (for high-stress sigh) */}
            {phase?.pulse && (
                <motion.div
                    key={`${phase.key}-pulse`}
                    className="absolute inset-6 rounded-full border"
                    style={{ borderColor: 'rgba(167,139,250,0.5)' }}
                    initial={{ scale: 0.9, opacity: 0.7 }}
                    animate={{ scale: 1.3, opacity: 0 }}
                    transition={{ duration: Math.min(1.4, duration), ease: 'easeOut' }}
                />
            )}
        </>
    );
}

/* ───────────── Box animation (medium) ───────────── */

function BoxAnimation({ phase, idx }: { phase: Phase | undefined; idx: number }) {
    // We draw all 4 sides cumulatively as user progresses through a round.
    const sideIndex = phase?.side ?? 0;
    const activeSide = sideIndex;
    const duration = phase ? phase.ms / 1000 : 0;
    const sideLabel = ['top', 'right', 'bottom', 'left'][activeSide];

    return (
        <div className="relative h-[220px] w-[220px] sm:h-[260px] sm:w-[260px]">
            {/* Base faint square */}
            <div
                className="absolute inset-0 rounded-2xl border"
                style={{ borderColor: 'rgba(167,139,250,0.15)', boxShadow: '0 0 40px -18px rgba(167,139,250,0.35)' }}
            />
            {/* Corner glows */}
            {[
                { top: -4, left: -4 },
                { top: -4, right: -4 },
                { bottom: -4, right: -4 },
                { bottom: -4, left: -4 },
            ].map((pos, i) => (
                <motion.span
                    key={i}
                    className="absolute h-2 w-2 rounded-full"
                    style={{ ...pos, background: '#a78bfa', boxShadow: '0 0 10px #a78bfa' }}
                    animate={{ scale: i === (activeSide + 1) % 4 ? 1.6 : 1, opacity: i <= activeSide ? 1 : 0.3 }}
                    transition={{ duration: 0.5 }}
                />
            ))}

            {/* Animated side — draws over the active side */}
            <motion.span
                key={`side-${idx}-${sideLabel}`}
                className="absolute rounded-full"
                style={{
                    background: 'linear-gradient(90deg,#a78bfa,#818cf8)',
                    boxShadow: '0 0 16px #a78bfa',
                    ...sideStyle(activeSide),
                }}
                initial={sideInitial(activeSide)}
                animate={sideAnimate(activeSide)}
                transition={{ duration, ease: 'linear' }}
            />

            {/* Center breath cue text */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    key={`center-${idx}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-center"
                >
                    <div className="text-5xl">🌬️</div>
                </motion.div>
            </div>
        </div>
    );
}

function sideStyle(side: number): React.CSSProperties {
    // Returns positioning for the traveling side-bar
    const thick = 3;
    if (side === 0) return { top: 0, left: 0, height: thick, width: '100%' };
    if (side === 1) return { top: 0, right: 0, width: thick, height: '100%' };
    if (side === 2) return { bottom: 0, left: 0, height: thick, width: '100%' };
    return { top: 0, left: 0, width: thick, height: '100%' };
}
function sideInitial(side: number): Record<string, string | number> {
    if (side === 0) return { width: '0%' };
    if (side === 1) return { height: '0%' };
    if (side === 2) return { width: '0%' };
    return { height: '0%' };
}
function sideAnimate(side: number): Record<string, string | number> {
    if (side === 0 || side === 2) return { width: '100%' };
    return { height: '100%' };
}
