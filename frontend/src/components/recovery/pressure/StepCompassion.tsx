'use client';

/**
 * Step 5 — Talk to Yourself Like a Teammate (Self-Compassion).
 *
 * Start with a "critical voice" speech bubble that pops (scale 0, particle
 * burst). A warm teammate bubble rises to take its place. User taps any
 * compassion phrases that feel right — each appears in the teammate
 * bubble when tapped.
 *
 * For social / self-imposed pressure: a Separation Statement card appears
 * after the phrases — user can accept or customise it.
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import type { CompassionData, PressureType } from '@/lib/recovery-pressure';
import {
    SEPARATION_STATEMENT,
    TEAMMATE_PHRASES,
} from '@/lib/recovery-pressure';

export function StepCompassion({
    type,
    accent,
    initial,
    onComplete,
}: {
    type: PressureType;
    accent: string;
    initial: CompassionData;
    onComplete: (d: CompassionData) => void;
}) {
    const showSeparation = type === 'social' || type === 'self';
    const [phrases, setPhrases] = useState<string[]>(initial.phrasesAccepted);
    const [custom, setCustom] = useState(initial.customPhrase);
    const [separationAccepted, setSepAccepted] = useState(initial.separationAccepted);
    const [sepEdit, setSepEdit] = useState(SEPARATION_STATEMENT);
    const [popped, setPopped] = useState(false);

    useEffect(() => {
        const t = window.setTimeout(() => setPopped(true), 900);
        return () => window.clearTimeout(t);
    }, []);

    const tap = (p: string) => {
        setPhrases((prev) => (prev.includes(p) ? prev : [...prev, p]));
    };

    const finish = () =>
        onComplete({
            phrasesAccepted: phrases,
            separationAccepted,
            customPhrase: custom,
        });

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
            <header className="flex flex-col items-center gap-3">
                <div className="text-xs uppercase tracking-[0.26em] text-white/55">
                    Step 5 · Talk to yourself like a teammate
                </div>
                <h2 className="text-balance text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Same voice you&apos;d use with a friend.
                </h2>
            </header>

            {/* Bubble transition: critical pops, teammate rises */}
            <div className="relative mt-10 flex h-44 w-full max-w-xl items-center justify-center">
                <AnimatePresence>
                    {!popped && (
                        <motion.div
                            key="crit"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute rounded-3xl border border-rose-500/40 bg-rose-500/10 px-5 py-4 text-sm text-rose-100"
                        >
                            &ldquo;You should be better than this.&rdquo;
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Pop particles */}
                {popped && (
                    <>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <motion.div
                                key={i}
                                aria-hidden
                                initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                                animate={{
                                    opacity: 0,
                                    scale: 0.3,
                                    x: (Math.cos((i / 8) * Math.PI * 2) * 80),
                                    y: (Math.sin((i / 8) * Math.PI * 2) * 80),
                                }}
                                transition={{ duration: 0.9 }}
                                className="absolute h-2 w-2 rounded-full"
                                style={{
                                    background: 'rgba(251,113,133,0.8)',
                                    filter: 'drop-shadow(0 0 4px rgba(251,113,133,0.7))',
                                }}
                            />
                        ))}
                    </>
                )}

                <AnimatePresence>
                    {popped && (
                        <motion.div
                            key="team"
                            initial={{ y: 30, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute flex max-w-md flex-col gap-2 rounded-3xl border p-5 text-center text-sm italic text-white/90"
                            style={{
                                borderColor: `${accent}55`,
                                background: `radial-gradient(circle at 30% 20%, ${accent}22 0%, transparent 70%)`,
                                boxShadow: `0 0 32px ${accent}33`,
                            }}
                        >
                            {phrases.length === 0 ? (
                                <span className="text-white/60">
                                    tap the phrases you&apos;d tell a friend in this spot
                                </span>
                            ) : (
                                phrases.map((p) => (
                                    <motion.div
                                        key={p}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-white"
                                    >
                                        &ldquo;{p}&rdquo;
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Phrase chips */}
            <div className="mt-6 flex w-full max-w-xl flex-wrap justify-center gap-2">
                {TEAMMATE_PHRASES.map((p) => {
                    const picked = phrases.includes(p);
                    return (
                        <motion.button
                            key={p}
                            onClick={() => tap(p)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                                picked
                                    ? 'border-white/30 bg-white/10 text-white'
                                    : 'border-white/10 bg-white/[0.03] text-white/80 hover:border-white/25'
                            }`}
                            style={picked ? { boxShadow: `0 0 16px ${accent}55` } : undefined}
                        >
                            <Heart
                                className="h-3 w-3"
                                style={{
                                    color: picked ? accent : 'rgba(255,255,255,0.4)',
                                    fill: picked ? accent : 'transparent',
                                }}
                            />
                            {p}
                        </motion.button>
                    );
                })}
            </div>

            <div className="mt-3 w-full max-w-sm">
                <input
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && custom.trim()) tap(custom.trim());
                    }}
                    placeholder="or write your own teammate line & press Enter"
                    className="w-full rounded-2xl border border-white/15 bg-white/[0.04] p-3 text-center text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
                />
            </div>

            {/* Separation statement */}
            {showSeparation && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.02] p-5"
                    style={{ boxShadow: `inset 0 0 0 1px ${accent}22` }}
                >
                    <div
                        className="text-[10px] uppercase tracking-[0.24em]"
                        style={{ color: accent }}
                    >
                        Separation statement
                    </div>
                    <textarea
                        value={sepEdit}
                        onChange={(e) => setSepEdit(e.target.value)}
                        rows={2}
                        className="mt-2 w-full resize-none bg-transparent text-sm italic text-white/90 focus:outline-none"
                    />
                    <div className="mt-3 flex items-center justify-end gap-2">
                        <button
                            onClick={() => {
                                setSepEdit(SEPARATION_STATEMENT);
                                setSepAccepted(true);
                            }}
                            className="text-[11px] uppercase tracking-[0.22em] text-white/45 transition hover:text-white/75"
                        >
                            Reset
                        </button>
                        <button
                            onClick={() => setSepAccepted(true)}
                            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition ${
                                separationAccepted ? 'opacity-60' : ''
                            }`}
                            style={{ backgroundColor: accent, color: '#0b0c12' }}
                        >
                            {separationAccepted ? 'Accepted' : 'Accept'}
                        </button>
                    </div>
                </motion.div>
            )}

            <button
                onClick={finish}
                disabled={phrases.length === 0}
                className="mt-6 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{ backgroundColor: accent, color: '#0b0c12' }}
            >
                Carry the teammate with me <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    );
}
