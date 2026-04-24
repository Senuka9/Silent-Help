/**
 * Recovery path state — Overwhelmed archetype.
 *
 * Lightweight, client-side, localStorage-backed state so the user can
 * close the tab and be asked "Continue where you left off?" on return.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { resolveStressLevel, type StressTier } from '@/lib/emotion-theme';

export type StressBucket = 'high' | 'medium' | 'low';

export interface BrainDumpItem {
    id: string;
    text: string;
    zone: 'now' | 'wait' | 'nocontrol' | null;
    autoSuggested?: boolean;
}

export interface RecoveryOverwhelmedState {
    version: 1;
    bucket: StressBucket;
    currentStep: number; // 0..5 -> six steps; 6 means complete
    breatheDone: boolean;
    coldSplashDone: boolean | null; // null = not answered; true/false = user response
    brainDump: string;
    items: BrainDumpItem[];
    chosenItemId: string | null;
    smallestStep: string;
    sprintMinutes: number; // 2 / 5 / 10
    sprintSecondsDone: number; // total seconds completed
    quietMode: boolean;
    startedAt: string;
    updatedAt: string;
}

const STORAGE_KEY = 'sh_recovery_overwhelmed';
const COMPLETIONS_KEY = 'sh_recovery_overwhelmed_completions';

export const STEPS = [
    'breathe',
    'brain-dump',
    'shrink',
    'sprint',
    'done',
    'reduce-future',
] as const;
export type StepId = (typeof STEPS)[number];

/* ───────────── Stress bucket mapping ───────────── */

export function tierToBucket(tier?: StressTier | null): StressBucket {
    if (tier === 'high') return 'high';
    if (tier === 'medium-high' || tier === 'medium-low') return 'medium';
    return 'low';
}

export function stressBucketFromProfile(stressLevel?: string | null): StressBucket {
    const t = resolveStressLevel(stressLevel).tier;
    return tierToBucket(t);
}

/* ───────────── Default state ───────────── */

function nowIso() {
    return new Date().toISOString();
}

function defaultState(bucket: StressBucket): RecoveryOverwhelmedState {
    return {
        version: 1,
        bucket,
        currentStep: 0,
        breatheDone: false,
        coldSplashDone: null,
        brainDump: '',
        items: [],
        chosenItemId: null,
        smallestStep: '',
        sprintMinutes: bucket === 'high' ? 2 : 5,
        sprintSecondsDone: 0,
        quietMode: false,
        startedAt: nowIso(),
        updatedAt: nowIso(),
    };
}

/* ───────────── Persistence helpers ───────────── */

function readStored(): RecoveryOverwhelmedState | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as RecoveryOverwhelmedState;
        if (parsed.version !== 1) return null;
        return parsed;
    } catch {
        return null;
    }
}

function writeStored(state: RecoveryOverwhelmedState) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // storage may be full — fail silently
    }
}

function clearStored() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(STORAGE_KEY);
}

export function getCompletionsCount(): number {
    if (typeof window === 'undefined') return 0;
    const v = window.localStorage.getItem(COMPLETIONS_KEY);
    const n = v ? Number(v) : 0;
    return Number.isFinite(n) ? n : 0;
}

export function incrementCompletions(): number {
    const next = getCompletionsCount() + 1;
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(COMPLETIONS_KEY, String(next));
    }
    return next;
}

/* ───────────── Hook ───────────── */

export interface RecoveryControls {
    state: RecoveryOverwhelmedState;
    hasResume: boolean;
    isHighStress: boolean;
    update: (patch: Partial<RecoveryOverwhelmedState>) => void;
    goToStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    restart: () => void;
    completePath: () => number; // returns total completions count
    /** Resume cached state if any; otherwise initialize fresh. */
    resume: () => void;
    startFresh: () => void;
}

export function useRecoveryOverwhelmed(bucket: StressBucket): RecoveryControls {
    const [state, setState] = useState<RecoveryOverwhelmedState>(() => defaultState(bucket));
    const [hasResume, setHasResume] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    // First-mount hydration
    useEffect(() => {
        const stored = readStored();
        if (stored && stored.currentStep < 4) {
            // mid-path, worth resuming
            setHasResume(true);
        }
        setHydrated(true);
    }, []);

    // Persist on change (after hydration)
    useEffect(() => {
        if (!hydrated) return;
        writeStored(state);
    }, [state, hydrated]);

    const update = useCallback((patch: Partial<RecoveryOverwhelmedState>) => {
        setState((prev) => ({ ...prev, ...patch, updatedAt: nowIso() }));
    }, []);

    const goToStep = useCallback((step: number) => {
        setState((prev) => ({ ...prev, currentStep: Math.max(0, step), updatedAt: nowIso() }));
    }, []);

    const nextStep = useCallback(() => {
        setState((prev) => ({ ...prev, currentStep: prev.currentStep + 1, updatedAt: nowIso() }));
    }, []);

    const prevStep = useCallback(() => {
        setState((prev) => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1), updatedAt: nowIso() }));
    }, []);

    const restart = useCallback(() => {
        const fresh = defaultState(bucket);
        setState(fresh);
        setHasResume(false);
        clearStored();
    }, [bucket]);

    const startFresh = useCallback(() => {
        const fresh = defaultState(bucket);
        setState(fresh);
        setHasResume(false);
    }, [bucket]);

    const resume = useCallback(() => {
        const stored = readStored();
        if (stored) {
            // Respect current bucket if tier differs — update bucket but keep answers
            setState({ ...stored, bucket });
        }
        setHasResume(false);
    }, [bucket]);

    const completePath = useCallback(() => {
        const n = incrementCompletions();
        clearStored();
        return n;
    }, []);

    const isHighStress = state.bucket === 'high';

    return useMemo(
        () => ({ state, hasResume, isHighStress, update, goToStep, nextStep, prevStep, restart, completePath, resume, startFresh }),
        [state, hasResume, isHighStress, update, goToStep, nextStep, prevStep, restart, completePath, resume, startFresh],
    );
}

/* ───────────── Auto-suggest heuristic (high stress only) ───────────── */

const NOT_IN_CONTROL_KEYWORDS = [
    'should',
    'shouldnt',
    "shouldn't",
    'what if',
    'they think',
    'what they',
    'might think',
    'could go wrong',
    'everyone will',
    'no one ',
    'nobody ',
    'always ',
    'never ',
];

export function detectNotInControl(text: string): boolean {
    const lower = text.toLowerCase();
    return NOT_IN_CONTROL_KEYWORDS.some((kw) => lower.includes(kw));
}

export function parseBrainDumpToItems(text: string): BrainDumpItem[] {
    return text
        .split(/\r?\n+/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line, i) => ({
            id: `item-${Date.now()}-${i}`,
            text: line.replace(/^[•\-*\d.)\s]+/, '').trim(),
            zone: null as BrainDumpItem['zone'],
        }))
        .filter((item) => item.text.length > 0);
}
