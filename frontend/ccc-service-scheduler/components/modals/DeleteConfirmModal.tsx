'use client';

import ModalShell from '@/components/modals/ModalShell';
import { btnDangerSolid, btnSecondary } from '@/lib/ui';

type DeleteConfirmModalProps = {
    /** Bold item name shown in the confirmation message. */
    label: string;
    onCancel: () => void;
    onConfirm: () => void;
    confirmDisabled?: boolean;
};

export default function DeleteConfirmModal({ label, onCancel, onConfirm, confirmDisabled }: DeleteConfirmModalProps) {
    return (
        <ModalShell title='Confirm deletion' onClose={onCancel}>
            <div className='space-y-4'>
                <p className='text-sm text-stone-600 dark:text-stone-400'>
                    Permanently delete{' '}
                    <span className='font-semibold text-stone-900 dark:text-stone-50'>{label}</span>
                    ? This action cannot be undone.
                </p>
                <div className='flex items-center justify-end gap-3 pt-2'>
                    <button type='button' onClick={onCancel} className={btnSecondary}>
                        Cancel
                    </button>
                    <button type='button' onClick={onConfirm} disabled={confirmDisabled} className={`${btnDangerSolid} disabled:opacity-50`}>
                        Delete
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}
