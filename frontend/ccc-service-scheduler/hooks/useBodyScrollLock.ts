'use client';

import { useLayoutEffect } from 'react';

/**
 * Prevents background scroll while mounted (e.g. modal open).
 * Restores prior body styles on unmount so nested locks (e.g. sidebar) stay correct.
 */
export function useBodyScrollLock(active: boolean) {
    useLayoutEffect(() => {
        if (!active) return;

        const body = document.body;
        const html = document.documentElement;
        const prevOverflow = body.style.overflow;
        const prevPaddingRight = body.style.paddingRight;
        const scrollbarGap = window.innerWidth - html.clientWidth;

        if (scrollbarGap > 0) {
            body.style.paddingRight = `${scrollbarGap}px`;
        }
        body.style.overflow = 'hidden';

        return () => {
            body.style.overflow = prevOverflow;
            body.style.paddingRight = prevPaddingRight;
        };
    }, [active]);
}
