'use client';

/**
 * Step 4 — Shrink the Load (Prioritisation + Micro-Break).
 *
 * 4A: User lists what they're carrying, then drags each item into one of
 *     three zones: Must now / Can wait / Outside my control. A big "load"
 *     block fractures into smaller pieces on mount. If pressure type is
 *     time and >1 item lands in "Must now", we prompt them to pick ONE.
 *
 * 4B: (time / self-imposed only) — offer a 60s micro-break with one of
 *     three reset rituals, each with a countdown ring.
 */

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Plus, X } from 'lucide-react';
import type {
    PressureType,
    TriageData,
    TriageItem,
} from '@/lib/recovery-pressure';
import { MICRO_BREAK_OPTIONS } from '@/lib/recovery-pressure';

type SubPhase = 'sort' | 'focus' | 'break-offer' | 'break-run' | 'done';

type Zone = TriageItem['zone'];
const ZONES: { id: Zone; label: string; hint: string; tone: string }[] = [
    {
        id: 'now',
        label: 'Must happen now',
        hint: 'urgent + important',
        tone: 'rgba(251,113,133,0.5)',
    },
    {
        id: 'later',
        label: 'Can wait',
        hint: 'important but not urgent',
        tone: 'rgba(250,204,21,0.5)',
    },
    {
        id: 'outside',
        label: 'Outside my control',
        hint: "others' expectations included",
        tone: 'rgba(148,163,184,0.5)',
    },
];

