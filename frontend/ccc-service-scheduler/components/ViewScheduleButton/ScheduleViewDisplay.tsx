'use client';

import type { ScheduleViewDisplayProps } from '@/types/scheduleTypes';
import ModalShell from '@/components/modals/ModalShell';
import { btnSecondary } from '@/lib/ui';

export default function ScheduleViewDisplay({
    schedule,
    onClose,
}: ScheduleViewDisplayProps) {
    return (
        <ModalShell
            onClose={onClose}
            ariaLabel={`Schedule for ${schedule.startDate} through ${schedule.endDate}`}
            panelClassName='max-w-3xl border-indigo-950/10 shadow-indigo-950/20 dark:border-indigo-300/10'
        >
            <div className='mb-6 flex flex-col gap-4 border-b border-amber-200/40 pb-5 dark:border-amber-400/20 sm:flex-row sm:items-start sm:justify-between sm:pb-6'>
                <div>
                    <p className='font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-amber-700 dark:text-amber-400/90'>
                        Week view
                    </p>
                    <h2 className='mt-2 font-[family-name:var(--font-fraunces),Georgia,serif] text-2xl font-medium tracking-tight text-indigo-950 dark:text-indigo-50 sm:text-3xl'>
                        {schedule.startDate}{' '}
                        <span className='text-amber-600/70 dark:text-amber-400/60'>
                            –
                        </span>{' '}
                        {schedule.endDate}
                    </h2>
                    <p className='mt-1 text-sm text-stone-600 dark:text-stone-400'>
                        {schedule.month} {schedule.year}
                    </p>
                </div>
                <button
                    type='button'
                    onClick={onClose}
                    className={btnSecondary}
                >
                    Close
                </button>
            </div>
            <div className='max-h-[min(60vh,28rem)] space-y-3 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:thin] sm:max-h-[min(70vh,32rem)]'>
                {schedule.days.map((day) => (
                    <section
                        key={day.date}
                        className='relative overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-50/50 pl-4 dark:border-stone-600/50 dark:bg-stone-900/30'
                    >
                        <div
                            className='absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-amber-500 to-indigo-700 opacity-90 dark:from-amber-400 dark:to-indigo-500'
                            aria-hidden
                        />
                        <div className='py-4 pl-4 pr-4'>
                            <h3 className='text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400'>
                                {day.dayOfWeek} — {day.date}
                                {day.serviceType
                                    ? ` · ${day.serviceType}${
                                          day.time ? ` · ${day.time}` : ''
                                      }`
                                    : ''}
                            </h3>
                            {day.officiants.length === 0 ? (
                                <p className='mt-2 text-sm text-stone-500 dark:text-stone-400'>
                                    No officiants assigned
                                </p>
                            ) : (
                                <ul className='mt-3 space-y-2'>
                                    {day.officiants.map((o, i) => (
                                        <li
                                            key={`${day.date}-${o.role}-${i}`}
                                            className='flex items-center justify-between gap-4 rounded-xl border border-stone-200/60 bg-white/90 px-3 py-2.5 text-sm dark:border-stone-600/40 dark:bg-stone-950/40'
                                        >
                                            <span className='font-medium text-indigo-900 dark:text-indigo-200'>
                                                {o.role}
                                            </span>
                                            <span className='text-stone-800 dark:text-stone-100'>
                                                {o.personName}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>
                ))}
            </div>
        </ModalShell>
    );
}
