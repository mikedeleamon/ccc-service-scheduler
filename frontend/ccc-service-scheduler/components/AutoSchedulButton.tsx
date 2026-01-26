'use client';
import { api } from '@/lib/api';

export default function AutoScheduleButton() {
    const run = async () => {
        const res = await api('/schedule', { method: 'POST' });
        console.log(res);
    };

    return (
        <button
            onClick={run}
            className='px-4 py-2 rounded bg-blue-600 text-white'
        >
            Auto-Schedule
        </button>
    );
}
