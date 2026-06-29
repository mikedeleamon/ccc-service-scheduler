'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useParish } from '@/lib/ParishContext';
import { btnPrimary, btnSecondary, inputBase } from '@/lib/ui';

type Status = 'idle' | 'running' | 'success' | 'error';

type Unfilled = {
    serviceId: number;
    role: string;
    date: string | null;
    serviceType: string | null;
    reason?: string | null;
};

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
    const [rangeMode, setRangeMode] = useState(false);
    const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [confirming, setConfirming] = useState(false);

    const resolveRange = (): { start: string; end: string } | null => {
        if (!rangeMode) return monthRange(month);
        if (!startDate || !endDate) return null;
        if (endDate < startDate) return null;
        return { start: startDate, end: endDate };
    };

    const run = async () => {
        const range = resolveRange();
        if (!range) {
            setStatus('error');
            setMessage('Choose a valid start and end date (end must not be before start).');
            return;
        }
        setConfirming(false);
        setStatus('running');
        setMessage(null);
        setUnfilled([]);
        try {
            const res = await api('/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parish: parish || null,
                    start_date: range.start,
                    end_date: range.end,
                }),
                timeoutMs: 60_000, // scheduling a wide range can take a while
            });

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
            <div className='space-y-2'>
                <div className='flex items-center gap-3 text-xs'>
                    <button
                        type='button'
                        onClick={() => setRangeMode(false)}
                        className={`font-medium ${!rangeMode ? 'text-indigo-700 underline dark:text-indigo-300' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'}`}
                    >
                        Single month
                    </button>
                    <span className='text-stone-300 dark:text-stone-600'>·</span>
                    <button
                        type='button'
                        onClick={() => setRangeMode(true)}
                        className={`font-medium ${rangeMode ? 'text-indigo-700 underline dark:text-indigo-300' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'}`}
                    >
                        Date range
                    </button>
                </div>

                {!rangeMode ? (
                    <div className='space-y-1'>
                        <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>Month</label>
                        <input
                            type='month'
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className={inputBase}
                        />
                    </div>
                ) : (
                    <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                        <div className='space-y-1'>
                            <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>From</label>
                            <input type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputBase} />
                        </div>
                        <div className='space-y-1'>
                            <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>To</label>
                            <input type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputBase} />
                        </div>
                    </div>
                )}

                {parish && (
                    <p className='text-xs text-stone-400 dark:text-stone-500'>Parish: {parish}</p>
                )}
            </div>

            {confirming ? (
                <div className='space-y-3 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/40'>
                    <p className='text-sm text-amber-900 dark:text-amber-200'>
                        This regenerates the schedule for the selected range. Existing{' '}
                        <strong>unconfirmed</strong> assignments will be replaced; confirmed ones are kept.
                    </p>
                    <div className='flex gap-2'>
                        <button type='button' onClick={run} className={`${btnPrimary} disabled:pointer-events-none disabled:opacity-45`}>
                            Yes, regenerate
                        </button>
                        <button type='button' onClick={() => setConfirming(false)} className={btnSecondary}>
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type='button'
                    onClick={() => { setConfirming(true); setMessage(null); }}
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
            )}

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
                                {u.reason ? <span className='text-amber-700/90 dark:text-amber-300/80'> — {u.reason}</span> : null}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
