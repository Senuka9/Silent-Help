'use client';

/**
 * Frustrated recovery path orchestrator at /recovery/frustrated.
 * Mirrors the anxious/overwhelmed orchestrators: routes between steps,
 * persists state to localStorage, offers resume prompt.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { X, RotateCcw, SkipForward } from 'lucide-react';
import { Aurora, NoiseOverlay } from '@/components/ui/aurora';
import { useWellness } from '@/components/wellness/WellnessProvider';
import {
    resolveEmotion,
    resolveStressLevel,
    emotionCssVars,
} from '@/lib/emotion-theme';
import {
    clearSession,
    emptySession,
    getCompletions,
    incrementCompletions,
    loadSession,
    saveSession,
    type FrustratedSession,
    type FrustratedStep,
} from '@/lib/recovery-frustrated';
import { recordActivity } from '@/lib/streak';
import { StepHeat } from '@/components/recovery/frustrated/StepHeat';
import { StepUntwist } from '@/components/recovery/frustrated/StepUntwist';
import { StepContain } from '@/components/recovery/frustrated/StepContain';
import { StepPlan } from '@/components/recovery/frustrated/StepPlan';
import { StepDone } from '@/components/recovery/frustrated/StepDone';
import { createJournalEntry } from '@/lib/api';
import { toast } from 'sonner';

const STEP_ORDER: FrustratedStep[] = ['heat', 'untwist', 'contain', 'plan', 'done'];

export default function FrustratedRecoveryPage() {
    const router = useRouter();
    const { profile, loadProfile } = useWellness();
    const [session, setSession] = useState<FrustratedSession | null>(null);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [completions, setCompletions] = useState(0);

    const theme = resolveEmotion('frustrated');
    const stress = resolveStressLevel(profile?.stressLevel);

    useEffect(() => {
        if (!profile) loadProfile();
    }, [profile, loadProfile]);

    useEffect(() => {
        const existing = loadSession();
        setCompletions(getCompletions());
        if (existing && existing.currentStep !== 'heat' && existing.currentStep !== 'done') {
            setSession(existing);
            setShowResumePrompt(true);
        } else {
            setSession(emptySession(stress.tier));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (session) saveSession(session);
    }, [session]);

    const restart = () => {
        clearSession();
        setSession(emptySession(stress.tier));
        setShowResumePrompt(false);
    };

    const exit = () => router.push('/dashboard');

    const skipStep = useCallback(() => {
        setSession((s) => {
            if (!s) return s;
            const idx = STEP_ORDER.indexOf(s.currentStep);
            if (idx < 0 || s.currentStep === 'done') return s;
            const next = STEP_ORDER[idx + 1] ?? 'done';
            if (next === 'done') {
                const n = incrementCompletions();
                setCompletions(n);
                recordActivity();
                window.setTimeout(clearSession, 1000);
            }
            return { ...s, currentStep: next };
        });
    }, []);

    const onJournal = useCallback(async () => {
        if (!session) return;
        const parts: string[] = ['# Frustrated recovery session\n'];
        if (session.tipp.completed.length > 0) {
            parts.push(
                `**Physical reset:** ${session.tipp.completed.join(', ')}${
                    session.tipp.dischargeTaps > 0
                        ? ` · ${session.tipp.dischargeTaps} discharge taps`
                        : ''
                }`,
            );
            if (session.tipp.checkIn) {
                parts.push(`**Post-TIPP check-in:** ${session.tipp.checkIn}`);
            }
        }
        if (session.untwist.thought) {
            parts.push(`\n**Hot thought:** "${session.untwist.thought}"`);
            if (session.untwist.defusionLabel)
                parts.push(`**Named feeling:** ${session.untwist.defusionLabel}`);
            if (session.untwist.reappraisal)
                parts.push(`**Reframe:** ${session.untwist.reappraisal}`);
        }
        if (session.contain.compassionTaps.length > 0) {
            parts.push(
                `\n**Self-compassion:** ${session.contain.compassionTaps
                    .map((t) => `"${t}"`)
                    .join('; ')}`,
            );
        }
        if (session.plan.thenClause) {
            parts.push(
                `\n**If-Then plan:** If ${session.plan.ifClause} — then ${session.plan.thenClause}.`,
            );
        }
        if (session.plan.worryWindow) {
            parts.push(
                `**Frustration appointment:** ${session.plan.worryWindow.label}`,
            );
        }
        try {
            await createJournalEntry(parts.join('\n'), 'angry');
            toast.success('Saved to journal');
            router.push('/dashboard');
        } catch {
            toast.error("Couldn't save — you can copy the text and try again.");
        }
    }, [session, router]);

    if (!session) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="loading-dots" aria-label="Loading">
                    <span />
                    <span />
                    <span />
                </div>
            </div>
        );
    }

    const currentStepIdx = STEP_ORDER.indexOf(session.currentStep);
    const progress = Math.round((currentStepIdx / (STEP_ORDER.length - 1)) * 100);

    return (
        <div
            className="relative min-h-screen overflow-hidden bg-[#0b0c12] text-white"
            style={emotionCssVars(theme)}
        >
            <Aurora
                intensity="strong"
                colors={[`${theme.accent}aa`, `${theme.accent2}88`, 'rgba(249,115,22,0.35)']}
            />
            <NoiseOverlay className="opacity-40" />

            <header className="pointer-events-none fixed inset-x-0 top-0 z-20 p-4">
                <div className="pointer-events-auto mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 backdrop-blur-lg">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/60">
                        <span>{theme.icon} Frustrated path</span>
                        <span
                            className="rounded-full px-2 py-0.5 text-[10px]"
                            style={{ color: stress.color, backgroundColor: stress.tint }}
                        >
                            {stress.label} stress
                        </span>
                    </div>
                    <div className="hidden flex-1 items-center gap-2 sm:flex">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: theme.accent }}
                                animate={{ width: `${progress}%` }}
                                transition={{ type: 'spring', stiffness: 180, damping: 26 }}
                            />
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                            {currentStepIdx + 1}/{STEP_ORDER.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {session.currentStep !== 'done' && (
                            <button
                                onClick={skipStep}
                                className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-white/50 transition hover:text-white/90"
                                aria-label="Skip step"
                                title="Skip this step"
                            >
                                <SkipForward className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Skip</span>
                            </button>
                        )}
                        <button
                            onClick={restart}
                            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-white/50 transition hover:text-white/90"
                            aria-label="Restart"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={exit}
                            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-white/60 transition hover:text-white/90"
                            aria-label="Exit"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {showResumePrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ y: 20, scale: 0.96, opacity: 0 }}
                            animate={{ y: 0, scale: 1, opacity: 1 }}
                            exit={{ y: 10, opacity: 0 }}
                            className="w-full max-w-sm rounded-3xl border border-white/15 bg-[#101220] p-6 text-center shadow-2xl"
                        >
                            <h3 className="text-lg font-semibold text-white">Pick up where you left off?</h3>
                            <p className="mt-2 text-sm text-white/70">
                                You paused during <em>{session.currentStep}</em>. Your progress is saved.
                            </p>
                            <div className="mt-5 flex gap-2">
                                <button
                                    onClick={restart}
                                    className="flex-1 rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:border-white/30"
                                >
                                    Start fresh
                                </button>
                                <button
                                    onClick={() => setShowResumePrompt(false)}
                                    className="flex-1 rounded-full px-4 py-2 text-sm font-medium text-[#0b0c12] transition"
                                    style={{ backgroundColor: theme.accent }}
                                >
                                    Continue
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10">
                <AnimatePresence mode="wait">
                    {session.currentStep === 'heat' && (
                        <motion.div
                            key="heat"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <StepHeat
                                stressTier={session.stressTier}
                                accent={theme.accent}
                                initial={session.tipp}
                                onComplete={(r) =>
                                    setSession((s) =>
                                        s ? { ...s, tipp: r, currentStep: 'untwist' } : s,
                                    )
                                }
                            />
                        </motion.div>
                    )}
                    {session.currentStep === 'untwist' && (
                        <motion.div
                            key="untwist"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <StepUntwist
                                stressTier={session.stressTier}
                                accent={theme.accent}
                                initial={session.untwist}
                                onComplete={(d) =>
                                    setSession((s) =>
                                        s ? { ...s, untwist: d, currentStep: 'contain' } : s,
                                    )
                                }
                            />
                        </motion.div>
                    )}
                    {session.currentStep === 'contain' && (
                        <motion.div
                            key="contain"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <StepContain
                                stressTier={session.stressTier}
                                accent={theme.accent}
                                initial={session.contain}
                                onComplete={(d) =>
                                    setSession((s) =>
                                        s ? { ...s, contain: d, currentStep: 'plan' } : s,
                                    )
                                }
                            />
                        </motion.div>
                    )}
                    {session.currentStep === 'plan' && (
                        <motion.div
                            key="plan"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <StepPlan
                                stressTier={session.stressTier}
                                accent={theme.accent}
                                initial={session.plan}
                                onComplete={(d) => {
                                    setSession((s) => {
                                        if (!s) return s;
                                        const next: FrustratedSession = {
                                            ...s,
                                            plan: d,
                                            currentStep: 'done',
                                        };
                                        const n = incrementCompletions();
                                        setCompletions(n);
                                        recordActivity();
                                        return next;
                                    });
                                    window.setTimeout(clearSession, 1000);
                                }}
                            />
                        </motion.div>
                    )}
                    {session.currentStep === 'done' && (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <StepDone
                                session={session}
                                accent={theme.accent}
                                onJournal={onJournal}
                            />
                            {completions > 0 && (
                                <div className="mb-8 text-center text-xs uppercase tracking-[0.2em] text-white/40">
                                    {completions} frustrated path{completions === 1 ? '' : 's'} completed
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
