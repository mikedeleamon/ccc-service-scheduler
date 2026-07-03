'use client';

import { useMemo, useState } from 'react';
import ModalShell from './ModalShell';
import VerseRefInput from './VerseRefInput';
import { positionsFor, SECOND_LESSON } from '@/constants/positions';
import { serviceForDate } from '@/lib/serviceCalendar';
import { composeVerseRef, isCompleteVerseRef, parseVerseRef, emptyVerseRef, type VerseRef } from '@/lib/verseRef';
import { btnPrimary, btnSecondary, inputBase } from '@/lib/ui';

export type LessonDraft = {
    id?: number;
    date: string;
    first_lesson: string;
    second_lesson: string;
};

type Props = {
    lesson: LessonDraft;
    onClose: () => void;
    onSave: (lesson: LessonDraft) => Promise<void>;
};

export default function LessonEditModal({ lesson, onClose, onSave }: Props) {
    const [date, setDate] = useState(lesson.date);
    const [firstRef, setFirstRef] = useState<VerseRef>(() => parseVerseRef(lesson.first_lesson));
    const [secondRef, setSecondRef] = useState<VerseRef>(() => parseVerseRef(lesson.second_lesson));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isNew = !lesson.id;
    const preview = useMemo(() => (date ? serviceForDate(date) : null), [date]);
    const needsSecondLesson = preview ? positionsFor(preview.serviceType).includes(SECOND_LESSON) : true;

    const handleSubmit = async () => {
        if (!date) { setError('Date is required.'); return; }
        if (date && !preview) { setError('No service occurs on that date.'); return; }
        if (!isCompleteVerseRef(firstRef)) { setError('First lesson needs a book, chapter, and verse.'); return; }
        if (needsSecondLesson && !isCompleteVerseRef(secondRef)) { setError('Second lesson needs a book, chapter, and verse.'); return; }

        setSaving(true);
        setError(null);
        try {
            await onSave({
                id: lesson.id,
                date,
                first_lesson: composeVerseRef(firstRef),
                second_lesson: needsSecondLesson ? composeVerseRef(secondRef) : '',
            });
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to save lesson.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalShell title={isNew ? 'Add lesson' : 'Edit lesson'} onClose={onClose}>
            <div className='space-y-4'>
                {error && (
                    <div className='rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200'>
                        {error}
                    </div>
                )}

                <div className='space-y-1'>
                    <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>
                        Date <span className='text-red-500'>*</span>
                    </label>
                    <input
                        type='date'
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={inputBase}
                    />
                    {date && !preview && (
                        <p className='text-xs text-red-600 dark:text-red-400'>No service occurs on this date.</p>
                    )}
                    {preview && (
                        <p className='text-xs text-stone-500 dark:text-stone-400'>
                            {preview.serviceType} · {preview.time}
                        </p>
                    )}
                </div>

                <div className='space-y-1'>
                    <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>
                        First lesson <span className='text-red-500'>*</span>
                    </label>
                    <VerseRefInput id='first-lesson' value={firstRef} onChange={setFirstRef} />
                </div>

                <div className='space-y-1'>
                    <label className='text-sm font-medium text-stone-700 dark:text-stone-300'>
                        Second lesson {needsSecondLesson && <span className='text-red-500'>*</span>}
                    </label>
                    <VerseRefInput
                        id='second-lesson'
                        value={needsSecondLesson ? secondRef : emptyVerseRef}
                        onChange={setSecondRef}
                        disabled={!needsSecondLesson}
                    />
                    {!needsSecondLesson && preview && (
                        <p className='text-xs text-stone-500 dark:text-stone-400'>
                            {preview.serviceType} only uses a first lesson.
                        </p>
                    )}
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
                        {saving ? 'Saving…' : isNew ? 'Add lesson' : 'Save changes'}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}
