'use client';

import type { Person } from '@/types/types';
import {
    calculateAge,
    formatAvailability,
    fullName,
} from '@/lib/rosterUtils';
import ModalShell from '@/components/modals/ModalShell';

type PersonDetailsModalProps = {
    person: Person;
    onClose: () => void;
};

export default function PersonDetailsModal({
    person,
    onClose,
}: PersonDetailsModalProps) {
    const rows: Array<{ label: string; value: React.ReactNode }> = [
        { label: 'First Name', value: person.first_name },
        { label: 'Last Name', value: person.last_name },
        { label: 'Birth Date', value: person.birth_date ?? '—' },
        { label: 'Age', value: calculateAge(person.birth_date) },
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
            <div className='overflow-hidden rounded-xl border border-stone-200/90 dark:border-stone-600/80'>
                <dl className='divide-y divide-stone-200 text-sm dark:divide-stone-700/80'>
                    {rows.map((r) => (
                        <div
                            key={r.label}
                            className='grid grid-cols-3 gap-4 px-4 py-3'
                        >
                            <dt className='font-medium text-stone-500 dark:text-stone-400'>
                                {r.label}
                            </dt>
                            <dd className='col-span-2 text-stone-900 dark:text-stone-100'>
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
