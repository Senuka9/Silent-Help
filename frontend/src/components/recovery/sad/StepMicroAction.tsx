'use client';

/**
 * Step 4 — Do One Micro-Action (Behavioral Activation).
 *
 * Very-low energy: "tiny" actions the user can do without leaving the chair
 * (open eyes fully, stretch one finger, etc.).
 * Full / low: "gentle" actions (water, window, one sentence).
 *
 * A 5-rung ladder SVG sits beside the picker. The chosen action sits on the
 * bottom rung highlighted with a warm amber glow. When the user taps "I
 * began", a soft amber dot grows on the rung and a small line appears
 * ("you began. that counts.").
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import type { ActionData, EnergyTier } from '@/lib/recovery-sad';
import { TINY_ACTIONS, GENTLE_ACTIONS } from '@/lib/recovery-sad';

export function StepMicroAction({
    energy,
    accent,
    initial,
    onComplete,
}: {
    energy: EnergyTier;
    accent: string;
    initial: ActionData;
    onComplete: (d: ActionData) => void;
}) {
    const kind: ActionData['kind'] = energy === 'very-low' ? 'tiny' : 'gentle';
    const suggestions = kind === 'tiny' ? TINY_ACTIONS : GENTLE_ACTIONS;

    const [action, setAction] = useState(initial.action);
    const [committed, setCommitted] = useState(initial.committed);

    const submit = () => {
        if (!action.trim()) return;
        setCommitted(true);
        window.setTimeout(
            () => onComplete({ action, committed: true, kind }),
            1400,
        );
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-10">
            <header className="flex flex-col items-center gap-2">
                <div className="text-xs uppercase tracking-[0.26em] text-white/55">
                    Step 4 · One tiny action
                </div>
                <h2 className="text-balance text-center text-3xl font-light tracking-tight text-white sm:text-4xl">
                    Motivation follows action. Not the other way around.
                </h2>
                <p className="mt-2 max-w-md text-center text-sm text-white/65">
                    You don&apos;t need to feel better to do this. You just need to begin.
                </p>
            </header>

            <div className="grid w-full max-w-2xl items-center gap-6 sm:grid-cols-[auto,1fr]">
                {/* Ladder */}
                <Ladder accent={accent} committed={committed} />

                {/* Picker */}
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((s) => {
                            const selected = action === s;
                            return (
                                <button
                                    key={s}
                                    onClick={() => setAction(s)}
                                    disabled={committed}
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
                        })}
                    </div>
                    <input
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        placeholder="or type your own tiny action…"
                        disabled={committed}
                        className="rounded-2xl border border-white/15 bg-white/[0.04] p-3 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
                    />

                    <AnimatePresence>
                        {action.trim() && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="rounded-2xl border border-white/10 bg-white/[0.02] p-3"
                                style={{ boxShadow: `inset 0 0 0 1px ${accent}33` }}
                            >
                                <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">
                                    smallest rung
                                </div>
                                <div className="mt-1 text-sm text-white">{action}</div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!committed ? (
                        <button
                            onClick={submit}
                            disabled={!action.trim()}
                            className="flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                            style={{ backgroundColor: accent, color: '#1a1023' }}
                        >
                            I began <Check className="h-4 w-4" />
                        </button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="rounded-2xl border p-3 text-center text-sm italic text-white/85"
                            style={{
                                borderColor: `${accent}44`,
                                boxShadow: `0 0 24px ${accent}33`,
                            }}
                        >
                            you began. that counts.
                        </motion.div>
                    )}
                </div>
            </div>

            <button
                onClick={() => onComplete({ action, committed, kind })}
                className="text-[11px] uppercase tracking-[0.22em] text-white/45 transition hover:text-white/75"
            >
                {committed ? 'continue' : "that's enough for now"} <ArrowRight className="ml-1 inline h-3 w-3" />
            </button>
        </div>
    );
}

function Ladder({ accent, committed }: { accent: string; committed: boolean }) {
    return (
        <div className="relative mx-auto h-72 w-28">
            <svg viewBox="0 0 100 280" className="h-full w-full">
                {/* rails */}
                <line x1="22" y1="10" x2="22" y2="270" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
                <line x1="78" y1="10" x2="78" y2="270" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />

                {[0, 1, 2, 3, 4].map((i) => {
                    const y = 260 - i * 50;
                    const highlighted = i === 0;
                    return (
                        <g key={i}>
                            <motion.line
                                x1="22"
                                y1={y}
                                x2="78"
                                y2={y}
                                strokeWidth={highlighted ? 4 : 2}
                                stroke={highlighted ? accent : 'rgba(255,255,255,0.3)'}
                                style={
                                    highlighted
                                        ? { filter: `drop-shadow(0 0 10px ${accent})` }
                                        : undefined
                                }
                            />
                            {highlighted && (
                                <motion.circle
                                    cx="50"
                                    cy={y}
                                    r="5"
                                    fill={accent}
                                    animate={
                                        committed
                                            ? { r: [5, 14, 10], opacity: [1, 0.6, 1] }
                                            : { opacity: [0.7, 1, 0.7] }
                                    }
                                    transition={
                                        committed
                                            ? { duration: 1.2 }
                                            : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                                    }
                                    style={{ filter: `drop-shadow(0 0 14px ${accent})` }}
                                />
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
