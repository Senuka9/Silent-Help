'use client';

/**
 * Step 3 — Shrink the Field.
 * Users tap an item then tap a zone (simple, works on touch & mouse).
 * For high stress: items matching "not-in-control" patterns auto-suggest the gray zone.
 * After sorting, pick one item from "Must happen now" — it glows and flies to center.
 * If nothing in "now" and high stress → offer a rest path.
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertTriangle, Clock, EyeOff, Moon } from 'lucide-react';
import { type BrainDumpItem, detectNotInControl } from '@/lib/recovery-overwhelmed';

type Zone = 'now' | 'wait' | 'nocontrol';

const ZONES: {
    key: Zone;
    title: string;
    subtitle: string;
    color: string;
    tint: string;
    icon: React.ElementType;
}[] = [
    {
        key: 'now',
        title: 'Must happen now',
        subtitle: 'Real and urgent',
        color: '#fb7185',
        tint: 'rgba(251,113,133,0.12)',
        icon: AlertTriangle,
    },
    {
        key: 'wait',
        title: 'Can wait',
        subtitle: 'Not today',
        color: '#fbbf24',
        tint: 'rgba(251,191,36,0.12)',
        icon: Clock,
    },
    {
        key: 'nocontrol',
        title: 'Not in my control',
        subtitle: 'Let it go, gently',
        color: '#94a3b8',
        tint: 'rgba(148,163,184,0.12)',
        icon: EyeOff,
    },
];

export default function StepShrinkField({
    initialItems,
    isHighStress,
    onPick,
    onRest,
}: {
    initialItems: BrainDumpItem[];
    isHighStress: boolean;
    onPick: (item: BrainDumpItem, allItems: BrainDumpItem[]) => void;
    onRest: (allItems: BrainDumpItem[]) => void;
}) {
    const [items, setItems] = useState<BrainDumpItem[]>(() => {
        if (!isHighStress) return initialItems;
        // Auto-suggest nocontrol for high stress
        return initialItems.map((item) =>
            detectNotInControl(item.text)
                ? { ...item, zone: 'nocontrol', autoSuggested: true }
                : item,
        );
    });
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [phase, setPhase] = useState<'sort' | 'pick' | 'launching'>('sort');
    const [flyingId, setFlyingId] = useState<string | null>(null);

    const unsorted = items.filter((i) => !i.zone);
    const byZone = (z: Zone) => items.filter((i) => i.zone === z);
    const allSorted = unsorted.length === 0;
    const nowItems = byZone('now');

    const assignZone = (id: string, zone: Zone) => {
        setItems((prev) =>
            prev.map((i) =>
                i.id === id ? { ...i, zone, autoSuggested: false } : i,
            ),
        );
        setSelectedId(null);
    };

    const unassign = (id: string) => {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, zone: null } : i)));
    };

    const proceedToPick = () => setPhase('pick');

    const pickItem = (id: string) => {
        setFlyingId(id);
        setPhase('launching');
        window.setTimeout(() => {
            const item = items.find((i) => i.id === id);
            if (item) onPick(item, items);
        }, 1400);
    };

    if (phase === 'launching' && flyingId) {
        const chosen = items.find((i) => i.id === flyingId);
        return (
            <div className="flex min-h-[400px] w-full items-center justify-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: [0.9, 1.1, 1], opacity: 1 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="relative rounded-2xl border px-6 py-5 text-center"
                    style={{
                        borderColor: 'rgba(167,139,250,0.6)',
                        background: 'rgba(167,139,250,0.12)',
                        boxShadow: '0 0 60px rgba(167,139,250,0.6)',
                    }}
                >
                    <motion.span
                        className="absolute -inset-4 rounded-3xl"
                        style={{
                            background:
                                'radial-gradient(circle, rgba(167,139,250,0.4), transparent 65%)',
                        }}
                        animate={{ scale: [0.9, 1.3, 1], opacity: [0.9, 0.3, 0.6] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                    />
                    <div className="relative font-display text-xl italic text-[color:var(--color-fg)] sm:text-2xl">
                        {chosen?.text}
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="relative flex w-full flex-col items-center gap-6 py-2">
            {phase === 'sort' && (
                <>
                    <motion.p
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-lg text-center text-base text-[color:var(--color-fg-muted)] sm:text-lg"
                    >
                        Of everything you wrote, what actually needs you right now?
                    </motion.p>

                    {/* Unsorted items cloud */}
                    <div className="flex min-h-[80px] w-full max-w-3xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4">
                        <AnimatePresence>
                            {unsorted.length === 0 && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-sm text-[color:var(--color-fg-subtle)]"
                                >
                                    Everything sorted.
                                </motion.p>
                            )}
                            {unsorted.map((item) => (
                                <motion.button
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9, y: 6 }}
                                    animate={{
                                        opacity: 1,
                                        scale: selectedId === item.id ? 1.05 : 1,
                                        y: selectedId === item.id ? -3 : 0,
                                    }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.35 }}
                                    onClick={() =>
                                        setSelectedId((cur) => (cur === item.id ? null : item.id))
                                    }
                                    className="rounded-full border px-4 py-1.5 text-sm transition-all"
                                    style={{
                                        borderColor:
                                            selectedId === item.id
                                                ? 'rgba(167,139,250,0.6)'
                                                : 'rgba(255,255,255,0.10)',
                                        background:
                                            selectedId === item.id
                                                ? 'rgba(167,139,250,0.14)'
                                                : 'rgba(255,255,255,0.03)',
                                        color:
                                            selectedId === item.id
                                                ? '#d9d5ff'
                                                : 'var(--color-fg-muted)',
                                        boxShadow:
                                            selectedId === item.id
                                                ? '0 0 22px -4px rgba(167,139,250,0.55)'
                                                : 'none',
                                    }}
                                >
                                    {item.text}
                                </motion.button>
                            ))}
                        </AnimatePresence>
                    </div>

                    <p className="text-center text-xs text-[color:var(--color-fg-subtle)]">
                        Tap an item, then tap a zone.
                    </p>

                    <div className="grid w-full max-w-4xl gap-3 sm:grid-cols-3">
                        {ZONES.map((z) => {
                            const zItems = byZone(z.key);
                            const canDrop = !!selectedId;
                            return (
                                <motion.button
                                    key={z.key}
                                    whileHover={canDrop ? { y: -3, scale: 1.01 } : undefined}
                                    onClick={() => selectedId && assignZone(selectedId, z.key)}
                                    className={`group relative flex min-h-[130px] flex-col gap-2 rounded-2xl border p-4 text-left transition-all ${canDrop ? 'cursor-pointer' : 'cursor-default'}`}
                                    style={{
                                        borderColor: canDrop ? `${z.color}66` : `${z.color}33`,
                                        background: z.tint,
                                        boxShadow: canDrop ? `0 0 40px -20px ${z.color}` : 'none',
                                    }}
                                    aria-label={`Move selected item to: ${z.title}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <z.icon className="h-4 w-4" style={{ color: z.color }} />
                                        <div className="text-sm font-semibold" style={{ color: z.color }}>
                                            {z.title}
                                        </div>
                                    </div>
                                    <div className="text-[0.7rem] uppercase tracking-[0.14em] text-[color:var(--color-fg-subtle)]">
                                        {z.subtitle}
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                        <AnimatePresence>
                                            {zItems.map((it) => (
                                                <motion.span
                                                    key={it.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.6 }}
                                                    animate={{
                                                        opacity: 1,
                                                        scale: [0.6, 1.08, 1],
                                                    }}
                                                    exit={{ opacity: 0, scale: 0.6 }}
                                                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        unassign(it.id);
                                                    }}
                                                    className="inline-flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                                                    style={{
                                                        borderColor: `${z.color}55`,
                                                        color: 'var(--color-fg)',
                                                        background: `${z.color}14`,
                                                    }}
                                                    title="Tap to move back"
                                                >
                                                    {it.text}
                                                    {it.autoSuggested && (
                                                        <Sparkles
                                                            className="ml-1 h-3 w-3"
                                                            style={{ color: z.color }}
                                                        />
                                                    )}
                                                </motion.span>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>

                    {isHighStress && items.some((i) => i.autoSuggested) && (
                        <p className="max-w-md text-center text-xs text-[color:var(--color-fg-subtle)]">
                            <Sparkles className="mr-1 inline h-3 w-3 text-indigo-300" />
                            Items marked with a sparkle were auto-placed — move them if you disagree.
                        </p>
                    )}

                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={!allSorted}
                        onClick={proceedToPick}
                        className="rounded-full px-7 py-2.5 text-sm font-semibold text-slate-900 transition-all disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                            background: 'linear-gradient(135deg,#a78bfa,#818cf8)',
                            boxShadow: '0 14px 40px -12px rgba(167,139,250,0.7)',
                        }}
                    >
                        Continue
                    </motion.button>
                </>
            )}

            {phase === 'pick' && (
                <PickOne
                    nowItems={nowItems}
                    isHighStress={isHighStress}
                    onPick={pickItem}
                    onRest={() => onRest(items)}
                    onBack={() => setPhase('sort')}
                    waitItemsCount={byZone('wait').length}
                />
            )}
        </div>
    );
}

function PickOne({
    nowItems,
    isHighStress,
    onPick,
    onRest,
    onBack,
    waitItemsCount,
}: {
    nowItems: BrainDumpItem[];
    isHighStress: boolean;
    onPick: (id: string) => void;
    onRest: () => void;
    onBack: () => void;
    waitItemsCount: number;
}) {
    if (nowItems.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex w-full max-w-lg flex-col items-center gap-5 py-6 text-center"
            >
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10">
                    <Moon className="h-7 w-7 text-emerald-300" />
                </div>
                <h3 className="font-display text-2xl italic text-[color:var(--color-fg)]">
                    That&rsquo;s actually good news.
                </h3>
                <p className="text-[color:var(--color-fg-muted)]">
                    Nothing urgent. {isHighStress ? 'Want to rest instead?' : 'You earned a quiet moment.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                        onClick={onRest}
                        className="rounded-full px-6 py-2.5 text-sm font-semibold text-slate-900"
                        style={{
                            background: 'linear-gradient(135deg,#34d399,#10b981)',
                            boxShadow: '0 14px 40px -12px rgba(52,211,153,0.6)',
                        }}
                    >
                        Rest now
                    </button>
                    {waitItemsCount > 0 && (
                        <button
                            onClick={onBack}
                            className="rounded-full border border-white/10 bg-white/[0.03] px-6 py-2.5 text-sm font-medium text-[color:var(--color-fg-muted)] hover:border-white/25 hover:text-[color:var(--color-fg)]"
                        >
                            Pick from Can wait
                        </button>
                    )}
                </div>
            </motion.div>
        );
    }

    return (
        <>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-lg text-center text-base text-[color:var(--color-fg-muted)] sm:text-lg"
            >
                Now pick just <strong className="text-[color:var(--color-fg)]">one thing</strong> from
                &ldquo;Must happen now&rdquo;.
            </motion.p>
            <div className="flex w-full max-w-2xl flex-col gap-2">
                {nowItems.map((item, i) => (
                    <motion.button
                        key={item.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i, duration: 0.4 }}
                        whileHover={{ scale: 1.015, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onPick(item.id)}
                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left backdrop-blur-xl transition-all hover:border-rose-300/40"
                        style={{ boxShadow: '0 10px 30px -15px rgba(251,113,133,0.35)' }}
                    >
                        <span
                            aria-hidden
                            className="pointer-events-none absolute inset-y-2 left-0 w-[3px] rounded-full opacity-80"
                            style={{ background: 'linear-gradient(180deg,#fb7185,transparent)' }}
                        />
                        <span className="pl-3 text-[1rem] text-[color:var(--color-fg)]">{item.text}</span>
                    </motion.button>
                ))}
            </div>
            <button
                onClick={onBack}
                className="text-xs text-[color:var(--color-fg-subtle)] underline-offset-4 hover:text-[color:var(--color-fg-muted)] hover:underline"
            >
                re-sort
            </button>
        </>
    );
}

