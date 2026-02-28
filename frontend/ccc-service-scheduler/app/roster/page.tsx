'use client';

import { useMemo, useState } from 'react';
import UploadSheetButton from '@/components/UploadSheetButton/UploadSheetButton';
import ViewScheduleButton from '@/components/ViewScheduleButton/ViewScheduleButton';
import AddPersonButton from '@/components/AddPersonButton/AddPersonButton';

type Person = {
    id: number;
    first_name: string;
    last_name: string;
    birth_date?: string | null; // YYYY-MM-DD
    gender: string;
    phone: string;
    parish?: string | null;
    email?: string | null;
    rank: string;
    availability?: unknown;
};

// Mock data until backend exposes a people endpoint.
const MOCK_PEOPLE: Person[] = [
    {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        birth_date: '1990-04-12',
        gender: 'male',
        phone: '+1 (555) 111-2222',
        parish: 'CCC Parish A',
        email: 'john.doe@example.com',
        rank: 'superior evangelist',
        availability: { sundays: true, wednesdays: true },
    },
    {
        id: 2,
        first_name: 'Jane',
        last_name: 'Smith',
        birth_date: '1994-09-03',
        gender: 'female',
        phone: '+1 (555) 333-4444',
        parish: 'CCC Parish A',
        email: 'jane.smith@example.com',
        rank: 'cape elder sister',
        availability: { sundays: true, wednesdays: false },
    },
];

function formatAvailability(availability: unknown): string {
    if (availability == null) return '—';
    if (typeof availability === 'string') return availability;
    try {
        return JSON.stringify(availability);
    } catch {
        return String(availability);
    }
}

