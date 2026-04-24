/**
 * Pressure recovery path — state, types, copy banks.
 *
 * Two-axis routing:
 *   pressure LEVEL  → from stressTier (high / medium / low).
 *   pressure TYPE   → chosen by the user up-front:
 *                     time | performance | social | self-imposed.
 *
 * Reframes, compassion phrases, and some step-level branches depend on
 * the type — the user picks it at the start (they can change it any time
 * via the restart button).
 */

import type { StressTier } from './emotion-theme';

export type PressureStep =
    | 'intro'
    | 'reset'
    | 'reframe'
    | 'arousal'
    | 'triage'
    | 'compassion'
    | 'prevention'
    | 'done';

export type PressureLevel = 'high' | 'medium' | 'low';

export type PressureType = 'time' | 'performance' | 'social' | 'self';

export function levelFromStress(tier: StressTier): PressureLevel {
    if (tier === 'high') return 'high';
    if (tier === 'low') return 'low';
    return 'medium';
}

export const PRESSURE_TYPE_META: Record<
    PressureType,
    { label: string; tagline: string; accent: string; tint: string }
> = {
    time: {
        label: 'Time',
        tagline: 'the clock is closing in',
        accent: '#f59e0b',
        tint: 'rgba(245, 158, 11, 0.12)',
    },
    performance: {
        label: 'Performance',
        tagline: 'this needs to go well',
        accent: '#38bdf8',
        tint: 'rgba(56, 189, 248, 0.12)',
    },
    social: {
        label: 'Social',
        tagline: 'people are watching',
        accent: '#c084fc',
        tint: 'rgba(192, 132, 252, 0.12)',
    },
    self: {
        label: 'Self-imposed',
        tagline: "I'm hard on myself",
        accent: '#fb7185',
        tint: 'rgba(251, 113, 133, 0.12)',
    },
};

/* ────────── Step data shapes ────────── */

export interface ResetData {
    protocol: 'sigh' | 'box' | 'slow' | null;
    cyclesCompleted: number;
    pmrCompleted: boolean;
}

export interface ReframeData {
    oldStory: string;
    acceptedReframe: string;
    truerThanBefore: boolean;
    /** Probability check (0-100) — only used at high level. */
    probBefore: number | null;
    probAfter: number | null;
}

export interface ArousalData {
    saidOutLoud: boolean;
    challengeBefore: number | null; // 0 = threat, 100 = challenge
    challengeAfter: number | null;
}

export interface TriageItem {
    id: string;
    text: string;
    zone: 'now' | 'later' | 'outside';
}

export interface TriageData {
    items: TriageItem[];
    pickedOne: string | null;
    microBreak: 'step-away' | 'sensory' | 'breath' | null;
    microBreakCompleted: boolean;
}

export interface CompassionData {
    phrasesAccepted: string[];
    separationAccepted: boolean;
    customPhrase: string;
}

export interface PreventionData {
    commitments: string[];
}

export interface PressureSession {
    currentStep: PressureStep;
    stressTier: StressTier;
    level: PressureLevel;
    type: PressureType | null;
    reset: ResetData;
    reframe: ReframeData;
    arousal: ArousalData;
    triage: TriageData;
    compassion: CompassionData;
    prevention: PreventionData;
    updatedAt: number;
}

const STORAGE_KEY = 'silent-help:recovery-pressure:v1';
const COMPLETIONS_KEY = 'silent-help:recovery-pressure:completions';
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

export function emptySession(stressTier: StressTier): PressureSession {
    return {
        currentStep: 'intro',
        stressTier,
        level: levelFromStress(stressTier),
        type: null,
        reset: { protocol: null, cyclesCompleted: 0, pmrCompleted: false },
        reframe: {
            oldStory: '',
            acceptedReframe: '',
            truerThanBefore: false,
            probBefore: null,
            probAfter: null,
        },
        arousal: { saidOutLoud: false, challengeBefore: null, challengeAfter: null },
        triage: {
            items: [],
            pickedOne: null,
            microBreak: null,
            microBreakCompleted: false,
        },
        compassion: { phrasesAccepted: [], separationAccepted: false, customPhrase: '' },
        prevention: { commitments: [] },
        updatedAt: Date.now(),
    };
}

export function loadSession(): PressureSession | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as PressureSession;
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

export function saveSession(session: PressureSession) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...session, updatedAt: Date.now() }),
        );
    } catch {
        /* non-fatal */
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

/* ────────── Copy banks ────────── */

export const REFRAME_MATRIX: Record<
    PressureType,
    { threat: string; challenge: string }
> = {
    time: {
        threat: "There's not enough time. I'll fail.",
        challenge: 'Time pressure means I focus on what matters most.',
    },
    performance: {
        threat: 'If I mess up, people will judge me.',
        challenge: 'Nerves mean I care. That energy can help me focus.',
    },
    social: {
        threat: 'Everyone expects perfection from me.',
        challenge: 'Most people want me to succeed, not fail.',
    },
    self: {
        threat: 'I should be better than this.',
        challenge: "I'm doing my best with what I have right now.",
    },
};

export const TEAMMATE_PHRASES: string[] = [
    "You've prepared for this. Trust yourself.",
    "One mistake doesn't define you.",
    "You're human. Humans feel pressure. That's okay.",
    "You don't have to be perfect. You just have to try.",
];

export const SEPARATION_STATEMENT =
    'Your performance is not your worth. Your value as a person is not on the line here.';

export const PREVENTION_COMMITMENTS: string[] = [
    'I will recognise the signs earlier (racing heart, tense shoulders).',
    'I will name the pressure source (time / performance / social / self).',
    "I will use the 'I am excited' reframe.",
    'I will take a 60-second micro-break before reacting.',
    'I will ask for support (colleague, friend, mentor).',
    'I will lower one expectation (my own or someone else\'s).',
];

/** PMR muscle groups, ordered feet → jaw. */
export const PMR_GROUPS = [
    { id: 'feet', label: 'feet', y: 150 },
    { id: 'calves', label: 'calves', y: 120 },
    { id: 'fists', label: 'fists', y: 85 },
    { id: 'shoulders', label: 'shoulders', y: 55 },
    { id: 'jaw', label: 'jaw', y: 25 },
] as const;

export const MICRO_BREAK_OPTIONS: {
    key: TriageData['microBreak'];
    label: string;
    line: string;
    emoji: string;
}[] = [
    {
        key: 'step-away',
        label: 'Step away',
        line: 'Stand up, stretch, get water.',
        emoji: '☕',
    },
    {
        key: 'sensory',
        label: 'Sensory reset',
        line: 'One song, eyes closed.',
        emoji: '🎧',
    },
    {
        key: 'breath',
        label: 'Breath reset',
        line: '5 deep breaths, longer exhale.',
        emoji: '🌬️',
    },
];
