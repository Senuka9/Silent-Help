'use client';

/**
 * Step 5 — Talk to Yourself Like a Friend (Self-Compassion).
 *
 * A soft heart pulses at ~60bpm behind the content. When the user taps a
 * compassion phrase, it appears in a "spoken card" with a typewriter
 * reveal, echoing back to them like a kind voice. Multiple phrases can
 * stack. They can also write their own.
 *
 * Very-low energy: instead of tapping phrases, we show a gentle silhouette
 * of a second figure fading in beside a dim outline — "imagine someone
 * kind sitting next to you." One button to continue.
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import type { CompassionData, EnergyTier } from '@/lib/recovery-sad';
import { COMPASSION_PHRASES } from '@/lib/recovery-sad';

export function StepSelfCompassion({
    energy,
    accent,
    initial,
    onComplete,
}: {
    energy: EnergyTier;
    accent: string;
    initial: CompassionData;
    onComplete: (d: CompassionData) => void;
}) {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-10">
            <Heartbeat accent={accent} />

            <header className="relative z-10 flex flex-col items-center gap-2">
                <div className="text-xs uppercase tracking-[0.26em] text-white/55">
                    Step 5 · Talk to yourself like a friend
                </div>
                <h2 className="text-balance text-center text-3xl font-light tracking-tight text-white sm:text-4xl">
                    What would you say to someone you love?
                </h2>
                <p className="mt-2 max-w-md text-center text-sm text-white/65">
                    Say it to yourself now, in the same voice. You deserve that voice too.
                </p>
            </header>

            {energy === 'very-low' ? (
                <Imagined accent={accent} onDone={() =>
                    onComplete({ phrasesHeard: [], ownPhrase: '', imagined: true })
                } />
            ) : (
                <PhrasePicker
                    accent={accent}
                    initial={initial}
                    onComplete={onComplete}
                />
            )}
        </div>
    );
}

function Heartbeat({ accent }: { accent: string }) {
    // ~60bpm = 1s per beat. Use a two-pulse variant so it feels alive.
    return (
        <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
                background: `radial-gradient(circle, ${accent}22 0%, transparent 60%)`,
            }}
            animate={{
                scale: [1, 1.08, 1.02, 1.1, 1],
                opacity: [0.35, 0.55, 0.45, 0.6, 0.35],
            }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        />
    );
}

function PhrasePicker({
    accent,
    initial,
    onComplete,
}: {
    accent: string;
    initial: CompassionData;
    onComplete: (d: CompassionData) => void;
}) {
    const [heard, setHeard] = useState<string[]>(initial.phrasesHeard);
    const [ownPhrase, setOwnPhrase] = useState(initial.ownPhrase);
    const [spoken, setSpoken] = useState<string | null>(null);

    const speak = (phrase: string) => {
        setSpoken(phrase);
        setHeard((prev) => (prev.includes(phrase) ? prev : [...prev, phrase]));
    };

    return (
        <div className="relative z-10 flex w-full max-w-xl flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-2">
                {COMPASSION_PHRASES.map((p) => {
                    const selected = heard.includes(p);
                    return (
                        <motion.button
                            key={p}
                            onClick={() => speak(p)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                                selected
                                    ? 'border-white/30 bg-white/10 text-white'
                                    : 'border-white/10 bg-white/[0.03] text-white/80 hover:border-white/25'
                            }`}
                            style={selected ? { boxShadow: `0 0 18px ${accent}55` } : undefined}
                        >
                            <Heart
                                className="h-3 w-3"
                                style={{
                                    color: selected ? accent : 'rgba(255,255,255,0.4)',
                                    fill: selected ? accent : 'transparent',
                                }}
                            />
                            {p}
                        </motion.button>
                    );
                })}
            </div>

            <input
                value={ownPhrase}
                onChange={(e) => setOwnPhrase(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && ownPhrase.trim()) speak(ownPhrase.trim());
                }}
                placeholder="or write your own & press Enter…"
                className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/[0.04] p-3 text-center text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />

            {/* Spoken card */}
            <div className="min-h-[104px] w-full">
                <AnimatePresence mode="wait">
                    {spoken && (
                        <motion.div
                            key={spoken}
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.5 }}
                            className="relative rounded-3xl border border-white/15 bg-white/[0.04] p-5 text-center"
                            style={{ boxShadow: `0 0 32px ${accent}33` }}
                        >
                            <div className="text-[10px] uppercase tracking-[0.3em] text-white/45">
                                to you
                            </div>
                            <Typewriter
                                text={spoken}
                                className="mt-2 text-lg font-light italic leading-relaxed text-white"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <button
                onClick={() =>
                    onComplete({
                        phrasesHeard: heard,
                        ownPhrase,
                        imagined: false,
                    })
                }
                disabled={heard.length === 0}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{ backgroundColor: accent, color: '#1a1023' }}
            >
                {heard.length > 0 ? 'I let it land' : 'Tap at least one to continue'}
                <ArrowRight className="h-4 w-4" />
            </button>
            <button
                onClick={() =>
                    onComplete({ phrasesHeard: heard, ownPhrase, imagined: false })
                }
                className="text-[11px] uppercase tracking-[0.22em] text-white/45 transition hover:text-white/75"
            >
                that&apos;s enough for now
            </button>
        </div>
    );
}

