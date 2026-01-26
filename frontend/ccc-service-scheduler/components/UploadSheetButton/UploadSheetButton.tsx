'use client';

import { useRouter } from 'next/navigation';

export default function UploadSheetButton() {
    const router = useRouter();

    const handleClick = () => {
        router.push('/upload');
    };

    return (
        <button
            onClick={handleClick}
            className='px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors'
        >
            Upload Excel Sheet
        </button>
    );
}
