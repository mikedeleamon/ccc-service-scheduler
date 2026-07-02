'use client';

import { useState } from 'react';
import ModalShell from './ModalShell';
import { btnPrimary, btnSecondary, inputBase, selectBase } from '@/lib/ui';

const SERVICE_TYPES = [
    'Devotional Service',
    'Mercy Day Service',
    'Power Day Service',
    'New Moon Service',
    'Easter Service',
    'Christmas Service',
    'New Years Service',
    'Youth Service',
];

export type ServiceDraft = {
    id?: number;
    date: string;
    time: string;
    service_type: string;
};

type Repeat = 'none' | 'weekly' | 'biweekly' | 'monthly';

const REPEAT_OPTIONS: { value: Repeat; label: string }[] = [
    { value: 'none', label: 'Does not repeat' },
    { value: 'weekly', label: 'Every week' },
    { value: 'biweekly', label: 'Every 2 weeks' },
    { value: 'monthly', label: 'Every month (same date)' },
];

const MAX_OCCURRENCES = 60; // safety cap so a far-off "until" can't create thousands

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

function toIso(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addMonthsClamped(d: Date, n: number): Date {
    const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(d.getDate(), lastDay));
    return target;
}

/** Every occurrence date (inclusive of the start) up to and including `untilIso`. */
export function buildRecurringDates(startIso: string, repeat: Repeat, untilIso: string): string[] {
    if (repeat === 'none') return [startIso];
    const [y, m, day] = startIso.split('-').map(Number);
    const start = new Date(y, m - 1, day);
    const dates: string[] = [];
    for (let i = 0; i < MAX_OCCURRENCES; i++) {
        const d =
            repeat === 'monthly'
                ? addMonthsClamped(start, i)
                : new Date(start.getFullYear(), start.getMonth(), start.getDate() + i * (repeat === 'weekly' ? 7 : 14));
        const iso = toIso(d);
        if (iso > untilIso) break;
        dates.push(iso);
    }
    return dates;
}

type Props = {
    service: ServiceDraft;
    onClose: () => void;
    onSave: (service: ServiceDraft) => Promise<void>;
    /** Called instead of onSave when a recurrence produces multiple services. */
    onSaveMany?: (services: ServiceDraft[]) => Promise<void>;
};

export default function ServiceEditModal({ service, onClose, onSave, onSaveMany }: Props) {
    const [draft, setDraft] = useState<ServiceDraft>(service);
    const [customType, setCustomType] = useState(
        SERVICE_TYPES.includes(service.service_type) ? '' : service.service_type,
    );
    const [useCustom, setUseCustom] = useState(
        !!service.service_type && !SERVICE_TYPES.includes(service.service_type),
    );
    const [repeat, setRepeat] = useState<Repeat>('none');
    const [repeatUntil, setRepeatUntil] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const update = (field: keyof ServiceDraft, value: string) =>
        setDraft((d) => ({ ...d, [field]: value }));

    const today = new Date().toISOString().slice(0, 10);

    const isNew = !service.id;
    const recurring = isNew && repeat !== 'none';

    // Live preview of how many services a recurrence will create.
    const occurrences =
        recurring && draft.date && repeatUntil && repeatUntil >= draft.date
            ? buildRecurringDates(draft.date, repeat, repeatUntil)
            : null;

    const handleSubmit = async () => {
        const finalType = useCustom ? customType.trim() : draft.service_type;
        if (!draft.date) { setError('Date is required.'); return; }
        if (draft.date < today) { setError('Service date cannot be in the past.'); return; }
        if (!finalType) { setError('Service type is required.'); return; }
        if (recurring && !repeatUntil) { setError('Choose a date to repeat until.'); return; }
        if (recurring && repeatUntil < draft.date) { setError('“Repeat until” must be on or after the start date.'); return; }

        setSaving(true);
        setError(null);
        try {
            if (recurring && onSaveMany) {
                const dates = buildRecurringDates(draft.date, repeat, repeatUntil);
                await onSaveMany(dates.map((date) => ({ date, time: draft.time, service_type: finalType })));
            } else {
                await onSave({ ...draft, service_type: finalType });
            }
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to save service.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalShell
            title={isNew ? 'Add service' : 'Edit service'}
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
                            Date <span className='text-red-500'>*</span>
                        </label>
                        <input
                            type='date'
                            value={draft.date}
                            min={today}
                            onChange={(e) => update('date', e.target.value)}
                            className={inputBase}
                        />
                    </div>

                    <div className='space-y-1'>
                        <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>
                            Time
                        </label>
                        <input
                            type='time'
                            value={draft.time}
                            onChange={(e) => update('time', e.target.value)}
                            className={inputBase}
                        />
                    </div>
                </div>

                <div className='space-y-2'>
                    <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>
                        Service type <span className='text-red-500'>*</span>
                    </label>
                    {!useCustom ? (
                        <select
                            value={draft.service_type}
                            onChange={(e) => update('service_type', e.target.value)}
                            className={selectBase}
                        >
                            <option value=''>Select type…</option>
                            {SERVICE_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            value={customType}
                            onChange={(e) => setCustomType(e.target.value)}
                            placeholder='Enter service type…'
                            className={inputBase}
                        />
                    )}
                    <button
                        type='button'
                        onClick={() => setUseCustom((v) => !v)}
                        className='text-xs text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400'
                    >
                        {useCustom ? '← Use preset types' : 'Enter custom type'}
                    </button>
                </div>

                {isNew && (
                    <div className='space-y-3 rounded-2xl border border-stone-200/80 bg-stone-50/60 p-3 dark:border-stone-700/50 dark:bg-stone-900/30'>
                        <div className='space-y-1'>
                            <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>
                                Repeat
                            </label>
                            <select
                                value={repeat}
                                onChange={(e) => setRepeat(e.target.value as Repeat)}
                                className={selectBase}
                            >
                                {REPEAT_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>

                        {recurring && (
                            <div className='space-y-1'>
                                <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>
                                    Repeat until <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='date'
                                    value={repeatUntil}
                                    min={draft.date || today}
                                    onChange={(e) => setRepeatUntil(e.target.value)}
                                    className={inputBase}
                                />
                                {occurrences && (
                                    <p className='pt-1 text-xs text-stone-500 dark:text-stone-400'>
                                        {occurrences.length >= MAX_OCCURRENCES
                                            ? `Creates the first ${MAX_OCCURRENCES} services (cap reached — narrow the range).`
                                            : `Creates ${occurrences.length} service${occurrences.length !== 1 ? 's' : ''}.`}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className='flex justify-end gap-3 pt-2'>
                    <button type='button' onClick={onClose} className={btnSecondary}>
                        Cancel
                    </button>
                    <button
                        type='button'
                        onClick={handleSubmit}
                        disabled={saving}
                        className={`${btnPrimary} disabled:pointer-events-none disabled:opacity-45`}
                    >
                        {saving
                            ? 'Saving…'
                            : recurring
                                ? `Add ${occurrences ? occurrences.length : ''} services`.replace('  ', ' ')
                                : isNew ? 'Add service' : 'Save changes'}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}
