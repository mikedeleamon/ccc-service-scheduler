'use client';

import { useMemo, useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout/SidebarLayout';
import BackButton from '@/components/BackButton/BackButton';
import UploadSheetButton from '@/components/UploadSheetButton/UploadSheetButton';
import ViewScheduleButton from '@/components/ViewScheduleButton/ViewScheduleButton';
import AddPersonButton from '@/components/AddPersonButton/AddPersonButton';
import PersonDetailsModal from '@/components/modals/PersonDetailsModal';
import PersonEditModal from '@/components/modals/PersonEditModal';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import type { Person } from '@/types/types';
import { MOCK_PEOPLE as IMPORTED_MOCK } from '@/lib/mockPeople';
import { fullName } from '@/lib/rosterUtils';
import {
    btnDanger,
    btnTablePrimary,
    btnTableSecondary,
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

const MOCK_PEOPLE: Person[] = IMPORTED_MOCK;

function formatAvailability(availability: unknown): string {
    if (availability == null) return '—';
    if (typeof availability === 'string') return availability;
    try {
        return JSON.stringify(availability);
    } catch {
        return String(availability);
    }
}

function isSamePerson(a: Person, b: Person): boolean {
    const norm = (s: string | null | undefined) =>
        (s ?? '').trim().toLowerCase();
    const normDate = (s: string | null | undefined) => (s ?? '').trim();

    return (
        norm(a.first_name) === norm(b.first_name) &&
        norm(a.last_name) === norm(b.last_name) &&
        normDate(a.birth_date ?? '') === normDate(b.birth_date ?? '')
    );
}

export default function RosterPage() {
    const [people, setPeople] = useState<Person[]>(MOCK_PEOPLE);
    const [viewing, setViewing] = useState<Person | null>(null);
    const [editing, setEditing] = useState<Person | null>(null);
    const [deleting, setDeleting] = useState<Person | null>(null);
    const [page, setPage] = useState(1);

    const pageSize = 10;
    const totalRows = people.length;
    const showPagination = totalRows > 10;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);

    const pageRows = useMemo(() => {
        if (!showPagination) return people;
        const start = (safePage - 1) * pageSize;
        return people.slice(start, start + pageSize);
    }, [people, safePage, showPagination]);

    const handleSave = (updated: Person) => {
        setPeople((prev) => {
            const existingIndex = prev.findIndex((p) =>
                isSamePerson(p, updated),
            );

            if (existingIndex !== -1) {
                const existing = prev[existingIndex];
                const merged: Person = {
                    ...existing,
                    ...updated,
                    id: existing.id,
                };
                const next = [...prev];
                next[existingIndex] = merged;
                return next;
            }

            const nextId =
                (prev.reduce((m, p) => Math.max(m, p.id), 0) || 0) + 1;
            const toAdd: Person = { ...updated, id: nextId };
            return [...prev, toAdd];
        });
    };

    const handleAddPerson = () => {
        const blank: Person = {
            id: 0,
            first_name: '',
            last_name: '',
            birth_date: '',
            gender: '',
            phone: '',
            parish: '',
            email: '',
            rank: '',
            availability: null,
        };
        setEditing(blank);
    };

    const confirmDelete = () => {
        if (!deleting) return;
        const person = deleting;

        setPeople((prev) => prev.filter((p) => p.id !== person.id));
        setViewing((v) => (v?.id === person.id ? null : v));
        setEditing((e) => (e?.id === person.id ? null : e));
        setDeleting(null);
    };

    return (
        <SidebarLayout>
            <div className={`${pageContent} relative max-w-6xl`}>
                <div className='flex flex-col gap-6 sm:flex-row sm:items-start'>
                    <BackButton />
                    <header className='min-w-0 flex-1 space-y-4 pt-1 sm:pt-0'>
                        <div>
                            <h1 className={heading1}>Roster</h1>
                            <p className={`${lead} mt-2 max-w-xl`}>
                                Individuals who can officiate services.
                            </p>
                        </div>
                        <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap'>
                            <UploadSheetButton />
                            <ViewScheduleButton />
                            <AddPersonButton onClick={handleAddPerson} />
                        </div>
                    </header>
                </div>

                <div className={`${tableWrap} max-w-full`}>
                    <table className={`${table} min-w-[900px]`}>
                        <thead>
                            <tr className={tableHeadRow}>
                                <th className={tableTh}>Name</th>
                                <th className={tableTh}>Gender</th>
                                <th className={tableTh}>Rank</th>
                                <th className={tableTh}>Phone</th>
                                <th className={tableTh}>Availability</th>
                                <th className={tableTh}>Details</th>
                                <th className={tableTh}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageRows.map((p) => (
                                <tr key={p.id} className={tableRow}>
                                    <td
                                        className={`${tableTd} font-medium text-stone-900 dark:text-stone-100`}
                                    >
                                        {fullName(p)}
                                    </td>
                                    <td className={tableTd}>{p.gender}</td>
                                    <td className={tableTd}>{p.rank}</td>
                                    <td className={tableTd}>{p.phone}</td>
                                    <td className={`${tableTd} max-w-[320px]`}>
                                        <span className='block truncate font-mono text-xs text-stone-500 dark:text-stone-400'>
                                            {formatAvailability(
                                                p.availability,
                                            )}
                                        </span>
                                    </td>
                                    <td className={tableTd}>
                                        <button
                                            type='button'
                                            onClick={() => setViewing(p)}
                                            className={btnTablePrimary}
                                        >
                                            View details
                                        </button>
                                    </td>
                                    <td className={tableTd}>
                                        <div className='flex flex-wrap items-center gap-2'>
                                            <button
                                                type='button'
                                                onClick={() => setEditing(p)}
                                                className={btnTableSecondary}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => setDeleting(p)}
                                                className={btnDanger}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {pageRows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className='px-4 py-10 text-center text-stone-500 dark:text-stone-400'
                                    >
                                        No people found.
                                    </td>
                                </tr>
                            )}
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
                            >
                                Prev
                            </button>
                            <span className='min-w-[6rem] text-center text-sm text-stone-600 dark:text-stone-400'>
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
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {viewing && (
                    <PersonDetailsModal
                        person={viewing}
                        onClose={() => setViewing(null)}
                    />
                )}

                {editing && (
                    <PersonEditModal
                        person={editing}
                        onClose={() => setEditing(null)}
                        onSave={handleSave}
                    />
                )}

                {deleting && (
                    <DeleteConfirmModal
                        person={deleting}
                        onCancel={() => setDeleting(null)}
                        onConfirm={confirmDelete}
                    />
                )}
            </div>
        </SidebarLayout>
    );
}
