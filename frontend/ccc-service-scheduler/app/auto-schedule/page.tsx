'use client';

import SidebarLayout from '@/components/SidebarLayout/SidebarLayout';
import BackButton from '@/components/BackButton/BackButton';
import AutoScheduleButton from '@/components/AutoScheduleButton/AutoScheduleButton';
import { heading1, lead, pageContent } from '@/lib/ui';

export default function AutoSchedulePage() {
    return (
        <SidebarLayout>
            <div className={`${pageContent} relative max-w-2xl`}>
                <div className='flex flex-col gap-6 sm:flex-row sm:items-start'>
                    <BackButton />
                    <header className='min-w-0 flex-1 space-y-4 pt-1 sm:pt-0'>
                        <h1 className={heading1}>Auto-schedule</h1>
                        <p className={lead}>
                            Run the scheduler against the API. Check the
                            browser console for the response payload.
                        </p>
                        <AutoScheduleButton />
                    </header>
                </div>
            </div>
        </SidebarLayout>
    );
}
