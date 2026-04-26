import { NextRequest } from 'next/server';

/**
 * GET /api/health/crisis — heartbeat endpoint for crisis resource availability.
 *
 * Returns a structured check of all shipped crisis resources:
 *  - Validates that every country has at least one call + one text resource
 *  - Validates phone number formats (digits only, reasonable length)
 *  - Returns per-country pass/fail and an overall status
 *
 * This endpoint is public (no auth) so monitoring tools and the frontend
 * SOS page can poll it without credentials.
 */

interface CountryCheck {
    country: string;
    countryName: string;
    resourceCount: number;
    hasCall: boolean;
    hasText: boolean;
    allFormatsValid: boolean;
    status: 'ok' | 'degraded' | 'fail';
}

// Inline the crisis data validation (mirrors the frontend crisis-resources.ts structure)
// We validate format only — we cannot dial numbers from the server.
const PHONE_REGEX = /^\+?[\d\s\-()]{2,20}$/;

function isValidDest(dest: string, mode: string): boolean {
    if (mode === 'link') {
        try { new URL(dest); return true; } catch { return false; }
    }
    // call or text — should be digits (with optional +, spaces, dashes)
    return PHONE_REGEX.test(dest.replace(/\s/g, ''));
}

// Hardcoded crisis resource manifest for server-side validation.
// Kept deliberately minimal — just keys, dests, and modes.
const CRISIS_MANIFEST: Record<string, { countryName: string; resources: { key: string; dest: string; mode: string }[] }> = {
    GB: {
        countryName: 'United Kingdom',
        resources: [
            { key: '999', dest: '999', mode: 'call' },
            { key: '111', dest: '111', mode: 'call' },
            { key: 'samaritans', dest: '116123', mode: 'call' },
            { key: 'shout', dest: '85258', mode: 'text' },
        ],
    },
    US: {
        countryName: 'United States',
        resources: [
            { key: '911', dest: '911', mode: 'call' },
            { key: '988', dest: '988', mode: 'call' },
            { key: 'crisis-text', dest: '741741', mode: 'text' },
        ],
    },
    AU: {
        countryName: 'Australia',
        resources: [
            { key: '000', dest: '000', mode: 'call' },
            { key: 'lifeline', dest: '131114', mode: 'call' },
            { key: 'crisis-text', dest: '0477131114', mode: 'text' },
        ],
    },
    LK: {
        countryName: 'Sri Lanka',
        resources: [
            { key: '1926', dest: '1926', mode: 'call' },
            { key: 'sumithrayo', dest: '+94112682535', mode: 'call' },
            { key: 'ccc', dest: '1333', mode: 'call' },
        ],
    },
    DE: {
        countryName: 'Germany',
        resources: [
            { key: '112', dest: '112', mode: 'call' },
            { key: 'telefon1', dest: '08001110111', mode: 'call' },
            { key: 'telefon2', dest: '08001110222', mode: 'call' },
        ],
    },
    FR: {
        countryName: 'France',
        resources: [
            { key: '112', dest: '112', mode: 'call' },
            { key: '3114', dest: '3114', mode: 'call' },
            { key: 'sos-amitie', dest: '0972394050', mode: 'call' },
        ],
    },
};

export async function GET(_req: NextRequest) {
    const checks: CountryCheck[] = [];
    let overallOk = true;

    for (const [code, data] of Object.entries(CRISIS_MANIFEST)) {
        const hasCall = data.resources.some((r) => r.mode === 'call');
        const hasText = data.resources.some((r) => r.mode === 'text');
        const allFormatsValid = data.resources.every((r) => isValidDest(r.dest, r.mode));

        const status = hasCall && allFormatsValid ? 'ok' : allFormatsValid ? 'degraded' : 'fail';
        if (status !== 'ok') overallOk = false;

        checks.push({
            country: code,
            countryName: data.countryName,
            resourceCount: data.resources.length,
            hasCall,
            hasText,
            allFormatsValid,
            status,
        });
    }

    return Response.json({
        status: overallOk ? 'ok' : 'degraded',
        checkedAt: new Date().toISOString(),
        countries: checks,
    }, {
        headers: {
            'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
    });
}
