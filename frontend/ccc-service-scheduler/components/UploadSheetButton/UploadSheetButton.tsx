'use client';

import { useRouter } from 'next/navigation';
import { btnPrimary } from '@/lib/ui';

export default function UploadSheetButton() {
    const router = useRouter();

    const handleClick = () => {
        router.push('/upload');
    };

    return (
        <button type='button' onClick={handleClick} className={btnPrimary}>
            Upload Excel sheet
        </button>
    );
}
