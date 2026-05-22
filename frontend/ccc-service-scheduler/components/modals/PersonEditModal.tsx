'use client';

import { useState } from 'react';
import { Rank, RANKS_BY_GENDER } from '@/constants/rank';
import { Gender } from '@/constants/gender';
import type { Person, PersonEditProps } from '@/types/types';
import { fullName } from '@/lib/rosterUtils';
import ModalShell from '@/components/modals/ModalShell';
import { btnPrimary, btnSecondary, inputBase, selectBase } from '@/lib/ui';

const DAYS: { key: string; label: string }[] = [
    { key: 'sundays',    label: 'Sun' },
    { key: 'mondays',    label: 'Mon' },
    { key: 'tuesdays',  label: 'Tue' },
    { key: 'wednesdays', label: 'Wed' },
    { key: 'thursdays',  label: 'Thu' },
    { key: 'fridays',    label: 'Fri' },
    { key: 'saturdays',  label: 'Sat' },
];

function parseAvailability(raw: unknown): Record<string, boolean> {
    const defaults = Object.fromEntries(DAYS.map((d) => [d.key, false]));
    if (raw == null) return defaults;
    let parsed: unknown = raw;
    if (typeof raw === 'string') {
        try { parsed = JSON.parse(raw); } catch { return defaults; }
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return defaults;
    const obj = parsed as Record<string, unknown>;
    const result = { ...defaults };
    for (const key of Object.keys(result)) {
        if (key in obj) result[key] = obj[key] === true;
    }
    return result;
}

export default function PersonEditModal({ person, onClose, onSave }: PersonEditProps) {
    const [draft, setDraft] = useState<Person>({ ...person });
    const [days, setDays] = useState<Record<string, boolean>>(() => parseAvailability(person.availability));
    const [error, setError] = useState<string | null>(null);

    const update = <K extends keyof Person>(key: K, value: Person[K]) =>
        setDraft((p) => ({ ...p, [key]: value }));

    const toggleDay = (key: string) =>
        setDays((prev) => ({ ...prev, [key]: !prev[key] }));

    const handleSave = () => {
        setError(null);

        const next: Person = { ...draft, availability: days };

        if (!next.first_name.trim() || !next.last_name.trim()) {
            setError('First name and last name are required.');
            return;
        }
        if (!next.gender?.trim()) {
            setError('Gender is required.');
            return;
        }
        if (!next.phone?.trim()) {
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

    const isNew = !person.id || person.id === 0;

    return (
        <ModalShell
            title={isNew ? 'Add person' : `Edit: ${fullName(person)}`}
            onClose={onClose}
        >
            <div className='space-y-4'>
                {error && (
                    <div className='rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200'>
                        {error}
                    </div>
                )}

                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    <div className='space-y-1'>
                        <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>First Name</label>
                        <input value={draft.first_name} onChange={(e) => update('first_name', e.target.value)} className={inputBase} />
                    </div>

                    <div className='space-y-1'>
                        <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>Last Name</label>
                        <input value={draft.last_name} onChange={(e) => update('last_name', e.target.value)} className={inputBase} />
                    </div>

                    <div className='space-y-1'>
                        <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>Birth Date</label>
                        <input
                            type='date'
                            value={draft.birth_date ?? ''}
                            onChange={(e) => update('birth_date', e.target.value)}
                            className={inputBase}
                        />
                    </div>

                    <div className='space-y-1'>
                        <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>Gender</label>
                        <select
                            value={draft.gender ?? ''}
                            onChange={(e) => update('gender', e.target.value)}
                            className={selectBase}
                        >
                            <option value=''>Select gender</option>
                            <option value={Gender.MALE}>{Gender.MALE}</option>
                            <option value={Gender.FEMALE}>{Gender.FEMALE}</option>
                        </select>
                    </div>

                    <div className='space-y-1'>
                        <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>Phone</label>
                        <input value={draft.phone ?? ''} onChange={(e) => update('phone', e.target.value)} className={inputBase} />
                    </div>

                    <div className='space-y-1'>
                        <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>Parish</label>
                        <input value={draft.parish ?? ''} onChange={(e) => update('parish', e.target.value)} className={inputBase} />
                    </div>

                    <div className='space-y-1 sm:col-span-2'>
                        <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>Email</label>
                        <input value={draft.email ?? ''} onChange={(e) => update('email', e.target.value)} className={inputBase} />
                    </div>

                    <div className='space-y-1 sm:col-span-2'>
                        <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>Rank</label>
                        {!draft.gender && (
                            <p className='text-xs text-stone-400 dark:text-stone-500'>Select gender first — ranks are gender-specific.</p>
                        )}
                        <select
                            value={draft.rank}
                            onChange={(e) => update('rank', e.target.value as Rank)}
                            disabled={!draft.gender}
                            className={`${selectBase} disabled:opacity-50`}
                        >
                            <option value=''>Select rank</option>
                            {draft.gender &&
                                RANKS_BY_GENDER[draft.gender as Gender].map((rank) => (
                                    <option key={rank} value={rank}>{rank}</option>
                                ))}
                        </select>
                    </div>

                    <div className='space-y-2 sm:col-span-2'>
                        <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>Availability</label>
                        <div className='flex flex-wrap gap-2'>
                            {DAYS.map(({ key, label }) => (
                                <button
                                    key={key}
                                    type='button'
                                    onClick={() => toggleDay(key)}
                                    aria-pressed={days[key]}
                                    className={[
                                        'select-none rounded-xl border px-3.5 py-1.5 text-sm font-medium transition',
                                        days[key]
                                            ? 'border-indigo-600 bg-indigo-700 text-white shadow-sm dark:border-indigo-400 dark:bg-indigo-500'
                                            : 'border-stone-300/90 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-300 dark:hover:bg-stone-800',
                                    ].join(' ')}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className='flex items-center justify-end gap-3 pt-2'>
                    <button type='button' onClick={onClose} className={btnSecondary}>Cancel</button>
                    <button type='button' onClick={handleSave} className={btnPrimary}>Save</button>
                </div>
            </div>
        </ModalShell>
    );
}
