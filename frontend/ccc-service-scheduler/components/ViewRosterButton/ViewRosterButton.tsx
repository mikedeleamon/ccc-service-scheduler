'use client';

import { useRouter } from 'next/navigation';
import { btnPrimary } from '@/lib/ui';

export default function ViewRosterButton() {
    const router = useRouter();

    return (
        <button
            type='button'
            onClick={() => router.push('/roster')}
            className={btnPrimary}
        >
            View roster
        </button>
    );
}
