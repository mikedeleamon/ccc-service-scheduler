'use client';

import type { Person } from '@/types/types';
import { fullName } from '@/lib/rosterUtils';
import ModalShell from '@/components/modals/ModalShell';
import { btnDangerSolid, btnSecondary } from '@/lib/ui';

type DeleteConfirmModalProps = {
    person: Person;
    onCancel: () => void;
    onConfirm: () => void;
};

export default function DeleteConfirmModal({
    person,
    onCancel,
    onConfirm,
}: DeleteConfirmModalProps) {
    return (
        <ModalShell
            title='Delete person?'
            onClose={onCancel}
        >
            <div className='space-y-4'>
                <p className='text-sm text-stone-600 dark:text-stone-400'>
                    This will permanently remove{' '}
                    <span className='font-semibold text-stone-900 dark:text-stone-50'>
                        {fullName(person)}
                    </span>
                    {person.birth_date ? ` (${person.birth_date})` : ''} from
                    the roster.
                </p>
                <div className='flex items-center justify-end gap-3 pt-2'>
                    <button
                        type='button'
                        onClick={onCancel}
                        className={btnSecondary}
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        onClick={onConfirm}
                        className={btnDangerSolid}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}
