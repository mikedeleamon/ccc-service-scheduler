import { useRouter } from 'next/navigation';

export default function BackButton() {
    const router = useRouter();

    return (
        <button
            className='absolute top-20 left-4 text-zinc-600 dark:text-zinc-400 flex items-center gap-2'
            onClick={() => router.push('/')}
        >
            <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
                stroke='currentColor'
                className='size-6'
            >
                <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='m11.25 9-3 3m0 0 3 3m-3-3h7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
                />
            </svg>
        </button>
    );
}
