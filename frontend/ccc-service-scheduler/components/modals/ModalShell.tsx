'use client';

import { useEffect, useId } from 'react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { btnClose, modalOverlay, modalPanel } from '@/lib/ui';

export type ModalShellProps = {
    onClose: () => void;
    children: React.ReactNode;
    /** If set, renders the standard title row and close control above children. */
    title?: string;
    /** Used when `title` is omitted (e.g. fully custom header inside children). */
    ariaLabel?: string;
    /** Appended to the panel for wider modals (e.g. schedule week view). */
    panelClassName?: string;
};

export default function ModalShell({
    onClose,
    children,
    title,
    ariaLabel = 'Dialog',
    panelClassName,
}: ModalShellProps) {
    useBodyScrollLock(true);
    const titleId = useId();

    useEffect(() => {
        function onKey(event: KeyboardEvent) {
            if (event.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            role='dialog'
            aria-modal='true'
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : ariaLabel}
            className={modalOverlay}
            onClick={onClose}
        >
            <div
                className={`${modalPanel} ${panelClassName ?? 'max-w-2xl'}`.trim()}
                onClick={(e) => e.stopPropagation()}
            >
                {title ? (
                    <div className='mb-6 flex items-start justify-between gap-4 border-b border-stone-200/90 pb-4 dark:border-stone-600/80'>
                        <h2
                            id={titleId}
                            className='text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-50'
                        >
                            {title}
                        </h2>
                        <button
                            type='button'
                            onClick={onClose}
                            className={btnClose}
                            aria-label='Close'
                        >
                            <span className='text-lg leading-none'>×</span>
                        </button>
                    </div>
                ) : null}
                {children}
            </div>
        </div>
    );
}
