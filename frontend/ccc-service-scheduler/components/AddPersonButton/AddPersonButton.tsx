'use client';

import { btnPrimary } from '@/lib/ui';

type AddPersonButtonProps = {
    onClick: () => void;
};

export default function AddPersonButton({ onClick }: AddPersonButtonProps) {
    return (
        <button type='button' onClick={onClick} className={btnPrimary}>
            Add person
        </button>
    );
}

