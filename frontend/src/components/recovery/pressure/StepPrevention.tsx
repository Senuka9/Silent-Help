'use client';

/**
 * Step 6 — What Would You Tell Future You? (Prevention).
 *
 * Calendar page flip on mount (3D rotateY). User toggles commitments from
 * the bank and those become chips on a "prep card" that gets saved to the
 * journal along with the session recap — so next time pressure shows up,
 * the user can open this card as their playbook.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, CheckCircle2 } from 'lucide-react';
import type { PreventionData } from '@/lib/recovery-pressure';
import { PREVENTION_COMMITMENTS } from '@/lib/recovery-pressure';

export function StepPrevention({
    accent,
    initial,
    onComplete,
}: {
    accent: string;
    initial: PreventionData;
    onComplete: (d: PreventionData) => void;
}) {
    const [commitments, setCommitments] = useState<string[]>(initial.commitments);

    const toggle = (c: string) => {
        setCommitments((prev) =>
            prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
        );
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
            <header className="flex flex-col items-center gap-3">
                <div className="text-xs uppercase tracking-[0.26em] text-white/55">
                    Step 6 · Future you
                </div>
                <h2 className="text-balance text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    What will help you next time?
                </h2>
                <p className="mt-1 max-w-md text-center text-sm text-white/65">
                    Tap whatever feels like it&apos;d help. We&apos;ll save it as a card you
                    can come back to.
                </p>
            </header>

            <div className="mt-10 grid w-full max-w-4xl gap-6 sm:grid-cols-[auto,1fr]">
                {/* Calendar page flip */}
                <motion.div
                    initial={{ rotateY: -90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    style={{ perspective: 900, transformStyle: 'preserve-3d' }}
                    className="mx-auto w-64"
                >
                    <div
                        className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.04] p-5"
                        style={{ boxShadow: `0 0 30px ${accent}33` }}
                    >
                        <div className="flex items-center justify-between">
                            <Calendar className="h-4 w-4" style={{ color: accent }} />
                            <div className="text-[10px] uppercase tracking-[0.24em] text-white/45">
                                next time
                            </div>
                        </div>
                        <div className="mt-3 text-xs uppercase tracking-[0.22em] text-white/55">
                            Pressure playbook
                        </div>
                        <div className="mt-2 min-h-[120px] space-y-1.5">
                            {commitments.length === 0 ? (
                                <div className="text-[11px] italic text-white/40">
                                    nothing yet — tap commitments to add
                                </div>
                            ) : (
                                commitments.map((c, i) => (
                                    <motion.div
                                        key={c}
                                        initial={{ opacity: 0, x: -6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex items-start gap-1.5 text-[11px] text-white/85"
                                    >
                                        <CheckCircle2
                                            className="mt-0.5 h-3 w-3 flex-none"
                                            style={{ color: accent }}
                                        />
                                        <span>{c}</span>
                                    </motion.div>
                                ))
                            )}
                        </div>
                        <div className="mt-3 border-t border-white/10 pt-2 text-[10px] italic text-white/40">
                            saved alongside this session.
                        </div>
                    </div>
                </motion.div>

                {/* Commitments bank */}
                <div className="flex flex-col gap-2">
                    {PREVENTION_COMMITMENTS.map((c, i) => {
                        const picked = commitments.includes(c);
                        return (
                            <motion.button
                                key={c}
                                onClick={() => toggle(c)}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ x: 3 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                                    picked
                                        ? 'border-white/30 bg-white/10 text-white'
                                        : 'border-white/10 bg-white/[0.03] text-white/80 hover:border-white/25'
                                }`}
                                style={picked ? { boxShadow: `0 0 18px ${accent}44` } : undefined}
                            >
                                <div
                                    className="flex h-5 w-5 flex-none items-center justify-center rounded-full border"
                                    style={{
                                        borderColor: picked ? accent : 'rgba(255,255,255,0.2)',
                                        backgroundColor: picked ? accent : 'transparent',
                                    }}
                                >
                                    {picked && (
                                        <CheckCircle2 className="h-4 w-4 text-[#0b0c12]" />
                                    )}
                                </div>
                                <span>{c}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="mt-10 max-w-md text-center text-base italic text-white/85"
            >
                You don&apos;t have to be fearless. You just have to be prepared.
                You&apos;ve got this.
            </motion.p>

            <button
                onClick={() => onComplete({ commitments })}
                className="mt-6 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                style={{ backgroundColor: accent, color: '#0b0c12' }}
            >
                {commitments.length > 0 ? 'Lock in the playbook' : 'Finish anyway'}{' '}
                <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    );
}
