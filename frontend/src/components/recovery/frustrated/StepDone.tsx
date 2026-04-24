'use client';

/**
 * Terminal screen for the frustrated recovery path.
 * Uses active "push" language per the design brief: "I got this out",
 * "I have a plan", "I am in control of my reaction."
 */

import { motion } from 'framer-motion';
import { Home, BookOpen, Zap } from 'lucide-react';
import Link from 'next/link';
import type { FrustratedSession } from '@/lib/recovery-frustrated';

export function StepDone({
    session,
    accent,
    onJournal,
}: {
    session: FrustratedSession;
    accent: string;
    onJournal: () => void;
}) {
    const { tipp, untwist, contain, plan } = session;

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-14">
            {/* Ember-to-spark confetti */}
            {Array.from({ length: 18 }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
                    animate={{
                        opacity: [0, 1, 0],
                        y: [0, -80 - Math.random() * 120],
                        x: [(Math.random() - 0.5) * 200, (Math.random() - 0.5) * 500],
                        scale: [0, 1, 0.4],
                    }}
                    transition={{
                        duration: 2.4,
                        delay: 0.1 + Math.random() * 0.9,
                        ease: 'easeOut',
                    }}
                    className="absolute h-2 w-2 rounded-full"
                    style={{
                        background: `radial-gradient(circle, ${accent}, #fcd34d 60%, transparent)`,
                        filter: `drop-shadow(0 0 6px ${accent})`,
                    }}
                />
            ))}

            <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.1 }}
                className="relative flex h-24 w-24 items-center justify-center rounded-full"
                style={{
                    background: `radial-gradient(circle at 30% 30%, ${accent}, ${accent}55)`,
                    boxShadow: `0 0 60px ${accent}88`,
                }}
            >
                <Zap className="h-12 w-12 text-[#0b0c12]" />
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="mt-8 text-balance text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            >
                You got this out.
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.5 }}
                className="mt-3 max-w-md text-center text-white/70"
            >
                Heat released. Narrative untwisted. Trigger contained. Plan locked in. You are in
                control of your reaction.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75, duration: 0.5 }}
                className="mt-10 grid w-full max-w-2xl gap-3 sm:grid-cols-2"
            >
                {tipp.completed.length > 0 && (
                    <RecapCard
                        label="Physical reset"
                        value={
                            tipp.completed
                                .map((c) =>
                                    c === 'temperature'
                                        ? 'ice dive'
                                        : c === 'tension'
                                          ? 'squeeze & release'
                                          : 'paced breathing',
                                )
                                .join(' · ') +
                            (tipp.dischargeTaps > 0 ? ` · ${tipp.dischargeTaps} discharge taps` : '')
                        }
                        accent={accent}
                    />
                )}
                {untwist.reappraisal && (
                    <RecapCard label="Reframed thought" value={untwist.reappraisal} accent={accent} />
                )}
                {untwist.defusionLabel && (
                    <RecapCard
                        label="Named the feeling"
                        value={`"there's that ${untwist.defusionLabel} again"`}
                        accent={accent}
                    />
                )}
                {(contain.safeRoomClosed || contain.compassionTaps.length > 0) && (
                    <RecapCard
                        label="Contained"
                        value={
                            [
                                contain.safeRoomClosed ? 'safe-room door closed' : null,
                                contain.compassionTaps.length
                                    ? `${contain.compassionTaps.length} compassion taps`
                                    : null,
                            ]
                                .filter(Boolean)
                                .join(' · ')
                        }
                        accent={accent}
                    />
                )}
                {plan.thenClause && (
                    <RecapCard
                        label="If-Then plan"
                        value={`If ${plan.ifClause.replace(/^if\s+/i, '')} — then ${plan.thenClause}`}
                        accent={accent}
                    />
                )}
                {plan.worryWindow && (
                    <RecapCard
                        label="Frustration appointment"
                        value={plan.worryWindow.label}
                        accent={accent}
                    />
                )}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="mt-10 flex flex-wrap items-center justify-center gap-3"
            >
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition hover:border-white/30"
                >
                    <Home className="h-4 w-4" /> Back to dashboard
                </Link>
                <button
                    onClick={onJournal}
                    className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                    style={{ backgroundColor: accent, color: '#0b0c12' }}
                >
                    <BookOpen className="h-4 w-4" /> Save to journal
                </button>
            </motion.div>
        </div>
    );
}

function RecapCard({
    label,
    value,
    accent,
}: {
    label: string;
    value: string;
    accent: string;
}) {
    return (
        <div
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            style={{ boxShadow: `inset 0 0 0 1px ${accent}11` }}
        >
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/45">{label}</div>
            <div className="mt-1 text-sm text-white">{value}</div>
        </div>
    );
}
