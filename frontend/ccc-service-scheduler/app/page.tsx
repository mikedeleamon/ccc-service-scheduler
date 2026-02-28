import AutoScheduleButton from '@/components/AutoScheduleButton/AutoScheduleButton';
import UploadSheetButton from '@/components/UploadSheetButton/UploadSheetButton';
import ViewScheduleButton from '@/components/ViewScheduleButton/ViewScheduleButton';

export default function Home() {
    return (
        <div className='flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black'>
            <main className='flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start'>
                <div className='flex flex-col items-center gap-6 text-center sm:items-start sm:text-left'>
                    <h1 className='max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50'>
                        Welcome to the CCC Service Scheduler
                    </h1>
                    <div className='max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400'>
                        Currently in development. The goal is to schedule
                        services for any given parish of Celestial Church of
                        Christ. <br />
                        <b>
                            The Schedule will be generated based on the
                            following criteria:
                        </b>
                        <ul>
                            <li>The fairness of the schedule.</li>
                            <li>The Rank of the person.</li>
                            <li>The time of the service.</li>
                            <li>The date of the service.</li>
                            <li>The location of the service.</li>
                        </ul>
                    </div>
                </div>
                <div className='flex flex-col gap-4 text-base font-medium sm:flex-row'>
                    <AutoScheduleButton />
                    <UploadSheetButton />
                    <ViewScheduleButton />
                </div>
            </main>
        </div>
    );
}
