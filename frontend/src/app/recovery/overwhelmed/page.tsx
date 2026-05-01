'use client';

/**
 * Overwhelmed Recovery Path — orchestrator.
 *
 * A six-step flow tailored to the "overwhelmed" archetype. Each step auto-
 * advances where possible, state is persisted to localStorage so users can
 * resume mid-path, and the visual behaviour adapts to the user's current
 * stress bucket (high / medium / low).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, X, SkipForward } from 'lucide-react';
import { Aurora, NoiseOverlay } from '@/components/ui/aurora';
import { resolveEmotion, emotionCssVars, resolveStressLevel } from '@/lib/emotion-theme';
import { useWellness } from '@/components/wellness/WellnessProvider';
import {
    useRecoveryOverwhelmed,
    stressBucketFromProfile,
    parseBrainDumpToItems,
    type BrainDumpItem,
} from '@/lib/recovery-overwhelmed';

import StepBreathe from '@/components/recovery/overwhelmed/StepBreathe';
import StepColdSplash from '@/components/recovery/overwhelmed/StepColdSplash';
import StepBrainDump from '@/components/recovery/overwhelmed/StepBrainDump';
import StepShrinkField from '@/components/recovery/overwhelmed/StepShrinkField';
import StepSprint from '@/components/recovery/overwhelmed/StepSprint';
import StepDone from '@/components/recovery/overwhelmed/StepDone';
import StepReduceFuture from '@/components/recovery/overwhelmed/StepReduceFuture';
import { recordActivity } from '@/lib/streak';

const STEP_LABELS = [
    'Settle your body',
    'Brain dump',
    'Sort & pick one',
    'Smallest step',
    'Done for now',
    'Reduce future load',
];

export default function OverwhelmedRecoveryPage() {
    const router = useRouter();
    const { profile, loadProfile } = useWellness();
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [quietModeUntil, setQuietModeUntil] = useState<number | null>(null);

    // Resolve stress bucket from profile, default to medium before load.
    const bucket = useMemo(
        () => stressBucketFromProfile(profile?.stressLevel),
        [profile?.stressLevel],
    );

    const controls = useRecoveryOverwhelmed(bucket);
    const { state, hasResume, isHighStress, update, nextStep, restart, resume, startFresh, completePath } = controls;

    // Load profile once
    useEffect(() => {
        let cancelled = false;
        loadProfile().finally(() => {
            if (!cancelled) setProfileLoaded(true);
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Theme — overwhelmed is purple, but accent varies by stress
    const theme = resolveEmotion('overwhelmed');
    const stress = resolveStressLevel(profile?.stressLevel);

    // Quiet-mode timer (15 min) after user selects it on step 5
    useEffect(() => {
        if (!quietModeUntil) return;
        const id = window.setInterval(() => {
            if (Date.now() >= quietModeUntil) {
                setQuietModeUntil(null);
                window.clearInterval(id);
            }
        }, 1000);
        return () => window.clearInterval(id);
    }, [quietModeUntil]);

    /* ──────────── step handlers ──────────── */

    const handleBreatheDone = useCallback(() => {
        if (isHighStress && state.coldSplashDone === null) {
            // Enter cold-splash interstitial for high stress users.
            update({ breatheDone: true });
            return;
        }
        update({ breatheDone: true });
        nextStep();
    }, [isHighStress, state.coldSplashDone, nextStep, update]);

    const handleSplashAnswer = useCallback(
        (didIt: boolean) => {
            update({ coldSplashDone: didIt });
            nextStep();
        },
        [update, nextStep],
    );

    const handleBrainDumpSubmit = useCallback(
        (text: string) => {
            const items = parseBrainDumpToItems(text);
            update({ brainDump: text, items });
            nextStep();
        },
        [update, nextStep],
    );

    const handlePickOne = useCallback(
        (item: BrainDumpItem, all: BrainDumpItem[]) => {
            update({ chosenItemId: item.id, items: all });
            nextStep();
        },
        [update, nextStep],
    );

    const handleRest = useCallback(
        (all: BrainDumpItem[]) => {
            // Skip sprint, go straight to done screen (rest mode).
            update({ items: all, chosenItemId: null, smallestStep: 'Rest', sprintMinutes: 0, sprintSecondsDone: 0, currentStep: 4 });
        },
        [update],
    );

    const handleSprintFinish = useCallback(
        (secondsDone: number, minutes: number) => {
            update({ sprintSecondsDone: secondsDone, sprintMinutes: minutes });
            nextStep();
        },
        [update, nextStep],
    );

    const handleSprintStopEarly = useCallback(
        (secondsDone: number, minutes: number) => {
            update({ sprintSecondsDone: secondsDone, sprintMinutes: minutes });
            nextStep();
        },
        [update, nextStep],
    );

    const handleDoneSelect = useCallback(
        (action: 'done' | 'one-more' | 'quiet') => {
            if (action === 'one-more') {
                // Loop back to shrink field with remaining items
                update({
                    chosenItemId: null,
                    smallestStep: '',
                    sprintSecondsDone: 0,
                    currentStep: 2,
                });
                return;
            }

            if (action === 'quiet') {
                setQuietModeUntil(Date.now() + 15 * 60 * 1000);
                update({ quietMode: true });
            }

            // Mark a completion — eligible for step 6 if 2+ completions.
            const totalCompletions = completePath();
            recordActivity();
            if (totalCompletions >= 2) {
                update({ currentStep: 5 });
            } else {
                update({ currentStep: 6 }); // terminal — step 6 unlocks after 2+ completions
            }
        },
        [completePath, update],
    );

    const handleReduceFutureDone = useCallback(() => {
        update({ currentStep: 6 });
    }, [update]);

    /* ──────────── resume modal ──────────── */

    const [resumeOpen, setResumeOpen] = useState(false);
    useEffect(() => {
        if (hasResume) setResumeOpen(true);
    }, [hasResume]);

    /* ──────────── terminal screen ──────────── */

    if (state.currentStep === 6) {
        return (
            <TerminalScreen
                theme={theme.accent}
                quietActive={!!quietModeUntil}
                quietMinutesLeft={
                    quietModeUntil
                        ? Math.max(0, Math.ceil((quietModeUntil - Date.now()) / 60000))
                        : 0
                }
                onDone={() => router.push('/dashboard')}
                onRestart={() => {
                    restart();
                }}
            />
        );
    }

    /* ──────────── main layout ──────────── */

    const chosenItem = state.items.find((i) => i.id === state.chosenItemId) ?? null;

    return (
        <div
            className="relative flex min-h-screen flex-col overflow-hidden"
            style={emotionCssVars(theme)}
        >
            <Aurora
                colors={[theme.soft, theme.glow, theme.tint]}
                intensity={state.currentStep === 0 ? 'strong' : 'normal'}
            />
            <NoiseOverlay />

            {/* Top chrome */}
            <header className="relative z-10 mx-auto flex w-full max-w-4xl items-center justify-between px-6 pt-8">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-[color:var(--color-fg-muted)] backdrop-blur-md transition-colors hover:border-white/25 hover:text-[color:var(--color-fg)]"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Dashboard
                </button>

                <span
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.18em] backdrop-blur-md"
                    style={{
                        borderColor: theme.ring,
                        background: theme.tint,
                        color: theme.accent,
                    }}
                >
                    <Sparkles className="h-3 w-3" />
                    Overwhelmed pathway
                </span>

                <div className="flex items-center gap-2">
                    {state.currentStep < 5 && (
                        <button
                            onClick={nextStep}
                            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-[color:var(--color-fg-muted)] backdrop-blur-md transition-colors hover:border-white/25 hover:text-[color:var(--color-fg)]"
                            aria-label="Skip step"
                            title="Skip this step"
                        >
                            <SkipForward className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Skip</span>
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (confirm('Exit this session? Your progress will be kept.')) {
                                router.push('/dashboard');
                            }
                        }}
                        className="rounded-full border border-white/10 bg-white/[0.03] p-2 text-[color:var(--color-fg-muted)] transition-colors hover:border-white/25 hover:text-[color:var(--color-fg)]"
                        aria-label="Exit"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </header>

            {/* Progress + header */}
            <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pt-6">
                <div className="flex items-baseline justify-between gap-3">
                    <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-fg-subtle)]">
                        Step {Math.min(state.currentStep + 1, 6)} · {STEP_LABELS[Math.min(state.currentStep, 5)]}
                    </div>
                    <div
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.68rem] font-medium"
                        style={{
                            color: stress.color,
                            borderColor: `${stress.color}55`,
                            background: stress.tint,
                        }}
                    >
                        <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: stress.color, boxShadow: `0 0 6px ${stress.color}` }}
                        />
                        {stress.label} stress
                    </div>
                </div>

                <div className="mt-3 flex gap-1.5">
                    {[0, 1, 2, 3, 4, 5].map((s) => {
                        const done = s < state.currentStep;
                        const active = s === state.currentStep;
                        return (
                            <div
                                key={s}
                                className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]"
                            >
                                {(done || active) && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        transition={{
                                            duration: 0.55,
                                            ease: 'easeOut',
                                            delay: active ? 0.15 : 0,
                                        }}
                                        className="h-full rounded-full"
                                        style={{
                                            background: theme.gradient,
                                            boxShadow: `0 0 14px ${theme.glow}`,
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step body */}
            <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-8 sm:py-12">
                <AnimatePresence mode="wait">
                    {!profileLoaded ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-sm text-[color:var(--color-fg-muted)]"
                        >
                            Preparing your pathway…
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`step-${state.currentStep}-breathe-${state.breatheDone}-splash-${state.coldSplashDone}`}
                            initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
                            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full"
                        >
                            {renderStep()}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <footer className="relative z-10 pb-6 text-center text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-subtle)]">
                Private · auto-saving · you can leave any time
            </footer>

            {/* Resume modal */}
            <AnimatePresence>
                {resumeOpen && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-5 backdrop-blur-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            initial={{ scale: 0.94, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.94, y: 20 }}
                            className="w-full max-w-sm rounded-[var(--radius-xl)] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-2xl"
                        >
                            <h3 className="font-display text-2xl italic text-[color:var(--color-fg)]">
                                Continue where you left off?
                            </h3>
                            <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
                                You were at step {Math.min(state.currentStep + 1, 6)} · {STEP_LABELS[Math.min(state.currentStep, 5)]}.
                            </p>
                            <div className="mt-6 flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        resume();
                                        setResumeOpen(false);
                                    }}
                                    className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-900"
                                    style={{
                                        background: 'linear-gradient(135deg,#a78bfa,#818cf8)',
                                        boxShadow: '0 14px 40px -12px rgba(167,139,250,0.6)',
                                    }}
                                >
                                    Continue
                                </button>
                                <button
                                    onClick={() => {
                                        startFresh();
                                        setResumeOpen(false);
                                    }}
                                    className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-2 text-sm font-medium text-[color:var(--color-fg-muted)] hover:border-white/25 hover:text-[color:var(--color-fg)]"
                                >
                                    Start fresh
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    function renderStep() {
        // Step 0 — Breathe (+ optional splash for high stress)
        if (state.currentStep === 0) {
            if (isHighStress && state.breatheDone && state.coldSplashDone === null) {
                return <StepColdSplash onAnswer={handleSplashAnswer} />;
            }
            return <StepBreathe bucket={bucket} onComplete={handleBreatheDone} />;
        }

        if (state.currentStep === 1) {
            return (
                <StepBrainDump
                    initialText={state.brainDump}
                    bucket={bucket}
                    onSubmit={handleBrainDumpSubmit}
                />
            );
        }

        if (state.currentStep === 2) {
            return (
                <StepShrinkField
                    initialItems={state.items}
                    isHighStress={isHighStress}
                    onPick={handlePickOne}
                    onRest={handleRest}
                />
            );
        }

        if (state.currentStep === 3) {
            if (!chosenItem) {
                // Guard: fall back to shrink if we lost the chosen item.
                update({ currentStep: 2 });
                return null;
            }
            return (
                <StepSprint
                    chosenItem={chosenItem}
                    isHighStress={isHighStress}
                    initialSmallestStep={state.smallestStep}
                    initialMinutes={state.sprintMinutes}
                    onUpdate={update}
                    onFinish={handleSprintFinish}
                    onStopEarly={handleSprintStopEarly}
                />
            );
        }

        if (state.currentStep === 4) {
            return (
                <StepDone
                    isHighStress={isHighStress}
                    stoppedEarly={state.sprintSecondsDone < state.sprintMinutes * 60 && state.sprintMinutes > 0}
                    secondsDone={state.sprintSecondsDone}
                    onSelect={handleDoneSelect}
                />
            );
        }

        if (state.currentStep === 5) {
            return <StepReduceFuture onDone={handleReduceFutureDone} />;
        }

        return null;
    }
}

/* ─────────── Terminal screen ─────────── */

function TerminalScreen({
    theme,
    onDone,
    onRestart,
    quietActive,
    quietMinutesLeft,
}: {
    theme: string;
    onDone: () => void;
    onRestart: () => void;
    quietActive: boolean;
    quietMinutesLeft: number;
}) {
    return (
        <div
            className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
            style={emotionCssVars(resolveEmotion('overwhelmed'))}
        >
            <Aurora colors={['rgba(167,139,250,0.3)', 'rgba(129,140,248,0.22)', 'rgba(125,211,252,0.2)']} intensity="strong" />
            <NoiseOverlay />

            <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex h-28 w-28 items-center justify-center rounded-full border border-white/15"
                style={{
                    background: `radial-gradient(circle, ${theme}33, transparent 70%)`,
                    boxShadow: `0 0 80px ${theme}66`,
                }}
            >
                <Sparkles className="h-12 w-12" style={{ color: theme }} />
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="mt-8 max-w-xl text-balance text-center font-display text-3xl italic text-[color:var(--color-fg)] sm:text-4xl"
            >
                You just handled overwhelm.
            </motion.h1>
            <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.6 }}
                className="mt-4 max-w-md text-center text-[color:var(--color-fg-muted)]"
            >
                That&rsquo;s a skill you&rsquo;re building. Come back any time.
            </motion.p>

            {quietActive && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6 rounded-full border border-sky-300/30 bg-sky-400/10 px-4 py-1.5 text-xs text-sky-200"
                >
                    🌙 Quiet mode · {quietMinutesLeft} min left
                </motion.div>
            )}

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onDone}
                    className="rounded-full px-7 py-2.5 text-sm font-semibold text-slate-900"
                    style={{
                        background: `linear-gradient(135deg, ${theme}, #818cf8)`,
                        boxShadow: `0 14px 40px -12px ${theme}aa`,
                    }}
                >
                    Back to dashboard
                </motion.button>
                <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onRestart}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-7 py-2.5 text-sm font-medium text-[color:var(--color-fg-muted)] hover:border-white/25 hover:text-[color:var(--color-fg)]"
                >
                    Run the path again
                </motion.button>
            </div>
        </div>
    );
}
