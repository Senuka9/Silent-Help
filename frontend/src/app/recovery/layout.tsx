'use client';

/**
 * Recovery paths use a distraction-free top-level layout.
 * No sidebar, no top bar — just an auth gate so the page can render
 * full-screen immersive animations.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function RecoveryLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isSignedIn, isLoaded } = useUser();
    const isGuest =
        typeof window !== 'undefined' && !!localStorage.getItem('sh_guest_name');
    const isAllowed = isSignedIn || isGuest;

    useEffect(() => {
        if (!isLoaded) return;
        if (!isAllowed) {
            router.replace('/auth/login');
        }
    }, [isAllowed, isLoaded, router]);

    if (!isLoaded || !isAllowed) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="loading-dots" aria-label="Loading">
                    <span />
                    <span />
                    <span />
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