function Typewriter({ text, className }: { text: string; className?: string }) {
    const [shown, setShown] = useState('');
    useEffect(() => {
        setShown('');
        let i = 0;
        const id = window.setInterval(() => {
            i += 1;
            setShown(text.slice(0, i));
            if (i >= text.length) window.clearInterval(id);
        }, 38);
        return () => window.clearInterval(id);
    }, [text]);
    return (
        <div className={className}>
            &ldquo;{shown}
            <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block"
            >
                |
            </motion.span>
            &rdquo;
        </div>
    );
}

function Imagined({ accent, onDone }: { accent: string; onDone: () => void }) {
    const [revealed, setRevealed] = useState(false);
    useEffect(() => {
        const t = window.setTimeout(() => setRevealed(true), 800);
        return () => window.clearTimeout(t);
    }, []);

    return (
        <div className="relative z-10 flex flex-col items-center gap-6">
            <p className="max-w-md text-center text-sm text-white/70">
                You don&apos;t have to say anything. Just picture someone kind sitting beside
                you. That&apos;s enough.
            </p>

            <div className="relative h-56 w-72">
                <svg viewBox="0 0 200 140" className="h-full w-full">
                    {/* User silhouette (dim) */}
                    <circle cx="70" cy="45" r="14" fill="rgba(255,255,255,0.12)" />
                    <path
                        d="M50 70 Q 70 60 90 70 L 92 125 L 48 125 Z"
                        fill="rgba(255,255,255,0.08)"
                    />
                    {/* Kind figure (fades in, warmer) */}
                    <motion.circle
                        cx="130"
                        cy="45"
                        r="14"
                        animate={{
                            opacity: revealed ? 1 : 0,
                            fill: `${accent}88`,
                        }}
                        transition={{ duration: 1.6 }}
                        style={{ filter: `drop-shadow(0 0 10px ${accent})` }}
                    />
                    <motion.path
                        d="M110 70 Q 130 60 150 70 L 152 125 L 108 125 Z"
                        animate={{
                            opacity: revealed ? 1 : 0,
                            fill: `${accent}44`,
                        }}
                        transition={{ duration: 1.6 }}
                    />
                    {/* Heart between them */}
                    <motion.g
                        animate={{
                            opacity: revealed ? 1 : 0,
                            scale: revealed ? [1, 1.15, 1] : 1,
                        }}
                        transition={{
                            opacity: { duration: 1 },
                            scale: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
                        }}
                        style={{ transformOrigin: '100px 90px' }}
                    >
                        <path
                            d="M100 85 C 96 80, 90 80, 90 86 C 90 92, 100 98, 100 98 C 100 98, 110 92, 110 86 C 110 80, 104 80, 100 85 Z"
                            fill={accent}
                            style={{ filter: `drop-shadow(0 0 12px ${accent})` }}
                        />
                    </motion.g>
                </svg>
            </div>

            <button
                onClick={onDone}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                style={{ backgroundColor: accent, color: '#1a1023' }}
            >
                They&apos;re with me <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    );
}
