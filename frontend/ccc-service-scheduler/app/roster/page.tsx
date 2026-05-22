'use client';

import { useEffect, useMemo, useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout/SidebarLayout';
import BackButton from '@/components/BackButton/BackButton';
import UploadSheetButton from '@/components/UploadSheetButton/UploadSheetButton';
import ViewScheduleButton from '@/components/ViewScheduleButton/ViewScheduleButton';
import AddPersonButton from '@/components/AddPersonButton/AddPersonButton';
import PersonDetailsModal from '@/components/modals/PersonDetailsModal';
import PersonEditModal from '@/components/modals/PersonEditModal';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import type { Person } from '@/types/types';
import { formatAvailability, fullName } from '@/lib/rosterUtils';
import { api } from '@/lib/api';
import { useParish } from '@/lib/ParishContext';
import {
    heading1,
    inputBase,
    lead,
    pageContent,
    selectBase,
    table,
    tableHeadRow,
    tableRow,
    tableTd,
    tableTh,
    tableWrap,
} from '@/lib/ui';

export default function RosterPage() {
    const { parish } = useParish();
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [viewing, setViewing] = useState<Person | null>(null);
    const [editing, setEditing] = useState<Person | null>(null);
    const [deleting, setDeleting] = useState<Person | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [rankFilter, setRankFilter] = useState('');
    const [genderFilter, setGenderFilter] = useState('');

    useEffect(() => {
        setLoading(true);
        const params = parish ? `?parish=${encodeURIComponent(parish)}` : '';
        api(`/people${params}`)
            .then((data) => setPeople(Array.isArray(data) ? data : []))
            .catch((err) => setError(err.message ?? 'Failed to load roster'))
            .finally(() => setLoading(false));
    }, [parish]);

    const ranks = useMemo(() => {
        const set = new Set(people.map((p) => p.rank).filter(Boolean));
        return Array.from(set).sort();
    }, [people]);

    const genders = useMemo(() => {
        const set = new Set(people.map((p) => p.gender).filter(Boolean) as string[]);
        return Array.from(set).sort();
    }, [people]);

    const filtered = useMemo(() => {
        let list = people;
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(
                (p) =>
                    p.first_name.toLowerCase().includes(q) ||
                    p.last_name.toLowerCase().includes(q) ||
                    (p.email && p.email.toLowerCase().includes(q)) ||
                    (p.phone && p.phone.includes(q)),
            );
        }
        if (rankFilter) list = list.filter((p) => p.rank === rankFilter);
        if (genderFilter) list = list.filter((p) => p.gender === genderFilter);
        return list;
    }, [people, search, rankFilter, genderFilter]);

    useEffect(() => { setPage(1); }, [search, rankFilter, genderFilter]);

    const pageSize = 10;
    const totalRows = filtered.length;
    const showPagination = totalRows > pageSize;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);

    const pageRows = useMemo(() => {
        if (!showPagination) return filtered;
        const start = (safePage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, safePage, showPagination]);

    const handleSave = async (updated: Person) => {
        setSaveError(null);
        try {
            if (updated.id && updated.id > 0) {
                const saved = await api(`/people/${updated.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updated),
                });
                setPeople((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
            } else {
                const created = await api('/people', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updated),
                });
                setPeople((prev) => [...prev, created]);
            }
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Failed to save person. Please try again.');
        }
    };

    const handleAddPerson = () => {
        setEditing({
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
        });
    };

    const confirmDelete = async () => {
        if (!deleting) return;
        const person = deleting;
        setDeleting(null);
        setDeleteError(null);
        try {
            await api(`/people/${person.id}`, { method: 'DELETE' });
            setPeople((prev) => prev.filter((p) => p.id !== person.id));
            if (viewing?.id === person.id) setViewing(null);
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Failed to delete person. Please try again.');
        }
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

                {/* Operation error banners */}
                {saveError && (
                    <div className='rounded-2xl border border-red-200/80 bg-red-50/90 p-4 dark:border-red-900/50 dark:bg-red-950/40'>
                        <p className='text-sm text-red-800 dark:text-red-200'>{saveError}</p>
                    </div>
                )}
                {deleteError && (
                    <div className='rounded-2xl border border-red-200/80 bg-red-50/90 p-4 dark:border-red-900/50 dark:bg-red-950/40'>
                        <p className='text-sm text-red-800 dark:text-red-200'>{deleteError}</p>
                    </div>
                )}

                {/* Fetch error */}
                {error && (
                    <div className='rounded-2xl border border-red-200/80 bg-red-50/90 p-4 dark:border-red-900/50 dark:bg-red-950/40'>
                        <p className='text-sm text-red-800 dark:text-red-200'>{error}</p>
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && (
                    <div className={`${tableWrap} max-w-full`}>
                        <table className={`${table} min-w-[660px]`}>
                            <thead>
                                <tr className={tableHeadRow}>
                                    <th className={tableTh}>Name</th>
                                    <th className={tableTh}>Gender</th>
                                    <th className={tableTh}>Rank</th>
                                    <th className={tableTh}>Phone</th>
                                    <th className={tableTh}>Availability</th>
                                    <th className={tableTh} />
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className='border-b border-stone-100 dark:border-stone-800/90'>
                                        <td className={tableTd}><div className='h-3.5 w-32 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700' /></td>
                                        <td className={tableTd}><div className='h-3.5 w-12 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700' /></td>
                                        <td className={tableTd}><div className='h-3.5 w-24 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700' /></td>
                                        <td className={tableTd}><div className='h-3.5 w-24 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700' /></td>
                                        <td className={tableTd}><div className='h-3.5 w-36 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700' /></td>
                                        <td className={tableTd} />
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Filters */}
                {!loading && !error && people.length > 0 && (
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
                        <div className='flex-1'>
                            <label className='mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400'>Search</label>
                            <div className='relative'>
                                <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400' aria-hidden>
                                    <path strokeLinecap='round' strokeLinejoin='round' d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z' />
                                </svg>
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder='Name, email, or phone…'
                                    className={`${inputBase} pl-9`}
                                />
                            </div>
                        </div>
                        <div className='w-full sm:w-44'>
                            <label className='mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400'>Rank</label>
                            <select value={rankFilter} onChange={(e) => setRankFilter(e.target.value)} className={selectBase}>
                                <option value=''>All ranks</option>
                                {ranks.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div className='w-full sm:w-36'>
                            <label className='mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400'>Gender</label>
                            <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className={selectBase}>
                                <option value=''>All</option>
                                {genders.map((g) => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        {(search || rankFilter || genderFilter) && (
                            <button
                                type='button'
                                onClick={() => { setSearch(''); setRankFilter(''); setGenderFilter(''); }}
                                className='shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200'
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && people.length === 0 && (
                    <div className='flex flex-col items-center justify-center gap-6 rounded-[1.35rem] border border-dashed border-stone-300 bg-stone-50/60 px-8 py-20 text-center dark:border-stone-600 dark:bg-stone-900/30'>
                        <div className='flex size-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950/60'>
                            <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='size-8 text-indigo-500 dark:text-indigo-400' aria-hidden>
                                <path strokeLinecap='round' strokeLinejoin='round' d='M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z' />
                            </svg>
                        </div>
                        <div className='max-w-sm'>
                            <h2 className='font-[family-name:var(--font-fraunces),Georgia,serif] text-xl font-medium tracking-tight text-indigo-950 dark:text-indigo-50'>
                                No one on the roster yet
                            </h2>
                            <p className='mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400'>
                                Upload a spreadsheet to import people in bulk, or add someone manually using the button above.
                            </p>
                        </div>
                        <div className='flex flex-col gap-3 sm:flex-row'>
                            <UploadSheetButton />
                            <AddPersonButton onClick={handleAddPerson} />
                        </div>
                    </div>
                )}

                {/* No results from filter */}
                {!loading && !error && people.length > 0 && filtered.length === 0 && (
                    <div className='rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 px-8 py-12 text-center dark:border-stone-600 dark:bg-stone-900/30'>
                        <p className='text-sm text-stone-500 dark:text-stone-400'>No people match your filters.</p>
                    </div>
                )}

                {/* Data table — rows are clickable to open the details modal */}
                {!loading && !error && filtered.length > 0 && (
                    <div className={`${tableWrap} max-w-full`}>
                        <table className={`${table} min-w-[660px]`}>
                            <thead>
                                <tr className={tableHeadRow}>
                                    <th className={tableTh}>Name</th>
                                    <th className={tableTh}>Gender</th>
                                    <th className={tableTh}>Rank</th>
                                    <th className={tableTh}>Phone</th>
                                    <th className={tableTh}>Availability</th>
                                    <th className={tableTh} />
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((p) => (
                                    <tr
                                        key={p.id}
                                        className={`${tableRow} cursor-pointer`}
                                        onClick={() => setViewing(p)}
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && setViewing(p)}
                                        aria-label={`View details for ${fullName(p)}`}
                                    >
                                        <td className={`${tableTd} font-medium text-stone-900 dark:text-stone-100`}>
                                            {fullName(p)}
                                        </td>
                                        <td className={tableTd}>{p.gender ?? '—'}</td>
                                        <td className={tableTd}>{p.rank}</td>
                                        <td className={tableTd}>{p.phone ?? '—'}</td>
                                        <td className={`${tableTd} max-w-[280px]`}>
                                            <span className='block truncate text-sm text-stone-600 dark:text-stone-300'>
                                                {formatAvailability(p.availability)}
                                            </span>
                                        </td>
                                        <td className={`${tableTd} w-6 text-right`}>
                                            <span className='text-stone-300 dark:text-stone-600' aria-hidden>›</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
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
                            >
                                Prev
                            </button>
                            <span className='min-w-[6rem] text-center text-sm text-stone-600 dark:text-stone-400'>
                                Page {safePage} of {totalPages}
                            </span>
                            <button
                                type='button'
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={safePage === totalPages}
                                className='rounded-2xl border border-stone-300/90 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-stone-50 disabled:opacity-40 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800'
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Modals */}
                {viewing && (
                    <PersonDetailsModal
                        person={viewing}
                        onClose={() => setViewing(null)}
                        onEdit={(p) => { setViewing(null); setEditing(p); }}
                        onDelete={(p) => { setViewing(null); setDeleting(p); }}
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
                        label={fullName(deleting)}
                        onCancel={() => setDeleting(null)}
                        onConfirm={confirmDelete}
                    />
                )}
            </div>
        </SidebarLayout>
    );
}
