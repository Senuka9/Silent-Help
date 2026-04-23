'use client';

/**
 * Step 4 — Smallest step + Sprint.
 *
 * Sub-phase A: pick/type the smallest possible start (with "seed sprouting" animation).
 * Sub-phase B: choose timer length (2/5/10 min). High stress pre-selects 2 min.
 * Sub-phase C: countdown with shrinking circle; pause button saves progress.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, Sprout } from 'lucide-react';
import type { BrainDumpItem } from '@/lib/recovery-overwhelmed';

const STARTERS = [
    'Open the document',
    'Write one sentence',
    'Pick up three things',
    'Send one message',
    'Set a 5-min timer',
];

type SubPhase = 'pick-step' | 'pick-timer' | 'running' | 'finished';

export default function StepSprint({
    chosenItem,
    isHighStress,
    initialSmallestStep,
    initialMinutes,
    onUpdate,
    onFinish,
    onStopEarly,
}: {
    chosenItem: BrainDumpItem;
    isHighStress: boolean;
    initialSmallestStep: string;
    initialMinutes: number;
    onUpdate: (patch: { smallestStep?: string; sprintMinutes?: number; sprintSecondsDone?: number }) => void;
    onFinish: (secondsDone: number, minutes: number) => void;
    onStopEarly: (secondsDone: number, minutes: number) => void;
}) {
    const [phase, setPhase] = useState<SubPhase>(initialSmallestStep ? 'pick-timer' : 'pick-step');
    const [smallest, setSmallest] = useState(initialSmallestStep);
    const [seeded, setSeeded] = useState(!!initialSmallestStep);
    const [minutes, setMinutes] = useState<number>(initialMinutes || (isHighStress ? 2 : 5));
    const [secondsLeft, setSecondsLeft] = useState<number>((initialMinutes || (isHighStress ? 2 : 5)) * 60);
    const [paused, setPaused] = useState(false);
    const [stoppedEarly, setStoppedEarly] = useState(false);
    const tickRef = useRef<number | null>(null);

    // Countdown tick
    useEffect(() => {
        if (phase !== 'running' || paused) return;
        tickRef.current = window.setInterval(() => {
            setSecondsLeft((s) => {
                if (s <= 1) {
                    if (tickRef.current) window.clearInterval(tickRef.current);
                    setPhase('finished');
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => {
            if (tickRef.current) window.clearInterval(tickRef.current);
        };
    }, [phase, paused]);

    // Emit running state on finish
    useEffect(() => {
        if (phase !== 'finished') return;
        const secondsDone = minutes * 60 - secondsLeft;
        onUpdate({ sprintSecondsDone: secondsDone });
        if (stoppedEarly) {
            onStopEarly(secondsDone, minutes);
        } else {
            onFinish(minutes * 60, minutes);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    const confirmSmallest = () => {
        if (!smallest.trim()) return;
        setSeeded(true);
        onUpdate({ smallestStep: smallest.trim() });
        window.setTimeout(() => setPhase('pick-timer'), 1200);
    };

    const startSprint = () => {
        setSecondsLeft(minutes * 60);
        onUpdate({ sprintMinutes: minutes, sprintSecondsDone: 0 });
        setPhase('running');
    };

    const stopEarly = () => {
        setStoppedEarly(true);
        setPhase('finished');
    };

    const totalSeconds = minutes * 60;
    const elapsedRatio = phase === 'running' ? 1 - secondsLeft / totalSeconds : 0;
    const mm = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const ss = (secondsLeft % 60).toString().padStart(2, '0');

    /* ═══ Phase A: pick smallest step ═══ */
    if (phase === 'pick-step') {
        return (
            <div className="flex w-full flex-col items-center gap-6 py-4">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-xl text-center"
                >
                    <p className="text-[0.7rem] uppercase tracking-[0.2em] text-[color:var(--color-fg-subtle)]">
                        Your one thing
                    </p>
                    <h3 className="mt-1 font-display text-xl italic text-[color:var(--color-fg)] sm:text-2xl">
                        {chosenItem.text}
                    </h3>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-lg text-center text-base text-[color:var(--color-fg-muted)] sm:text-lg"
                >
                    What&rsquo;s the smallest possible start for this?
                </motion.p>

                <div className="flex max-w-2xl flex-wrap items-center justify-center gap-2">
                    {STARTERS.map((s, i) => (
                        <motion.button
                            key={s}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * i }}
                            whileHover={{ y: -2, scale: 1.03 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setSmallest(s)}
                            className={`rounded-full border px-4 py-1.5 text-sm transition-all ${smallest === s ? '' : 'text-[color:var(--color-fg-muted)]'}`}
                            style={{
                                borderColor: smallest === s ? 'rgba(167,139,250,0.55)' : 'rgba(255,255,255,0.10)',
                                background: smallest === s ? 'rgba(167,139,250,0.14)' : 'rgba(255,255,255,0.03)',
                                color: smallest === s ? '#d9d5ff' : undefined,
                                boxShadow: smallest === s ? '0 0 22px -4px rgba(167,139,250,0.6)' : 'none',
                            }}
                        >
                            {s}
                        </motion.button>
                    ))}
                </div>

                <div className="w-full max-w-xl">
                    <input
                        value={smallest}
                        onChange={(e) => setSmallest(e.target.value)}
                        placeholder="…or write your own"
                        className="w-full rounded-full border border-white/[0.08] bg-white/[0.03] px-5 py-3 text-center text-sm text-[color:var(--color-fg)] outline-none transition-colors placeholder:text-[color:var(--color-fg-subtle)] focus:border-white/25"
                    />
                </div>

                {/* Seed sprout preview */}
                <AnimatePresence>
                    {seeded && (
                        <motion.div
                            key="sprout"
                            initial={{ opacity: 0, y: 10, scale: 0.6 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                            className="text-center"
                        >
                            <motion.div
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 2.4, repeat: Infinity }}
                                className="text-3xl"
                            >
                                <Sprout className="mx-auto h-8 w-8 text-emerald-300" />
                            </motion.div>
                            <p className="mt-2 font-display text-lg italic text-[color:var(--color-fg)]">
                                You only need to begin. You do not need to finish.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!seeded && (
                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={!smallest.trim()}
                        onClick={confirmSmallest}
                        className="rounded-full px-7 py-2.5 text-sm font-semibold text-slate-900 transition-all disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                            background: 'linear-gradient(135deg,#a78bfa,#818cf8)',
                            boxShadow: '0 14px 40px -12px rgba(167,139,250,0.7)',
                        }}
                    >
                        That&rsquo;s my start
                    </motion.button>
                )}
            </div>
        );
    }

    /* ═══ Phase B: pick timer ═══ */
    if (phase === 'pick-timer') {
        const options = [2, 5, 10];
        return (
            <div className="flex w-full flex-col items-center gap-6 py-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                >
                    <p className="text-[0.7rem] uppercase tracking-[0.2em] text-[color:var(--color-fg-subtle)]">
                        Starting
                    </p>
                    <h3 className="mt-1 font-display text-xl italic text-[color:var(--color-fg)] sm:text-2xl">
                        {smallest}
                    </h3>
                </motion.div>

                <p className="max-w-lg text-center text-[color:var(--color-fg-muted)]">
                    Pick a length. You can stop any time.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                    {options.map((m) => {
                        const isPrimary = isHighStress ? m === 2 : minutes === m;
                        const selected = minutes === m;
                        return (
                            <motion.button
                                key={m}
                                whileHover={{ y: -3 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setMinutes(m)}
                                className={`relative rounded-2xl border text-center transition-all ${isPrimary ? 'px-8 py-5' : 'px-6 py-4'}`}
                                style={{
                                    borderColor: selected ? 'rgba(167,139,250,0.55)' : 'rgba(255,255,255,0.10)',
                                    background: selected ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)',
                                    boxShadow: selected
                                        ? '0 14px 40px -12px rgba(167,139,250,0.55)'
                                        : 'none',
                                }}
                            >
                                <div
                                    className="font-display italic"
                                    style={{
                                        color: selected ? '#d9d5ff' : 'var(--color-fg)',
                                        fontSize: isPrimary ? '2.2rem' : '1.6rem',
                                    }}
                                >
                                    {m} min
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={startSprint}
                    className="inline-flex items-center gap-2 rounded-full px-7 py-2.5 text-sm font-semibold text-slate-900"
                    style={{
                        background: 'linear-gradient(135deg,#a78bfa,#818cf8)',
                        boxShadow: '0 14px 40px -12px rgba(167,139,250,0.7)',
                    }}
                >
                    <Play className="h-4 w-4" />
                    Start — {minutes} min
                </motion.button>
            </div>
        );
    }

    /* ═══ Phase C: running sprint ═══ */
    return (
        <div className="flex w-full flex-col items-center gap-6 py-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
            >
                <p className="text-[0.7rem] uppercase tracking-[0.2em] text-[color:var(--color-fg-subtle)]">
                    In progress
                </p>
                <h3 className="mt-1 font-display text-xl italic text-[color:var(--color-fg)]">
                    {smallest}
                </h3>
            </motion.div>

            <div className="relative flex h-[300px] w-[300px] items-center justify-center">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r="54" stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="none" />
                    <motion.circle
                        cx="60"
                        cy="60"
                        r="54"
                        stroke="url(#sprintGrad)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        fill="none"
                        pathLength={1}
                        strokeDasharray="1 1"
                        animate={{ strokeDashoffset: elapsedRatio }}
                        transition={{ duration: 1, ease: 'linear' }}
                        style={{ filter: 'drop-shadow(0 0 10px rgba(167,139,250,0.55))' }}
                    />
                    <defs>
                        <linearGradient id="sprintGrad" x1="0" x2="1" y1="0" y2="1">
                            <stop offset="0%" stopColor="#a78bfa" />
                            <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="font-display text-5xl italic tabular-nums text-[color:var(--color-fg)]">
                        {mm}:{ss}
                    </div>
                    <div className="mt-2 text-xs uppercase tracking-[0.2em] text-[color:var(--color-fg-subtle)]">
                        {paused ? 'Paused' : 'Focus'}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
                <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPaused((p) => !p)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm text-[color:var(--color-fg-muted)] hover:border-white/25 hover:text-[color:var(--color-fg)]"
                >
                    {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {paused ? 'Resume' : 'Pause'}
                </motion.button>
                <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={stopEarly}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-rose-400/5 px-5 py-2 text-sm text-rose-200 hover:border-rose-300/55 hover:bg-rose-400/10"
                >
                    Stop — keep what I did
                </motion.button>
            </div>

            <p className="max-w-md text-center text-xs text-[color:var(--color-fg-subtle)]">
                You only need to begin. You do not need to finish.
            </p>
        </div>
    );
}
