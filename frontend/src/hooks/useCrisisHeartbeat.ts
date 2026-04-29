'use client';

import { useState, useEffect, useRef } from 'react';

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
    const runRef = useRef<() => void>(() => {});

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            setStatus('checking');
            try {
                const res = await fetch('/api/health/crisis', { cache: 'no-store' });
                if (cancelled) return;
                if (!res.ok) { setStatus('unknown'); return; }
                const data = await res.json();
                if (cancelled) return;
                setStatus(data.status === 'ok' ? 'ok' : 'degraded');
                setCheckedAt(data.checkedAt);
                const map: Record<string, 'ok' | 'degraded' | 'fail'> = {};
                for (const c of data.countries ?? []) map[c.country] = c.status;
                setCountryStatuses(map);
            } catch {
                if (cancelled) return;
                setStatus(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'unknown');
            }
        };

        runRef.current = run;
        run();
        const id = setInterval(run, POLL_INTERVAL_MS);
        const onOnline = () => run();
        window.addEventListener('online', onOnline);

        return () => {
            cancelled = true;
            clearInterval(id);
            window.removeEventListener('online', onOnline);
        };
    }, []);

    return { status, checkedAt, countryStatuses, check: () => runRef.current() };
}
