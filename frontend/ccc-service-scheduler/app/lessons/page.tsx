'use client';

import { useEffect, useMemo, useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout/SidebarLayout';
import BackButton from '@/components/BackButton/BackButton';
import LessonEditModal, { LessonDraft } from '@/components/modals/LessonEditModal';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import { api } from '@/lib/api';
import {
    btnPrimary,
    btnTableSecondary,
    btnDanger,
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

type Lesson = {
    id: number;
    date: string;
    dayOfWeek: string;
    time: string | null;
    serviceType: string | null;
    first_lesson: string | null;
    second_lesson: string | null;
};

function ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function formatDate(iso: string): string {
    const d = new Date(iso + 'T00:00:00');
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    return `${month}, ${ordinal(d.getDate())}, ${d.getFullYear()}`;
}

function formatTime12(time: string | null): string {
    if (!time) return '—';
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return m === 0 ? `${hour}:00 ${period}` : `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

const blankDraft: LessonDraft = { date: '', first_lesson: '', second_lesson: '' };

export default function LessonsPage() {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<LessonDraft | null>(null);
    const [deleting, setDeleting] = useState<Lesson | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 15;

    const load = () => {
        setLoading(true);
        return api('/lessons')
            .then((data) => setLessons(Array.isArray(data) ? data : []))
            .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load lessons'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const sorted = useMemo(() => [...lessons].sort((a, b) => a.date.localeCompare(b.date)), [lessons]);
    const totalRows = sorted.length;
    const showPagination = totalRows > pageSize;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const pageRows = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return sorted.slice(start, start + pageSize);
    }, [sorted, safePage]);

    const handleSave = async (draft: LessonDraft) => {
        const payload = { date: draft.date, first_lesson: draft.first_lesson, second_lesson: draft.second_lesson || null };
        if (draft.id) {
            await api(`/lessons/${draft.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } else {
            await api('/lessons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        }
        await load();
    };

    const confirmDelete = async () => {
        if (!deleting) return;
        const l = deleting;
        setDeleting(null);
        setDeleteError(null);
        try {
            await api(`/lessons/${l.id}`, { method: 'DELETE' });
            await load();
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Failed to delete lesson.');
        }
    };

    return (
        <SidebarLayout>
            <div className={`${pageContent} relative max-w-5xl`}>
                <div className='flex flex-col gap-6 sm:flex-row sm:items-start'>
                    <BackButton />
                    <header className='min-w-0 flex-1 space-y-4 pt-1 sm:pt-0'>
                        <div>
                            <h1 className={heading1}>Lessons</h1>
                            <p className={`${lead} mt-2 max-w-xl`}>
                                Bible readings for each service date. These are universal across parishes and populate
                                automatically wherever a First or Second Lesson officiant is assigned.
                            </p>
                        </div>
                        <div className='flex flex-wrap items-center gap-3'>
                            <button type='button' onClick={() => setEditing(blankDraft)} className={btnPrimary}>
                                + Add lesson
                            </button>
                        </div>
                    </header>
                </div>

                {deleteError && (
                    <div className='rounded-2xl border border-red-200/80 bg-red-50/90 p-4 dark:border-red-900/50 dark:bg-red-950/40'>
                        <p className='text-sm text-red-800 dark:text-red-200'>{deleteError}</p>
                    </div>
                )}

                {error && (
                    <div className='rounded-2xl border border-red-200/80 bg-red-50/90 p-4 dark:border-red-900/50 dark:bg-red-950/40'>
                        <p className='text-sm text-red-800 dark:text-red-200'>{error}</p>
                    </div>
                )}

                {!loading && !error && sorted.length === 0 && (
                    <div className='flex flex-col items-center justify-center gap-6 rounded-[1.35rem] border border-dashed border-stone-300 bg-stone-50/60 px-8 py-20 text-center dark:border-stone-600 dark:bg-stone-900/30'>
                        <div className='max-w-sm'>
                            <h2 className='font-[family-name:var(--font-fraunces),Georgia,serif] text-xl font-medium tracking-tight text-indigo-950 dark:text-indigo-50'>
                                No lessons added yet
                            </h2>
                            <p className='mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400'>
                                Add a lesson for a service date to have it show up under the officiant in schedules and exports.
                            </p>
                        </div>
                        <button type='button' onClick={() => setEditing(blankDraft)} className={btnPrimary}>
                            + Add lesson
                        </button>
                    </div>
                )}

                {!loading && !error && sorted.length > 0 && (
                    <div className={tableWrap}>
                        <table className={table}>
                            <caption className='sr-only'>Lessons by service date.</caption>
                            <thead>
                                <tr className={tableHeadRow}>
                                    <th className={tableTh}>Day</th>
                                    <th className={tableTh}>Date</th>
                                    <th className={tableTh}>Time</th>
                                    <th className={tableTh}>First Lesson</th>
                                    <th className={tableTh}>Second Lesson</th>
                                    <th className={tableTh}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((l) => {
                                    return (
                                        <tr key={l.id} className={tableRow}>
                                            <td className={tableTd}>{l.dayOfWeek}</td>
                                            <td className={tableTd}>{formatDate(l.date)}</td>
                                            <td className={tableTd}>{formatTime12(l.time)}</td>
                                            <td className={tableTd}>{l.first_lesson || '—'}</td>
                                            <td className={tableTd}>
                                                {l.second_lesson ? l.second_lesson : <span className='text-stone-400 dark:text-stone-600'>N/A</span>}
                                            </td>
                                            <td className={tableTd}>
                                                <div className='flex flex-wrap items-center gap-1'>
                                                    <button
                                                        type='button'
                                                        onClick={() => setEditing({
                                                            id: l.id,
                                                            date: l.date,
                                                            first_lesson: l.first_lesson ?? '',
                                                            second_lesson: l.second_lesson ?? '',
                                                        })}
                                                        className={btnTableSecondary}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type='button'
                                                        onClick={() => setDeleting(l)}
                                                        className={btnDanger}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
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

                {editing && (
                    <LessonEditModal
                        lesson={editing}
                        onClose={() => setEditing(null)}
                        onSave={handleSave}
                    />
                )}

                {deleting && (
                    <DeleteConfirmModal
                        label={`the lesson for ${formatDate(deleting.date)}`}
                        onCancel={() => setDeleting(null)}
                        onConfirm={confirmDelete}
                    />
                )}
            </div>
        </SidebarLayout>
    );
}
