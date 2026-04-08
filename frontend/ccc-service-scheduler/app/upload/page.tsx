'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import SidebarLayout from '@/components/SidebarLayout/SidebarLayout';
import BackButton from '@/components/BackButton/BackButton';
import {
    btnPrimary,
    btnSecondary,
    card,
    cardMuted,
    heading1,
    heading2,
    lead,
    pageContent,
} from '@/lib/ui';

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        data?: { count?: number };
    } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setResult({
                success: false,
                message: 'Please select a file first',
            });
            return;
        }

        setUploading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api('/import', {
                method: 'POST',
                body: formData,
            });

            if (response.error) {
                setResult({ success: false, message: response.error });
            } else {
                setResult({
                    success: true,
                    message: `Successfully imported ${response.count} records`,
                    data: response,
                });
            }
        } catch (error) {
            setResult({
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to upload file',
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <SidebarLayout>
            <div className={`${pageContent} relative max-w-4xl`}>
                <div className='flex flex-col gap-6 sm:flex-row sm:items-start'>
                    <BackButton />
                    <div className='min-w-0 flex-1 pt-1 sm:pt-0'>
                        <h1 className={heading1}>Upload Excel sheet</h1>
                        <p className={`${lead} mt-2`}>
                            Import people data from a spreadsheet to support
                            schedule generation.
                        </p>
                    </div>
                </div>

                <div className={`${cardMuted} space-y-6`}>
                    <h2 className={heading2}>Required Excel schema</h2>
                    <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Your spreadsheet must include these columns
                        (case-sensitive):
                    </p>

                    <a
                        href='/ccc_service_scheduler_template.xlsx'
                        download
                        className={`${btnSecondary} w-full sm:w-auto`}
                    >
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                            strokeWidth={1.5}
                            stroke='currentColor'
                            className='size-5'
                            aria-hidden
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                d='m9 13.5 3 3m0 0 3-3m-3 3v-6m1.06-4.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z'
                            />
                        </svg>
                        Download template
                    </a>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        {[
                            [
                                'first name',
                                "Required — person's first name",
                            ],
                            ['last name', "Required — person's last name"],
                            [
                                'birth date',
                                'Required — YYYY-MM-DD',
                            ],
                            ['gender', 'Required'],
                            ['phone', 'Required — contact number'],
                            ['parish', 'Required — parish name'],
                            ['email', 'Required — unique'],
                            ['rank', 'Required — e.g. superior evangelist'],
                            ['availability', 'Required — JSON'],
                            [
                                'roles',
                                'Required — comma-separated (usher, reader, …)',
                            ],
                        ].map(([name, desc]) => (
                            <div
                                key={name}
                                className='rounded-xl border border-slate-200/80 bg-white/60 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40'
                            >
                                <span className='font-mono text-sm font-semibold text-slate-900 dark:text-white'>
                                    {name}
                                </span>
                                <p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
                                    {desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className='rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 dark:border-amber-900/40 dark:bg-amber-950/30'>
                        <p className='text-xs text-amber-900 dark:text-amber-100'>
                            <strong>Note:</strong> Headers must match exactly.
                            The roles column uses comma-separated values split
                            into an array on import.
                        </p>
                    </div>
                </div>

                <div className={card}>
                    <h2 className={heading2}>Upload file</h2>
                    <div className='mt-6 space-y-4'>
                        <div>
                            <label
                                htmlFor='file-upload'
                                className='mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'
                            >
                                Excel file (.xlsx, .xls)
                            </label>
                            <input
                                id='file-upload'
                                type='file'
                                accept='.xlsx,.xls'
                                onChange={handleFileChange}
                                className='block w-full cursor-pointer text-sm text-stone-600 file:mr-4 file:rounded-2xl file:border-0 file:bg-indigo-700 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-600 dark:text-stone-400 dark:file:bg-indigo-600 dark:hover:file:bg-indigo-500'
                            />
                        </div>
                        {file && (
                            <p className='text-sm text-slate-600 dark:text-slate-400'>
                                Selected:{' '}
                                <span className='font-mono text-slate-900 dark:text-slate-200'>
                                    {file.name}
                                </span>{' '}
                                ({(file.size / 1024).toFixed(2)} KB)
                            </p>
                        )}
                        <button
                            type='button'
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className={`${btnPrimary} w-full disabled:pointer-events-none disabled:opacity-45`}
                        >
                            {uploading ? 'Uploading…' : 'Upload and import'}
                        </button>
                    </div>
                </div>

                {result && (
                    <div
                        className={`rounded-2xl border p-5 ${
                            result.success
                                ? 'border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-900/50 dark:bg-emerald-950/40'
                                : 'border-red-200/80 bg-red-50/90 dark:border-red-900/50 dark:bg-red-950/40'
                        }`}
                        role={result.success ? 'status' : 'alert'}
                        aria-live={result.success ? 'polite' : 'assertive'}
                    >
                        <p
                            className={`text-sm font-medium ${
                                result.success
                                    ? 'text-emerald-800 dark:text-emerald-200'
                                    : 'text-red-800 dark:text-red-200'
                            }`}
                        >
                            {result.message}
                        </p>
                        {result.success && result.data && (
                            <p className='mt-2 text-xs text-emerald-700 dark:text-emerald-300'>
                                Records imported: {result.data.count}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </SidebarLayout>
    );
}
