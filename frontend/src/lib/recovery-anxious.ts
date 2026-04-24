/**
 * Anxious recovery path — state, persistence, and types.
 * Mirrors the shape of recovery-overwhelmed.ts so the two paths stay
 * consistent and a user's session resumes cleanly if they close the tab.
 */

import type { StressTier } from './emotion-theme';

export const ANXIOUS_STEPS = ['ground', 'reframe', 'worry', 'brave', 'done'] as const;
export type AnxiousStep = (typeof ANXIOUS_STEPS)[number];

export interface SensoryItem {
    sense: 'see' | 'feel' | 'hear' | 'smell' | 'taste';
    value: string;
}

export interface ReframeData {
    thought: string;
    fear: string;
    reality: string;
    feltProbability: number;   // 0–100, user's felt estimate
    rationalProbability: number; // 0–100, after reflection
}

export interface WorryWindow {
    worryText: string;
    scheduledAt: number; // unix ms
    label: string;       // display label, e.g. "Today 6:00 PM"
}

export interface BraveStepData {
    goal: string;
    tinyStep: string;
    selfSoothed: boolean;
}

export interface AnxiousSession {
    currentStep: AnxiousStep;
    startedAt: number;
    stressTier: StressTier;
    breathsCompleted: number;
    pmrCompleted: boolean;
    sensoryItems: SensoryItem[];
    reframe: ReframeData;
    worry: WorryWindow | null;
    brave: BraveStepData;
}

const KEY = 'sh_recovery_anxious';
const COMPLETIONS_KEY = 'sh_recovery_anxious_completions';

export function emptySession(stressTier: StressTier): AnxiousSession {
    return {
        currentStep: 'ground',
        startedAt: Date.now(),
        stressTier,
        breathsCompleted: 0,
        pmrCompleted: false,
        sensoryItems: [],
        reframe: {
            thought: '',
            fear: '',
            reality: '',
            feltProbability: 80,
            rationalProbability: 10,
        },
        worry: null,
        brave: { goal: '', tinyStep: '', selfSoothed: false },
    };
}

export function loadSession(): AnxiousSession | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as AnxiousSession;
        // Drop sessions older than 2 hours — likely abandoned.
        if (!parsed.startedAt || Date.now() - parsed.startedAt > 2 * 60 * 60 * 1000) {
            localStorage.removeItem(KEY);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

export function saveSession(session: AnxiousSession) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(KEY, JSON.stringify(session));
    } catch {
        /* noop — quota errors are non-fatal; the path still works in memory. */
    }
}

export function clearSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEY);
}

export function incrementCompletions(): number {
    if (typeof window === 'undefined') return 0;
    const current = Number(localStorage.getItem(COMPLETIONS_KEY) || '0') || 0;
    const next = current + 1;
    localStorage.setItem(COMPLETIONS_KEY, String(next));
    return next;
}

export function getCompletions(): number {
    if (typeof window === 'undefined') return 0;
    return Number(localStorage.getItem(COMPLETIONS_KEY) || '0') || 0;
}

/**
 * Offers a set of worry-window time slots tailored to the current time of day.
 * Returns label + timestamp pairs the user can tap through in one gesture.
 */
export function suggestWorrySlots(now = new Date()): { label: string; at: number }[] {
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);
    const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const in4h = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const tomorrowMorning = new Date(now);
    tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
    tomorrowMorning.setHours(9, 0, 0, 0);

    const fmt = (d: Date) =>
        d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    const fmtDay = (d: Date) => {
        const today = new Date();
        if (d.toDateString() === today.toDateString()) return `Today ${fmt(d)}`;
        return `Tomorrow ${fmt(d)}`;
    };

    return [
        { label: `In 1 hour · ${fmt(in1h)}`, at: in1h.getTime() },
        { label: `In 2 hours · ${fmt(in2h)}`, at: in2h.getTime() },
        { label: `In 4 hours · ${fmt(in4h)}`, at: in4h.getTime() },
        { label: fmtDay(tomorrowMorning), at: tomorrowMorning.getTime() },
    ];
}

/**
 * Crude catastrophizing detector — spots common cognitive distortions
 * in the thought text so Step 2 can adapt its reframe prompts.
 * Intentionally simple: keyword scan, not an LLM call.
 */
export function detectCatastrophizing(text: string): boolean {
    const t = text.toLowerCase();
    const markers = [
        'what if',
        'everyone will',
        'nobody',
        'always',
        'never',
        'disaster',
        'ruin',
        'terrible',
        'worst',
        'end of',
        "can't cope",
        'die',
    ];
    return markers.some((m) => t.includes(m));
}

/**
 * Initial rational-probability suggestion. Anxiety typically inflates felt
 * likelihood 5–10x; we seed the slider at felt/8, clamped to 2–25.
 */
export function suggestRationalProbability(felt: number): number {
    const suggested = Math.round(felt / 8);
    return Math.max(2, Math.min(25, suggested));
}
