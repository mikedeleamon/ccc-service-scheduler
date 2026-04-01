import SidebarLayout from '@/components/SidebarLayout/SidebarLayout';
import AutoScheduleButton from '@/components/AutoScheduleButton/AutoScheduleButton';
import UploadSheetButton from '@/components/UploadSheetButton/UploadSheetButton';
import ViewScheduleButton from '@/components/ViewScheduleButton/ViewScheduleButton';
import ViewRosterButton from '@/components/ViewRosterButton/ViewRosterButton';
import { card, heading1, lead } from '@/lib/ui';

export default function Home() {
    return (
        <SidebarLayout>
            <div className='mx-auto flex w-full max-w-3xl flex-col py-2 sm:py-5'>
                <div
                    className={`${card} group relative w-full overflow-hidden border-indigo-950/[0.08] bg-gradient-to-br from-[#fffefb] via-white to-indigo-50/35 dark:from-stone-900 dark:via-stone-900 dark:to-indigo-950/25`}
                >
                    <div
                        className='pointer-events-none absolute -left-8 top-8 hidden h-24 w-24 rotate-12 rounded-3xl border border-amber-400/35 bg-amber-400/10 sm:block dark:border-amber-500/25 dark:bg-amber-500/10'
                        aria-hidden
                    />
                    <div
                        className='pointer-events-none absolute -right-4 bottom-0 h-32 w-32 rounded-full bg-indigo-600/[0.07] blur-2xl dark:bg-indigo-400/10'
                        aria-hidden
                    />

                    <div className='relative max-w-prose'>
                        <p className='inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-amber-800 dark:text-amber-400/90'>
                            <span
                                className='inline-block size-1.5 rounded-full bg-amber-500'
                                aria-hidden
                            />
                            Celestial Church of Christ
                        </p>
                        <h1
                            className={`${heading1} mt-4 text-balance border-l-2 border-amber-500/70 pl-4 dark:border-amber-400/50`}
                        >
                            Welcome to the CCC Service Scheduler
                        </h1>

                        <div className={`${lead} mt-6 space-y-5 text-pretty`}>
                            <p>
                                In development — built to assign parish services
                                fairly while respecting rank, availability, and
                                every service&apos;s time and place.
                            </p>
                            <div>
                                <p className='font-medium text-indigo-950 dark:text-indigo-100'>
                                    Each generated schedule weighs:
                                </p>
                                <ul className='mt-3 grid gap-2 text-left sm:grid-cols-2'>
                                    {[
                                        'Fair rotation of roles',
                                        'Member rank',
                                        'Time & date',
                                        'Location',
                                    ].map((item) => (
                                        <li
                                            key={item}
                                            className='flex items-baseline gap-2 text-stone-700 dark:text-stone-400'
                                        >
                                            <span
                                                className='font-mono text-amber-600 dark:text-amber-400/90'
                                                aria-hidden
                                            >
                                                /
                                            </span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className='relative mt-10 flex w-full flex-col gap-3 border-t border-stone-200/70 pt-8 dark:border-stone-600/50 sm:flex-row sm:flex-wrap'>
                        <AutoScheduleButton />
                        <UploadSheetButton />
                        <ViewScheduleButton />
                        <ViewRosterButton />
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}
