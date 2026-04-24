'use client';

/**
 * Step 3 — Schedule the Worry (Regain Control).
 *
 * Two micro-phases:
 *   a. Write the worry as a short "note".
 *   b. Pick a worry window (time slot) — tap a suggested time.
 *
 * High / medium-high tiers also get a drag-to-jar visual metaphor:
 * the user physically drags their worry-note into a jar and the lid
 * closes with a satisfying animation. The note + time are persisted so
 * the orchestrator can surface a reminder later.
 */

import { useState } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { ArrowRight, Clock, Calendar } from 'lucide-react';
import type { StressTier } from '@/lib/emotion-theme';
import { suggestWorrySlots, type WorryWindow } from '@/lib/recovery-anxious';

type Phase = 'write' | 'time' | 'jar';

export function StepWorryWindow({
    stressTier,
    accent,
    initial,
    onComplete,
}: {
    stressTier: StressTier;
    accent: string;
    initial: WorryWindow | null;
    onComplete: (w: WorryWindow) => void;
}) {
    const includeJar = stressTier === 'high' || stressTier === 'medium-high';
    const [phase, setPhase] = useState<Phase>('write');
    const [text, setText] = useState(initial?.worryText ?? '');
    const [slot, setSlot] = useState<{ label: string; at: number } | null>(
        initial ? { label: initial.label, at: initial.scheduledAt } : null,
    );

    const finish = (w: WorryWindow) => onComplete(w);

    const totalPhases = includeJar ? 3 : 2;
    const phaseIndex = phase === 'write' ? 0 : phase === 'time' ? 1 : 2;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
            <header className="flex flex-col items-center gap-3">
                <div className="text-xs uppercase tracking-[0.26em] text-white/50">
                    Step 3 · Schedule the worry
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Give it an appointment
                </h2>
                <div className="mt-2 flex items-center gap-2">
                    {Array.from({ length: totalPhases }).map((_, i) => (
                        <motion.div
                            key={i}
                            layout
                            className="h-1.5 rounded-full"
                            animate={{
                                width: i === phaseIndex ? 40 : 14,
                                backgroundColor:
                                    i <= phaseIndex ? accent : 'rgba(255,255,255,0.18)',
                            }}
                            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                        />
                    ))}
                </div>
            </header>

            <AnimatePresence mode="wait">
                {phase === 'write' && (
                    <motion.div
                        key="write"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -14 }}
                        transition={{ duration: 0.45 }}
                        className="mt-10 w-full max-w-xl"
                    >
                        <WorryWrite
                            value={text}
                            onChange={setText}
                            accent={accent}
                            onSubmit={() => setPhase('time')}
                        />
                    </motion.div>
                )}

                {phase === 'time' && (
                    <motion.div
                        key="time"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -14 }}
                        transition={{ duration: 0.45 }}
                        className="mt-10 w-full max-w-xl"
                    >
                        <WorrySlotPicker
                            accent={accent}
                            selected={slot}
                            onPick={(s) => {
                                setSlot(s);
                                if (includeJar) {
                                    setPhase('jar');
                                } else {
                                    finish({
                                        worryText: text,
                                        scheduledAt: s.at,
                                        label: s.label,
                                    });
                                }
                            }}
                        />
                    </motion.div>
                )}

                {phase === 'jar' && slot && (
                    <motion.div
                        key="jar"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -14 }}
                        transition={{ duration: 0.45 }}
                        className="mt-10 w-full max-w-xl"
                    >
                        <WorryJar
                            worryText={text}
                            slotLabel={slot.label}
                            accent={accent}
                            onDone={() =>
                                finish({
                                    worryText: text,
                                    scheduledAt: slot.at,
                                    label: slot.label,
                                })
                            }
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ────────── a) Write the worry ────────── */

