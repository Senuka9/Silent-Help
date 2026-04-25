'use client';

/**
 * Pressure recovery path orchestrator at /recovery/pressure.
 *
 * Routes across Intro (pressure-type picker) → 6 steps → Done. Persists
 * the session to localStorage (2h TTL), supports resume, and saves a
 * Markdown recap + prevention playbook to the journal on completion.
 *
 * Unique to pressure: the background picks up a secondary tint from the
 * user's chosen pressure TYPE, so the screen feels like the app "gets"
 * which flavour they're wrestling with.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, X, SkipForward } from 'lucide-react';
import { Aurora, NoiseOverlay } from '@/components/ui/aurora';
import { useWellness } from '@/components/wellness/WellnessProvider';
import {
    emotionCssVars,
    resolveEmotion,
    resolveStressLevel,
} from '@/lib/emotion-theme';
import {
    PRESSURE_TYPE_META,
    clearSession,
    emptySession,
    getCompletions,
    incrementCompletions,
    levelFromStress,
    loadSession,
    saveSession,
    type PressureSession,
    type PressureStep,
} from '@/lib/recovery-pressure';
import { StepIntro } from '@/components/recovery/pressure/StepIntro';
import { StepReset } from '@/components/recovery/pressure/StepReset';
import { StepReframe } from '@/components/recovery/pressure/StepReframe';
import { StepArousal } from '@/components/recovery/pressure/StepArousal';
import { StepTriage } from '@/components/recovery/pressure/StepTriage';
import { StepCompassion } from '@/components/recovery/pressure/StepCompassion';
import { StepPrevention } from '@/components/recovery/pressure/StepPrevention';
import { StepDone } from '@/components/recovery/pressure/StepDone';
import { createJournalEntry } from '@/lib/api';
import { toast } from 'sonner';

const STEP_ORDER: PressureStep[] = [
    'intro',
    'reset',
    'reframe',
    'arousal',
    'triage',
    'compassion',
    'prevention',
    'done',
];

export default function PressureRecoveryPage() {
    const router = useRouter();
    const { profile, loadProfile } = useWellness();
    const [session, setSession] = useState<PressureSession | null>(null);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [completions, setCompletions] = useState(0);

    const theme = resolveEmotion('pressure');
    const stress = resolveStressLevel(profile?.stressLevel);

    useEffect(() => {
        if (!profile) loadProfile();
    }, [profile, loadProfile]);

    useEffect(() => {
        const existing = loadSession();
        setCompletions(getCompletions());
        if (
            existing &&
            existing.currentStep !== 'intro' &&
            existing.currentStep !== 'done'
        ) {
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
                window.setTimeout(clearSession, 1000);
            }
            return { ...s, currentStep: next };
        });
    }, []);

    const onJournal = useCallback(async () => {
        if (!session) return;
        const parts: string[] = ['# Pressure recovery session\n'];
        if (session.type) {
            parts.push(
                `**Pressure type:** ${PRESSURE_TYPE_META[session.type].label} — ${PRESSURE_TYPE_META[session.type].tagline}`,
            );
        }
        parts.push(`**Level:** ${session.level}`);
        if (session.reset.protocol) {
            parts.push(
                `\n**Reset:** ${session.reset.protocol} · ${session.reset.cyclesCompleted} cycles${
                    session.reset.pmrCompleted ? ' · PMR sweep' : ''
                }`,
            );
        }
        if (session.reframe.acceptedReframe) {
            parts.push(`\n**Threat story:** "${session.reframe.oldStory}"`);
            parts.push(`**Challenge story:** "${session.reframe.acceptedReframe}"`);
            if (session.reframe.probBefore != null && session.reframe.probAfter != null) {
                parts.push(
                    `**Probability check:** ${session.reframe.probBefore}% → ${session.reframe.probAfter}% (${Math.max(
                        0,
                        session.reframe.probBefore - session.reframe.probAfter,
                    )}% relief)`,
                );
            }
        }
        if (session.arousal.saidOutLoud) {
            parts.push(`\n**Arousal reappraisal:** "I am excited." (said out loud)`);
            if (
                session.arousal.challengeBefore != null &&
                session.arousal.challengeAfter != null
            ) {
                parts.push(
                    `**Challenge shift:** ${session.arousal.challengeBefore} → ${session.arousal.challengeAfter}`,
                );
            }
        }
        if (session.triage.items.length > 0) {
            parts.push(`\n**Load:**`);
            const byZone = {
                now: session.triage.items.filter((i) => i.zone === 'now'),
                later: session.triage.items.filter((i) => i.zone === 'later'),
                outside: session.triage.items.filter((i) => i.zone === 'outside'),
            };
            if (byZone.now.length > 0)
                parts.push(`- Must now: ${byZone.now.map((i) => i.text).join('; ')}`);
            if (byZone.later.length > 0)
                parts.push(`- Can wait: ${byZone.later.map((i) => i.text).join('; ')}`);
            if (byZone.outside.length > 0)
                parts.push(
                    `- Outside my control: ${byZone.outside.map((i) => i.text).join('; ')}`,
                );
            if (session.triage.pickedOne) {
                const item = session.triage.items.find(
                    (i) => i.id === session.triage.pickedOne,
                );
                if (item) parts.push(`**Focus for next 5 min:** ${item.text}`);
            }
            if (session.triage.microBreakCompleted && session.triage.microBreak) {
                parts.push(`**60s reset:** ${session.triage.microBreak}`);
            }
        }
        if (
            session.compassion.phrasesAccepted.length > 0 ||
            session.compassion.separationAccepted
        ) {
            parts.push(
                `\n**Teammate voice:** ${session.compassion.phrasesAccepted.map((p) => `"${p}"`).join('; ')}`,
            );
            if (session.compassion.separationAccepted) {
                parts.push(`**Separation statement:** accepted`);
            }
        }
        if (session.prevention.commitments.length > 0) {
            parts.push(`\n## Pressure playbook — for next time`);
            session.prevention.commitments.forEach((c) => parts.push(`- ${c}`));
        }
        try {
            await createJournalEntry(parts.join('\n'), 'stressed');
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
    const typeMeta = session.type ? PRESSURE_TYPE_META[session.type] : null;
    const pathAccent = typeMeta?.accent ?? theme.accent;

    return (
        <div
            className="relative min-h-screen overflow-hidden bg-[#0b0c12] text-white"
            style={emotionCssVars(theme)}
        >
            <Aurora
                intensity="strong"
                colors={[
                    `${theme.accent}99`,
                    typeMeta ? `${typeMeta.accent}77` : `${theme.accent2}77`,
                    'rgba(148,163,184,0.3)',
                ]}
            />
            <NoiseOverlay className="opacity-35" />

            {/* Type-tinted overlay */}
            {typeMeta && (
                <motion.div
                    aria-hidden
                    key={session.type}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background: `radial-gradient(ellipse at 50% 30%, ${typeMeta.tint} 0%, transparent 60%)`,
                    }}
                />
            )}

            <header className="pointer-events-none fixed inset-x-0 top-0 z-20 p-4">
                <div className="pointer-events-auto mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 backdrop-blur-lg">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/60">
                        <span>{theme.icon} Pressure path</span>
                        {typeMeta && (
                            <span
                                className="rounded-full px-2 py-0.5 text-[10px]"
                                style={{
                                    color: typeMeta.accent,
                                    backgroundColor: typeMeta.tint,
                                }}
                            >
                                {typeMeta.label}
                            </span>
                        )}
                        <span
                            className="rounded-full px-2 py-0.5 text-[10px]"
                            style={{ color: stress.color, backgroundColor: stress.tint }}
                        >
                            {session.level} level
                        </span>
                    </div>
                    <div className="hidden flex-1 items-center gap-2 sm:flex">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: pathAccent }}
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
                            <h3 className="text-lg font-semibold text-white">
                                Pick up where you left off?
                            </h3>
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
                                    className="flex-1 rounded-full px-4 py-2 text-sm font-medium text-[#0b0c12] transition"
                                    style={{ backgroundColor: pathAccent }}
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
                    {session.currentStep === 'intro' && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <StepIntro
                                onPick={(t) =>
                                    setSession((s) =>
                                        s
                                            ? {
                                                  ...s,
                                                  type: t,
                                                  level: levelFromStress(s.stressTier),
                                                  currentStep: 'reset',
                                              }
                                            : s,
                                    )
                                }
                            />
                        </motion.div>
                    )}

                    {session.currentStep === 'reset' && session.type && (
                        <motion.div
                            key="reset"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <StepReset
                                level={session.level}
                                type={session.type}
                                accent={pathAccent}
                                initial={session.reset}
                                onComplete={(d) =>
                                    setSession((s) =>
                                        s
                                            ? { ...s, reset: d, currentStep: 'reframe' }
                                            : s,
                                    )
                                }
                            />
                        </motion.div>
                    )}

                    {session.currentStep === 'reframe' && session.type && (
                        <motion.div
                            key="reframe"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <StepReframe
                                level={session.level}
                                type={session.type}
                                accent={pathAccent}
                                initial={session.reframe}
                                onComplete={(d) =>
                                    setSession((s) =>
                                        s
                                            ? { ...s, reframe: d, currentStep: 'arousal' }
                                            : s,
                                    )
                                }
                            />
                        </motion.div>
                    )}

                    {session.currentStep === 'arousal' && session.type && (
                        <motion.div
                            key="arousal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <StepArousal
                                type={session.type}
                                accent={pathAccent}
                                initial={session.arousal}
                                onComplete={(d) =>
                                    setSession((s) =>
                                        s
                                            ? { ...s, arousal: d, currentStep: 'triage' }
                                            : s,
                                    )
                                }
                            />
                        </motion.div>
                    )}

                    {session.currentStep === 'triage' && session.type && (
                        <motion.div
                            key="triage"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <StepTriage
                                type={session.type}
                                accent={pathAccent}
                                initial={session.triage}
                                onComplete={(d) =>
                                    setSession((s) =>
                                        s
                                            ? { ...s, triage: d, currentStep: 'compassion' }
                                            : s,
                                    )
                                }
                            />
                        </motion.div>
                    )}

                    {session.currentStep === 'compassion' && session.type && (
                        <motion.div
                            key="compassion"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <StepCompassion
                                type={session.type}
                                accent={pathAccent}
                                initial={session.compassion}
                                onComplete={(d) =>
                                    setSession((s) =>
                                        s
                                            ? { ...s, compassion: d, currentStep: 'prevention' }
                                            : s,
                                    )
                                }
                            />
                        </motion.div>
                    )}

                    {session.currentStep === 'prevention' && (
                        <motion.div
                            key="prevention"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <StepPrevention
                                accent={pathAccent}
                                initial={session.prevention}
                                onComplete={(d) => {
                                    setSession((s) => {
                                        if (!s) return s;
                                        const next: PressureSession = {
                                            ...s,
                                            prevention: d,
                                            currentStep: 'done',
                                        };
                                        const n = incrementCompletions();
                                        setCompletions(n);
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
                                accent={pathAccent}
                                onJournal={onJournal}
                            />
                            {completions > 0 && (
                                <div className="mb-8 text-center text-xs uppercase tracking-[0.2em] text-white/40">
                                    {completions} pressure path{completions === 1 ? '' : 's'} completed
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
