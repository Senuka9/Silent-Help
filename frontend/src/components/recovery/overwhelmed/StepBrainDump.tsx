'use client';

/**
 * Step 2 — Brain Dump.
 * High-stress users get tap-to-insert starter prompts.
 * On "That's all for now": shrink-weight text shown briefly before
 * advancing to next step.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenLine } from 'lucide-react';
import type { StressBucket } from '@/lib/recovery-overwhelmed';

const STARTERS = ['I have to…', "I'm worried about…", 'Someone needs…', 'I keep thinking…', "I haven't done…"];

export default function StepBrainDump({
    initialText,
    bucket,
    onSubmit,
}: {
    initialText: string;
    bucket: StressBucket;
    onSubmit: (text: string) => void;
}) {
    const [text, setText] = useState(initialText);
    const [shaking, setShaking] = useState(false);
    const [shrinking, setShrinking] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        // Attention-grab gentle shake on mount
        setShaking(true);
        const t = window.setTimeout(() => setShaking(false), 700);
        return () => window.clearTimeout(t);
    }, []);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const insert = (starter: string) => {
        const lineBreak = text && !text.endsWith('\n') ? '\n' : '';
        const next = `${text}${lineBreak}${starter} `;
        setText(next);
        textareaRef.current?.focus();
    };

    const handleDone = () => {
        if (!text.trim()) return;
        if (bucket === 'high') {
            // Play the shrink animation, then advance
            setShrinking(true);
            window.setTimeout(() => onSubmit(text.trim()), 2200);
        } else {
            onSubmit(text.trim());
        }
    };

    const prompt =
        bucket === 'high'
            ? "Write what's in your head. No order. Just dump."
            : "Write everything that's in your head. No order. No grammar. Just dump.";

    return (
        <div className="relative flex w-full flex-col items-center gap-6 py-4">
            <AnimatePresence>
                {!shrinking && (
                    <motion.div
                        key="prompt"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.4 }}
                        className="max-w-lg text-center"
                    >
                        <p className="text-base text-[color:var(--color-fg-muted)] sm:text-lg">{prompt}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                className="relative w-full max-w-2xl"
                animate={
                    shaking
                        ? { x: [0, -6, 6, -4, 4, -2, 2, 0] }
                        : shrinking
                            ? { scale: 0.92, opacity: 0.6, filter: 'blur(2px)' }
                            : { x: 0, scale: 1, opacity: 1, filter: 'blur(0px)' }
                }
                transition={{ duration: shrinking ? 1.8 : 0.7, ease: shrinking ? [0.22, 1, 0.36, 1] : 'easeInOut' }}
            >
                <div
                    className="relative overflow-hidden rounded-[var(--radius-xl)] border border-white/[0.08] bg-white/[0.03] p-1 backdrop-blur-xl"
                    style={{ boxShadow: '0 20px 60px -30px rgba(167,139,250,0.45)' }}
                >
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="start writing…"
                        className="block h-56 w-full resize-none rounded-[calc(var(--radius-xl)-4px)] bg-transparent px-5 py-4 text-base leading-relaxed text-[color:var(--color-fg)] outline-none placeholder:text-[color:var(--color-fg-subtle)] sm:h-64"
                    />

                    {/* Writing-pen corner indicator */}
                    <motion.div
                        aria-hidden
                        className="pointer-events-none absolute bottom-3 right-4 flex items-center gap-1 text-[color:var(--color-fg-subtle)]"
                        animate={{ y: [0, -2, 0], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <PenLine className="h-3.5 w-3.5" />
                        <span className="inline-block h-3 w-px bg-current" />
                    </motion.div>
                </div>
            </motion.div>

            {bucket === 'high' && !shrinking && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="flex max-w-2xl flex-wrap items-center justify-center gap-2"
                >
                    <span className="text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--color-fg-subtle)]">
                        Tap to add
                    </span>
                    {STARTERS.map((s) => (
                        <motion.button
                            key={s}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => insert(s)}
                            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[color:var(--color-fg-muted)] transition-colors hover:border-white/25 hover:bg-white/[0.06] hover:text-[color:var(--color-fg)]"
                        >
                            {s}
                        </motion.button>
                    ))}
                </motion.div>
            )}

            <AnimatePresence>
                {shrinking && (
                    <motion.p
                        key="shrink-msg"
                        initial={{ opacity: 0, scale: 1.05, y: -4 }}
                        animate={{ opacity: 1, scale: 0.85, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                        className="max-w-md text-center font-display text-lg italic text-[color:var(--color-fg)] sm:text-xl"
                    >
                        You don&rsquo;t need to solve any of this yet. You just made it smaller by writing it down.
                    </motion.p>
                )}
            </AnimatePresence>

            {!shrinking && (
                <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={!text.trim()}
                    onClick={handleDone}
                    className="rounded-full px-7 py-2.5 text-sm font-semibold text-slate-900 transition-all disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                        background: 'linear-gradient(135deg,#a78bfa,#818cf8)',
                        boxShadow: '0 14px 40px -12px rgba(167,139,250,0.7)',
                    }}
                >
                    That&rsquo;s all for now
                </motion.button>
            )}
        </div>
    );
}
