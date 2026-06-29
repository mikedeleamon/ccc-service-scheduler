'use client';

import { useEffect, useState } from 'react';
import ModalShell from './ModalShell';
import { btnDanger, btnPrimary, btnSecondary, selectBase } from '@/lib/ui';
import { api } from '@/lib/api';

type Service = {
    id: number;
    date: string;
    time: string | null;
    service_type: string;
    parish: string | null;
};

type Assignment = {
    id: number;
    service_id: number;
    person_id: number;
    role: string;
    confirmed: boolean;
};

type Person = {
    id: number;
    first_name: string;
    last_name: string;
};

type Props = {
    service: Service;
    parish: string | null;
    onClose: () => void;
    onEdit: (service: Service) => void;
    onDelete: (service: Service) => void;
};

const ALL_ROLES = [
    'Service Conductor',
    '1st member prayer',
    '2nd member prayer',
    '3rd member prayer',
    '1st lesson',
    '2nd lesson',
    'Preacher',
    'Closing prayer',
];

function formatDate(iso: string): string {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function ServiceDetailsModal({ service, parish, onClose, onEdit, onDelete }: Props) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [peopleMap, setPeopleMap] = useState<Map<number, string>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Add-officiant form state
    const [adding, setAdding] = useState(false);
    const [newPersonId, setNewPersonId] = useState('');
    const [newRole, setNewRole] = useState('');
    const [addError, setAddError] = useState<string | null>(null);
    const [addSaving, setAddSaving] = useState(false);

    // Per-row action state
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    useEffect(() => {
        const peopleParams = parish ? `?parish=${encodeURIComponent(parish)}` : '';
        Promise.all([
            api(`/assignments?service_id=${service.id}`),
            api(`/people${peopleParams}`),
        ])
            .then(([assignmentsData, peopleData]: [Assignment[], Person[]]) => {
                setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
                const list = Array.isArray(peopleData) ? peopleData : [];
                setPeople(list);
                const map = new Map<number, string>();
                for (const p of list) map.set(p.id, `${p.first_name} ${p.last_name}`);
                setPeopleMap(map);
            })
            .catch((err) => setError(err.message ?? 'Failed to load assignments.'))
            .finally(() => setLoading(false));
    }, [service.id, parish]);

    const handleRemove = async (id: number) => {
        setRemovingId(id);
        try {
            await api(`/assignments/${id}`, { method: 'DELETE' });
            setAssignments((prev) => prev.filter((a) => a.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove assignment.');
        } finally {
            setRemovingId(null);
        }
    };

    const handleToggleConfirmed = async (assignment: Assignment) => {
        setTogglingId(assignment.id);
        try {
            const updated = await api(`/assignments/${assignment.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmed: !assignment.confirmed }),
            });
            setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update assignment.');
        } finally {
            setTogglingId(null);
        }
    };

    const handleAddOfficiant = async () => {
        if (!newPersonId) { setAddError('Select a person.'); return; }
        if (!newRole) { setAddError('Select a role.'); return; }
        setAddSaving(true);
        setAddError(null);
        try {
            const created = await api('/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ service_id: service.id, person_id: Number(newPersonId), role: newRole }),
            });
            setAssignments((prev) => [...prev, created]);
            setAdding(false);
            setNewPersonId('');
            setNewRole('');
        } catch (err) {
            setAddError(err instanceof Error ? err.message : 'Failed to add assignment.');
        } finally {
            setAddSaving(false);
        }
    };

    const details: Array<{ label: string; value: React.ReactNode }> = [
        { label: 'Date', value: formatDate(service.date) },
        { label: 'Time', value: service.time ? formatTime(service.time) : '—' },
        { label: 'Service type', value: service.service_type },
        { label: 'Parish', value: service.parish ?? '—' },
    ];

    return (
        <ModalShell title={service.service_type} onClose={onClose}>
            <div className='space-y-5'>
                {/* Service details */}
                <div className='overflow-hidden rounded-xl border border-stone-200/90 dark:border-stone-600/80'>
                    <dl className='divide-y divide-stone-200 text-sm dark:divide-stone-700/80'>
                        {details.map((row) => (
                            <div key={row.label} className='grid grid-cols-3 gap-4 px-4 py-3'>
                                <dt className='font-medium text-stone-500 dark:text-stone-400'>{row.label}</dt>
                                <dd className='col-span-2 font-mono text-xs text-stone-900 dark:text-stone-100'>
                                    {row.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* Assigned officiants */}
                <div>
                    <div className='mb-2 flex items-center justify-between'>
                        <h3 className='text-sm font-semibold text-stone-700 dark:text-stone-300'>
                            Assigned officiants
                        </h3>
                        {!adding && !loading && (
                            <button
                                type='button'
                                onClick={() => { setAdding(true); setAddError(null); }}
                                className='inline-flex items-center gap-1 rounded-xl border border-stone-300/90 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800'
                            >
                                <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor' className='size-3' aria-hidden>
                                    <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
                                </svg>
                                Add officiant
                            </button>
                        )}
                    </div>

                    {error && (
                        <p className='mb-2 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200'>
                            {error}
                        </p>
                    )}

                    {loading && (
                        <div className='space-y-2'>
                            {[1, 2].map((i) => (
                                <div key={i} className='h-9 animate-pulse rounded-xl bg-stone-100 dark:bg-stone-800' />
                            ))}
                        </div>
                    )}

                    {!loading && (
                        <div className='overflow-hidden rounded-xl border border-stone-200/90 dark:border-stone-600/80'>
                            <table className='w-full text-left text-sm'>
                                <thead>
                                    <tr className='border-b border-stone-200 bg-stone-50/80 dark:border-stone-700/90 dark:bg-stone-800/50'>
                                        <th className='px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400'>Name</th>
                                        <th className='px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400'>Role</th>
                                        <th className='px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400'>Confirmed</th>
                                        <th className='px-4 py-2.5' />
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.length === 0 && !adding && (
                                        <tr>
                                            <td colSpan={4} className='px-4 py-4 text-sm text-stone-400 dark:text-stone-500'>
                                                No officiants assigned yet.
                                            </td>
                                        </tr>
                                    )}
                                    {assignments.map((a) => (
                                        <tr key={a.id} className='border-b border-stone-100 last:border-0 dark:border-stone-800/90'>
                                            <td className='px-4 py-3 text-stone-900 dark:text-stone-100'>
                                                {peopleMap.get(a.person_id) ?? `Person #${a.person_id}`}
                                            </td>
                                            <td className='px-4 py-3 text-stone-700 dark:text-stone-300'>{a.role}</td>
                                            <td className='px-4 py-3'>
                                                <button
                                                    type='button'
                                                    onClick={() => handleToggleConfirmed(a)}
                                                    disabled={togglingId === a.id}
                                                    title='Click to toggle'
                                                    className='disabled:opacity-50'
                                                >
                                                    {a.confirmed ? (
                                                        <span className='inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60'>
                                                            <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={2.5} stroke='currentColor' className='size-3' aria-hidden>
                                                                <path strokeLinecap='round' strokeLinejoin='round' d='m4.5 12.75 6 6 9-13.5' />
                                                            </svg>
                                                            Yes
                                                        </span>
                                                    ) : (
                                                        <span className='inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500 transition hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700'>
                                                            Pending
                                                        </span>
                                                    )}
                                                </button>
                                            </td>
                                            <td className='px-4 py-3 text-right'>
                                                <button
                                                    type='button'
                                                    onClick={() => handleRemove(a.id)}
                                                    disabled={removingId === a.id}
                                                    aria-label='Remove officiant'
                                                    className='rounded-lg p-1 text-stone-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950/40 dark:hover:text-red-400'
                                                >
                                                    {removingId === a.id ? (
                                                        <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='size-4 animate-spin'>
                                                            <path strokeLinecap='round' strokeLinejoin='round' d='M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99' />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='size-4'>
                                                            <path strokeLinecap='round' strokeLinejoin='round' d='M6 18 18 6M6 6l12 12' />
                                                        </svg>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Inline add form */}
                                    {adding && (
                                        <tr className='border-t border-indigo-100 bg-indigo-50/40 dark:border-indigo-900/40 dark:bg-indigo-950/20'>
                                            <td className='px-3 py-2.5'>
                                                <select
                                                    value={newPersonId}
                                                    onChange={(e) => setNewPersonId(e.target.value)}
                                                    className='w-full rounded-xl border border-stone-300/90 bg-white px-2 py-1.5 text-xs text-stone-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100'
                                                >
                                                    <option value=''>Select person…</option>
                                                    {people.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.first_name} {p.last_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className='px-3 py-2.5'>
                                                <select
                                                    value={newRole}
                                                    onChange={(e) => setNewRole(e.target.value)}
                                                    className='w-full rounded-xl border border-stone-300/90 bg-white px-2 py-1.5 text-xs text-stone-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100'
                                                >
                                                    <option value=''>Select role…</option>
                                                    {ALL_ROLES.map((r) => (
                                                        <option key={r} value={r}>{r}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className='px-3 py-2.5' />
                                            <td className='px-3 py-2.5'>
                                                <div className='flex items-center justify-end gap-1.5'>
                                                    <button
                                                        type='button'
                                                        onClick={() => { setAdding(false); setAddError(null); setNewPersonId(''); setNewRole(''); }}
                                                        className='rounded-lg px-2 py-1 text-xs text-stone-500 transition hover:bg-stone-100 dark:hover:bg-stone-800'
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type='button'
                                                        onClick={handleAddOfficiant}
                                                        disabled={addSaving}
                                                        className='rounded-lg bg-indigo-700 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-indigo-600 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500'
                                                    >
                                                        {addSaving ? 'Adding…' : 'Add'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {addError && (
                                <p className='border-t border-red-200/80 bg-red-50/90 px-4 py-2.5 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200'>
                                    {addError}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className='flex items-center justify-between border-t border-stone-200/80 pt-4 dark:border-stone-700/60'>
                    <button type='button' onClick={() => onDelete(service)} className={btnDanger}>
                        Delete
                    </button>
                    <button type='button' onClick={() => onEdit(service)} className={btnPrimary}>
                        Edit service
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}
