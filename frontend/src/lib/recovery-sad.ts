/**
 * Sad recovery path — session state + persistence + small helpers.
 *
 * Sad uses an "energy tier" (not a stress tier) because what matters for
 * pacing here is how much cognitive load the user can tolerate — not how
 * aroused they are. We derive energy from stressLevel:
 *   high stress        -> very-low-energy    (skip optional steps, pre-fills)
 *   medium-high stress -> low-energy         (slightly shorter, gentler)
 *   medium-low / low   -> full               (all 6 steps, normal depth)
 *
 * Everything else mirrors the anxious/frustrated paths: 2-hour session TTL,
 * completion counter, localStorage persistence.
 */

import type { StressTier } from './emotion-theme';

export type SadStep =
    | 'body'
    | 'reframe'
    | 'savor'
    | 'action'
    | 'compassion'
    | 'values'
    | 'done';

export type EnergyTier = 'very-low' | 'low' | 'full';

export function energyFromStress(tier: StressTier): EnergyTier {
    if (tier === 'high') return 'very-low';
    if (tier === 'medium-high') return 'low';
    return 'full';
}

export type BodyRegion =
    | 'eyes'
    | 'throat'
    | 'chest'
    | 'shoulders'
    | 'stomach'
    | 'elsewhere';

export interface BodyScanData {
    /** Body regions the user tapped. Empty if they used the nostril anchor instead. */
    regions: BodyRegion[];
    /** Completed the 3-breath nostril anchor (very-low tier). */
    anchorCompleted: boolean;
    /** Number of body-scan breath cycles they actually sat through. */
    breaths: number;
}

export type ReappraisalStyle = 'reconstrual' | 'repurposing' | 'prewritten';

export interface ReframeData {
    style: ReappraisalStyle | null;
    /** The reframe the user wrote, OR the pre-written one they accepted. */
    reframe: string;
    /** If repurposing: the value it surfaced. Used as a preview hint for Step 6. */
    surfacedValue: string;
}

export interface SavorData {
    /** The tiny good thing they thought of (or picked from the suggestion chips). */
    thing: string;
    /** Did they complete the 5-second hold on the teacup? */
    heldTeaCup: boolean;
    /** Seconds held (caps at 5). */
    heldSeconds: number;
}

export interface ActionData {
    action: string;
    committed: boolean;
    /** 'tiny' (very-low-energy physical micro-action) vs 'gentle' (regular). */
    kind: 'tiny' | 'gentle' | null;
}

export interface CompassionData {
    /** Phrases the user tapped (or that were spoken to them). */
    phrasesHeard: string[];
    /** Their own phrase, if they wrote one. */
    ownPhrase: string;
    /** Did they use the "imagine someone kind beside you" imagery (very-low tier)? */
    imagined: boolean;
}

export interface ValuesData {
    value: string;
    tinyStep: string;
}

export interface SadSession {
    currentStep: SadStep;
    stressTier: StressTier;
    energy: EnergyTier;
    body: BodyScanData;
    reframe: ReframeData;
    savor: SavorData;
    action: ActionData;
    compassion: CompassionData;
    values: ValuesData;
    updatedAt: number;
}

const STORAGE_KEY = 'silent-help:recovery-sad:v1';
const COMPLETIONS_KEY = 'silent-help:recovery-sad:completions';
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

export function emptySession(stressTier: StressTier): SadSession {
    return {
        currentStep: 'body',
        stressTier,
        energy: energyFromStress(stressTier),
        body: { regions: [], anchorCompleted: false, breaths: 0 },
        reframe: { style: null, reframe: '', surfacedValue: '' },
        savor: { thing: '', heldTeaCup: false, heldSeconds: 0 },
        action: { action: '', committed: false, kind: null },
        compassion: { phrasesHeard: [], ownPhrase: '', imagined: false },
        values: { value: '', tinyStep: '' },
        updatedAt: Date.now(),
    };
}

export function loadSession(): SadSession | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as SadSession;
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

export function saveSession(session: SadSession) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...session, updatedAt: Date.now() }),
        );
    } catch {
        /* storage unavailable — non-fatal */
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

/** Copy banks — kept central so wording is consistent across paths. */

export const SAVOR_SUGGESTIONS: string[] = [
    'a sip of water',
    'morning light',
    'a warm blanket',
    'a song I love',
    'a soft pet',
    'clean clothes',
    'a favorite mug',
    'the smell of coffee',
];

export const UNIVERSAL_SAVORS: string[] = [
    'the warmth of your phone in your hand',
    'the sound of your own breath',
    'the softness of what you\'re wearing',
    'the light in the room, whatever it is',
];

export const TINY_ACTIONS: string[] = [
    'Open my eyes fully',
    'Stretch one finger',
    'Sit up slightly',
    'Unclench my jaw',
    'Take one slower breath',
];

export const GENTLE_ACTIONS: string[] = [
    'Get a drink of water',
    'Look out a window for 30 seconds',
    'Write one sentence about anything',
    'Step outside for one breath',
    'Send a short "hi" to someone',
];

export const COMPASSION_PHRASES: string[] = [
    "It's okay to feel this.",
    "You're not alone in this.",
    "This will pass, even if it doesn't feel like it yet.",
    "You are doing the best you can today.",
    "Your sadness is a sign that you care.",
];

export const VALUES: { key: string; label: string; hint: string }[] = [
    { key: 'kindness', label: 'Kindness', hint: 'being gentle with myself or others' },
    { key: 'creativity', label: 'Creativity', hint: 'making, not just consuming' },
    { key: 'rest', label: 'Rest', hint: 'letting my body and mind recover' },
    { key: 'connection', label: 'Connection', hint: 'presence with people I love' },
    { key: 'growth', label: 'Growth', hint: 'becoming a little more myself' },
    { key: 'honesty', label: 'Honesty', hint: 'telling the truth about how I feel' },
    { key: 'courage', label: 'Courage', hint: 'doing small hard things anyway' },
    { key: 'play', label: 'Play', hint: 'doing something just for the joy of it' },
];

export const PREWRITTEN_REFRAME =
    "You're not failing. You're human. Sadness shows you care deeply.";
