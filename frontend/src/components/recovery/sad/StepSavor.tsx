'use client';

/**
 * Step 3 — Savor a Tiny Good Thing.
 *
 * Core interaction: a steaming teacup SVG. The user *holds* (mouse-down or
 * touch-hold) for 5 seconds — that's the actual 5-second savor window. A
 * ring fills while they hold; if they release early, it smoothly drains.
 *
 * Before the hold, they pick (or type) a tiny good thing. At very-low
 * energy we pre-fill a universal savor so there's nothing to produce.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { EnergyTier, SavorData } from '@/lib/recovery-sad';
import { SAVOR_SUGGESTIONS, UNIVERSAL_SAVORS } from '@/lib/recovery-sad';

const HOLD_SECONDS = 5;

export function StepSavor({
    energy,
    accent,
    initial,
    onComplete,
}: {
    energy: EnergyTier;
    accent: string;
    initial: SavorData;
    onComplete: (d: SavorData) => void;
}) {
    const [thing, setThing] = useState(
        initial.thing ||
            (energy === 'very-low' ? UNIVERSAL_SAVORS[0] : ''),
    );
    const [held, setHeld] = useState(initial.heldTeaCup);
    const [seconds, setSeconds] = useState(initial.heldSeconds);
    const pressing = useRef(false);
    const [isPressing, setIsPressing] = useState(false);
    const lastTick = useRef<number | null>(null);

    const progress = useMotionValue(0);
    const ringDashoffset = useTransform(progress, [0, 1], [283, 0]);

    // Tick while pressing; decay when released (but never below zero).
    useEffect(() => {
        let raf = 0;
        const tick = (t: number) => {
            if (lastTick.current == null) lastTick.current = t;
            const dt = (t - lastTick.current) / 1000;
            lastTick.current = t;
            setSeconds((prev) => {
                const next = pressing.current
                    ? Math.min(HOLD_SECONDS, prev + dt)
                    : Math.max(0, prev - dt * 0.6);
                progress.set(next / HOLD_SECONDS);
                if (next >= HOLD_SECONDS && !held) {
                    setHeld(true);
                }
                return next;
            });
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [held, progress]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-10">
            <header className="flex flex-col items-center gap-2">
                <div className="text-xs uppercase tracking-[0.26em] text-white/55">
                    Step 3 · Savor one tiny good thing
                </div>
                <h2 className="text-balance text-center text-3xl font-light tracking-tight text-white sm:text-4xl">
                    Hold it for five seconds.
                </h2>
                <p className="mt-2 max-w-md text-center text-sm text-white/65">
                    Just one small thing that felt okay — a sip of water, a song, warm light.
                    Close your eyes if that helps.
                </p>
            </header>

            {/* Picker / input */}
            <div className="flex w-full max-w-xl flex-col items-center gap-3">
                <div className="flex flex-wrap justify-center gap-2">
                    {(energy === 'very-low' ? UNIVERSAL_SAVORS : SAVOR_SUGGESTIONS).map(
                        (s) => {
                            const selected = thing === s;
                            return (
                                <button
                                    key={s}
                                    onClick={() => setThing(s)}
                                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                                        selected
                                            ? 'border-white/30 bg-white/10 text-white'
                                            : 'border-white/10 bg-white/[0.03] text-white/75 hover:border-white/25'
                                    }`}
                                    style={
                                        selected ? { boxShadow: `0 0 16px ${accent}55` } : undefined
                                    }
                                >
                                    {s}
                                </button>
                            );
                        },
                    )}
                </div>

                <input
                    value={thing}
                    onChange={(e) => setThing(e.target.value)}
                    placeholder="or type your own tiny thing…"
                    className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/[0.04] p-3 text-center text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
                />
            </div>

            {/* Teacup */}
            <div
                onMouseDown={() => { pressing.current = true; setIsPressing(true); }}
                onMouseUp={() => { pressing.current = false; setIsPressing(false); }}
                onMouseLeave={() => { pressing.current = false; setIsPressing(false); }}
                onTouchStart={() => { pressing.current = true; setIsPressing(true); }}
                onTouchEnd={() => { pressing.current = false; setIsPressing(false); }}
                onTouchCancel={() => { pressing.current = false; setIsPressing(false); }}
                className="relative flex h-72 w-72 cursor-pointer select-none items-center justify-center"
            >
                <svg viewBox="0 0 110 110" className="absolute inset-0 -rotate-90">
                    <circle
                        cx="55"
                        cy="55"
                        r="45"
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="4"
                    />
                    <motion.circle
                        cx="55"
                        cy="55"
                        r="45"
                        fill="none"
                        stroke={accent}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray="283"
                        style={{
                            strokeDashoffset: ringDashoffset,
                            filter: `drop-shadow(0 0 8px ${accent})`,
                        }}
                    />
                </svg>

                {/* Steam particles */}
                {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                        key={i}
                        aria-hidden
                        className="absolute h-2 w-2 rounded-full"
                        style={{
                            background: `radial-gradient(circle, ${accent}cc, transparent 70%)`,
                            left: `${50 + (i - 2) * 6}%`,
                            bottom: '55%',
                        }}
                        animate={{
                            y: [0, -40],
                            opacity: [0, 0.7, 0],
                            scale: [0.6, 1.2, 0.4],
                        }}
                        transition={{
                            duration: 3.6,
                            delay: i * 0.45,
                            repeat: Infinity,
                            ease: 'easeOut',
                        }}
                    />
                ))}

                {/* Teacup body */}
                <svg viewBox="0 0 100 100" className="relative h-32 w-32">
                    <path
                        d="M20 45 Q 20 40 25 40 L 75 40 Q 80 40 80 45 L 78 72 Q 75 82 65 85 L 35 85 Q 25 82 22 72 Z"
                        fill="rgba(255,255,255,0.06)"
                        stroke="rgba(255,255,255,0.35)"
                        strokeWidth="1.5"
                    />
                    <path
                        d="M80 50 Q 92 52 92 60 Q 92 68 80 68"
                        fill="none"
                        stroke="rgba(255,255,255,0.35)"
                        strokeWidth="1.5"
                    />
                    {/* Liquid */}
                    <motion.ellipse
                        cx="50"
                        cy="48"
                        rx="28"
                        ry="3"
                        animate={{
                            fill: `${accent}`,
                            opacity: 0.6 + (seconds / HOLD_SECONDS) * 0.4,
                        }}
                    />
                </svg>

                <div className="absolute bottom-2 text-center">
                    <div
                        className="text-[11px] uppercase tracking-[0.3em]"
                        style={{ color: accent }}
                    >
                        {held ? 'saved' : isPressing ? 'holding' : 'press & hold'}
                    </div>
                    <div className="mt-0.5 text-xs text-white/55 tabular-nums">
                        {seconds.toFixed(1)}s / {HOLD_SECONDS}s
                    </div>
                </div>
            </div>

            {thing && (
                <motion.p
                    key={thing}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-md text-center text-sm italic text-white/75"
                >
                    &ldquo;{thing}&rdquo;
                </motion.p>
            )}

            <div className="flex items-center gap-2">
                <button
                    onClick={() =>
                        onComplete({ thing: thing || UNIVERSAL_SAVORS[0], heldTeaCup: held, heldSeconds: seconds })
                    }
                    disabled={!held}
                    className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                    style={{ backgroundColor: accent, color: '#1a1023' }}
                >
                    {held ? (
                        <>
                            That was enough <Sparkles className="h-4 w-4" />
                        </>
                    ) : (
                        <>
                            Hold 5s first <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </button>
            </div>
            <button
                onClick={() =>
                    onComplete({ thing: thing || UNIVERSAL_SAVORS[0], heldTeaCup: false, heldSeconds: seconds })
                }
                className="text-[11px] uppercase tracking-[0.22em] text-white/45 transition hover:text-white/75"
            >
                that&apos;s enough for now
            </button>
        </div>
    );
}
