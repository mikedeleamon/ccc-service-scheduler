/** Shared Tailwind class strings — design tokens for the app shell. */

export const btnPrimary =
    'inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-700 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-950/25 transition hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 active:translate-y-px disabled:pointer-events-none disabled:opacity-45 dark:bg-indigo-500 dark:shadow-indigo-950/50 dark:hover:bg-indigo-400';

export const btnSecondary =
    'inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-300/90 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-sm transition hover:border-stone-400 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500/60 active:translate-y-px disabled:pointer-events-none disabled:opacity-45 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 dark:hover:border-stone-500 dark:hover:bg-stone-800';

export const btnDanger =
    'inline-flex items-center justify-center gap-2 rounded-2xl border border-red-300/80 bg-white px-3 py-2 text-sm font-medium text-red-800 shadow-sm transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:border-red-900/40 dark:bg-stone-900 dark:text-red-300 dark:hover:bg-red-950/40';

export const btnDangerSolid =
    'inline-flex items-center justify-center gap-2 rounded-2xl bg-red-700 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-red-950/25 transition hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 active:translate-y-px';

export const btnTablePrimary =
    'inline-flex items-center rounded-xl bg-indigo-700 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500';

export const btnTableSecondary =
    'inline-flex items-center rounded-xl border border-stone-300/90 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 shadow-sm transition hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800';

export const btnIconBack =
    'inline-flex size-10 items-center justify-center rounded-2xl border border-stone-300/90 bg-white text-stone-700 shadow-sm transition hover:border-amber-400/60 hover:bg-amber-50/50 hover:text-indigo-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-amber-500/40 dark:hover:bg-stone-800';

export const btnMenu =
    'inline-flex size-10 items-center justify-center rounded-2xl border border-stone-300/90 bg-white text-stone-800 shadow-sm transition hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800';

export const btnClose =
    'rounded-xl p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100';

export const card =
    'rounded-[1.35rem] border border-stone-200/90 bg-white/85 p-6 shadow-md shadow-stone-900/[0.06] backdrop-blur-[2px] dark:border-stone-600/60 dark:bg-stone-900/55 dark:shadow-none';

export const cardMuted =
    'rounded-[1.35rem] border border-stone-200/80 bg-stone-100/80 p-6 dark:border-stone-600/50 dark:bg-stone-900/35';

export const heading1 =
    'font-[family-name:var(--font-fraunces),Georgia,serif] text-3xl font-medium leading-[1.15] tracking-tight text-indigo-950 dark:text-indigo-50 sm:text-[2.35rem]';

export const heading2 =
    'font-[family-name:var(--font-fraunces),Georgia,serif] text-xl font-medium tracking-tight text-indigo-950 dark:text-indigo-50';

export const lead =
    'text-base leading-relaxed text-stone-700 dark:text-stone-400 sm:text-lg';

export const inputBase =
    'w-full rounded-2xl border border-stone-300/90 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm transition placeholder:text-stone-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-500';

export const selectBase =
    'w-full rounded-2xl border border-stone-300/90 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100';

export const tableWrap =
    'overflow-x-auto rounded-[1.25rem] border border-stone-200/90 bg-white/95 shadow-md shadow-stone-900/[0.04] dark:border-stone-700/80 dark:bg-stone-900/45';

export const table = 'w-full min-w-[520px] text-left text-sm';

export const tableHeadRow =
    'border-b border-stone-200 bg-indigo-950/[0.03] dark:border-stone-700/90 dark:bg-indigo-950/30';

export const tableTh =
    'px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400';

export const tableTd = 'px-4 py-3.5 text-stone-800 dark:text-stone-200';

export const tableRow =
    'border-b border-stone-100 transition hover:bg-amber-50/40 dark:border-stone-800/90 dark:hover:bg-stone-800/35';

export const modalOverlay =
    'fixed inset-0 z-50 flex items-center justify-center overscroll-contain bg-indigo-950/55 p-4 backdrop-blur-[3px] dark:bg-stone-950/70';

export const modalPanel =
    'max-h-[90vh] w-full overflow-y-auto overscroll-contain rounded-[1.25rem] border border-stone-200/95 bg-[#fdfcfa] p-6 shadow-2xl shadow-indigo-950/20 dark:border-stone-600/70 dark:bg-stone-900 dark:shadow-black/40';

export const pageContent =
    'relative mx-auto w-full max-w-6xl space-y-8 px-1 sm:px-0';
