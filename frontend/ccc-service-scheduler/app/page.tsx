import SidebarLayout from '@/components/SidebarLayout/SidebarLayout';
import AutoScheduleButton from '@/components/AutoScheduleButton/AutoScheduleButton';
import UploadSheetButton from '@/components/UploadSheetButton/UploadSheetButton';
import ViewScheduleButton from '@/components/ViewScheduleButton/ViewScheduleButton';
import ViewRosterButton from '@/components/ViewRosterButton/ViewRosterButton';

export default function Home() {
    return (
        <SidebarLayout>
            <div className='flex w-full items-center justify-center'>
                <div className='flex flex-col items-center gap-8 max-w-2xl text-center'>
                    <h1 className='text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50'>
                        Welcome to the CCC Service Scheduler
                    </h1>

                    <div className='text-lg leading-8 text-zinc-600 dark:text-zinc-400'>
                        Currently in development. The goal is to schedule
                        services for any given parish of Celestial Church of
                        Christ.
                        <br />
                        <b>
                            The Schedule will be generated based on the
                            following criteria:
                        </b>
                        <ul className='list-disc list-inside mt-2 space-y-1 text-center'>
                            <li>The fairness of the schedule.</li>
                            <li>The Rank of the person.</li>
                            <li>The time of the service.</li>
                            <li>The date of the service.</li>
                            <li>The location of the service.</li>
                        </ul>
                    </div>

                    <div className='flex flex-col gap-4 text-base font-medium sm:flex-row sm:justify-center mt-10'>
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
