'use client';

/**
 * Terminal screen for the anxious recovery path.
 * Celebrates what the user actually did (their own words echoed back),
 * and offers next actions: back to dashboard, or journal the whole run.
 */

import { motion } from 'framer-motion';
import { Home, BookOpen, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { AnxiousSession } from '@/lib/recovery-anxious';

const CONFETTI = Array.from({ length: 16 }, (_, i) => ({
    y: -80 - (i % 5) * 16,
    x1: ((i % 8) - 4) * 25,
    x2: ((i % 8) - 4) * 50,
    delay: 0.1 + (i * 0.8) / 16,
}));

export function StepDone({
    session,
    accent,
    onJournal,
}: {
    session: AnxiousSession;
    accent: string;
    onJournal: () => void;
}) {
    const { reframe, worry, brave, sensoryItems } = session;

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-14">
            {/* Sparkle confetti */}
            {CONFETTI.map((c, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
                    animate={{
                        opacity: [0, 1, 0],
                        y: [0, c.y],
                        x: [c.x1, c.x2],
                        scale: [0, 1, 0.6],
                    }}
                    transition={{
                        duration: 2.2,
                        delay: c.delay,
                        ease: 'easeOut',
                    }}
                    className="absolute"
                    style={{ color: accent }}
                >
                    <Sparkles className="h-4 w-4" />
                </motion.div>
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
                <svg viewBox="0 0 24 24" className="h-12 w-12 text-[#0b0c12]">
                    <motion.path
                        d="M5 12 L10 17 L19 7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    />
                </svg>
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-8 text-balance text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            >
                You handled anxiety.
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mt-3 max-w-md text-center text-white/70"
            >
                Your body is calmer, the thought is untwisted, the worry has an appointment, and
                you named a tiny brave step.
            </motion.p>

            {/* Recap cards */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="mt-10 grid w-full max-w-2xl gap-3 sm:grid-cols-2"
            >
                {sensoryItems.length > 0 && (
                    <RecapCard
                        label="Grounded with"
                        value={`${sensoryItems.length} sensory anchors`}
                        accent={accent}
                    />
                )}
                {reframe.thought && (
                    <RecapCard
                        label="Reframed thought"
                        value={reframe.reality || reframe.thought}
                        accent={accent}
                    />
                )}
                {worry && (
                    <RecapCard
                        label="Worry scheduled for"
                        value={worry.label}
                        accent={accent}
                    />
                )}
                {brave.tinyStep && (
                    <RecapCard
                        label="Tiny brave step"
                        value={brave.tinyStep}
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
