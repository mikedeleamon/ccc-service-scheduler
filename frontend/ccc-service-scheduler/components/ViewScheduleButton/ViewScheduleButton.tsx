'use client';

import { useRouter } from 'next/navigation';

export default function ViewScheduleButton() {
    const router = useRouter();

    return (
        <button
            type='button'
            onClick={() => router.push('/schedules')}
            className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
        >
            View schedules
        </button>
    );
}
