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

type Props = {
    service: ServiceDraft;
    onClose: () => void;
    onSave: (service: ServiceDraft) => Promise<void>;
};

export default function ServiceEditModal({ service, onClose, onSave }: Props) {
    const [draft, setDraft] = useState<ServiceDraft>(service);
    const [customType, setCustomType] = useState(
        SERVICE_TYPES.includes(service.service_type) ? '' : service.service_type,
    );
    const [useCustom, setUseCustom] = useState(
        !!service.service_type && !SERVICE_TYPES.includes(service.service_type),
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const update = (field: keyof ServiceDraft, value: string) =>
        setDraft((d) => ({ ...d, [field]: value }));

    const handleSubmit = async () => {
        const finalType = useCustom ? customType.trim() : draft.service_type;
        if (!draft.date) { setError('Date is required.'); return; }
        if (!finalType) { setError('Service type is required.'); return; }

        setSaving(true);
        setError(null);
        try {
            await onSave({ ...draft, service_type: finalType });
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to save service.');
        } finally {
            setSaving(false);
        }
    };

    const isNew = !service.id;

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
                        {saving ? 'Saving…' : isNew ? 'Add service' : 'Save changes'}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}
