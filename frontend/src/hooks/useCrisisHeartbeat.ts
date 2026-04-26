'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Heartbeat hook — polls /api/health/crisis every 5 minutes to verify
 * crisis resource data integrity. Degrades gracefully (shows "unknown"
 * status when offline or endpoint unreachable).
 */

export type HeartbeatStatus = 'checking' | 'ok' | 'degraded' | 'offline' | 'unknown';

export interface CrisisHeartbeat {
    status: HeartbeatStatus;
    checkedAt: string | null;
    countryStatuses: Record<string, 'ok' | 'degraded' | 'fail'>;
    check: () => void;
}

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useCrisisHeartbeat(): CrisisHeartbeat {
    const [status, setStatus] = useState<HeartbeatStatus>('checking');
    const [checkedAt, setCheckedAt] = useState<string | null>(null);
    const [countryStatuses, setCountryStatuses] = useState<Record<string, 'ok' | 'degraded' | 'fail'>>({});

    const check = useCallback(async () => {
        setStatus('checking');
        try {
            const res = await fetch('/api/health/crisis', { cache: 'no-store' });
            if (!res.ok) {
                setStatus('unknown');
                return;
            }
            const data = await res.json();
            setStatus(data.status === 'ok' ? 'ok' : 'degraded');
            setCheckedAt(data.checkedAt);
            const map: Record<string, 'ok' | 'degraded' | 'fail'> = {};
            for (const c of data.countries ?? []) {
                map[c.country] = c.status;
            }
            setCountryStatuses(map);
        } catch {
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                setStatus('offline');
            } else {
                setStatus('unknown');
            }
        }
    }, []);

    useEffect(() => {
        check();
        const id = setInterval(check, POLL_INTERVAL_MS);
        return () => clearInterval(id);
    }, [check]);

    // Also check when coming back online
    useEffect(() => {
        const handler = () => check();
        window.addEventListener('online', handler);
        return () => window.removeEventListener('online', handler);
    }, [check]);

    return { status, checkedAt, countryStatuses, check };
}
