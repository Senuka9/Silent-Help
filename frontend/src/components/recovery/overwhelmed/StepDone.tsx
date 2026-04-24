'use client';

/**
 * Step 5 — After the Sprint.
 * Shows confetti of tiny checkmarks, a congratulations line, and 2–3 next choices
 * (3 for high stress: "quiet mode").
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Moon } from 'lucide-react';

type Action = 'done' | 'one-more' | 'quiet';

export default function StepDone({
    isHighStress,
    stoppedEarly,
    secondsDone,
    onSelect,
}: {
    isHighStress: boolean;
    stoppedEarly: boolean;
    secondsDone: number;
    onSelect: (action: Action) => void;
}) {
    const [celebrated, setCelebrated] = useState(false);

    useEffect(() => {
        const t = window.setTimeout(() => setCelebrated(true), 1500);
        return () => window.clearTimeout(t);
    }, []);

    const confetti = useMemo(() => {
        return Array.from({ length: 28 }).map((_, i) => ({
            id: i,
            x: (i * 37) % 100,
            delay: (i % 8) * 0.1,
            duration: 1.6 + (i % 7) * 0.2,
            rotate: (i * 47) % 360,
            size: 10 + (i % 6) * 1.2,
        }));
    }, []);

    const minutesDone = Math.round(secondsDone / 60);

    return (
        <div className="relative flex w-full flex-col items-center gap-6 py-6">
            {/* Confetti */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] overflow-hidden">
                {confetti.map((c) => (
                    <motion.div
                        key={c.id}
                        className="absolute"
                        style={{ left: `${c.x}%`, fontSize: c.size }}
                        initial={{ y: -40, opacity: 0, rotate: 0 }}
                        animate={{ y: 280, opacity: [0, 1, 1, 0], rotate: c.rotate }}
                        transition={{
                            duration: c.duration,
                            delay: c.delay,
                            ease: 'easeIn',
                        }}
                    >
                        <Check className="text-emerald-300" style={{ width: c.size, height: c.size }} />
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex h-24 w-24 items-center justify-center rounded-full border border-emerald-300/40"
                style={{
                    background: 'radial-gradient(circle, rgba(52,211,153,0.32), rgba(16,185,129,0.15))',
                    boxShadow: '0 0 50px rgba(52,211,153,0.5)',
                }}
            >
                <Check className="h-12 w-12 text-emerald-200" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-center"
            >
                <h2 className="font-display text-3xl italic text-[color:var(--color-fg)] sm:text-4xl">
                    {stoppedEarly ? 'That\u2019s not nothing.' : 'You began. That\u2019s the hard part done.'}
                </h2>
                <p className="mt-3 text-[color:var(--color-fg-muted)]">
                    {stoppedEarly
                        ? `You did ${minutesDone || 1} min. Progress saved.`
                        : 'Your nervous system is calmer than it was a few minutes ago.'}
                </p>
            </motion.div>

            <AnimatePresence>
                {celebrated && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className={`flex w-full max-w-2xl flex-col gap-3 sm:flex-row ${isHighStress ? 'sm:flex-row' : ''}`}
                    >
                        <Choice
                            icon="✅"
                            label={'I\u2019m done for now'}
                            accent="#34d399"
                            onClick={() => onSelect('done')}
                            primary={isHighStress}
                        />
                        <Choice
                            icon="🔄"
                            label="One more small step"
                            accent="#a78bfa"
                            onClick={() => onSelect('one-more')}
                        />
                        {isHighStress && (
                            <Choice
                                icon={<Moon className="h-4 w-4" />}
                                label="Take a real break — 15 min quiet mode"
                                accent="#7dd3fc"
                                onClick={() => onSelect('quiet')}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Choice({
    icon,
    label,
    accent,
    onClick,
    primary,
}: {
    icon: React.ReactNode;
    label: string;
    accent: string;
    onClick: () => void;
    primary?: boolean;
}) {
    return (
        <motion.button
            whileHover={{ y: -2, scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="group relative flex flex-1 items-center gap-3 overflow-hidden rounded-2xl border px-5 py-4 text-left backdrop-blur-xl transition-all"
            style={{
                borderColor: `${accent}44`,
                background: primary ? `${accent}1a` : 'rgba(255,255,255,0.03)',
                boxShadow: primary ? `0 14px 40px -14px ${accent}aa` : `0 6px 22px -14px ${accent}88`,
            }}
        >
            <span
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg"
                style={{ background: `${accent}22`, border: `1px solid ${accent}44`, color: accent }}
            >
                {icon}
            </span>
            <span className="text-sm font-medium text-[color:var(--color-fg)]">{label}</span>
        </motion.button>
    );
}

