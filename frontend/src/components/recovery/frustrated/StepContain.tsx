'use client';

/**
 * Step 3 — Contain (the calm space / airlock).
 *
 * Chaotic particles snap into neat boxes. S.T.O.P sequence reveals one beat
 * at a time. High/medium-high tiers also drag a "safe room" door shut on
 * the trigger. Self-compassion taps at the end.
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { Shield, CheckCircle2, ArrowRight, Heart, DoorClosed } from 'lucide-react';
import type { StressTier } from '@/lib/emotion-theme';
import type { ContainData } from '@/lib/recovery-frustrated';
import { COMPASSION_PHRASES } from '@/lib/recovery-frustrated';

type Phase = 'intro' | 'stop' | 'saferoom' | 'compassion';

export function StepContain({
    stressTier,
    accent,
    initial,
    onComplete,
}: {
    stressTier: StressTier;
    accent: string;
    initial: ContainData;
    onComplete: (d: ContainData) => void;
}) {
    const isHigh = stressTier === 'high' || stressTier === 'medium-high';
    const [data, setData] = useState<ContainData>(initial);
    const [phase, setPhase] = useState<Phase>('intro');
    const update = (patch: Partial<ContainData>) => setData((d) => ({ ...d, ...patch }));

    const phaseOrder: Phase[] = isHigh
        ? ['intro', 'stop', 'saferoom', 'compassion']
        : ['intro', 'stop', 'compassion'];
    const idx = phaseOrder.indexOf(phase);
    const next = () => {
        if (idx >= phaseOrder.length - 1) onComplete(data);
        else setPhase(phaseOrder[idx + 1]);
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
            <motion.div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)` }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />

            <header className="relative z-10 flex flex-col items-center gap-3">
                <div className="text-xs uppercase tracking-[0.26em] text-white/55">Step 3 · Contain</div>
                <h2 className="text-balance text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Build a small, quiet room around this
                </h2>
                <div className="mt-2 flex items-center gap-2">
                    {phaseOrder.map((_, i) => (
                        <motion.div
                            key={i}
                            layout
                            className="h-1.5 rounded-full"
                            animate={{
                                width: i === idx ? 40 : 14,
                                backgroundColor: i <= idx ? accent : 'rgba(255,255,255,0.18)',
                            }}
                            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                        />
                    ))}
                </div>
            </header>

            <AnimatePresence mode="wait">
                {phase === 'intro' && (
                    <Pane key="intro">
                        <Intro onNext={next} accent={accent} />
                    </Pane>
                )}
                {phase === 'stop' && (
                    <Pane key="stop">
                        <StopSequence
                            accent={accent}
                            onDone={() => {
                                update({ stopCompleted: true });
                                next();
                            }}
                        />
                    </Pane>
                )}
                {phase === 'saferoom' && (
                    <Pane key="saferoom">
                        <SafeRoom
                            accent={accent}
                            onClose={() => {
                                update({ safeRoomClosed: true });
                                next();
                            }}
                        />
                    </Pane>
                )}
                {phase === 'compassion' && (
                    <Pane key="compassion">
                        <Compassion
                            accent={accent}
                            taps={data.compassionTaps}
                            onTap={(phrase) => {
                                const taps = data.compassionTaps.includes(phrase)
                                    ? data.compassionTaps
                                    : [...data.compassionTaps, phrase];
                                update({ compassionTaps: taps });
                            }}
                            onDone={() =>
                                onComplete({ ...data, stopCompleted: true })
                            }
                        />
                    </Pane>
                )}
            </AnimatePresence>
        </div>
    );
}

function Pane({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mt-10 w-full max-w-xl"
        >
            {children}
        </motion.div>
    );
}

const chaosParticles = Array.from({ length: 9 }, (_, i) => ({
    x: (i * 41) % 360,
    y: (i * 29) % 220,
    r: (i * 17) % 45,
}));

function Intro({ onNext, accent }: { onNext: () => void; accent: string }) {
    const [organized, setOrganized] = useState(false);
    useEffect(() => {
        const t = window.setTimeout(() => setOrganized(true), 900);
        return () => window.clearTimeout(t);
    }, []);

    return (
        <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-center text-white/70">
                Watch the noise get put away. It&apos;s not gone — just set aside so we can breathe.
            </p>
            <div className="relative h-64 w-full">
                {chaosParticles.map((p, i) => {
                    const col = i % 3;
                    const row = Math.floor(i / 3);
                    const targetX = 40 + col * 120;
                    const targetY = 30 + row * 70;
                    return (
                        <motion.div
                            key={i}
                            initial={{
                                x: p.x,
                                y: p.y,
                                rotate: p.r,
                                opacity: 0.8,
                            }}
                            animate={
                                organized
                                    ? { x: targetX, y: targetY, rotate: 0, opacity: 0.35 }
                                    : {}
                            }
                            transition={{
                                delay: 0.05 * i,
                                type: 'spring',
                                stiffness: 120,
                                damping: 18,
                            }}
                            className="absolute h-14 w-24 rounded-lg border"
                            style={{
                                background: organized
                                    ? 'rgba(255,255,255,0.03)'
                                    : `radial-gradient(circle, ${accent}66, transparent 70%)`,
                                borderColor: organized ? 'rgba(255,255,255,0.1)' : `${accent}44`,
                                boxShadow: organized ? undefined : `0 0 18px ${accent}55`,
                            }}
                        />
                    );
                })}
            </div>
            <button
                onClick={onNext}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                style={{ backgroundColor: accent, color: '#0b0c12' }}
            >
                Ready to S.T.O.P <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    );
}

const STOP_STEPS = [
    { letter: 'S', word: 'Stop', line: 'Freeze the reaction. Not forever — just for a breath.' },
    { letter: 'T', word: 'Take a breath', line: '4 in, 8 out. One breath. You only owe yourself one.' },
    { letter: 'O', word: 'Observe', line: "What's happening in your body? What's the story in your head?" },
    { letter: 'P', word: 'Proceed', line: 'Move forward on purpose, not on autopilot.' },
];

function StopSequence({ accent, onDone }: { accent: string; onDone: () => void }) {
    const [revealed, setRevealed] = useState(1);

    return (
        <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-center text-white/70">
                Four beats. Each one unlocks when you&apos;re ready for it.
            </p>
            <div className="flex w-full flex-col gap-2">
                {STOP_STEPS.map((s, i) => {
                    const visible = i < revealed;
                    return (
                        <motion.div
                            key={s.letter}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{
                                opacity: visible ? 1 : 0.25,
                                y: 0,
                                filter: visible ? 'blur(0px)' : 'blur(2px)',
                            }}
                            transition={{ duration: 0.5 }}
                            className="flex items-start gap-4 rounded-2xl border p-4"
                            style={{
                                borderColor: visible ? `${accent}55` : 'rgba(255,255,255,0.08)',
                                background: visible ? `${accent}11` : 'rgba(255,255,255,0.02)',
                                boxShadow: visible ? `0 0 28px ${accent}22` : undefined,
                            }}
                        >
                            <div
                                className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-lg font-semibold"
                                style={{
                                    backgroundColor: visible ? accent : 'rgba(255,255,255,0.08)',
                                    color: visible ? '#0b0c12' : 'rgba(255,255,255,0.5)',
                                }}
                            >
                                {s.letter}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-white">{s.word}</div>
                                <div className="text-xs text-white/60">{s.line}</div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            {revealed < STOP_STEPS.length ? (
                <button
                    onClick={() => setRevealed((r) => r + 1)}
                    className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                    style={{ backgroundColor: accent, color: '#0b0c12' }}
                >
                    Next beat
                </button>
            ) : (
                <button
                    onClick={onDone}
                    className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                    style={{ backgroundColor: accent, color: '#0b0c12' }}
                >
                    <CheckCircle2 className="h-4 w-4" /> S.T.O.P complete
                </button>
            )}
        </div>
    );
}

function SafeRoom({ accent, onClose }: { accent: string; onClose: () => void }) {
    const x = useMotionValue(0);
    const bgDarken = useTransform(x, [0, 180], [0, 0.6]);
    const rotY = useTransform(x, [0, 180], [0, -60]);
    const [closed, setClosed] = useState(false);

    return (
        <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-center text-white/70">
                Picture the trigger. Drag the door shut on it — not to deny it, just to set it
                down for a minute.
            </p>
            <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                <motion.div
                    aria-hidden
                    className="absolute inset-0"
                    style={{ backgroundColor: 'black', opacity: bgDarken }}
                />
                <div className="absolute inset-x-0 top-4 text-center text-[11px] uppercase tracking-[0.22em] text-white/50">
                    The trigger
                </div>
                <div className="absolute inset-x-0 top-10 text-center text-sm italic text-white/70">
                    (whatever set this off)
                </div>
                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 200 }}
                    dragElastic={0.1}
                    style={{ x, rotateY: rotY, perspective: 800 }}
                    onDragEnd={() => {
                        if (x.get() > 140) {
                            x.set(200);
                            setClosed(true);
                            window.setTimeout(onClose, 900);
                        } else {
                            x.set(0);
                        }
                    }}
                    className="absolute inset-y-4 left-6 w-24 cursor-grab active:cursor-grabbing"
                >
                    <div
                        className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border-2"
                        style={{
                            borderColor: `${accent}66`,
                            background:
                                'linear-gradient(180deg, rgba(120,53,15,0.5) 0%, rgba(51,30,10,0.8) 100%)',
                            boxShadow: `inset 0 0 20px rgba(0,0,0,0.5), 0 0 24px ${accent}33`,
                        }}
                    >
                        <DoorClosed className="h-10 w-10" style={{ color: accent }} />
                        <div className="text-[10px] uppercase tracking-[0.22em] text-white/75">
                            Drag me
                        </div>
                    </div>
                </motion.div>
                {closed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-x-0 bottom-4 text-center text-xs italic text-white/70"
                    >
                        <Shield className="mx-auto mb-1 h-4 w-4" style={{ color: accent }} />
                        sealed — you can revisit it on your schedule, not its.
                    </motion.div>
                )}
            </div>
            {!closed && (
                <button
                    onClick={() => {
                        x.set(200);
                        setClosed(true);
                        window.setTimeout(onClose, 900);
                    }}
                    className="text-xs uppercase tracking-[0.22em] text-white/50 transition hover:text-white/80"
                >
                    Skip — close the door
                </button>
            )}
        </div>
    );
}

function Compassion({
    accent,
    taps,
    onTap,
    onDone,
}: {
    accent: string;
    taps: string[];
    onTap: (phrase: string) => void;
    onDone: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-center text-white/70">
                Tap each line that feels true. Say it to yourself like you&apos;d say it to a
                friend having the worst day.
            </p>
            <div className="flex w-full flex-col gap-2">
                {COMPASSION_PHRASES.map((p, i) => {
                    const tapped = taps.includes(p);
                    return (
                        <motion.button
                            key={p}
                            onClick={() => onTap(p)}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * i, duration: 0.35 }}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            className={`relative flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                                tapped
                                    ? 'border-white/25 bg-white/10'
                                    : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                            }`}
                            style={tapped ? { boxShadow: `0 0 24px ${accent}33` } : undefined}
                        >
                            <Heart
                                className="h-4 w-4 flex-none"
                                style={{
                                    color: tapped ? accent : 'rgba(255,255,255,0.35)',
                                    fill: tapped ? accent : 'transparent',
                                }}
                            />
                            <span className={`text-sm ${tapped ? 'text-white' : 'text-white/75'}`}>
                                {p}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
            <button
                onClick={onDone}
                disabled={taps.length === 0}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{ backgroundColor: accent, color: '#0b0c12' }}
            >
                {taps.length > 0 ? 'Now make a plan' : 'Tap at least one to continue'}
                <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    );
}
