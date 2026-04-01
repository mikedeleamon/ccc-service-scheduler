'use client';

import { api } from '@/lib/api';
import { btnPrimary } from '@/lib/ui';

export default function AutoScheduleButton() {
    const run = async () => {
        const res = await api('/schedule', { method: 'POST' });
        console.log(res);
    };

    return (
        <button type='button' onClick={run} className={btnPrimary}>
            Auto-schedule
        </button>
    );
}
