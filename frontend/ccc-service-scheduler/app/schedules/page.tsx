'use client';

import { useMemo, useState } from 'react';
import ScheduleViewDisplay from '@/components/ViewScheduleButton/ScheduleViewDisplay';
import type {
    ScheduleWeekDetail,
    ScheduleWeekSummary,
} from '@/components/ViewScheduleButton/scheduleTypes';

// Mock data: replace with API call when backend provides schedules endpoints
const MOCK_SCHEDULES: ScheduleWeekDetail[] = [
    {
        id: '1',
        startDate: '2026-01-05',
        endDate: '2026-01-11',
        month: 'January',
        year: '2026',
        days: [
            {
                dayOfWeek: 'Sunday',
                date: '2026-01-05',
                serviceType: 'Devotional Service',
                officiants: [
                    { role: 'Usher', personName: 'John Doe' },
                    { role: 'Reader', personName: 'Jane Smith' },
                ],
            },
            {
                dayOfWeek: 'Wednesday',
                date: '2026-01-08',
                serviceType: 'Mercy Day Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
            {
                dayOfWeek: 'Friday',
                date: '2026-01-10',
                serviceType: 'Power Day Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
        ],
    },
    {
        id: '2',
        startDate: '2026-01-12',
        endDate: '2026-01-18',
        month: 'January',
        year: '2026',
        days: [
            {
                dayOfWeek: 'Sunday',
                date: '2026-01-12',
                serviceType: 'Devotional Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
            {
                dayOfWeek: 'Wednesday',
                date: '2026-01-15',
                serviceType: 'Mercy Day Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
            {
                dayOfWeek: 'Friday',
                date: '2026-01-17',
                serviceType: 'Power Day Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
        ],
    },
    {
        id: '3',
        startDate: '2026-01-19',
        endDate: '2026-01-25',
        month: 'January',
        year: '2026',
        days: [
            {
                dayOfWeek: 'Sunday',
                date: '2026-01-19',
                serviceType: 'Devotional Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
            {
                dayOfWeek: 'Wednesday',
                date: '2026-01-22',
                serviceType: 'Mercy Day Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
            {
                dayOfWeek: 'Friday',
                date: '2026-01-24',
                serviceType: 'Power Day Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
        ],
    },
    {
        id: '4',
        startDate: '2026-02-02',
        endDate: '2026-02-08',
        month: 'January',
        year: '2026',
        days: [
            {
                dayOfWeek: 'Sunday',
                date: '2026-02-02',
                serviceType: 'Devotional Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
            {
                dayOfWeek: 'Wednesday',
                date: '2026-02-05',
                serviceType: 'Mercy Day Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
            {
                dayOfWeek: 'Friday',
                date: '2026-02-07',
                serviceType: 'Power Day Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
        ],
    },
    {
        id: '5',
        startDate: '2026-02-09',
        endDate: '2026-02-15',
        month: 'January',
        year: '2026',
        days: [
            {
                dayOfWeek: 'Sunday',
                date: '2026-02-09',
                serviceType: 'Devotional Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
            {
                dayOfWeek: 'Wednesday',
                date: '2026-02-11',
                serviceType: 'Mercy Day Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
            {
                dayOfWeek: 'Friday',
                date: '2026-02-13',
                serviceType: 'Power Day Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
        ],
    },
    {
        id: '6',
        startDate: '2026-02-16',
        endDate: '2026-02-22',
        month: 'January',
        year: '2026',
        days: [
            {
                dayOfWeek: 'Sunday',
                date: '2026-02-16',
                serviceType: 'Devotional Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
        ],
    },
    {
        id: '7',
        startDate: '2026-02-16',
        endDate: '2026-02-22',
        month: 'January',
        year: '2026',
        days: [
            {
                dayOfWeek: 'Sunday',
                date: '2026-02-16',
                serviceType: 'Devotional Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
        ],
    },
    {
        id: '8',
        startDate: '2026-02-23',
        endDate: '2026-03-01',
        month: 'January',
        year: '2026',
        days: [
            {
                dayOfWeek: 'Sunday',
                date: '2026-02-23',
                serviceType: 'Devotional Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
        ],
    },
    {
        id: '9',
        startDate: '2026-03-02',
        endDate: '2026-03-08',
        month: 'January',
        year: '2026',
        days: [
            {
                dayOfWeek: 'Sunday',
                date: '2026-03-02',
                serviceType: 'Devotional Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
        ],
    },
    {
        id: '10',
        startDate: '2026-03-09',
        endDate: '2026-03-15',
        month: 'January',
        year: '2026',
        days: [
            {
                dayOfWeek: 'Sunday',
                date: '2026-03-09',
                serviceType: 'Devotional Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
            {
                dayOfWeek: 'Wednesday',
                date: '2026-03-04',
                serviceType: 'Mercy Day Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
            {
                dayOfWeek: 'Friday',
                date: '2026-03-06',
                serviceType: 'Power Day Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
        ],
    },
    {
        id: '11',
        startDate: '2026-03-16',
        endDate: '2026-03-22',
        month: 'January',
        year: '2026',
        days: [
            {
                dayOfWeek: 'Sunday',
                date: '2026-03-16',
                serviceType: 'Devotional Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
            {
                dayOfWeek: 'Wednesday',
                date: '2026-03-18',
                serviceType: 'Mercy Day Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
            {
                dayOfWeek: 'Friday',
                date: '2026-03-20',
                serviceType: 'Power Day Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
        ],
    },
];

function formatDateRange(start: string, end: string): string {
    return `${start} – ${end}`;
}

export default function ServicesPage() {
    const [viewingSchedule, setViewingSchedule] =
        useState<ScheduleWeekDetail | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const summaries: ScheduleWeekSummary[] = useMemo(
        () =>
            MOCK_SCHEDULES.map((s) => ({
                id: s.id,
                startDate: s.startDate,
                endDate: s.endDate,
                month: s.month,
                year: s.year,
            })),
        [],
    );

    const totalRows = summaries.length;
    const showPagination = totalRows >= 10;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);

    const pageRows = useMemo(() => {
        if (!showPagination) return summaries;
        const start = (safePage - 1) * pageSize;
        return summaries.slice(start, start + pageSize);
    }, [safePage, showPagination, summaries]);

    const handleView = (id: string) => {
        const detail = MOCK_SCHEDULES.find((s) => s.id === id) ?? null;
        setViewingSchedule(detail);
    };

    return (
        <div className='flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black'>
            <main className='flex min-h-screen w-full max-w-5xl flex-col gap-8 py-16 px-8 bg-white dark:bg-black'>
                <header className='space-y-2'>
                    <h1 className='text-3xl font-semibold tracking-tight text-black dark:text-zinc-50'>
                        Schedules
                    </h1>
                    <p className='text-zinc-600 dark:text-zinc-400'>
                        Select a week to view the schedule grouped by day.
                    </p>
                </header>

                <div className='w-full overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800'>
                    <table className='w-full min-w-[520px] text-left text-sm text-zinc-800 dark:text-zinc-200'>
                        <thead>
                            <tr className='border-b border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800'>
                                <th className='px-4 py-3 font-semibold'>
                                    Date
                                </th>
                                <th className='px-4 py-3 font-semibold'>
                                    Month
                                </th>
                                <th className='px-4 py-3 font-semibold'>
                                    Year
                                </th>
                                <th className='px-4 py-3 font-semibold'>
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageRows.map((row) => (
                                <tr
                                    key={row.id}
                                    className='border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                >
                                    <td className='px-4 py-3'>
                                        {formatDateRange(
                                            row.startDate,
                                            row.endDate,
                                        )}
                                    </td>
                                    <td className='px-4 py-3'>{row.month}</td>
                                    <td className='px-4 py-3'>{row.year}</td>
                                    <td className='px-4 py-3'>
                                        <button
                                            type='button'
                                            onClick={() => handleView(row.id)}
                                            className='rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700'
                                        >
                                            View schedule
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {showPagination && (
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                        <div className='text-sm text-zinc-600 dark:text-zinc-400'>
                            Showing {(safePage - 1) * pageSize + 1}–
                            {Math.min(safePage * pageSize, totalRows)} of{' '}
                            {totalRows}
                        </div>
                        <div className='flex items-center gap-2'>
                            <button
                                type='button'
                                onClick={() =>
                                    setPage((p) => Math.max(1, p - 1))
                                }
                                disabled={safePage === 1}
                                className='rounded border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
                            >
                                Prev
                            </button>
                            <div className='text-sm text-zinc-700 dark:text-zinc-300'>
                                Page {safePage} of {totalPages}
                            </div>
                            <button
                                type='button'
                                onClick={() =>
                                    setPage((p) => Math.min(totalPages, p + 1))
                                }
                                disabled={safePage === totalPages}
                                className='rounded border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
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
            </main>
        </div>
    );
}
