'use client';

import { useEffect, useId, useRef } from 'react';
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
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onKey(event: KeyboardEvent) {
            if (event.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        const previouslyFocused = document.activeElement as HTMLElement | null;

        const root = panelRef.current;
        if (root) {
            const focusable = root.querySelector<HTMLElement>(
                'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
            );
            (focusable ?? root).focus?.();
        }

        return () => previouslyFocused?.focus?.();
    }, []);

    useEffect(() => {
        function handleTab(event: KeyboardEvent) {
            if (event.key !== 'Tab') return;
            const root = panelRef.current;
            if (!root) return;

            const nodes = Array.from(
                root.querySelectorAll<HTMLElement>(
                    'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
                ),
            ).filter(
                (el) =>
                    !el.hasAttribute('disabled') &&
                    el.getAttribute('aria-hidden') !== 'true',
            );

            if (nodes.length === 0) {
                event.preventDefault();
                root.focus();
                return;
            }

            const first = nodes[0];
            const last = nodes[nodes.length - 1];
            const active = document.activeElement as HTMLElement | null;

            if (event.shiftKey) {
                if (!active || active === first || !root.contains(active)) {
                    event.preventDefault();
                    last.focus();
                }
            } else {
                if (active === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        }

        document.addEventListener('keydown', handleTab);
        return () => document.removeEventListener('keydown', handleTab);
    }, []);

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
                ref={panelRef}
                tabIndex={-1}
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
