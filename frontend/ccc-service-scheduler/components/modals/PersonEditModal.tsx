'use client';

import { useState } from 'react';
import { Rank, RANKS_BY_GENDER } from '@/constants/rank';
import { Gender } from '@/constants/gender';
import type { Person, PersonEditProps } from '@/types/types';
import { formatAvailability, fullName } from '@/lib/rosterUtils';
import ModalShell from '@/components/modals/ModalShell';
import {
    btnPrimary,
    btnSecondary,
    inputBase,
    selectBase,
} from '@/lib/ui';

export default function PersonEditModal({
    person,
    onClose,
    onSave,
}: PersonEditProps) {
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
                    <div className='rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200'>
                        {error}
                    </div>
                )}

                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    <div className='space-y-1'>
                        <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>
                            First Name
                        </label>
                        <input
                            value={draft.first_name}
                            onChange={(e) =>
                                update('first_name', e.target.value)
                            }
                            className={inputBase}
                        />
                    </div>

                    <div className='space-y-1'>
                        <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>
                            Last Name
                        </label>
                        <input
                            value={draft.last_name}
                            onChange={(e) =>
                                update('last_name', e.target.value)
                            }
                            className={inputBase}
                        />
                    </div>

                    <div className='space-y-1'>
                        <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>
                            Birth Date
                        </label>
                        <input
                            type='date'
                            value={draft.birth_date ?? ''}
                            onChange={(e) =>
                                update('birth_date', e.target.value)
                            }
                            placeholder='YYYY-MM-DD'
                            className={inputBase}
                        />
                    </div>

                    <div className='space-y-1'>
                        <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>
                            Gender
                        </label>

                        <select
                            value={draft.gender}
                            onChange={(e) => update('gender', e.target.value)}
                            className={selectBase}
                        >
                            <option value=''>Select gender</option>
                            <option value={Gender.MALE}>{Gender.MALE}</option>
                            <option value={Gender.FEMALE}>
                                {Gender.FEMALE}
                            </option>
                        </select>
                    </div>

                    <div className='space-y-1'>
                        <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>
                            Phone
                        </label>
                        <input
                            value={draft.phone}
                            onChange={(e) => update('phone', e.target.value)}
                            className={inputBase}
                        />
                    </div>

                    <div className='space-y-1'>
                        <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>
                            Parish
                        </label>
                        <input
                            value={draft.parish ?? ''}
                            onChange={(e) => update('parish', e.target.value)}
                            className={inputBase}
                        />
                    </div>

                    <div className='space-y-1 sm:col-span-2'>
                        <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>
                            Email
                        </label>
                        <input
                            value={draft.email ?? ''}
                            onChange={(e) => update('email', e.target.value)}
                            className={inputBase}
                        />
                    </div>

                    <div className='space-y-1 sm:col-span-2'>
                        <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>
                            Rank
                        </label>
                        <select
                            value={draft.rank}
                            onChange={(e) =>
                                update('rank', e.target.value as Rank)
                            }
                            disabled={!draft.gender}
                            className={`${selectBase} disabled:opacity-50`}
                        >
                            <option value=''>Select rank</option>

                            {draft.gender &&
                                RANKS_BY_GENDER[draft.gender as Gender].map(
                                    (rank) => (
                                        <option
                                            key={rank}
                                            value={rank}
                                        >
                                            {rank}
                                        </option>
                                    ),
                                )}
                        </select>
                    </div>

                    <div className='space-y-1 sm:col-span-2'>
                        <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>
                            Availability (JSON or text)
                        </label>
                        <textarea
                            value={availabilityText}
                            onChange={(e) =>
                                setAvailabilityText(e.target.value)
                            }
                            rows={4}
                            placeholder='e.g. {"sundays": true, "wednesdays": false}'
                            className={`${inputBase} font-mono text-xs`}
                        />
                    </div>
                </div>

                <div className='flex items-center justify-end gap-3 pt-2'>
                    <button
                        type='button'
                        onClick={onClose}
                        className={btnSecondary}
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        onClick={handleSave}
                        className={btnPrimary}
                    >
                        Save
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}
