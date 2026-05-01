'use client';

/**
 * Sad recovery path orchestrator at /recovery/sad.
 *
 * Routes the user across 6 gentle steps. Like the other paths, this
 * persists to localStorage (2h TTL), offers a resume prompt, and saves a
 * Markdown recap to the journal on completion.
 *
 * Sad-specific: we also show an "idle kindness" notice if the user hasn't
 * interacted for ~30s. Sadness shouldn't feel like homework, so the app
 * acknowledges stillness instead of nudging.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
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
    energyFromStress,
    getCompletions,
    incrementCompletions,
    loadSession,
    saveSession,
    type SadSession,
    type SadStep,
} from '@/lib/recovery-sad';
import { StepBodyScan } from '@/components/recovery/sad/StepBodyScan';
import { StepReframe } from '@/components/recovery/sad/StepReframe';
import { StepSavor } from '@/components/recovery/sad/StepSavor';
import { StepMicroAction } from '@/components/recovery/sad/StepMicroAction';
import { StepSelfCompassion } from '@/components/recovery/sad/StepSelfCompassion';
import { StepValues } from '@/components/recovery/sad/StepValues';
import { StepDone } from '@/components/recovery/sad/StepDone';
import { createJournalEntry } from '@/lib/api';
import { toast } from 'sonner';
import { recordActivity } from '@/lib/streak';

const STEP_ORDER: SadStep[] = [
    'body',
    'reframe',
    'savor',
    'action',
    'compassion',
    'values',
    'done',
];

const IDLE_MS = 30000;

export default function SadRecoveryPage() {
    const router = useRouter();
    const { profile, loadProfile } = useWellness();
    const [session, setSession] = useState<SadSession | null>(null);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [completions, setCompletions] = useState(0);
    const [idle, setIdle] = useState(false);
    const idleTimerRef = useRef<number | null>(null);

    const theme = resolveEmotion('sad');
    const stress = resolveStressLevel(profile?.stressLevel);

    useEffect(() => {
        if (!profile) loadProfile();
    }, [profile, loadProfile]);

    useEffect(() => {
        const existing = loadSession();
        setCompletions(getCompletions());
        if (existing && existing.currentStep !== 'body' && existing.currentStep !== 'done') {
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

    // Idle kindness: reset on any interaction.
    useEffect(() => {
        const reset = () => {
            setIdle(false);
            if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
            idleTimerRef.current = window.setTimeout(() => setIdle(true), IDLE_MS);
        };
        reset();
        const events: (keyof WindowEventMap)[] = [
            'mousemove',
            'keydown',
            'click',
            'touchstart',
            'scroll',
        ];
        events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
        return () => {
            if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
            events.forEach((e) => window.removeEventListener(e, reset));
        };
    }, []);

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
        const parts: string[] = ['# Sad recovery session\n'];
        if (session.body.anchorCompleted) {
            parts.push(`**Noticed:** ${session.body.breaths} breaths at the nostril anchor.`);
        } else if (session.body.regions.length > 0) {
            parts.push(
                `**Noticed sadness in:** ${session.body.regions.join(', ')}`,
            );
        }
        if (session.reframe.reframe) {
            const lbl =
                session.reframe.style === 'repurposing'
                    ? 'Repurposing'
                    : session.reframe.style === 'prewritten'
                      ? 'Heard'
                      : 'Reconstrual';
            parts.push(`\n**${lbl}:** ${session.reframe.reframe}`);
            if (session.reframe.surfacedValue) {
                parts.push(`**Pointed at value:** ${session.reframe.surfacedValue}`);
            }
        }
        if (session.savor.thing) {
            parts.push(
                `\n**Savored:** ${session.savor.thing}${
                    session.savor.heldTeaCup ? ' (held 5s)' : ''
                }`,
            );
        }
        if (session.action.action) {
            parts.push(
                `\n**Micro-action:** ${session.action.action}${
                    session.action.committed ? ' — begun' : ''
                }`,
            );
        }
        if (session.compassion.imagined) {
            parts.push(`\n**Compassion:** pictured someone kind beside me.`);
        } else if (session.compassion.phrasesHeard.length > 0) {
            parts.push(
                `\n**Compassion phrases:** ${session.compassion.phrasesHeard
                    .map((p) => `"${p}"`)
                    .join('; ')}`,
            );
            if (session.compassion.ownPhrase) {
                parts.push(`**My own:** "${session.compassion.ownPhrase}"`);
            }
        }
        if (session.values.value) {
            parts.push(
                `\n**Anchored to:** ${session.values.value} — ${session.values.tinyStep}`,
            );
        }
        try {
            await createJournalEntry(parts.join('\n'), 'sad');
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

    const energy = energyFromStress(session.stressTier);
    const currentStepIdx = STEP_ORDER.indexOf(session.currentStep);
    const progress = Math.round((currentStepIdx / (STEP_ORDER.length - 1)) * 100);

    return (
        <div
            className="relative min-h-screen overflow-hidden bg-[#0b0c12] text-white"
            style={emotionCssVars(theme)}
        >
            <Aurora
                intensity="soft"
                colors={[`${theme.accent}88`, `${theme.accent2}66`, 'rgba(251,191,36,0.25)']}
            />
            <NoiseOverlay className="opacity-30" />

            <header className="pointer-events-none fixed inset-x-0 top-0 z-20 p-4">
                <div className="pointer-events-auto mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 backdrop-blur-lg">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/60">
                        <span>{theme.icon} Sad path</span>
                        <span
                            className="rounded-full px-2 py-0.5 text-[10px]"
                            style={{ color: stress.color, backgroundColor: stress.tint }}
                        >
                            {energy === 'very-low'
                                ? 'Very low energy'
                                : energy === 'low'
                                  ? 'Low energy'
                                  : 'Gentle'}
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

            {/* Idle kindness */}
            <AnimatePresence>
                {idle && session.currentStep !== 'done' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center"
                    >
                        <div
                            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs italic text-white/65 backdrop-blur-lg"
                            style={{ boxShadow: `0 0 24px ${theme.accent}22` }}
                        >
                            take your time — nothing here is timed
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                                You paused during <em>{session.currentStep}</em>. Your answers are saved.
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
                                    className="flex-1 rounded-full px-4 py-2 text-sm font-medium text-[#1a1023] transition"
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
                    {session.currentStep === 'body' && (
                        <motion.div
                            key="body"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                            className="pt-24"
                        >
                            <StepBodyScan
                                energy={energy}
                                accent={theme.accent}
                                initial={session.body}
                                onComplete={(d) =>
                                    setSession((s) =>
                                        s ? { ...s, body: d, currentStep: 'reframe' } : s,
                                    )
                                }
                            />
                        </motion.div>
                    )}
                    {session.currentStep === 'reframe' && (
                        <motion.div
                            key="reframe"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <StepReframe
                                energy={energy}
                                accent={theme.accent}
                                initial={session.reframe}
                                onComplete={(d) =>
                                    setSession((s) =>
                                        s ? { ...s, reframe: d, currentStep: 'savor' } : s,
                                    )
                                }
                            />
                        </motion.div>
                    )}
                    {session.currentStep === 'savor' && (
                        <motion.div
                            key="savor"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <StepSavor
                                energy={energy}
                                accent={theme.accent}
                                initial={session.savor}
                                onComplete={(d) =>
                                    setSession((s) =>
                                        s ? { ...s, savor: d, currentStep: 'action' } : s,
                                    )
                                }
                            />
                        </motion.div>
                    )}
                    {session.currentStep === 'action' && (
                        <motion.div
                            key="action"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <StepMicroAction
                                energy={energy}
                                accent={theme.accent}
                                initial={session.action}
                                onComplete={(d) =>
                                    setSession((s) =>
                                        s ? { ...s, action: d, currentStep: 'compassion' } : s,
                                    )
                                }
                            />
                        </motion.div>
                    )}
                    {session.currentStep === 'compassion' && (
                        <motion.div
                            key="compassion"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <StepSelfCompassion
                                energy={energy}
                                accent={theme.accent}
                                initial={session.compassion}
                                onComplete={(d) =>
                                    setSession((s) =>
                                        s
                                            ? { ...s, compassion: d, currentStep: 'values' }
                                            : s,
                                    )
                                }
                            />
                        </motion.div>
                    )}
                    {session.currentStep === 'values' && (
                        <motion.div
                            key="values"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <StepValues
                                energy={energy}
                                accent={theme.accent}
                                initial={session.values}
                                surfacedValue={session.reframe.surfacedValue}
                                onComplete={(d) => {
                                    setSession((s) => {
                                        if (!s) return s;
                                        const next: SadSession = {
                                            ...s,
                                            values: d,
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
                            transition={{ duration: 0.6 }}
                        >
                            <StepDone
                                session={session}
                                accent={theme.accent}
                                onJournal={onJournal}
                            />
                            {completions > 0 && (
                                <div className="mb-8 text-center text-xs uppercase tracking-[0.2em] text-white/40">
                                    {completions} sad path{completions === 1 ? '' : 's'} completed
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
