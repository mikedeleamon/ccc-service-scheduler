'use client';

import { BIBLE_BOOKS } from '@/constants/bibleBooks';
import { composeVerseRef, type VerseRef } from '@/lib/verseRef';
import { inputBase } from '@/lib/ui';

type Props = {
    id: string;
    value: VerseRef;
    onChange: (value: VerseRef) => void;
    disabled?: boolean;
};

export default function VerseRefInput({ id, value, onChange, disabled }: Props) {
    const set = (field: keyof VerseRef, v: string) => onChange({ ...value, [field]: v });
    const preview = composeVerseRef(value);

    return (
        <div className='space-y-1'>
            <div className='grid grid-cols-[1fr_4.5rem_auto_4.5rem_auto_4.5rem] items-center gap-1.5'>
                <input
                    value={value.book}
                    onChange={(e) => set('book', e.target.value)}
                    placeholder='Book…'
                    list={`${id}-books`}
                    disabled={disabled}
                    className={`${inputBase} disabled:cursor-not-allowed disabled:opacity-50`}
                />
                <datalist id={`${id}-books`}>
                    {BIBLE_BOOKS.map((b) => <option key={b} value={b} />)}
                </datalist>
                <input
                    type='number'
                    min={1}
                    value={value.chapter}
                    onChange={(e) => set('chapter', e.target.value)}
                    placeholder='Ch.'
                    disabled={disabled}
                    className={`${inputBase} disabled:cursor-not-allowed disabled:opacity-50`}
                />
                <span className='text-center text-stone-400 dark:text-stone-500'>:</span>
                <input
                    type='number'
                    min={1}
                    value={value.startVerse}
                    onChange={(e) => set('startVerse', e.target.value)}
                    placeholder='Verse'
                    disabled={disabled}
                    className={`${inputBase} disabled:cursor-not-allowed disabled:opacity-50`}
                />
                <span className='text-center text-stone-400 dark:text-stone-500'>–</span>
                <input
                    type='number'
                    min={1}
                    value={value.endVerse}
                    onChange={(e) => set('endVerse', e.target.value)}
                    placeholder='End'
                    disabled={disabled}
                    className={`${inputBase} disabled:cursor-not-allowed disabled:opacity-50`}
                />
            </div>
            {preview && !disabled && (
                <p className='text-xs text-stone-500 dark:text-stone-400'>{preview}</p>
            )}
        </div>
    );
}
