'use client';

/**
 * Step 6 — Anchor to Values (Committed Action).
 *
 * A compass rose with 8 values around a slowly rotating ring. The user
 * taps a value — the needle swings to point at it with a gentle spring.
 * Then they write one tiny step toward that value today.
 *
 * Very-low energy: auto-selects "Rest" and pre-fills "let myself actually
 * rest for ten minutes." They can tweak or accept.
 *
 * If Step 2 repurposing surfaced a value, we softly highlight it as a
 * suggested starting point (doesn't auto-select).
 */

import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Compass as CompassIcon } from 'lucide-react';
import type { EnergyTier, ValuesData } from '@/lib/recovery-sad';
import { VALUES } from '@/lib/recovery-sad';

export function StepValues({
    energy,
    accent,
    initial,
    surfacedValue,
    onComplete,
}: {
    energy: EnergyTier;
    accent: string;
    initial: ValuesData;
    surfacedValue?: string;
    onComplete: (d: ValuesData) => void;
}) {
    const defaultValue =
        initial.value ||
        (energy === 'very-low'
            ? 'rest'
            : surfacedValue && VALUES.some((v) => v.key === surfacedValue)
              ? surfacedValue
              : '');

    const [value, setValue] = useState(defaultValue);
    const [tinyStep, setTinyStep] = useState(
        initial.tinyStep ||
            (energy === 'very-low'
                ? 'let myself actually rest for ten minutes without guilt'
                : ''),
    );

    // Compute needle rotation based on selected value.
    const selectedIdx = VALUES.findIndex((v) => v.key === value);
    const targetDeg = selectedIdx >= 0 ? (selectedIdx / VALUES.length) * 360 : 0;

    const needleAngle = useSpring(targetDeg, { stiffness: 80, damping: 18 });
    const needleRotate = useTransform(needleAngle, (d) => `rotate(${d - 90}deg)`);

    useEffect(() => {
        needleAngle.set(targetDeg);
    }, [targetDeg, needleAngle]);

    const canSubmit = value.trim() && tinyStep.trim();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-10">
            <header className="flex flex-col items-center gap-2">
                <div className="text-xs uppercase tracking-[0.26em] text-white/55">
                    Step 6 · Anchor to a value
                </div>
                <h2 className="text-balance text-center text-3xl font-light tracking-tight text-white sm:text-4xl">
                    What still matters, even today?
                </h2>
                <p className="mt-2 max-w-md text-center text-sm text-white/65">
                    Not something to achieve. Something to point toward. Pick the one that
                    feels closest.
                </p>
            </header>

            <div className="grid w-full max-w-3xl items-center gap-6 sm:grid-cols-[auto,1fr]">
                {/* Compass */}
                <div className="relative mx-auto h-72 w-72">
                    <motion.div
                        aria-hidden
                        className="absolute inset-4 rounded-full border border-white/10"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                        style={{
                            background: `conic-gradient(from 0deg, ${accent}22, ${accent}11, ${accent}22)`,
                        }}
                    />
                    <div
                        className="absolute inset-10 rounded-full border border-white/10 bg-[#0b0c12]/60 backdrop-blur"
                    />

                    {/* Value chips around rim */}
                    {VALUES.map((v, i) => {
                        const angle = (i / VALUES.length) * Math.PI * 2 - Math.PI / 2;
                        const r = 130;
                        const x = 144 + Math.cos(angle) * r - 40;
                        const y = 144 + Math.sin(angle) * r - 12;
                        const selected = v.key === value;
                        const suggested = surfacedValue === v.key && !selected;
                        return (
                            <motion.button
                                key={v.key}
                                onClick={() => setValue(v.key)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`absolute rounded-full border px-2.5 py-1 text-[11px] transition ${
                                    selected
                                        ? 'border-white/30 bg-white/15 text-white'
                                        : 'border-white/10 bg-white/[0.05] text-white/75 hover:border-white/25'
                                }`}
                                style={{
                                    left: x,
                                    top: y,
                                    boxShadow: selected
                                        ? `0 0 20px ${accent}77`
                                        : suggested
                                          ? `0 0 14px ${accent}33`
                                          : undefined,
                                }}
                            >
                                {v.label}
                            </motion.button>
                        );
                    })}

                    {/* Needle */}
                    <motion.div
                        className="absolute left-1/2 top-1/2 h-1 w-24 origin-left -translate-y-1/2"
                        style={{
                            rotate: needleRotate,
                            background: `linear-gradient(90deg, ${accent}, transparent)`,
                            boxShadow: `0 0 12px ${accent}`,
                        }}
                    />

                    {/* Center */}
                    <div
                        className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
                        style={{
                            background: `radial-gradient(circle, ${accent}33 0%, transparent 80%)`,
                            border: `1px solid ${accent}55`,
                        }}
                    >
                        <CompassIcon className="h-5 w-5" style={{ color: accent }} />
                    </div>
                </div>

                {/* Tiny step */}
                <div className="flex flex-col gap-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">
                            anchored to
                        </div>
                        <div className="mt-1 text-lg capitalize text-white">
                            {value || <span className="italic text-white/40">pick one</span>}
                        </div>
                        {value && (
                            <div className="text-xs italic text-white/55">
                                {VALUES.find((v) => v.key === value)?.hint}
                            </div>
                        )}
                    </div>
                    <textarea
                        value={tinyStep}
                        onChange={(e) => setTinyStep(e.target.value)}
                        rows={4}
                        placeholder="One tiny step toward that today…"
                        className="w-full resize-none rounded-2xl border border-white/15 bg-white/[0.04] p-3 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
                    />
                    {energy === 'very-low' && (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-xs italic text-white/60">
                            Rest is not weakness. It&apos;s recovery. If that&apos;s all today
                            holds, it&apos;s enough.
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onComplete({ value, tinyStep })}
                    disabled={!canSubmit}
                    className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                    style={{ backgroundColor: accent, color: '#1a1023' }}
                >
                    Point me at it <ArrowRight className="h-4 w-4" />
                </button>
            </div>
            <button
                onClick={() => onComplete({ value: value || 'rest', tinyStep: tinyStep || 'just rest today' })}
                className="text-[11px] uppercase tracking-[0.22em] text-white/45 transition hover:text-white/75"
            >
                that&apos;s enough for now
            </button>
        </div>
    );
}
