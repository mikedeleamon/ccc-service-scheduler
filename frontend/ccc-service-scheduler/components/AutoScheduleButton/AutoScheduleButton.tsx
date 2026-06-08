'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useParish } from '@/lib/ParishContext';
import { btnPrimary, inputBase } from '@/lib/ui';

type Status = 'idle' | 'running' | 'success' | 'error';

type Unfilled = { serviceId: number; role: string; date: string | null; serviceType: string | null };

type Props = {
    onSuccess?: () => void;
};

function monthRange(month: string): { start: string; end: string } {
    // month is "YYYY-MM"
    const [y, m] = month.split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 0)); // day 0 of next month = last day of this month
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    return { start: iso(start), end: iso(end) };
}

export default function AutoScheduleButton({ onSuccess }: Props) {
    const { parish } = useParish();
    const [status, setStatus] = useState<Status>('idle');
    const [message, setMessage] = useState<string | null>(null);
    const [unfilled, setUnfilled] = useState<Unfilled[]>([]);
    const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

    const run = async () => {
        setStatus('running');
        setMessage(null);
        setUnfilled([]);
        try {
            const { start, end } = monthRange(month);
            const res = await api('/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parish: parish || null,
                    start_date: start,
                    end_date: end,
                }),
            });
            if (res?.detail) throw new Error(res.detail);

            const weeks = Array.isArray(res?.weeks) ? res.weeks : [];
            const gaps: Unfilled[] = Array.isArray(res?.unfilled) ? res.unfilled : [];
            setStatus('success');
            setUnfilled(gaps);
            setMessage(
                `Schedule generated — ${weeks.length} week${weeks.length !== 1 ? 's' : ''} filled.` +
                (gaps.length ? ` ${gaps.length} position${gaps.length !== 1 ? 's' : ''} could not be filled.` : ''),
            );
            onSuccess?.();
        } catch (e) {
            setStatus('error');
            setMessage(e instanceof Error ? e.message : 'Scheduling failed. Try again.');
        }
    };

    return (
        <div className='space-y-3'>
            <div className='space-y-1'>
                <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>Month</label>
                <input
                    type='month'
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className={inputBase}
                />
                {parish && (
                    <p className='text-xs text-stone-400 dark:text-stone-500'>Parish: {parish}</p>
                )}
            </div>

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

            {unfilled.length > 0 && (
                <div className='rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200'>
                    <p className='font-medium'>Unfilled positions</p>
                    <ul className='mt-1 space-y-0.5'>
                        {unfilled.map((u, i) => (
                            <li key={i}>
                                {u.date ?? '?'} — {u.serviceType ?? 'Service'}: {u.role}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
