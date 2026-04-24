'use client';

/**
 * Step 4 — Build a Better Path (action plan).
 *
 * Phases:
 *   trigger  — pick/name the trigger (the thing that sets you off).
 *              Visualized as a radial "chooser wheel" with the trigger in
 *              the center and surrounding slots the user can tap to seed
 *              the If clause.
 *   ifthen   — fillable If-Then implementation intention. On submit the two
 *              halves slide together and "lock" with a click animation.
 *   window   — (high / medium-high) optional "Give this frustration an
 *              appointment" — worry-window scheduler for rumination.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Clock, CheckCircle2, Target } from 'lucide-react';
import type { StressTier } from '@/lib/emotion-theme';
import type { PlanData } from '@/lib/recovery-frustrated';
import {
    TRIGGER_STARTERS,
    THEN_STARTERS,
    suggestFrustrationSlots,
} from '@/lib/recovery-frustrated';

type Phase = 'trigger' | 'ifthen' | 'window';

export function StepPlan({
    stressTier,
    accent,
    initial,
    onComplete,
}: {
    stressTier: StressTier;
    accent: string;
    initial: PlanData;
    onComplete: (d: PlanData) => void;
}) {
    const isHigh = stressTier === 'high' || stressTier === 'medium-high';
    const [data, setData] = useState<PlanData>(initial);
    const [phase, setPhase] = useState<Phase>('trigger');
    const update = (patch: Partial<PlanData>) => setData((d) => ({ ...d, ...patch }));

    const phaseOrder: Phase[] = isHigh
        ? ['trigger', 'ifthen', 'window']
        : ['trigger', 'ifthen'];
    const idx = phaseOrder.indexOf(phase);
    const next = () => {
        if (idx >= phaseOrder.length - 1) onComplete(data);
        else setPhase(phaseOrder[idx + 1]);
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
            <header className="flex flex-col items-center gap-3">
                <div className="text-xs uppercase tracking-[0.26em] text-white/55">
                    Step 4 · Build a better path
                </div>
                <h2 className="text-balance text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Turn this frustration into a plan
                </h2>
                <div className="mt-2 flex items-center gap-2">
                    {phaseOrder.map((_, i) => (
                        <motion.div
                            key={i}
                            layout
                            className="h-1.5 rounded-full"
                            animate={{
                                width: i === idx ? 40 : 14,
                                backgroundColor:
                                    i <= idx ? accent : 'rgba(255,255,255,0.18)',
                            }}
                            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                        />
                    ))}
                </div>
            </header>

            <AnimatePresence mode="wait">
                {phase === 'trigger' && (
                    <Pane key="trigger">
                        <TriggerWheel
                            accent={accent}
                            value={data.trigger}
                            onChange={(t, clauseSeed) => {
                                update({
                                    trigger: t,
                                    ifClause: data.ifClause || clauseSeed || '',
                                });
                            }}
                            onNext={next}
                        />
                    </Pane>
                )}
                {phase === 'ifthen' && (
                    <Pane key="ifthen">
                        <IfThen
                            accent={accent}
                            data={data}
                            update={update}
                            onNext={next}
                        />
                    </Pane>
                )}
                {phase === 'window' && (
                    <Pane key="window">
                        <WorryWindowPicker
                            accent={accent}
                            selected={data.worryWindow}
                            onPick={(w) => update({ worryWindow: w })}
                            onDone={() => onComplete(data)}
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

/* ────────── Trigger wheel ────────── */

function TriggerWheel({
    accent,
    value,
    onChange,
    onNext,
}: {
    accent: string;
    value: string;
    onChange: (trigger: string, ifSeed: string) => void;
    onNext: () => void;
}) {
    const slots = TRIGGER_STARTERS;

    return (
        <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-center text-white/70">
                What pattern keeps lighting you up? Tap one from the wheel — or type your own.
                We&apos;ll turn it into a plan, not a fight.
            </p>

            <div className="relative h-80 w-80">
                {/* Outer rim */}
                <motion.div
                    aria-hidden
                    className="absolute inset-0 rounded-full border border-white/10"
                    style={{
                        background: `conic-gradient(from 0deg, ${accent}33, ${accent}11, ${accent}33)`,
                    }}
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, ease: 'linear', repeat: Infinity }}
                />
                <div className="absolute inset-4 rounded-full border border-white/10 bg-[#0b0c12]/70 backdrop-blur" />

                {/* Slots */}
                {slots.map((s, i) => {
                    const angle = (i / slots.length) * Math.PI * 2 - Math.PI / 2;
                    const r = 128;
                    const x = 160 + Math.cos(angle) * r - 44;
                    const y = 160 + Math.sin(angle) * r - 14;
                    const selected = value === s;
                    return (
                        <motion.button
                            key={s}
                            onClick={() =>
                                onChange(s, `I notice myself getting frustrated when ${s.toLowerCase()}`)
                            }
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
                                boxShadow: selected ? `0 0 18px ${accent}66` : undefined,
                            }}
                        >
                            {s}
                        </motion.button>
                    );
                })}

                {/* Center target */}
                <div
                    className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border"
                    style={{
                        borderColor: `${accent}55`,
                        background: `radial-gradient(circle, ${accent}22 0%, transparent 80%)`,
                        boxShadow: `0 0 30px ${accent}33`,
                    }}
                >
                    <Target className="h-5 w-5" style={{ color: accent }} />
                    <div className="mt-1 max-w-[84px] text-center text-[11px] italic text-white/85 leading-tight">
                        {value || 'your trigger'}
                    </div>
                </div>
            </div>

            <input
                value={value}
                onChange={(e) =>
                    onChange(e.target.value, `I notice myself getting frustrated when ${e.target.value.toLowerCase()}`)
                }
                placeholder="or type your own…"
                className="w-full rounded-2xl border border-white/15 bg-white/[0.04] p-3 text-center text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />

            <button
                onClick={onNext}
                disabled={!value.trim()}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{ backgroundColor: accent, color: '#0b0c12' }}
            >
                Make the If-Then <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    );
}

