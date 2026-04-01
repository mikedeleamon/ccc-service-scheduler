'use client';

import { useRouter } from 'next/navigation';
import { btnIconBack } from '@/lib/ui';

export default function BackButton() {
    const router = useRouter();

    return (
        <button
            type='button'
            className={`${btnIconBack} absolute left-0 top-0 sm:relative sm:left-auto sm:top-auto`}
            onClick={() => router.push('/')}
            aria-label='Back to home'
        >
            <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={2}
                stroke='currentColor'
                className='size-5'
                aria-hidden
            >
                <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18'
                />
            </svg>
        </button>
    );
}
