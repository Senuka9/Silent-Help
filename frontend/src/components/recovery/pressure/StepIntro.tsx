'use client';

/**
 * Intro — user names the TYPE of pressure they're under. Every downstream
 * reframe / compassion line pivots on this, so we ask clearly but quickly.
 * Four tiles with distinct color tints so the choice feels tactile.
 */

import { motion } from 'framer-motion';
import { Clock, Trophy, Users, Flame, ArrowRight } from 'lucide-react';
import type { PressureType } from '@/lib/recovery-pressure';
import { PRESSURE_TYPE_META } from '@/lib/recovery-pressure';

const ICONS: Record<PressureType, typeof Clock> = {
    time: Clock,
    performance: Trophy,
    social: Users,
    self: Flame,
};

export function StepIntro({
    onPick,
}: {
    onPick: (t: PressureType) => void;
}) {
    const types: PressureType[] = ['time', 'performance', 'social', 'self'];

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
            <header className="flex flex-col items-center gap-3">
                <div className="text-xs uppercase tracking-[0.26em] text-white/55">
                    Name the pressure
                </div>
                <h2 className="text-balance text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    What kind of pressure is this?
                </h2>
                <p className="mt-2 max-w-md text-center text-sm text-white/65">
                    Naming it is half the shift. The rest of this path tunes itself to the
                    answer — the reframes, the compassion, even the break.
                </p>
            </header>

            <div className="mt-10 grid w-full max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {types.map((t, i) => {
                    const meta = PRESSURE_TYPE_META[t];
                    const Icon = ICONS[t];
                    return (
                        <motion.button
                            key={t}
                            onClick={() => onPick(t)}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08, duration: 0.45 }}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-white/30"
                        >
                            {/* Type-tinted glow */}
                            <div
                                aria-hidden
                                className="absolute inset-0 opacity-0 transition group-hover:opacity-100"
                                style={{
                                    background: `radial-gradient(circle at 20% 20%, ${meta.tint} 0%, transparent 60%)`,
                                }}
                            />

                            <div
                                className="relative flex h-11 w-11 items-center justify-center rounded-full"
                                style={{
                                    backgroundColor: meta.tint,
                                    color: meta.accent,
                                    boxShadow: `0 0 22px ${meta.accent}33`,
                                }}
                            >
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="relative">
                                <div className="text-lg font-medium text-white">{meta.label}</div>
                                <div className="text-xs italic text-white/60">{meta.tagline}</div>
                            </div>
                            <div className="relative mt-auto flex items-center gap-1 text-[11px] uppercase tracking-[0.22em] text-white/45 transition group-hover:text-white/80">
                                choose <ArrowRight className="h-3 w-3" />
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            <p className="mt-10 max-w-md text-center text-[11px] italic text-white/40">
                pressure is fuel — we&apos;re going to direct it, not fight it.
            </p>
        </div>
    );
}
