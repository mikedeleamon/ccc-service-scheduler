'use client';

import { useEffect, useMemo, useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout/SidebarLayout';
import AutoScheduleButton from '@/components/AutoScheduleButton/AutoScheduleButton';
import ScheduleViewDisplay from '@/components/ViewScheduleButton/ScheduleViewDisplay';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import type { ScheduleWeekDetail, ScheduleWeekSummary } from '@/types/scheduleTypes';
import BackButton from '@/components/BackButton/BackButton';
import { api } from '@/lib/api';
import { useParish } from '@/lib/ParishContext';
import {
    btnDangerSolid,
    heading1,
    lead,
    pageContent,
    table,
    tableHeadRow,
    tableRow,
    tableTd,
    tableTh,
    tableWrap,
    btnTablePrimary,
} from '@/lib/ui';

function formatDateStr(iso: string): string {
    try {
        const d = new Date(iso + 'T00:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
        return iso;
    }
}

function formatDateRange(start: string, end: string): string {
    return `${formatDateStr(start)} – ${formatDateStr(end)}`;
}

export default function SchedulesPage() {
    const { parish } = useParish();
    const [schedules, setSchedules] = useState<ScheduleWeekDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewingSchedule, setViewingSchedule] = useState<ScheduleWeekDetail | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // Bulk delete state
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = () => {
        setLoading(true);
        const params = parish ? `?parish=${encodeURIComponent(parish)}` : '';
        return api(`/schedule${params}`)
            .then((data) => setSchedules(Array.isArray(data) ? data : []))
            .catch((err) => setError(err.message ?? 'Failed to load schedules'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [parish]);

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

    const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

    const toggleRow = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (allPageSelected) {
            setSelected((prev) => {
                const next = new Set(prev);
                pageRows.forEach((r) => next.delete(r.id));
                return next;
            });
        } else {
            setSelected((prev) => {
                const next = new Set(prev);
                pageRows.forEach((r) => next.add(r.id));
                return next;
            });
        }
    };

    const handleBulkDelete = async () => {
        setDeleting(true);
        setDeleteError(null);
        try {
            await api('/schedule', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ week_starts: Array.from(selected), parish: parish ?? null }),
            });
            setSelected(new Set());
            setShowDeleteConfirm(false);
            await load();
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Failed to delete schedules.');
        } finally {
            setDeleting(false);
        }
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
                        <div className='flex flex-wrap items-center gap-3'>
                            <AutoScheduleButton />
                            {selected.size > 0 && (
                                <button
                                    type='button'
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className={btnDangerSolid}
                                >
                                    <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='size-4' aria-hidden>
                                        <path strokeLinecap='round' strokeLinejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0' />
                                    </svg>
                                    Delete {selected.size} selected
                                </button>
                            )}
                        </div>
                    </header>
                </div>

                {deleteError && (
                    <div className='rounded-2xl border border-red-200/80 bg-red-50/90 p-4 dark:border-red-900/50 dark:bg-red-950/40'>
                        <p className='text-sm text-red-800 dark:text-red-200'>{deleteError}</p>
                    </div>
                )}

                {loading && (
                    <div className={tableWrap}>
                        <table className={table}>
                            <thead>
                                <tr className={tableHeadRow}>
                                    <th className={tableTh}></th>
                                    <th className={tableTh}>Date</th>
                                    <th className={tableTh}>Month</th>
                                    <th className={tableTh}>Year</th>
                                    <th className={tableTh}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className='border-b border-stone-100 dark:border-stone-800/90'>
                                        <td className={tableTd}><div className='h-3.5 w-4 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700' /></td>
                                        <td className={tableTd}><div className='h-3.5 w-48 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700' /></td>
                                        <td className={tableTd}><div className='h-3.5 w-16 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700' /></td>
                                        <td className={tableTd}><div className='h-3.5 w-10 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700' /></td>
                                        <td className={tableTd}><div className='h-3.5 w-24 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700' /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
                                    <th className='px-4 py-3.5'>
                                        <input
                                            type='checkbox'
                                            checked={allPageSelected}
                                            onChange={toggleAll}
                                            aria-label='Select all on page'
                                            className='size-4 rounded border-stone-300 accent-indigo-700'
                                        />
                                    </th>
                                    <th className={tableTh}>Date</th>
                                    <th className={tableTh}>Month</th>
                                    <th className={tableTh}>Year</th>
                                    <th className={tableTh}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((row) => (
                                    <tr key={row.id} className={`${tableRow} ${selected.has(row.id) ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : ''}`}>
                                        <td className='px-4 py-3.5'>
                                            <input
                                                type='checkbox'
                                                checked={selected.has(row.id)}
                                                onChange={() => toggleRow(row.id)}
                                                aria-label={`Select ${formatDateRange(row.startDate, row.endDate)}`}
                                                className='size-4 rounded border-stone-300 accent-indigo-700'
                                            />
                                        </td>
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

                {showDeleteConfirm && (
                    <DeleteConfirmModal
                        label={`${selected.size} schedule week${selected.size !== 1 ? 's' : ''} and all their services`}
                        onCancel={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                        onConfirm={handleBulkDelete}
                        confirmDisabled={deleting}
                    />
                )}
            </div>
        </SidebarLayout>
    );
}
