'use client';

/**
 * Terminal screen for the pressure recovery path.
 * Headline energy: a mastered/directed pulse (pressure is fuel).
 * Recap echoes the user's own words + the challenge-mindset delta.
 */

import { motion } from 'framer-motion';
import { BookOpen, Home, Zap } from 'lucide-react';
import Link from 'next/link';
import type { PressureSession } from '@/lib/recovery-pressure';
import { PRESSURE_TYPE_META } from '@/lib/recovery-pressure';

export function StepDone({
    session,
    accent,
    onJournal,
}: {
    session: PressureSession;
    accent: string;
    onJournal: () => void;
}) {
    const { reset, reframe, arousal, triage, compassion, prevention, type } = session;

    const challengeDelta =
        arousal.challengeBefore != null && arousal.challengeAfter != null
            ? arousal.challengeAfter - arousal.challengeBefore
            : null;

    const probRelief =
        reframe.probBefore != null && reframe.probAfter != null
            ? Math.max(0, reframe.probBefore - reframe.probAfter)
            : null;

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-14">
            {/* Directed-pulse badge */}
            <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 160, damping: 14 }}
                className="relative flex h-24 w-24 items-center justify-center rounded-full"
                style={{
                    background: `radial-gradient(circle at 30% 30%, ${accent}, ${accent}44)`,
                    boxShadow: `0 0 60px ${accent}88`,
                }}
            >
                <Zap className="h-12 w-12 text-[#0b0c12]" />
                <motion.div
                    aria-hidden
                    className="absolute inset-0 rounded-full"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ border: `2px solid ${accent}` }}
                />
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="mt-8 text-balance text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            >
                Pressure directed.
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.5 }}
                className="mt-3 max-w-md text-center text-white/70"
            >
                {type ? PRESSURE_TYPE_META[type].label : 'Unnamed'} pressure named. Body
                reset. Story flipped. Fuel renamed. Load sorted. Teammate with you.
                Playbook saved.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75, duration: 0.5 }}
                className="mt-10 grid w-full max-w-2xl gap-3 sm:grid-cols-2"
            >
                {reset.protocol && (
                    <RecapCard
                        label="Reset"
                        value={
                            reset.protocol === 'sigh'
                                ? `${reset.cyclesCompleted} physiological sighs`
                                : reset.protocol === 'box'
                                  ? `${reset.cyclesCompleted} rounds of box breathing`
                                  : `${reset.cyclesCompleted} slow breaths`
                        }
                        sub={reset.pmrCompleted ? 'plus full body PMR sweep' : undefined}
                        accent={accent}
                    />
                )}
                {reframe.acceptedReframe && (
                    <RecapCard
                        label="Challenge story"
                        value={reframe.acceptedReframe}
                        sub={
                            probRelief && probRelief > 0
                                ? `${probRelief}% probability relief`
                                : undefined
                        }
                        accent={accent}
                    />
                )}
                {arousal.saidOutLoud && (
                    <RecapCard
                        label="Fuel renamed"
                        value={'"I am excited." (said out loud)'}
                        sub={
                            challengeDelta != null
                                ? `${challengeDelta >= 0 ? '+' : ''}${challengeDelta} toward challenge`
                                : undefined
                        }
                        accent={accent}
                    />
                )}
                {triage.items.length > 0 && (
                    <RecapCard
                        label="Load sorted"
                        value={`${triage.items.filter((i) => i.zone === 'now').length} now · ${triage.items.filter((i) => i.zone === 'later').length} later · ${triage.items.filter((i) => i.zone === 'outside').length} outside me`}
                        sub={
                            triage.pickedOne
                                ? `Focus: "${triage.items.find((i) => i.id === triage.pickedOne)?.text ?? ''}"`
                                : undefined
                        }
                        accent={accent}
                    />
                )}
                {triage.microBreakCompleted && triage.microBreak && (
                    <RecapCard
                        label="60s break"
                        value={triage.microBreak}
                        accent={accent}
                    />
                )}
                {(compassion.phrasesAccepted.length > 0 || compassion.separationAccepted) && (
                    <RecapCard
                        label="Teammate voice"
                        value={
                            compassion.phrasesAccepted.length > 0
                                ? compassion.phrasesAccepted.map((p) => `"${p}"`).join(' · ')
                                : 'separation statement accepted'
                        }
                        accent={accent}
                    />
                )}
                {prevention.commitments.length > 0 && (
                    <RecapCard
                        label="Next-time playbook"
                        value={`${prevention.commitments.length} commitments saved`}
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
    sub,
    accent,
}: {
    label: string;
    value: string;
    sub?: string;
    accent: string;
}) {
    return (
        <div
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            style={{ boxShadow: `inset 0 0 0 1px ${accent}11` }}
        >
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/45">{label}</div>
            <div className="mt-1 text-sm text-white">{value}</div>
            {sub && <div className="mt-1 text-[11px] italic text-white/50">{sub}</div>}
        </div>
    );
}