/* ────────── If-Then ────────── */

function IfThen({
    accent,
    data,
    update,
    onNext,
}: {
    accent: string;
    data: PlanData;
    update: (patch: Partial<PlanData>) => void;
    onNext: () => void;
}) {
    const [locked, setLocked] = useState(false);

    const submit = () => {
        if (!data.ifClause.trim() || !data.thenClause.trim()) return;
        setLocked(true);
        window.setTimeout(onNext, 1200);
    };

    return (
        <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-center text-white/70">
                Turn the trigger into a pre-decided response. When you see this pattern again,
                the plan fires automatically — no willpower needed.
            </p>

            <div className="relative w-full">
                <motion.div
                    animate={locked ? { x: 18 } : { x: 0 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                    className="rounded-2xl border border-white/15 bg-white/[0.04] p-4"
                    style={locked ? { boxShadow: `0 0 24px ${accent}33` } : undefined}
                >
                    <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">IF</div>
                    <input
                        value={data.ifClause}
                        onChange={(e) => update({ ifClause: e.target.value })}
                        disabled={locked}
                        placeholder="I notice myself getting frustrated…"
                        className="mt-1 w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                    />
                </motion.div>

                <div className="my-2 flex justify-center">
                    <motion.div
                        animate={locked ? { scale: [1, 1.4, 1], rotate: [0, 90, 0] } : {}}
                        transition={{ duration: 0.6 }}
                        className="flex h-8 w-8 items-center justify-center rounded-full"
                        style={{
                            background: locked ? accent : 'rgba(255,255,255,0.08)',
                            color: locked ? '#0b0c12' : 'rgba(255,255,255,0.7)',
                            boxShadow: locked ? `0 0 20px ${accent}88` : undefined,
                        }}
                    >
                        {locked ? <CheckCircle2 className="h-4 w-4" /> : '→'}
                    </motion.div>
                </div>

                <motion.div
                    animate={locked ? { x: -18 } : { x: 0 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                    className="rounded-2xl border border-white/15 bg-white/[0.04] p-4"
                    style={locked ? { boxShadow: `0 0 24px ${accent}33` } : undefined}
                >
                    <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">THEN I WILL</div>
                    <input
                        value={data.thenClause}
                        onChange={(e) => update({ thenClause: e.target.value })}
                        disabled={locked}
                        placeholder="take three slow exhales…"
                        className="mt-1 w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                    />
                </motion.div>
            </div>

            {!data.thenClause.trim() && (
                <div className="flex flex-wrap justify-center gap-2">
                    {THEN_STARTERS.map((s) => (
                        <button
                            key={s}
                            onClick={() => update({ thenClause: s })}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 transition hover:border-white/25"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            <button
                onClick={submit}
                disabled={!data.ifClause.trim() || !data.thenClause.trim() || locked}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{ backgroundColor: accent, color: '#0b0c12' }}
            >
                {locked ? 'Plan locked in' : 'Lock in the plan'}
                {!locked && <ArrowRight className="h-4 w-4" />}
            </button>
        </div>
    );
}

/* ────────── Worry window (high / medium-high) ────────── */

function WorryWindowPicker({
    accent,
    selected,
    onPick,
    onDone,
}: {
    accent: string;
    selected: { scheduledAt: number; label: string } | null;
    onPick: (w: { scheduledAt: number; label: string }) => void;
    onDone: () => void;
}) {
    const slots = suggestFrustrationSlots();

    return (
        <div className="flex flex-col items-center gap-5">
            <p className="max-w-md text-center text-white/70">
                Give this frustration an appointment. When it shows up again before then, you
                get to say: <span className="italic text-white">&ldquo;not now — we have a time
                for this.&rdquo;</span>
            </p>
            <div className="grid w-full gap-3 sm:grid-cols-3">
                {slots.map((s, i) => {
                    const isSelected = selected?.scheduledAt === s.at;
                    return (
                        <motion.button
                            key={s.at}
                            onClick={() => onPick({ scheduledAt: s.at, label: s.label })}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * i, duration: 0.35 }}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            className={`flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition ${
                                isSelected
                                    ? 'border-white/30 bg-white/10'
                                    : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                            }`}
                            style={
                                isSelected
                                    ? { boxShadow: `0 0 22px ${accent}44` }
                                    : undefined
                            }
                        >
                            <div
                                className="flex h-8 w-8 items-center justify-center rounded-full"
                                style={{ backgroundColor: `${accent}22`, color: accent }}
                            >
                                <Clock className="h-4 w-4" />
                            </div>
                            <div className="text-sm font-medium text-white">{s.label}</div>
                            <div className="text-[11px] text-white/50">15-min window</div>
                        </motion.button>
                    );
                })}
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onDone}
                    className="text-xs uppercase tracking-[0.22em] text-white/50 transition hover:text-white/80"
                >
                    Skip
                </button>
                <button
                    onClick={onDone}
                    disabled={!selected}
                    className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                    style={{ backgroundColor: accent, color: '#0b0c12' }}
                >
                    Finish
                </button>
            </div>
        </div>
    );
}
