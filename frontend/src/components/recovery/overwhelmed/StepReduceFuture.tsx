'use client';

/**
 * Step 6 (optional) — Reduce Future Load.
 * Only shown if user has completed the path at least twice.
 * Animation: a shield appearing around the checkmark.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, BellOff, CalendarClock, Users, Check } from 'lucide-react';

type Pick = 'mute' | 'reschedule' | 'delegate';

export default function StepReduceFuture({
    onDone,
}: {
    onDone: () => void;
}) {
    const [chosen, setChosen] = useState<Pick | null>(null);
    const [delegateTo, setDelegateTo] = useState('');
    const [confirmed, setConfirmed] = useState(false);

    const confirm = () => {
        setConfirmed(true);
        window.setTimeout(onDone, 1800);
    };

    if (confirmed) {
        return (
            <div className="flex min-h-[340px] w-full flex-col items-center justify-center gap-5 py-6">
                <ShieldedCheck />
                <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="font-display text-2xl italic text-[color:var(--color-fg)]"
                >
                    Future-you will thank you.
                </motion.p>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col items-center gap-6 py-2">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <h3 className="font-display text-2xl italic text-[color:var(--color-fg)] sm:text-3xl">
                    Want to prevent overwhelm tomorrow?
                </h3>
                <p className="mt-2 text-[color:var(--color-fg-muted)]">
                    Pick one tiny protection for future-you.
                </p>
            </motion.div>

            <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
                <OptionCard
                    icon={BellOff}
                    title="Mute notifications"
                    subtitle="For 30 minutes"
                    accent="#a78bfa"
                    selected={chosen === 'mute'}
                    onClick={() => setChosen('mute')}
                />
                <OptionCard
                    icon={CalendarClock}
                    title={'Move a &quot;Can wait&quot; task'}
                    plainTitle={`Move a "Can wait" task`}
                    subtitle="To tomorrow"
                    accent="#38bdf8"
                    selected={chosen === 'reschedule'}
                    onClick={() => setChosen('reschedule')}
                />
                <OptionCard
                    icon={Users}
                    title="Ask for help"
                    subtitle="Who can share the load?"
                    accent="#34d399"
                    selected={chosen === 'delegate'}
                    onClick={() => setChosen('delegate')}
                />
            </div>

            {chosen === 'delegate' && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-lg"
                >
                    <input
                        value={delegateTo}
                        onChange={(e) => setDelegateTo(e.target.value)}
                        placeholder="A name, a team, anyone who could help…"
                        className="w-full rounded-full border border-white/[0.08] bg-white/[0.03] px-5 py-3 text-center text-sm text-[color:var(--color-fg)] outline-none transition-colors placeholder:text-[color:var(--color-fg-subtle)] focus:border-white/25"
                    />
                </motion.div>
            )}

            <div className="flex items-center gap-3">
                <button
                    onClick={onDone}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-6 py-2.5 text-sm font-medium text-[color:var(--color-fg-muted)] hover:border-white/25 hover:text-[color:var(--color-fg)]"
                >
                    Maybe later
                </button>
                <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={!chosen || (chosen === 'delegate' && !delegateTo.trim())}
                    onClick={confirm}
                    className="rounded-full px-7 py-2.5 text-sm font-semibold text-slate-900 transition-all disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                        background: 'linear-gradient(135deg,#a78bfa,#818cf8)',
                        boxShadow: '0 14px 40px -12px rgba(167,139,250,0.7)',
                    }}
                >
                    Protect future-me
                </motion.button>
            </div>
        </div>
    );
}

function OptionCard({
    icon: Icon,
    title,
    plainTitle,
    subtitle,
    accent,
    selected,
    onClick,
}: {
    icon: React.ElementType;
    title: string;
    plainTitle?: string;
    subtitle: string;
    accent: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <motion.button
            whileHover={{ y: -3, scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="flex items-start gap-3 rounded-2xl border p-4 text-left backdrop-blur-xl transition-all"
            style={{
                borderColor: selected ? `${accent}77` : `${accent}33`,
                background: selected ? `${accent}18` : 'rgba(255,255,255,0.03)',
                boxShadow: selected ? `0 14px 40px -14px ${accent}aa` : 'none',
            }}
        >
            <span
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${accent}22`, border: `1px solid ${accent}44`, color: accent }}
            >
                <Icon className="h-4 w-4" />
            </span>
            <span className="flex min-w-0 flex-col">
                <span className="text-sm font-medium text-[color:var(--color-fg)]">
                    {plainTitle ?? title}
                </span>
                <span className="text-xs text-[color:var(--color-fg-muted)]">{subtitle}</span>
            </span>
        </motion.button>
    );
}

function ShieldedCheck() {
    return (
        <div className="relative flex h-32 w-32 items-center justify-center">
            <motion.div
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-300/40"
                style={{
                    background: 'radial-gradient(circle, rgba(52,211,153,0.28), rgba(16,185,129,0.12))',
                    boxShadow: '0 0 40px rgba(52,211,153,0.45)',
                }}
            >
                <Check className="h-9 w-9 text-emerald-200" />
            </motion.div>
            <motion.div
                initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex items-center justify-center"
            >
                <Shield
                    className="h-32 w-32 text-[color:var(--color-fg)]"
                    style={{
                        color: 'rgba(167,139,250,0.85)',
                        filter: 'drop-shadow(0 0 20px rgba(167,139,250,0.6))',
                    }}
                    strokeWidth={1.1}
                    fill="none"
                />
            </motion.div>
        </div>
    );
}
