'use client';

/**
 * Terminal screen for the sad recovery path.
 * Warm sunrise visual — no confetti (too loud for sadness). Recap cards
 * that echo the user's own words. Two quiet actions.
 */

import { motion } from 'framer-motion';
import { Home, BookOpen } from 'lucide-react';
import Link from 'next/link';
import type { SadSession } from '@/lib/recovery-sad';

export function StepDone({
    session,
    accent,
    onJournal,
}: {
    session: SadSession;
    accent: string;
    onJournal: () => void;
}) {
    const { body, reframe, savor, action, compassion, values } = session;

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-14">
            {/* Sunrise */}
            <div className="relative mb-6 h-48 w-full max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-1/2 top-6 h-36 w-36 -translate-x-1/2 rounded-full"
                    style={{
                        background: `radial-gradient(circle at 50% 55%, #fde68a 0%, ${accent} 50%, transparent 80%)`,
                        filter: `drop-shadow(0 0 60px ${accent})`,
                    }}
                />
                <motion.div
                    aria-hidden
                    className="absolute bottom-0 left-0 right-0 h-20"
                    style={{
                        background: `linear-gradient(180deg, transparent 0%, #0b0c12 100%)`,
                    }}
                />
                {/* Light rays */}
                {Array.from({ length: 6 }).map((_, i) => (
                    <motion.div
                        key={i}
                        aria-hidden
                        className="absolute left-1/2 top-20 h-40 w-0.5 origin-top"
                        style={{
                            background: `linear-gradient(180deg, ${accent}55, transparent)`,
                            rotate: `${(i - 2.5) * 18}deg`,
                            translateX: '-50%',
                        }}
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{
                            duration: 3,
                            delay: i * 0.2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                ))}
            </div>

            <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-balance text-center text-3xl font-light tracking-tight text-white sm:text-4xl"
            >
                You showed up.
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="mt-3 max-w-md text-center text-white/70"
            >
                That was enough. You noticed, softened the story, held a small good thing, took
                one action, and pointed yourself at what matters.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85, duration: 0.6 }}
                className="mt-10 grid w-full max-w-2xl gap-3 sm:grid-cols-2"
            >
                {(body.regions.length > 0 || body.anchorCompleted) && (
                    <RecapCard
                        label="Noticed"
                        value={
                            body.anchorCompleted
                                ? `${body.breaths} breaths at the nostril anchor`
                                : `sadness in ${body.regions.join(', ')}`
                        }
                        accent={accent}
                    />
                )}
                {reframe.reframe && (
                    <RecapCard
                        label={
                            reframe.style === 'repurposing'
                                ? 'This points at'
                                : reframe.style === 'prewritten'
                                  ? 'You heard'
                                  : 'Softer story'
                        }
                        value={
                            reframe.style === 'repurposing' && reframe.surfacedValue
                                ? `${reframe.surfacedValue} — ${reframe.reframe}`
                                : reframe.reframe
                        }
                        accent={accent}
                    />
                )}
                {savor.thing && (
                    <RecapCard
                        label={savor.heldTeaCup ? 'Held for 5s' : 'Noticed'}
                        value={savor.thing}
                        accent={accent}
                    />
                )}
                {action.action && (
                    <RecapCard
                        label={action.committed ? 'You began' : 'You named'}
                        value={action.action}
                        accent={accent}
                    />
                )}
                {(compassion.phrasesHeard.length > 0 || compassion.imagined) && (
                    <RecapCard
                        label="Compassion"
                        value={
                            compassion.imagined
                                ? 'pictured someone kind beside me'
                                : compassion.phrasesHeard
                                      .map((p) => `"${p}"`)
                                      .join(' · ')
                        }
                        accent={accent}
                    />
                )}
                {values.value && (
                    <RecapCard
                        label="Pointed at"
                        value={`${values.value}${values.tinyStep ? ` — ${values.tinyStep}` : ''}`}
                        accent={accent}
                    />
                )}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
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
                    style={{ backgroundColor: accent, color: '#1a1023' }}
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