export function StepTriage({
    type,
    accent,
    initial,
    onComplete,
}: {
    type: PressureType;
    accent: string;
    initial: TriageData;
    onComplete: (d: TriageData) => void;
}) {
    const showMicroBreak = type === 'time' || type === 'self';
    const [items, setItems] = useState<TriageItem[]>(initial.items);
    const [pickedOne, setPickedOne] = useState<string | null>(initial.pickedOne);
    const [microBreak, setMicroBreak] = useState<TriageData['microBreak']>(
        initial.microBreak,
    );
    const [microBreakCompleted, setBreakCompleted] = useState(
        initial.microBreakCompleted,
    );
    const [phase, setPhase] = useState<SubPhase>('sort');
    const [newItem, setNewItem] = useState('');

    const nowCount = useMemo(
        () => items.filter((i) => i.zone === 'now').length,
        [items],
    );

    const addItem = () => {
        if (!newItem.trim()) return;
        setItems((prev) => [
            ...prev,
            {
                id: `i-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                text: newItem.trim(),
                zone: 'now',
            },
        ]);
        setNewItem('');
    };

    const removeItem = (id: string) =>
        setItems((prev) => prev.filter((i) => i.id !== id));

    const moveItem = (id: string, zone: Zone) =>
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, zone } : i)));

    const advanceFromSort = () => {
        if (type === 'time' && nowCount > 1) setPhase('focus');
        else if (showMicroBreak) setPhase('break-offer');
        else finish();
    };

    const finish = () =>
        onComplete({
            items,
            pickedOne,
            microBreak,
            microBreakCompleted,
        });

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
            <header className="flex flex-col items-center gap-3">
                <div className="text-xs uppercase tracking-[0.26em] text-white/55">
                    Step 4 · Shrink the load
                </div>
                <h2 className="text-balance text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    What actually needs you right now?
                </h2>
                <p className="mt-1 max-w-md text-center text-sm text-white/65">
                    And what&apos;s just pressure talking?
                </p>
            </header>

            <AnimatePresence mode="wait">
                {phase === 'sort' && (
                    <motion.div
                        key="sort"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -14 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10 mt-8 w-full max-w-4xl"
                    >
                        <LoadBlock accent={accent} />

                        <div className="mt-6 flex flex-col items-center gap-2">
                            <div className="flex w-full max-w-md items-center gap-2">
                                <input
                                    value={newItem}
                                    onChange={(e) => setNewItem(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') addItem();
                                    }}
                                    placeholder="Type one thing you're carrying…"
                                    className="flex-1 rounded-2xl border border-white/15 bg-white/[0.04] p-3 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
                                />
                                <button
                                    onClick={addItem}
                                    className="rounded-full p-2 transition"
                                    style={{
                                        backgroundColor: accent,
                                        color: '#0b0c12',
                                    }}
                                    aria-label="Add"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                                then drag each item to where it actually belongs
                            </div>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                            {ZONES.map((z) => (
                                <DropZone
                                    key={z.id}
                                    zone={z}
                                    items={items.filter((i) => i.zone === z.id)}
                                    onDrop={(id) => moveItem(id, z.id)}
                                    onRemove={removeItem}
                                />
                            ))}
                        </div>

                        <div className="mt-8 flex justify-center">
                            <button
                                onClick={advanceFromSort}
                                disabled={items.length === 0}
                                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                                style={{ backgroundColor: accent, color: '#0b0c12' }}
                            >
                                {items.length === 0 ? 'Add at least one' : 'Continue'}{' '}
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {phase === 'focus' && (
                    <motion.div
                        key="focus"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -14 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10 mt-10 w-full max-w-xl"
                    >
                        <div
                            className="rounded-3xl border p-5"
                            style={{
                                borderColor: `${accent}55`,
                                boxShadow: `0 0 28px ${accent}33`,
                            }}
                        >
                            <div
                                className="text-[10px] uppercase tracking-[0.24em]"
                                style={{ color: accent }}
                            >
                                Time pressure — focus rule
                            </div>
                            <p className="mt-2 text-sm text-white/80">
                                You have {nowCount} things in &ldquo;must happen now&rdquo;.
                                Pick ONE for the next 5 minutes. The others are real, but they
                                can wait.
                            </p>
                            <div className="mt-4 space-y-2">
                                {items
                                    .filter((i) => i.zone === 'now')
                                    .map((i) => {
                                        const selected = pickedOne === i.id;
                                        return (
                                            <button
                                                key={i.id}
                                                onClick={() => setPickedOne(i.id)}
                                                className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left text-sm transition ${
                                                    selected
                                                        ? 'border-white/30 bg-white/10 text-white'
                                                        : 'border-white/10 bg-white/[0.03] text-white/80 hover:border-white/25'
                                                }`}
                                                style={
                                                    selected
                                                        ? { boxShadow: `0 0 18px ${accent}55` }
                                                        : undefined
                                                }
                                            >
                                                <span>{i.text}</span>
                                                {selected && (
                                                    <CheckCircle2
                                                        className="h-4 w-4"
                                                        style={{ color: accent }}
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={() =>
                                    showMicroBreak
                                        ? setPhase('break-offer')
                                        : finish()
                                }
                                disabled={!pickedOne}
                                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                                style={{ backgroundColor: accent, color: '#0b0c12' }}
                            >
                                This one <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {phase === 'break-offer' && (
                    <motion.div
                        key="break-offer"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -14 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10 mt-10 w-full max-w-xl"
                    >
                        <p className="text-center text-sm text-white/70">
                            Stepping away for 60 seconds isn&apos;t weakness. It&apos;s
                            strategy. Pick a reset.
                        </p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            {MICRO_BREAK_OPTIONS.map((o) => {
                                const selected = microBreak === o.key;
                                return (
                                    <motion.button
                                        key={o.key}
                                        onClick={() => setMicroBreak(o.key)}
                                        whileHover={{ y: -3 }}
                                        whileTap={{ scale: 0.97 }}
                                        className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition ${
                                            selected
                                                ? 'border-white/30 bg-white/10'
                                                : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                                        }`}
                                        style={
                                            selected
                                                ? { boxShadow: `0 0 22px ${accent}44` }
                                                : undefined
                                        }
                                    >
                                        <div className="text-2xl">{o.emoji}</div>
                                        <div className="text-sm font-medium text-white">
                                            {o.label}
                                        </div>
                                        <div className="text-[11px] text-white/60">
                                            {o.line}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                        <div className="mt-6 flex items-center justify-center gap-2">
                            <button
                                onClick={finish}
                                className="text-[11px] uppercase tracking-[0.22em] text-white/50 transition hover:text-white/80"
                            >
                                Skip break
                            </button>
                            <button
                                onClick={() => setPhase('break-run')}
                                disabled={!microBreak}
                                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                                style={{ backgroundColor: accent, color: '#0b0c12' }}
                            >
                                Start · 60s <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {phase === 'break-run' && microBreak && (
                    <motion.div
                        key="break-run"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -14 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10 mt-10 w-full max-w-xl"
                    >
                        <BreakTimer
                            accent={accent}
                            label={
                                MICRO_BREAK_OPTIONS.find((o) => o.key === microBreak)?.label ??
                                ''
                            }
                            line={
                                MICRO_BREAK_OPTIONS.find((o) => o.key === microBreak)?.line ??
                                ''
                            }
                            onDone={() => {
                                setBreakCompleted(true);
                                finish();
                            }}
                            onSkip={finish}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ────────── Fracturing load block ────────── */

function LoadBlock({ accent }: { accent: string }) {
    return (
        <div className="relative mx-auto h-24 w-full max-w-md">
            {Array.from({ length: 9 }).map((_, i) => {
                const col = i % 3;
                const row = Math.floor(i / 3);
                return (
                    <motion.div
                        key={i}
                        initial={{
                            x: `calc(50% - 96px + ${col * 0}px)`,
                            y: 0,
                            rotate: 0,
                            opacity: 0.8,
                        }}
                        animate={{
                            x: `calc(50% - 96px + ${col * 64}px)`,
                            y: row * 28,
                            rotate: ((i * 11) % 14) - 7,
                            opacity: 0.9,
                        }}
                        transition={{
                            delay: i * 0.05,
                            type: 'spring',
                            stiffness: 160,
                            damping: 18,
                        }}
                        className="absolute left-0 top-0 h-6 w-16 rounded-md border"
                        style={{
                            background: `linear-gradient(180deg, ${accent}33, ${accent}11)`,
                            borderColor: `${accent}55`,
                            boxShadow: `0 0 12px ${accent}22`,
                        }}
                    />
                );
            })}
        </div>
    );
}

/* ────────── Drop zone ────────── */

function DropZone({
    zone,
    items,
    onDrop,
    onRemove,
}: {
    zone: (typeof ZONES)[number];
    items: TriageItem[];
    onDrop: (id: string) => void;
    onRemove: (id: string) => void;
}) {
    const [isOver, setOver] = useState(false);
    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                const id = e.dataTransfer.getData('text/plain');
                if (id) onDrop(id);
            }}
            className="rounded-3xl border bg-white/[0.02] p-4 transition"
            style={{
                borderColor: isOver ? zone.tone : 'rgba(255,255,255,0.1)',
                boxShadow: isOver ? `0 0 20px ${zone.tone}` : undefined,
            }}
        >
            <div
                className="text-[10px] uppercase tracking-[0.24em]"
                style={{ color: zone.tone }}
            >
                {zone.label}
            </div>
            <div className="mt-0.5 text-[11px] italic text-white/45">{zone.hint}</div>
            <div className="mt-3 min-h-[80px] space-y-2">
                {items.length === 0 && (
                    <div className="rounded-lg border border-dashed border-white/10 p-3 text-center text-[11px] italic text-white/35">
                        drop items here
                    </div>
                )}
                {items.map((i) => (
                    <div
                        key={i.id}
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', i.id);
                            e.dataTransfer.effectAllowed = 'move';
                        }}
                        className="group flex cursor-grab items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] p-2 text-xs text-white/85 active:cursor-grabbing"
                    >
                        <span className="truncate">{i.text}</span>
                        <button
                            onClick={() => onRemove(i.id)}
                            className="ml-2 text-white/30 transition hover:text-white/80"
                            aria-label="Remove"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ────────── 60s break timer ────────── */

function BreakTimer({
    accent,
    label,
    line,
    onDone,
    onSkip,
}: {
    accent: string;
    label: string;
    line: string;
    onDone: () => void;
    onSkip: () => void;
}) {
    const TOTAL = 60;
    const [seconds, setSeconds] = useState(TOTAL);

    useEffect(() => {
        if (seconds <= 0) {
            const t = window.setTimeout(onDone, 600);
            return () => window.clearTimeout(t);
        }
        const t = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
        return () => window.clearTimeout(t);
    }, [seconds, onDone]);

    const pct = (TOTAL - seconds) / TOTAL;

    return (
        <div className="flex flex-col items-center gap-5">
            <div className="relative flex h-56 w-56 items-center justify-center">
                <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
                    <circle
                        cx="60"
                        cy="60"
                        r="52"
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="4"
                    />
                    <motion.circle
                        cx="60"
                        cy="60"
                        r="52"
                        fill="none"
                        stroke={accent}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 52}`}
                        animate={{ strokeDashoffset: `${(1 - pct) * 2 * Math.PI * 52}` }}
                        transition={{ duration: 1 }}
                        style={{ filter: `drop-shadow(0 0 8px ${accent})` }}
                    />
                </svg>
                <div className="text-center">
                    <div className="text-5xl font-light tabular-nums text-white">
                        {seconds}
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-white/55">
                        seconds
                    </div>
                </div>
            </div>
            <div className="text-center">
                <div className="text-lg font-medium text-white">{label}</div>
                <div className="text-xs text-white/60">{line}</div>
            </div>
            <button
                onClick={onSkip}
                className="text-[11px] uppercase tracking-[0.22em] text-white/45 transition hover:text-white/75"
            >
                end break early
            </button>
        </div>
    );
}
