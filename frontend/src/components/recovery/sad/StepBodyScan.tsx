'use client';

/**
 * Step 1 — Physical Awareness (gentle somatic check-in).
 *
 * Full / low energy: user breathes at 4-in / 6-out while tapping the body
 * regions where they feel the sadness. Multi-select. No forced number of
 * regions — they can skip.
 *
 * Very-low energy: single-point nostril anchor. Just 3 breaths. No body map.
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { BodyScanData, EnergyTier } from '@/lib/recovery-sad';

const BODY_REGIONS: {
    id: BodyScanData['regions'][number];
    label: string;
    /** Centre-point on the SVG silhouette (100×160 viewbox). */
    cx: number;
    cy: number;
    /** Radius of the tap target. */
    r: number;
}[] = [
    { id: 'eyes', label: 'behind my eyes', cx: 50, cy: 22, r: 8 },
    { id: 'throat', label: 'my throat', cx: 50, cy: 38, r: 6 },
    { id: 'chest', label: 'my chest', cx: 50, cy: 58, r: 12 },
    { id: 'shoulders', label: 'my shoulders', cx: 32, cy: 48, r: 7 },
    { id: 'stomach', label: 'my stomach', cx: 50, cy: 82, r: 11 },
    { id: 'elsewhere', label: 'somewhere else', cx: 50, cy: 125, r: 10 },
];

export function StepBodyScan({
    energy,
    accent,
    initial,
    onComplete,
}: {
    energy: EnergyTier;
    accent: string;
    initial: BodyScanData;
    onComplete: (d: BodyScanData) => void;
}) {
    const [data, setData] = useState<BodyScanData>(initial);

    return energy === 'very-low' ? (
        <NostrilAnchor
            accent={accent}
            initial={data}
            onComplete={(d) => {
                setData(d);
                onComplete(d);
            }}
        />
    ) : (
        <BodyScan
            accent={accent}
            initial={data}
            onComplete={(d) => {
                setData(d);
                onComplete(d);
            }}
        />
    );
}

/* ────────── Body scan (full / low tier) ────────── */

