'use client';

import { useState } from 'react';
import type { Person } from '@/types/types';
import { calculateAge, formatAvailability, fullName } from '@/lib/rosterUtils';
import ModalShell from '@/components/modals/ModalShell';
import { btnDanger, btnPrimary } from '@/lib/ui';

type PersonDetailsModalProps = {
    person: Person;
    onClose: () => void;
    onEdit: (person: Person) => void;
    onDelete: (person: Person) => void;
};

export default function PersonDetailsModal({ person, onClose, onEdit, onDelete }: PersonDetailsModalProps) {
    const [copied, setCopied] = useState(false);

    const copyPhone = () => {
        if (!person.phone) return;
        navigator.clipboard.writeText(person.phone).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {});
    };

    const rows: Array<{ label: string; value: React.ReactNode }> = [
        { label: 'First name',   value: person.first_name },
        { label: 'Last name',    value: person.last_name },
        { label: 'Birth date',   value: person.birth_date ?? '—' },
        { label: 'Age',          value: calculateAge(person.birth_date) ?? '—' },
        { label: 'Gender',       value: person.gender ?? '—' },
        {
            label: 'Phone',
            value: person.phone ? (
                <span className='flex items-center gap-2'>
                    <span className='font-mono text-xs'>{person.phone}</span>
                    <button
                        type='button'
                        onClick={copyPhone}
                        title='Copy phone number'
                        className='inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10px] font-medium transition hover:bg-stone-100 dark:hover:bg-stone-800'
                    >
                        {copied ? (
                            <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor' className='size-3 text-emerald-600 dark:text-emerald-400' aria-hidden>
                                <path strokeLinecap='round' strokeLinejoin='round' d='m4.5 12.75 6 6 9-13.5' />
                            </svg>
                        ) : (
                            <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='size-3 text-stone-400' aria-hidden>
                                <path strokeLinecap='round' strokeLinejoin='round' d='M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184' />
                            </svg>
                        )}
                        <span className={copied ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}>
                            {copied ? 'Copied' : 'Copy'}
                        </span>
                    </button>
                </span>
            ) : '—',
        },
        { label: 'Parish',       value: person.parish ?? '—' },
        { label: 'Email',        value: person.email ?? '—' },
        { label: 'Rank',         value: person.rank },
        { label: 'Availability', value: formatAvailability(person.availability) },
    ];

    return (
        <ModalShell title={fullName(person)} onClose={onClose}>
            <div className='overflow-hidden rounded-xl border border-stone-200/90 dark:border-stone-600/80'>
                <dl className='divide-y divide-stone-200 text-sm dark:divide-stone-700/80'>
                    {rows.map((r) => (
                        <div key={r.label} className='grid grid-cols-3 gap-4 px-4 py-3'>
                            <dt className='font-medium text-stone-500 dark:text-stone-400'>{r.label}</dt>
                            <dd className='col-span-2 text-stone-900 dark:text-stone-100'>
                                {typeof r.value === 'string' || typeof r.value === 'number' ? (
                                    <span className='break-words font-mono text-xs'>{r.value}</span>
                                ) : r.value}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>

            <div className='mt-5 flex items-center justify-between border-t border-stone-200/80 pt-4 dark:border-stone-700/60'>
                <button type='button' onClick={() => onDelete(person)} className={btnDanger}>
                    Delete
                </button>
                <button type='button' onClick={() => onEdit(person)} className={btnPrimary}>
                    Edit person
                </button>
            </div>
        </ModalShell>
    );
}
