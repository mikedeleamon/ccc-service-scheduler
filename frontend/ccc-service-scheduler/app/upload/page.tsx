'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setResult({ success: false, message: 'Please select a file first' });
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
                message: error instanceof Error ? error.message : 'Failed to upload file',
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className='flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black'>
            <main className='flex min-h-screen w-full max-w-4xl flex-col items-center justify-between py-16 px-8 bg-white dark:bg-black sm:items-start'>
                <div className='w-full space-y-8'>
                    <div className='flex flex-col gap-4'>
                        <h1 className='text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50'>
                            Upload Excel Sheet
                        </h1>
                        <p className='text-lg leading-8 text-zinc-600 dark:text-zinc-400'>
                            Upload an Excel file to import people data and auto-generate a schedule.
                        </p>
                    </div>

                    {/* Schema Documentation */}
                    <div className='rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6'>
                        <h2 className='text-xl font-semibold mb-4 text-black dark:text-zinc-50'>
                            Required Excel Schema
                        </h2>
                        <p className='text-sm text-zinc-600 dark:text-zinc-400 mb-4'>
                            Your Excel spreadsheet must contain the following columns (case-sensitive):
                        </p>
                        <div className='space-y-3'>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                <div className='flex flex-col'>
                                    <span className='font-mono text-sm font-semibold text-black dark:text-zinc-50'>
                                        first name
                                    </span>
                                    <span className='text-xs text-zinc-500 dark:text-zinc-500'>
                                        Required - Person's first name
                                    </span>
                                </div>
                                <div className='flex flex-col'>
                                    <span className='font-mono text-sm font-semibold text-black dark:text-zinc-50'>
                                        last name
                                    </span>
                                    <span className='text-xs text-zinc-500 dark:text-zinc-500'>
                                        Required - Person's last name
                                    </span>
                                </div>
                                <div className='flex flex-col'>
                                    <span className='font-mono text-sm font-semibold text-black dark:text-zinc-50'>
                                        birth date
                                    </span>
                                    <span className='text-xs text-zinc-500 dark:text-zinc-500'>
                                        Required - Date of birth (YYYY-MM-DD format)
                                    </span>
                                </div>
                                <div className='flex flex-col'>
                                    <span className='font-mono text-sm font-semibold text-black dark:text-zinc-50'>
                                        gender
                                    </span>
                                    <span className='text-xs text-zinc-500 dark:text-zinc-500'>
                                        Required - Person's gender
                                    </span>
                                </div>
                                <div className='flex flex-col'>
                                    <span className='font-mono text-sm font-semibold text-black dark:text-zinc-50'>
                                        phone
                                    </span>
                                    <span className='text-xs text-zinc-500 dark:text-zinc-500'>
                                        Required - Contact phone number
                                    </span>
                                </div>
                                <div className='flex flex-col'>
                                    <span className='font-mono text-sm font-semibold text-black dark:text-zinc-50'>
                                        parish
                                    </span>
                                    <span className='text-xs text-zinc-500 dark:text-zinc-500'>
                                        Required - Parish name
                                    </span>
                                </div>
                                <div className='flex flex-col'>
                                    <span className='font-mono text-sm font-semibold text-black dark:text-zinc-50'>
                                        email
                                    </span>
                                    <span className='text-xs text-zinc-500 dark:text-zinc-500'>
                                        Required - Email address (must be unique)
                                    </span>
                                </div>
                                <div className='flex flex-col'>
                                    <span className='font-mono text-sm font-semibold text-black dark:text-zinc-50'>
                                        rank
                                    </span>
                                    <span className='text-xs text-zinc-500 dark:text-zinc-500'>
                                        Required - Rank (e.g., "superior evangelist", "cape elder")
                                    </span>
                                </div>
                                <div className='flex flex-col'>
                                    <span className='font-mono text-sm font-semibold text-black dark:text-zinc-50'>
                                        availability
                                    </span>
                                    <span className='text-xs text-zinc-500 dark:text-zinc-500'>
                                        Required - Availability schedule (JSON format)
                                    </span>
                                </div>
                                <div className='flex flex-col'>
                                    <span className='font-mono text-sm font-semibold text-black dark:text-zinc-50'>
                                        roles
                                    </span>
                                    <span className='text-xs text-zinc-500 dark:text-zinc-500'>
                                        Required - Comma-separated list of roles (e.g., "usher, reader, choir")
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className='mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded'>
                            <p className='text-xs text-yellow-800 dark:text-yellow-200'>
                                <strong>Note:</strong> Column names must match exactly as shown above (case-sensitive). 
                                The "roles" column should contain comma-separated values that will be automatically split into an array.
                            </p>
                        </div>
                    </div>

                    {/* Upload Form */}
                    <div className='rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6'>
                        <h2 className='text-xl font-semibold mb-4 text-black dark:text-zinc-50'>
                            Upload File
                        </h2>
                        <div className='space-y-4'>
                            <div>
                                <label
                                    htmlFor='file-upload'
                                    className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2'
                                >
                                    Select Excel File (.xlsx, .xls)
                                </label>
                                <input
                                    id='file-upload'
                                    type='file'
                                    accept='.xlsx,.xls'
                                    onChange={handleFileChange}
                                    className='block w-full text-sm text-zinc-500 dark:text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-200 dark:file:bg-zinc-700 file:text-zinc-700 dark:file:text-zinc-300 hover:file:bg-zinc-300 dark:hover:file:bg-zinc-600 cursor-pointer'
                                />
                            </div>
                            {file && (
                                <div className='text-sm text-zinc-600 dark:text-zinc-400'>
                                    Selected: <span className='font-mono'>{file.name}</span> (
                                    {(file.size / 1024).toFixed(2)} KB)
                                </div>
                            )}
                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className='flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                {uploading ? 'Uploading...' : 'Upload and Import'}
                            </button>
                        </div>
                    </div>

                    {/* Result Message */}
                    {result && (
                        <div
                            className={`rounded-lg border p-4 ${
                                result.success
                                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                                    : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                            }`}
                        >
                            <p
                                className={`text-sm font-medium ${
                                    result.success
                                        ? 'text-green-800 dark:text-green-200'
                                        : 'text-red-800 dark:text-red-200'
                                }`}
                            >
                                {result.message}
                            </p>
                            {result.success && result.data && (
                                <div className='mt-2 text-xs text-green-700 dark:text-green-300'>
                                    <p>Records imported: {result.data.count}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
