'use client';

import { useRouter } from 'next/navigation';
import { btnPrimary } from '@/lib/ui';

export default function ViewScheduleButton() {
    const router = useRouter();

    return (
        <button
            type='button'
            onClick={() => router.push('/schedules')}
            className={btnPrimary}
        >
            View schedules
        </button>
    );
}
