'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DaySchedule, ScheduleWeekDetail } from '@/types/scheduleTypes';
import { api } from '@/lib/api';
import { positionsFor } from '@/constants/positions';
import { btnSecondary } from '@/lib/ui';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function pad(n: number): string {
    return String(n).padStart(2, '0');
}
function toIso(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Monday-start grid of Date objects covering the whole month (with spillover). */
function monthGrid(year: number, month: number): Date[] {
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7; // days since Monday
    const start = new Date(year, month, 1 - offset);
    const last = new Date(year, month + 1, 0);
    const endOffset = (7 - ((last.getDay() + 6) % 7) - 1 + 7) % 7;
    const end = new Date(year, month, last.getDate() + endOffset);
    const days: Date[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
    }
    return days;
}

type ScheduleCalendarProps = {
    parish: string | null;
    onSelectWeek: (week: ScheduleWeekDetail) => void;
    refreshKey?: number;
};

export default function ScheduleCalendar({ parish, onSelectWeek, refreshKey }: ScheduleCalendarProps) {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [weeks, setWeeks] = useState<ScheduleWeekDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const grid = useMemo(() => monthGrid(year, month), [year, month]);
    const todayIso = toIso(now);

    useEffect(() => {
        setLoading(true);
        const start = toIso(grid[0]);
        const end = toIso(grid[grid.length - 1]);
        const params = new URLSearchParams({ start_date: start, end_date: end });
        if (parish) params.set('parish', parish);
        api(`/schedule?${params.toString()}`)
            .then((data) => { setWeeks(Array.isArray(data) ? data : []); setError(null); })
            .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load calendar'))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year, month, parish, refreshKey]);

    // date ISO -> the services scheduled that day
    const byDate = useMemo(() => {
        const map = new Map<string, DaySchedule[]>();
        for (const w of weeks) {
            for (const day of w.days) {
                const list = map.get(day.date) ?? [];
                list.push(day);
                map.set(day.date, list);
            }
        }
        return map;
    }, [weeks]);

    const weekContaining = (iso: string): ScheduleWeekDetail | null =>
        weeks.find((w) => iso >= w.startDate && iso <= w.endDate) ?? null;

    const goToMonth = (delta: number) => {
        const d = new Date(year, month + delta, 1);
        setYear(d.getFullYear());
        setMonth(d.getMonth());
    };
    const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };

    return (
        <div className='space-y-4'>
            <div className='flex flex-wrap items-center gap-3'>
                <div className='flex items-center gap-1'>
                    <button type='button' onClick={() => goToMonth(-1)} aria-label='Previous month' className={btnSecondary}>
                        <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='size-4' aria-hidden>
                            <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5 8.25 12l7.5-7.5' />
                        </svg>
                    </button>
                    <button type='button' onClick={() => goToMonth(1)} aria-label='Next month' className={btnSecondary}>
                        <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='size-4' aria-hidden>
                            <path strokeLinecap='round' strokeLinejoin='round' d='m8.25 4.5 7.5 7.5-7.5 7.5' />
                        </svg>
                    </button>
                </div>
                <p className='min-w-[10rem] font-[family-name:var(--font-fraunces),Georgia,serif] text-xl font-medium text-indigo-950 dark:text-indigo-50'>
                    {MONTHS[month]} {year}
                </p>
                <button type='button' onClick={goToday} className={btnSecondary}>Today</button>
            </div>

            {error && (
                <div className='rounded-2xl border border-red-200/80 bg-red-50/90 p-4 dark:border-red-900/50 dark:bg-red-950/40'>
                    <p className='text-sm text-red-800 dark:text-red-200'>{error}</p>
                </div>
            )}

            <div className={`overflow-hidden rounded-[1.25rem] border border-stone-200/90 bg-white/95 shadow-md shadow-stone-900/[0.04] dark:border-stone-700/80 dark:bg-stone-900/45 ${loading ? 'opacity-60' : ''}`}>
                {/* Weekday header */}
                <div className='grid grid-cols-7 border-b border-stone-200 bg-indigo-950/[0.03] dark:border-stone-700/90 dark:bg-indigo-950/30'>
                    {WEEKDAYS.map((wd) => (
                        <div key={wd} className='px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400'>
                            {wd}
                        </div>
                    ))}
                </div>

                {/* Day cells */}
                <div className='grid grid-cols-7'>
                    {grid.map((d) => {
                        const iso = toIso(d);
                        const inMonth = d.getMonth() === month;
                        const isToday = iso === todayIso;
                        const services = byDate.get(iso) ?? [];
                        const clickable = services.length > 0;
                        return (
                            <div
                                key={iso}
                                role={clickable ? 'button' : undefined}
                                tabIndex={clickable ? 0 : undefined}
                                onClick={clickable ? () => { const w = weekContaining(iso); if (w) onSelectWeek(w); } : undefined}
                                onKeyDown={clickable ? (e) => { if (e.key === 'Enter') { const w = weekContaining(iso); if (w) onSelectWeek(w); } } : undefined}
                                aria-label={clickable ? `View week of ${iso}` : undefined}
                                className={[
                                    'min-h-[92px] border-b border-r border-stone-100 p-1.5 dark:border-stone-800/80',
                                    inMonth ? '' : 'bg-stone-50/60 dark:bg-stone-950/30',
                                    clickable ? 'cursor-pointer transition hover:bg-amber-50/50 dark:hover:bg-stone-800/40' : '',
                                ].join(' ')}
                            >
                                <div className='flex items-center justify-between'>
                                    <span className={[
                                        'inline-flex size-6 items-center justify-center rounded-full text-xs',
                                        isToday ? 'bg-indigo-700 font-semibold text-white dark:bg-indigo-500' : inMonth ? 'text-stone-700 dark:text-stone-300' : 'text-stone-400 dark:text-stone-600',
                                    ].join(' ')}>
                                        {d.getDate()}
                                    </span>
                                </div>
                                <div className='mt-1 space-y-1'>
                                    {services.map((svc) => {
                                        const total = positionsFor(svc.serviceType).length;
                                        const filled = svc.officiants.length;
                                        const complete = total > 0 && filled >= total;
                                        return (
                                            <div
                                                key={svc.serviceId}
                                                className={[
                                                    'truncate rounded-md px-1.5 py-1 text-[11px] font-medium leading-tight',
                                                    complete
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                        : 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300',
                                                ].join(' ')}
                                                title={`${svc.serviceType ?? 'Service'}${svc.time ? ` · ${svc.time}` : ''} — ${filled}${total ? `/${total}` : ''} filled`}
                                            >
                                                <span className='block truncate'>{svc.serviceType ?? 'Service'}</span>
                                                <span className='opacity-80'>{filled}{total ? `/${total}` : ''}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {!loading && !error && byDate.size === 0 && (
                <p className='text-center text-sm text-stone-500 dark:text-stone-400'>
                    No services scheduled in {MONTHS[month]} {year}.
                </p>
            )}
        </div>
    );
}
