'use client';

import { useMemo, useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout/SidebarLayout';
import AutoScheduleButton from '@/components/AutoScheduleButton/AutoScheduleButton';
import ScheduleViewDisplay from '@/components/ViewScheduleButton/ScheduleViewDisplay';
import type {
    ScheduleWeekDetail,
    ScheduleWeekSummary,
} from '@/types/scheduleTypes';
import BackButton from '@/components/BackButton/BackButton';
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
                time: '10:00',
                serviceType: 'Devotional Service',
                officiants: [
                    { role: 'Usher', personName: 'John Doe' },
                    { role: 'Reader', personName: 'Jane Smith' },
                ],
            },
            {
                dayOfWeek: 'Wednesday',
                date: '2026-01-08',
                time: '18:00',
                serviceType: 'Mercy Day Service',
                officiants: [
                    { role: 'Usher', personName: 'Jane Smith' },
                    { role: 'Reader', personName: 'John Doe' },
                ],
            },
            {
                dayOfWeek: 'Friday',
                date: '2026-01-10',
                time: '18:00',
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
                time: '10:00',
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
        <SidebarLayout>
            <div className={`${pageContent} relative max-w-5xl`}>
                <div className='flex flex-col gap-6 sm:flex-row sm:items-start'>
                    <BackButton />
                    <header className='min-w-0 flex-1 space-y-4 pt-1 sm:pt-0'>
                        <div>
                            <h1 className={heading1}>Schedules</h1>
                            <p className={`${lead} mt-2 max-w-xl`}>
                                Select a week to open a day-by-day view with
                                officiants.
                            </p>
                        </div>
                        <div>
                            <AutoScheduleButton />
                        </div>
                    </header>
                </div>

                <div className={tableWrap}>
                    <table className={table}>
                        <caption className='sr-only'>
                            Weekly schedules. Use the View schedule button to
                            open a week’s details.
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
                                        {formatDateRange(
                                            row.startDate,
                                            row.endDate,
                                        )}
                                    </td>
                                    <td className={tableTd}>{row.month}</td>
                                    <td className={tableTd}>{row.year}</td>
                                    <td className={tableTd}>
                                        <button
                                            type='button'
                                            onClick={() =>
                                                handleView(row.id)
                                            }
                                            className={btnTablePrimary}
                                            aria-label={`View schedule for ${formatDateRange(
                                                row.startDate,
                                                row.endDate,
                                            )}`}
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
                        <p className='text-sm text-stone-600 dark:text-stone-400'>
                            Showing {(safePage - 1) * pageSize + 1}–
                            {Math.min(safePage * pageSize, totalRows)} of{' '}
                            {totalRows}
                        </p>
                        <div className='flex items-center gap-2'>
                            <button
                                type='button'
                                onClick={() =>
                                    setPage((p) => Math.max(1, p - 1))
                                }
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
                                onClick={() =>
                                    setPage((p) =>
                                        Math.min(totalPages, p + 1),
                                    )
                                }
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
