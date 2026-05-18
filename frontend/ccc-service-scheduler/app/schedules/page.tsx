'use client';

import { useEffect, useMemo, useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout/SidebarLayout';
import AutoScheduleButton from '@/components/AutoScheduleButton/AutoScheduleButton';
import ScheduleViewDisplay from '@/components/ViewScheduleButton/ScheduleViewDisplay';
import type { ScheduleWeekDetail, ScheduleWeekSummary } from '@/types/scheduleTypes';
import BackButton from '@/components/BackButton/BackButton';
import { api } from '@/lib/api';
import { useParish } from '@/lib/ParishContext';
import {
    btnTablePrimary,
    heading1,
    lead,
    pageContent,
    table,
    tableHeadRow,
    tableRow,
    tableTd,
    tableTh,
    tableWrap,
} from '@/lib/ui';

function formatDateRange(start: string, end: string): string {
    return `${start} – ${end}`;
}

export default function SchedulesPage() {
    const { parish } = useParish();
    const [schedules, setSchedules] = useState<ScheduleWeekDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewingSchedule, setViewingSchedule] = useState<ScheduleWeekDetail | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        setLoading(true);
        const params = parish ? `?parish=${encodeURIComponent(parish)}` : '';
        api(`/schedule${params}`)
            .then((data) => setSchedules(Array.isArray(data) ? data : []))
            .catch((err) => setError(err.message ?? 'Failed to load schedules'))
            .finally(() => setLoading(false));
    }, [parish]);

    const summaries: ScheduleWeekSummary[] = useMemo(
        () => schedules.map((s) => ({
            id: s.id,
            startDate: s.startDate,
            endDate: s.endDate,
            month: s.month,
            year: s.year,
        })),
        [schedules],
    );

    const totalRows = summaries.length;
    const showPagination = totalRows >= pageSize;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);

    const pageRows = useMemo(() => {
        if (!showPagination) return summaries;
        const start = (safePage - 1) * pageSize;
        return summaries.slice(start, start + pageSize);
    }, [safePage, showPagination, summaries]);

    const handleView = (id: string) => {
        setViewingSchedule(schedules.find((s) => s.id === id) ?? null);
    };

    return (
        <SidebarLayout>
            <div className={`${pageContent} relative max-w-5xl`}>
                <div className='flex flex-col gap-6 sm:flex-row sm:items-start'>
                    <BackButton />
                    <header className='min-w-0 flex-1 space-y-4 pt-1 sm:pt-0'>
                        <div>
                            <h1 className={heading1}>Schedules</h1>
                            <p className={`${lead} mt-2 max-w-xl`}>
                                Select a week to open a day-by-day view with officiants.
                            </p>
                        </div>
                        <div>
                            <AutoScheduleButton />
                        </div>
                    </header>
                </div>

                {loading && (
                    <p className='text-sm text-stone-500 dark:text-stone-400'>Loading schedules…</p>
                )}

                {error && (
                    <div className='rounded-2xl border border-red-200/80 bg-red-50/90 p-4 dark:border-red-900/50 dark:bg-red-950/40'>
                        <p className='text-sm text-red-800 dark:text-red-200'>{error}</p>
                    </div>
                )}

                {!loading && !error && schedules.length === 0 && (
                    <div className='flex flex-col items-center justify-center gap-6 rounded-[1.35rem] border border-dashed border-stone-300 bg-stone-50/60 px-8 py-20 text-center dark:border-stone-600 dark:bg-stone-900/30'>
                        <div className='flex size-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950/60'>
                            <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='size-8 text-indigo-500 dark:text-indigo-400' aria-hidden>
                                <path strokeLinecap='round' strokeLinejoin='round' d='M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5' />
                            </svg>
                        </div>
                        <div className='max-w-sm'>
                            <h2 className='font-[family-name:var(--font-fraunces),Georgia,serif] text-xl font-medium tracking-tight text-indigo-950 dark:text-indigo-50'>
                                No schedules generated yet
                            </h2>
                            <p className='mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400'>
                                Use the auto-schedule button above to generate a week-by-week schedule from your roster.
                            </p>
                        </div>
                        <AutoScheduleButton />
                    </div>
                )}

                {!loading && !error && schedules.length > 0 && (
                    <div className={tableWrap}>
                        <table className={table}>
                            <caption className='sr-only'>
                                Weekly schedules. Use the View schedule button to open a week's details.
                            </caption>
                            <thead>
                                <tr className={tableHeadRow}>
                                    <th className={tableTh}>Date</th>
                                    <th className={tableTh}>Month</th>
                                    <th className={tableTh}>Year</th>
                                    <th className={tableTh}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((row) => (
                                    <tr key={row.id} className={tableRow}>
                                        <td className={tableTd}>
                                            {formatDateRange(row.startDate, row.endDate)}
                                        </td>
                                        <td className={tableTd}>{row.month}</td>
                                        <td className={tableTd}>{row.year}</td>
                                        <td className={tableTd}>
                                            <button
                                                type='button'
                                                onClick={() => handleView(row.id)}
                                                className={btnTablePrimary}
                                                aria-label={`View schedule for ${formatDateRange(row.startDate, row.endDate)}`}
                                            >
                                                View schedule
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {showPagination && (
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                        <p className='text-sm text-stone-600 dark:text-stone-400'>
                            Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, totalRows)} of {totalRows}
                        </p>
                        <div className='flex items-center gap-2'>
                            <button
                                type='button'
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={safePage === 1}
                                className='rounded-2xl border border-stone-300/90 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-stone-50 disabled:opacity-40 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800'
                                aria-label='Previous page'
                            >
                                Prev
                            </button>
                            <span className='min-w-[6rem] text-center text-sm text-stone-600 dark:text-stone-400' aria-live='polite'>
                                Page {safePage} of {totalPages}
                            </span>
                            <button
                                type='button'
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={safePage === totalPages}
                                className='rounded-2xl border border-stone-300/90 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-stone-50 disabled:opacity-40 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800'
                                aria-label='Next page'
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {viewingSchedule && (
                    <ScheduleViewDisplay
                        schedule={viewingSchedule}
                        onClose={() => setViewingSchedule(null)}
                    />
                )}
            </div>
        </SidebarLayout>
    );
}
