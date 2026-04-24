/**
 * Frustrated recovery path — session state, persistence, and small helpers.
 *
 * Mirrors the `recovery-anxious` / `recovery-overwhelmed` conventions:
 *  - A single JSON blob in localStorage that the orchestrator reads on mount.
 *  - Auto-saved on every state change so the user can close the tab and resume.
 *  - Expires after 2 hours so stale runs don't hijack fresh emotional states.
 *  - Tracks completions so we can show lightweight streaks later.
 */

import type { StressTier } from './emotion-theme';

export type FrustratedStep =
    | 'heat'
    | 'untwist'
    | 'contain'
    | 'plan'
    | 'done';

export type TippChoice = 'temperature' | 'tension' | 'breathing';

export interface TippResults {
    /** Which TIPP tiles the user actually completed in this session. */
    completed: TippChoice[];
    /** Number of taps during the high-tier 10s Quick Discharge. */
    dischargeTaps: number;
    /** Post-TIPP check-in — did they still feel explosive, or slightly cooler? */
    checkIn: 'explosive' | 'cooler' | null;
    /** How many full TIPP passes they ran (the "still explosive" path loops once). */
    passes: number;
}

export interface UntwistData {
    /** The hot thought the user typed. */
    thought: string;
    /** Answers to the three reality-testing questions. 'yes' | 'no' | 'maybe'. */
    realityTest: {
        hundredPercentTrue: 'yes' | 'no' | 'maybe' | null;
        onlyNegative: 'yes' | 'no' | 'maybe' | null;
        matterLater: 'yes' | 'no' | 'maybe' | null;
    };
    /** Low/medium-low reappraisal — the softer version of the thought. */
    reappraisal: string;
    /** High-tier defusion — "There's that ___ again" emotion label. */
    defusionLabel: string;
}

export interface ContainData {
    /** User ticked all four STOP beats. */
    stopCompleted: boolean;
    /** High-tier: did they "close the door" on the trigger? */
    safeRoomClosed: boolean;
    /** Which self-compassion phrases they tapped on. */
    compassionTaps: string[];
}

export interface PlanData {
    /** The trigger they chose to plan against (short phrase). */
    trigger: string;
    /** The If side of the implementation intention. */
    ifClause: string;
    /** The Then side — the concrete action. */
    thenClause: string;
    /** Optional worry window (high tier) — ISO string + human label. */
    worryWindow: { scheduledAt: number; label: string } | null;
}

export interface FrustratedSession {
    currentStep: FrustratedStep;
    stressTier: StressTier;
    tipp: TippResults;
    untwist: UntwistData;
    contain: ContainData;
    plan: PlanData;
    updatedAt: number;
}

const STORAGE_KEY = 'silent-help:recovery-frustrated:v1';
const COMPLETIONS_KEY = 'silent-help:recovery-frustrated:completions';
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

export function emptySession(stressTier: StressTier): FrustratedSession {
    return {
        currentStep: 'heat',
        stressTier,
        tipp: {
            completed: [],
            dischargeTaps: 0,
            checkIn: null,
            passes: 0,
        },
        untwist: {
            thought: '',
            realityTest: {
                hundredPercentTrue: null,
                onlyNegative: null,
                matterLater: null,
            },
            reappraisal: '',
            defusionLabel: '',
        },
        contain: {
            stopCompleted: false,
            safeRoomClosed: false,
            compassionTaps: [],
        },
        plan: {
            trigger: '',
            ifClause: '',
            thenClause: '',
            worryWindow: null,
        },
        updatedAt: Date.now(),
    };
}

export function loadSession(): FrustratedSession | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as FrustratedSession;
        if (!parsed || typeof parsed !== 'object') return null;
        if (Date.now() - (parsed.updatedAt ?? 0) > MAX_AGE_MS) {
            window.localStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

export function saveSession(session: FrustratedSession) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...session, updatedAt: Date.now() }),
        );
    } catch {
        /* quota or private-mode — not fatal */
    }
}

export function clearSession() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(STORAGE_KEY);
}

export function getCompletions(): number {
    if (typeof window === 'undefined') return 0;
    const raw = window.localStorage.getItem(COMPLETIONS_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
}

export function incrementCompletions(): number {
    const next = getCompletions() + 1;
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(COMPLETIONS_KEY, String(next));
    }
    return next;
}

/** Suggest a few short windows for "give this frustration an appointment". */
export function suggestFrustrationSlots(now = new Date()): {
    at: number;
    label: string;
}[] {
    const cloneAt = (hoursFromNow: number, roundMinutes = 15) => {
        const d = new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000);
        const m = d.getMinutes();
        d.setMinutes(Math.ceil(m / roundMinutes) * roundMinutes, 0, 0);
        return d;
    };
    const fmt = (d: Date) =>
        d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const tomorrow5pm = new Date(now);
    tomorrow5pm.setDate(tomorrow5pm.getDate() + 1);
    tomorrow5pm.setHours(17, 0, 0, 0);
    const a = cloneAt(1);
    const b = cloneAt(3);
    return [
        { at: a.getTime(), label: `In 1h · ${fmt(a)}` },
        { at: b.getTime(), label: `In 3h · ${fmt(b)}` },
        { at: tomorrow5pm.getTime(), label: `Tomorrow · 5:00 PM` },
    ];
}

/** Starter reappraisal suggestions keyed by common frustration tones. */
export const REAPPRAISAL_STARTERS: string[] = [
    'This is difficult, but there is a path.',
    'I can handle one part of this, even if not all of it.',
    "I'm allowed to feel this, and it will pass.",
    "This isn't forever — it's right now.",
];

export const COMPASSION_PHRASES: string[] = [
    "It's okay to feel this.",
    'I am not a bad person for being angry.',
    'My frustration is a signal, not a command.',
    'I can be mad and still in control.',
    'This feeling will move through me.',
];

export const TRIGGER_STARTERS: string[] = [
    'Someone interrupts me',
    'A plan falls apart',
    'I feel unheard',
    'Something takes longer than it should',
    'I make a mistake',
];

export const THEN_STARTERS: string[] = [
    'take three 4-in / 8-out breaths',
    'step away for 90 seconds',
    'name the emotion out loud',
    'unclench my jaw and drop my shoulders',
    'ask one clarifying question before reacting',
];