function fullName(p: Person): string {
    return `${p.first_name} ${p.last_name}`;
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

type ModalShellProps = {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
};

function ModalShell({ title, children, onClose }: ModalShellProps) {
    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
            <div className='max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900'>
                <div className='mb-4 flex items-center justify-between gap-4'>
                    <h2 className='text-xl font-semibold text-zinc-900 dark:text-zinc-50'>
                        {title}
                    </h2>
                    <button
                        type='button'
                        onClick={onClose}
                        className='rounded-md bg-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600'
                    >
                        Close
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

type PersonDetailsProps = {
    person: Person;
    onClose: () => void;
};

function PersonDetailsModal({ person, onClose }: PersonDetailsProps) {
    const rows: Array<{ label: string; value: React.ReactNode }> = [
        // { label: 'id', value: person.id },
        { label: 'First Name', value: person.first_name },
        { label: 'Last Name', value: person.last_name },
        { label: 'Birth Date', value: person.birth_date ?? '—' },
        { label: 'Gender', value: person.gender },
        { label: 'Phone', value: person.phone },
        { label: 'Parish', value: person.parish ?? '—' },
        { label: 'Email', value: person.email ?? '—' },
        { label: 'Rank', value: person.rank },
        {
            label: 'Availability',
            value: formatAvailability(person.availability),
        },
    ];

    return (
        <ModalShell
            title={`Person details: ${fullName(person)}`}
            onClose={onClose}
        >
            <div className='rounded-lg border border-zinc-200 dark:border-zinc-800'>
                <dl className='divide-y divide-zinc-200 text-sm dark:divide-zinc-800'>
                    {rows.map((r) => (
                        <div
                            key={r.label}
                            className='grid grid-cols-3 gap-4 px-4 py-3'
                        >
                            <dt className='font-medium text-zinc-600 dark:text-zinc-400'>
                                {r.label}
                            </dt>
                            <dd className='col-span-2 text-zinc-900 dark:text-zinc-100'>
                                <span className='break-words font-mono text-xs'>
                                    {r.value}
                                </span>
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </ModalShell>
    );
}

type PersonEditProps = {
    person: Person;
    onClose: () => void;
    onSave: (updated: Person) => void;
};

function PersonEditModal({ person, onClose, onSave }: PersonEditProps) {
    const [draft, setDraft] = useState<Person>({ ...person });
    const [availabilityText, setAvailabilityText] = useState(() =>
        draft.availability == null
            ? ''
            : formatAvailability(draft.availability),
    );
    const [error, setError] = useState<string | null>(null);

    const update = <K extends keyof Person>(key: K, value: Person[K]) => {
        setDraft((p) => ({ ...p, [key]: value }));
    };

    const handleSave = () => {
        setError(null);

        let parsedAvailability: unknown = availabilityText.trim();
        if (availabilityText.trim() === '') parsedAvailability = null;
        else {
            try {
                parsedAvailability = JSON.parse(availabilityText);
            } catch {
                // Allow free-form string if not valid JSON
                parsedAvailability = availabilityText;
            }
        }

        const next: Person = {
            ...draft,
            availability: parsedAvailability,
        };

        if (!next.first_name.trim() || !next.last_name.trim()) {
            setError('First name and last name are required.');
            return;
        }
        if (!next.gender.trim()) {
            setError('Gender is required.');
            return;
        }
        if (!next.phone.trim()) {
            setError('Phone is required.');
            return;
        }
        if (!next.rank.trim()) {
            setError('Rank is required.');
            return;
        }

        onSave(next);
        onClose();
    };

    return (
        <ModalShell
            title={`Edit person: ${fullName(person)}`}
            onClose={onClose}
        >
            <div className='space-y-4'>
                {error && (
                    <div className='rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200'>
                        {error}
                    </div>
                )}

                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    <div className='space-y-1'>
                        <label className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                            First Name
                        </label>
                        <input
                            value={draft.first_name}
                            onChange={(e) =>
                                update('first_name', e.target.value)
                            }
                            className='w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100'
                        />
                    </div>

                    <div className='space-y-1'>
                        <label className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                            Last Name
                        </label>
                        <input
                            value={draft.last_name}
                            onChange={(e) =>
                                update('last_name', e.target.value)
                            }
                            className='w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100'
                        />
                    </div>

                    <div className='space-y-1'>
                        <label className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                            Birth Date
                        </label>
                        <input
                            value={draft.birth_date ?? ''}
                            onChange={(e) =>
                                update('birth_date', e.target.value)
                            }
                            placeholder='YYYY-MM-DD'
                            className='w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100'
                        />
                    </div>

                    <div className='space-y-1'>
                        <label className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                            Gender
                        </label>
                        <input
                            value={draft.gender}
                            onChange={(e) => update('gender', e.target.value)}
                            className='w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100'
                        />
                    </div>

                    <div className='space-y-1'>
                        <label className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                            Phone
                        </label>
                        <input
                            value={draft.phone}
                            onChange={(e) => update('phone', e.target.value)}
                            className='w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100'
                        />
                    </div>

                    <div className='space-y-1'>
                        <label className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                            Parish
                        </label>
                        <input
                            value={draft.parish ?? ''}
                            onChange={(e) => update('parish', e.target.value)}
                            className='w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100'
                        />
                    </div>

                    <div className='space-y-1 sm:col-span-2'>
                        <label className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                            Email
                        </label>
                        <input
                            value={draft.email ?? ''}
                            onChange={(e) => update('email', e.target.value)}
                            className='w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100'
                        />
                    </div>

                    <div className='space-y-1 sm:col-span-2'>
                        <label className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                            Rank
                        </label>
                        <input
                            value={draft.rank}
                            onChange={(e) => update('rank', e.target.value)}
                            className='w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100'
                        />
                    </div>

                    <div className='space-y-1 sm:col-span-2'>
                        <label className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                            Availability (JSON or text)
                        </label>
                        <textarea
                            value={availabilityText}
                            onChange={(e) =>
                                setAvailabilityText(e.target.value)
                            }
                            rows={4}
                            placeholder='e.g. {"sundays": true, "wednesdays": false}'
                            className='w-full rounded border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100'
                        />
                    </div>
                </div>

                <div className='flex items-center justify-end gap-2'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='rounded border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        onClick={handleSave}
                        className='rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700'
                    >
                        Save
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

type DeleteConfirmModalProps = {
    person: Person;
    onCancel: () => void;
    onConfirm: () => void;
};

function DeleteConfirmModal({
    person,
    onCancel,
    onConfirm,
}: DeleteConfirmModalProps) {
    return (
        <ModalShell
            title='Delete person?'
            onClose={onCancel}
        >
            <div className='space-y-4'>
                <p className='text-sm text-zinc-700 dark:text-zinc-300'>
                    This will permanently remove{' '}
                    <span className='font-semibold text-zinc-900 dark:text-zinc-50'>
                        {fullName(person)}
                    </span>
                    {person.birth_date ? ` (${person.birth_date})` : ''} from
                    the roster.
                </p>
                <div className='flex items-center justify-end gap-2'>
                    <button
                        type='button'
                        onClick={onCancel}
                        className='rounded border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        onClick={onConfirm}
                        className='rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700'
                    >
                        Delete
                    </button>
                </div>
            </div>
        </ModalShell>
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

            // Update existing person matched by first_name, last_name, birth_date
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

            // Otherwise treat as new person, assign next id
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
        <div className='flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black'>
            <main className='flex min-h-screen w-full max-w-6xl flex-col gap-8 py-16 px-8 bg-white dark:bg-black'>
                <header className='space-y-2'>
                    <h1 className='text-3xl font-semibold tracking-tight text-black dark:text-zinc-50'>
                        Roster
                    </h1>
                    <p className='text-zinc-600 dark:text-zinc-400'>
                        Individuals who can officiate services.
                    </p>
                    <div className='flex flex-col gap-3 pt-2 sm:flex-row'>
                        <UploadSheetButton />
                        <ViewScheduleButton />
                        <AddPersonButton onClick={handleAddPerson} />
                    </div>
                </header>

                <div className='w-full overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800'>
                    <table className='w-full min-w-[900px] text-left text-sm text-zinc-800 dark:text-zinc-200'>
                        <thead>
                            <tr className='border-b border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800'>
                                <th className='px-4 py-3 font-semibold'>
                                    Name
                                </th>
                                <th className='px-4 py-3 font-semibold'>
                                    Gender
                                </th>
                                <th className='px-4 py-3 font-semibold'>
                                    Rank
                                </th>
                                <th className='px-4 py-3 font-semibold'>
                                    Phone
                                </th>
                                <th className='px-4 py-3 font-semibold'>
                                    Availability
                                </th>
                                <th className='px-4 py-3 font-semibold'>
                                    Details
                                </th>
                                <th className='px-4 py-3 font-semibold'>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageRows.map((p) => (
                                <tr
                                    key={p.id}
                                    className='border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                >
                                    <td className='px-4 py-3 font-medium'>
                                        {fullName(p)}
                                    </td>
                                    <td className='px-4 py-3'>{p.gender}</td>
                                    <td className='px-4 py-3'>{p.rank}</td>
                                    <td className='px-4 py-3'>{p.phone}</td>
                                    <td className='px-4 py-3 max-w-[320px]'>
                                        <span className='block truncate font-mono text-xs text-zinc-600 dark:text-zinc-400'>
                                            {formatAvailability(p.availability)}
                                        </span>
                                    </td>
                                    <td className='px-4 py-3'>
                                        <button
                                            type='button'
                                            onClick={() => setViewing(p)}
                                            className='rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700'
                                        >
                                            View details
                                        </button>
                                    </td>
                                    <td className='px-4 py-3'>
                                        <div className='flex flex-wrap items-center gap-2'>
                                            <button
                                                type='button'
                                                onClick={() => setEditing(p)}
                                                className='rounded border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => setDeleting(p)}
                                                className='rounded border border-red-200 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:bg-zinc-900 dark:text-red-200 dark:hover:bg-red-900/20'
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
                                        className='px-4 py-8 text-center text-zinc-500 dark:text-zinc-400'
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
            </main>
        </div>
    );
}
