'use client';

/**
 * Step 1.5 — Cold Splash (high-stress only, optional).
 * Animation: water ripple rings emanating from center.
 */

import { motion } from 'framer-motion';
import { Droplets } from 'lucide-react';

export default function StepColdSplash({
    onAnswer,
}: {
    onAnswer: (didIt: boolean) => void;
}) {
    return (
        <div className="relative flex w-full flex-col items-center gap-8 py-10">
            <div className="relative flex h-[240px] w-[240px] items-center justify-center sm:h-[280px] sm:w-[280px]">
                {[0, 1, 2].map((i) => (
                    <motion.span
                        key={i}
                        className="absolute inset-0 rounded-full border"
                        style={{ borderColor: 'rgba(125,211,252,0.6)' }}
                        initial={{ scale: 0.3, opacity: 0.9 }}
                        animate={{ scale: 1.8, opacity: 0 }}
                        transition={{
                            duration: 2.4,
                            repeat: Infinity,
                            ease: 'easeOut',
                            delay: i * 0.8,
                        }}
                    />
                ))}
                <motion.div
                    className="relative flex h-24 w-24 items-center justify-center rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.25), rgba(125,211,252,0.55) 55%, rgba(56,189,248,0.4))',
                        boxShadow: '0 0 50px rgba(56,189,248,0.6)',
                    }}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <Droplets className="h-10 w-10 text-white" />
                </motion.div>
            </div>

            <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="max-w-md text-center text-base text-[color:var(--color-fg-muted)] sm:text-lg"
            >
                If you can, splash cold water on your face or wrists. This helps reset your
                nervous system.
            </motion.p>

            <div className="flex flex-wrap items-center justify-center gap-3">
                <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onAnswer(true)}
                    className="rounded-full px-6 py-2.5 text-sm font-semibold text-slate-900"
                    style={{
                        background: 'linear-gradient(135deg,#7dd3fc,#38bdf8)',
                        boxShadow: '0 10px 30px -10px rgba(56,189,248,0.6)',
                    }}
                >
                    I did it
                </motion.button>
                <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onAnswer(false)}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-6 py-2.5 text-sm font-medium text-[color:var(--color-fg-muted)] hover:border-white/25 hover:bg-white/[0.06] hover:text-[color:var(--color-fg)]"
                >
                    Skip
                </motion.button>
            </div>
        </div>
    );
}
