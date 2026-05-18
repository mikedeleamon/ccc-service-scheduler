'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { btnPrimary } from '@/lib/ui';

type Status = 'idle' | 'running' | 'success' | 'error';

type Props = {
    onSuccess?: () => void;
};

export default function AutoScheduleButton({ onSuccess }: Props) {
    const [status, setStatus] = useState<Status>('idle');
    const [message, setMessage] = useState<string | null>(null);

    const run = async () => {
        setStatus('running');
        setMessage(null);
        try {
            const res = await api('/schedule', { method: 'POST' });
            const count = Array.isArray(res) ? res.length : (res?.weeks ?? res?.count ?? '?');
            setStatus('success');
            setMessage(`Schedule generated — ${count} week${count !== 1 ? 's' : ''} created.`);
            onSuccess?.();
        } catch (e) {
            setStatus('error');
            setMessage(e instanceof Error ? e.message : 'Scheduling failed. Try again.');
        }
    };

    return (
        <div className='space-y-3'>
            <button
                type='button'
                onClick={run}
                disabled={status === 'running'}
                className={`${btnPrimary} disabled:pointer-events-none disabled:opacity-45`}
            >
                {status === 'running' ? (
                    <>
                        <svg className='size-4 animate-spin' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' aria-hidden>
                            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
                        </svg>
                        Running…
                    </>
                ) : (
                    <>
                        <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='size-4' aria-hidden>
                            <path strokeLinecap='round' strokeLinejoin='round' d='M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z' />
                        </svg>
                        Auto-schedule
                    </>
                )}
            </button>

            {message && (
                <div className={`rounded-2xl border px-4 py-3 text-sm ${
                    status === 'success'
                        ? 'border-emerald-200/80 bg-emerald-50/90 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200'
                        : 'border-red-200/80 bg-red-50/90 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200'
                }`}>
                    {message}
                </div>
            )}
        </div>
    );
}