function WorryWrite({
    value,
    onChange,
    accent,
    onSubmit,
}: {
    value: string;
    onChange: (v: string) => void;
    accent: string;
    onSubmit: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-center text-white/70">
                Write your worry as one short line. You&apos;re not solving it — you&apos;re putting
                it on a shelf.
            </p>

            <motion.div
                initial={{ rotate: -2, scale: 0.96, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full"
            >
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={3}
                    autoFocus
                    placeholder="I'm worried about…"
                    className="w-full rounded-2xl border border-amber-200/20 p-4 text-base text-amber-50 placeholder:text-amber-100/30 focus:outline-none"
                    style={{
                        background:
                            'linear-gradient(180deg, rgba(254, 243, 199, 0.08) 0%, rgba(253, 230, 138, 0.04) 100%)',
                        backgroundImage:
                            'repeating-linear-gradient(0deg, transparent 0px, transparent 28px, rgba(251, 191, 36, 0.08) 29px)',
                    }}
                />
            </motion.div>

            <button
                onClick={onSubmit}
                disabled={!value.trim()}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{ backgroundColor: accent, color: '#0b0c12' }}
            >
                Pick a time <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    );
}

/* ────────── b) Slot picker ────────── */

function WorrySlotPicker({
    accent,
    selected,
    onPick,
}: {
    accent: string;
    selected: { label: string; at: number } | null;
    onPick: (s: { label: string; at: number }) => void;
}) {
    const slots = suggestWorrySlots();

    return (
        <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-center text-white/70">
                Choose a 15-minute window later to sit with this worry. Until then, when it shows
                up, you get to say: <span className="italic text-white/90">&ldquo;Not now.&rdquo;</span>
            </p>

            <div className="grid w-full gap-3 sm:grid-cols-2">
                {slots.map((s, i) => {
                    const isSelected = selected?.at === s.at;
                    return (
                        <motion.button
                            key={s.at}
                            onClick={() => onPick(s)}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * i, duration: 0.35 }}
                            whileHover={{ y: -2, scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                                isSelected
                                    ? 'border-white/30 bg-white/10'
                                    : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-full"
                                    style={{
                                        backgroundColor: `${accent}22`,
                                        color: accent,
                                    }}
                                >
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">{s.label}</div>
                                    <div className="text-xs text-white/50">15-minute worry window</div>
                                </div>
                            </div>
                            <Calendar className="h-4 w-4 text-white/40" />
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

/* ────────── c) Drag-to-jar (high / medium-high) ────────── */

function WorryJar({
    worryText,
    slotLabel,
    accent,
    onDone,
}: {
    worryText: string;
    slotLabel: string;
    accent: string;
    onDone: () => void;
}) {
    const [inJar, setInJar] = useState(false);
    const dragControls = useDragControls();

    return (
        <div className="flex flex-col items-center gap-6">
            <p className="max-w-md text-center text-white/70">
                Drag your worry into the jar. The lid will seal it away until {slotLabel}.
            </p>

            <div className="relative h-[420px] w-full max-w-sm">
                {/* Jar */}
                <div className="absolute inset-x-1/2 bottom-0 w-56 -translate-x-1/2">
                    {/* Lid */}
                    <motion.div
                        className="mx-auto h-6 w-52 rounded-t-xl border-2 border-white/25"
                        style={{
                            background: `linear-gradient(180deg, ${accent}55 0%, ${accent}22 100%)`,
                            transformOrigin: 'bottom center',
                        }}
                        animate={{
                            y: inJar ? 0 : -4,
                            rotate: inJar ? 0 : -8,
                        }}
                        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                    />
                    {/* Body */}
                    <div
                        className="relative mt-1 h-64 w-56 overflow-hidden rounded-b-3xl rounded-t-xl border-2 border-white/20"
                        style={{
                            background:
                                'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                        }}
                    >
                        {/* Liquid */}
                        <motion.div
                            className="absolute inset-x-0 bottom-0"
                            animate={{ height: inJar ? '65%' : '35%' }}
                            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                            style={{
                                background: `linear-gradient(180deg, ${accent}66 0%, ${accent}33 100%)`,
                            }}
                        />
                        {/* Bubbles */}
                        {inJar && (
                            <>
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute h-2 w-2 rounded-full bg-white/50"
                                        initial={{ y: 200, x: 40 + i * 40, opacity: 0.6 }}
                                        animate={{ y: 60, opacity: 0 }}
                                        transition={{ duration: 1.8, delay: i * 0.3 }}
                                    />
                                ))}
                            </>
                        )}
                        {/* Label */}
                        <div className="absolute inset-x-0 top-10 text-center text-[10px] uppercase tracking-[0.3em] text-white/40">
                            Worry jar
                        </div>
                        {/* Stored text */}
                        {inJar && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 0.85, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="absolute inset-x-4 bottom-16 text-center text-[11px] italic text-white/70"
                            >
                                &ldquo;{worryText.slice(0, 60)}{worryText.length > 60 ? '…' : ''}&rdquo;
                                <div className="mt-1 text-[10px] not-italic text-white/50">
                                    sealed until {slotLabel}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Draggable worry note */}
                {!inJar && (
                    <motion.div
                        drag
                        dragControls={dragControls}
                        dragMomentum={false}
                        onDragEnd={(_, info) => {
                            // If released near the jar (bottom half), "drop in"
                            if (info.point.y > window.innerHeight / 2) {
                                setInJar(true);
                            }
                        }}
                        whileDrag={{ scale: 1.06, rotate: 0 }}
                        initial={{ opacity: 0, y: -20, rotate: -3 }}
                        animate={{ opacity: 1, y: 0, rotate: -3 }}
                        className="absolute left-1/2 top-0 z-10 w-56 -translate-x-1/2 cursor-grab rounded-xl p-3 shadow-2xl active:cursor-grabbing"
                        style={{
                            background:
                                'linear-gradient(180deg, rgba(254, 243, 199, 0.95) 0%, rgba(253, 230, 138, 0.92) 100%)',
                            color: '#422006',
                        }}
                    >
                        <div className="text-[10px] uppercase tracking-[0.22em] text-amber-900/60">
                            Drag me into the jar
                        </div>
                        <div className="mt-1 text-sm italic">
                            &ldquo;{worryText.slice(0, 90)}{worryText.length > 90 ? '…' : ''}&rdquo;
                        </div>
                    </motion.div>
                )}
            </div>

            <AnimatePresence>
                {inJar && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        onClick={onDone}
                        className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                        style={{ backgroundColor: accent, color: '#0b0c12' }}
                    >
                        Sealed — take one brave step <ArrowRight className="h-4 w-4" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