function BodyScan({
    accent,
    initial,
    onComplete,
}: {
    accent: string;
    initial: BodyScanData;
    onComplete: (d: BodyScanData) => void;
}) {
    const [regions, setRegions] = useState<BodyScanData['regions']>(initial.regions);
    const [phase, setPhase] = useState<'in' | 'out'>('in');
    const [breaths, setBreaths] = useState(initial.breaths);

    // 4-in, 6-out breath rhythm.
    useEffect(() => {
        const t = window.setTimeout(
            () => {
                if (phase === 'in') setPhase('out');
                else {
                    setPhase('in');
                    setBreaths((b) => Math.min(b + 1, 99));
                }
            },
            phase === 'in' ? 4000 : 6000,
        );
        return () => window.clearTimeout(t);
    }, [phase]);

    const toggle = (r: BodyScanData['regions'][number]) => {
        setRegions((prev) =>
            prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
        );
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <header className="flex flex-col items-center gap-2">
                <div className="text-xs uppercase tracking-[0.26em] text-white/55">
                    Step 1 · Notice the body
                </div>
                <h2 className="text-balance text-center text-3xl font-light tracking-tight text-white sm:text-4xl">
                    Where does the sadness live today?
                </h2>
                <p className="mt-2 max-w-md text-center text-sm text-white/65">
                    Just notice. Tap anywhere you feel something — you don&apos;t have to change
                    it, or be sure. Breathe at the orb&apos;s pace if that helps.
                </p>
            </header>

            <div className="relative grid w-full max-w-xl items-center gap-6 sm:grid-cols-[auto,1fr]">
                {/* Body silhouette */}
                <div className="relative mx-auto h-80 w-52">
                    <svg viewBox="0 0 100 160" className="h-full w-full">
                        {/* Silhouette base */}
                        <path
                            d="M50 10 a10 10 0 1 1 -0.01 0 M40 30 Q 50 26 60 30 L 64 52 Q 70 54 72 62 L 70 88 Q 62 92 60 98 L 58 145 L 48 148 L 42 145 L 40 98 Q 38 92 30 88 L 28 62 Q 30 54 36 52 Z"
                            fill="rgba(255,255,255,0.03)"
                            stroke="rgba(255,255,255,0.18)"
                            strokeWidth="0.6"
                        />

                        {/* Region tap zones */}
                        {BODY_REGIONS.map((rg) => {
                            const selected = regions.includes(rg.id);
                            return (
                                <g key={rg.id}>
                                    <motion.circle
                                        cx={rg.cx}
                                        cy={rg.cy}
                                        r={rg.r}
                                        onClick={() => toggle(rg.id)}
                                        style={{ cursor: 'pointer' }}
                                        initial={false}
                                        animate={{
                                            fill: selected ? `${accent}66` : 'rgba(255,255,255,0.03)',
                                            stroke: selected ? accent : 'rgba(255,255,255,0.2)',
                                        }}
                                    />
                                    {selected && (
                                        <motion.circle
                                            cx={rg.cx}
                                            cy={rg.cy}
                                            r={rg.r}
                                            fill="none"
                                            stroke={accent}
                                            strokeWidth={0.6}
                                            animate={{
                                                r: [rg.r, rg.r + 4, rg.r],
                                                opacity: [0.6, 0, 0.6],
                                            }}
                                            transition={{
                                                duration: 3.2,
                                                repeat: Infinity,
                                                ease: 'easeInOut',
                                            }}
                                        />
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* Breath orb + region list */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative flex h-40 w-40 items-center justify-center">
                        <motion.div
                            className="h-24 w-24 rounded-full"
                            animate={{
                                scale: phase === 'in' ? 1.25 : 0.75,
                                background: `radial-gradient(circle at 30% 30%, ${accent}, ${accent}22)`,
                                boxShadow: `0 0 48px ${accent}55`,
                            }}
                            transition={{
                                duration: phase === 'in' ? 4 : 6,
                                ease: [0.45, 0, 0.35, 1],
                            }}
                        />
                        <div className="absolute text-center">
                            <div
                                className="text-[10px] uppercase tracking-[0.3em]"
                                style={{ color: accent }}
                            >
                                {phase === 'in' ? 'breathe in' : 'slow exhale'}
                            </div>
                            <div className="mt-1 text-xs text-white/55">{breaths} / 3 breaths</div>
                        </div>
                    </div>

                    <div className="w-full text-center text-xs text-white/55">
                        {regions.length === 0
                            ? 'tap where you feel it — or skip this part'
                            : `you noticed ${regions.length} place${
                                  regions.length === 1 ? '' : 's'
                              }`}
                    </div>
                </div>
            </div>

            <button
                onClick={() => onComplete({ regions, anchorCompleted: false, breaths })}
                disabled={breaths < 1 && regions.length === 0}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{ backgroundColor: accent, color: '#1a1023' }}
            >
                Continue gently <ArrowRight className="h-4 w-4" />
            </button>
            <button
                onClick={() => onComplete({ regions, anchorCompleted: false, breaths })}
                className="text-[11px] uppercase tracking-[0.22em] text-white/45 transition hover:text-white/75"
            >
                that&apos;s enough for now
            </button>
        </div>
    );
}

/* ────────── Nostril anchor (very-low tier) ────────── */

function NostrilAnchor({
    accent,
    initial,
    onComplete,
}: {
    accent: string;
    initial: BodyScanData;
    onComplete: (d: BodyScanData) => void;
}) {
    const [breaths, setBreaths] = useState(initial.breaths);
    const [running, setRunning] = useState(false);
    const [phase, setPhase] = useState<'in' | 'out'>('in');
    const lastRef = useRef(phase);

    useEffect(() => {
        if (!running) return;
        const t = window.setTimeout(
            () => {
                if (phase === 'in') {
                    setPhase('out');
                    lastRef.current = 'out';
                } else {
                    setPhase('in');
                    lastRef.current = 'in';
                    setBreaths((b) => {
                        const next = b + 1;
                        if (next >= 3) {
                            setRunning(false);
                            window.setTimeout(
                                () =>
                                    onComplete({
                                        regions: [],
                                        anchorCompleted: true,
                                        breaths: next,
                                    }),
                                900,
                            );
                        }
                        return next;
                    });
                }
            },
            phase === 'in' ? 4000 : 6000,
        );
        return () => window.clearTimeout(t);
    }, [phase, running, onComplete]);

    return (
        <div className="flex flex-col items-center gap-6">
            <header className="flex flex-col items-center gap-2">
                <div className="text-xs uppercase tracking-[0.26em] text-white/55">
                    Step 1 · Gentle anchor
                </div>
                <h2 className="text-balance text-center text-3xl font-light tracking-tight text-white sm:text-4xl">
                    Three breaths. That&apos;s all we&apos;re doing.
                </h2>
                <p className="mt-2 max-w-md text-center text-sm text-white/65">
                    Feel the air at your nostrils — the small coolness as it comes in, the faint
                    warmth as it leaves. Nothing else to do.
                </p>
            </header>

            <div className="relative flex h-56 w-56 items-center justify-center">
                <motion.div
                    aria-hidden
                    className="absolute h-40 w-40 rounded-full"
                    animate={{
                        scale: running && phase === 'in' ? 1.2 : 0.75,
                        opacity: running ? 0.8 : 0.4,
                        background: `radial-gradient(circle, ${accent}55 0%, transparent 70%)`,
                    }}
                    transition={{
                        duration: phase === 'in' ? 4 : 6,
                        ease: [0.45, 0, 0.35, 1],
                    }}
                />
                <motion.div
                    className="h-6 w-6 rounded-full"
                    animate={{
                        scale: running && phase === 'in' ? 1.6 : 1,
                        background: accent,
                        boxShadow: `0 0 40px ${accent}`,
                    }}
                    transition={{
                        duration: phase === 'in' ? 4 : 6,
                        ease: [0.45, 0, 0.35, 1],
                    }}
                />
            </div>

            <div className="text-center">
                <div
                    className="text-[11px] uppercase tracking-[0.3em]"
                    style={{ color: accent }}
                >
                    {running ? (phase === 'in' ? 'in' : 'out') : 'ready'}
                </div>
                <div className="mt-1 text-xs text-white/55">breath {breaths} of 3</div>
            </div>

            {!running ? (
                <button
                    onClick={() => {
                        setRunning(true);
                        setPhase('in');
                    }}
                    className="rounded-full px-5 py-2.5 text-sm font-medium transition"
                    style={{ backgroundColor: accent, color: '#1a1023' }}
                >
                    Begin
                </button>
            ) : (
                <button
                    onClick={() =>
                        onComplete({ regions: [], anchorCompleted: true, breaths })
                    }
                    className="text-[11px] uppercase tracking-[0.22em] text-white/45 transition hover:text-white/75"
                >
                    that&apos;s enough for now
                </button>
            )}
        </div>
    );
}
