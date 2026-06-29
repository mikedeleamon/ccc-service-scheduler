'use client';

import { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
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
    tableHeadRow,
    tableTh,
    tableTd,
    tableRow,
} from '@/lib/ui';

type PreviewRow = Record<string, string | number | null>;

const REQUIRED = ['first name', 'last name', 'rank'];

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [preview, setPreview] = useState<{ headers: string[]; rows: PreviewRow[] } | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        data?: { created?: number; updated?: number; skipped?: number; skipped_rows?: { row: number; reason: string }[] };
    } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    /** Mirror the backend's skip rules so users see problems *before* importing. */
    const skipPreview = useMemo(() => {
        if (!preview) return { missingColumns: [] as string[], rows: [] as { row: number; reason: string }[] };

        const headerMap = new Map(preview.headers.map((h) => [h.trim().toLowerCase(), h]));
        const missingColumns = REQUIRED.filter((c) => !headerMap.has(c));
        if (missingColumns.length > 0) return { missingColumns, rows: [] };

        const get = (row: PreviewRow, key: string) => {
            const orig = headerMap.get(key);
            const v = orig ? row[orig] : null;
            return v == null ? '' : String(v).trim();
        };

        const seenEmail = new Map<string, number>();
        const seenName = new Map<string, number>();
        const rows: { row: number; reason: string }[] = [];

        preview.rows.forEach((row, i) => {
            const rowNo = i + 2; // header + 1-based
            const missing = REQUIRED.filter((c) => !get(row, c));
            if (missing.length) {
                rows.push({ row: rowNo, reason: `missing ${missing.join(', ')}` });
                return;
            }
            const email = headerMap.has('email') ? get(row, 'email').toLowerCase() : '';
            const nameKey = `${get(row, 'first name').toLowerCase()}|${get(row, 'last name').toLowerCase()}`;
            if (email && seenEmail.has(email)) {
                rows.push({ row: rowNo, reason: `duplicate email (also row ${seenEmail.get(email)})` });
                return;
            }
            if (seenName.has(nameKey)) {
                rows.push({ row: rowNo, reason: `duplicate name (also row ${seenName.get(nameKey)})` });
                return;
            }
            if (email) seenEmail.set(email, rowNo);
            seenName.set(nameKey, rowNo);
        });

        return { missingColumns, rows };
    }, [preview]);

    const parseFile = (f: File) => {
        setParseError(null);
        setPreview(null);
        setResult(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows: PreviewRow[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

                if (rows.length === 0) {
                    setParseError('The spreadsheet appears to be empty.');
                    return;
                }

                const headers = Object.keys(rows[0]);
                setPreview({ headers, rows });
            } catch {
                setParseError('Could not read the file. Make sure it is a valid .xlsx or .xls file.');
            }
        };
        reader.readAsArrayBuffer(f);
    };

    const acceptFile = (f: File) => {
        if (!f.name.match(/\.(xlsx|xls)$/i)) {
            setParseError('Only .xlsx and .xls files are accepted.');
            return;
        }
        setFile(f);
        parseFile(f);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) acceptFile(e.target.files[0]);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) acceptFile(dropped);
    };

    const handleClear = () => {
        setFile(null);
        setPreview(null);
        setParseError(null);
        setResult(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleImport = async () => {
        if (!file) return;
        setUploading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api('/import/', { method: 'POST', body: formData, timeoutMs: 60_000 });

            if (response.error || response.detail) {
                setResult({ success: false, message: response.error ?? response.detail });
            } else {
                const { created = 0, updated = 0, skipped = 0 } = response;
                const parts = [`${created} added`, `${updated} updated`];
                if (skipped > 0) parts.push(`${skipped} skipped`);
                setResult({
                    success: true,
                    message: `Import complete — ${parts.join(', ')}`,
                    data: response,
                });
                setPreview(null);
                setFile(null);
                if (inputRef.current) inputRef.current.value = '';
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
        <SidebarLayout>
            <div className={`${pageContent} relative max-w-4xl`}>
                <div className='flex flex-col gap-6 sm:flex-row sm:items-start'>
                    <BackButton />
                    <div className='min-w-0 flex-1 pt-1 sm:pt-0'>
                        <h1 className={heading1}>Upload Excel sheet</h1>
                        <p className={`${lead} mt-2`}>
                            Import people data from a spreadsheet to support schedule generation.
                        </p>
                    </div>
                </div>

                {/* Schema reference card */}
                <div className={`${cardMuted} space-y-6`}>
                    <h2 className={heading2}>Required Excel schema</h2>
                    <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Your spreadsheet must include these columns (case-sensitive):
                    </p>

                    <a
                        href='/ccc_service_scheduler_template.xlsx'
                        download
                        className={`${btnSecondary} w-full sm:w-auto`}
                    >
                        <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='size-5' aria-hidden>
                            <path strokeLinecap='round' strokeLinejoin='round' d='m9 13.5 3 3m0 0 3-3m-3 3v-6m1.06-4.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z' />
                        </svg>
                        Download template
                    </a>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        {[
                            ['first name', "Required — person's first name"],
                            ['last name', "Required — person's last name"],
                            ['birth date', 'Optional — MM-DD (e.g. 03-15)'],
                            ['gender', 'Optional — male / female'],
                            ['phone', 'Optional — contact number'],
                            ['parish', 'Optional — parish name'],
                            ['email', 'Optional — used to match existing records'],
                            ['rank', 'Required — e.g. Brother, Sister, Evangelist'],
                            ['availability', 'Optional — {"sundays": true, "wednesdays": false}'],
                        ].map(([name, desc]) => (
                            <div key={name} className='rounded-xl border border-slate-200/80 bg-white/60 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40'>
                                <span className='font-mono text-sm font-semibold text-slate-900 dark:text-white'>{name}</span>
                                <p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>{desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className='rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 dark:border-amber-900/40 dark:bg-amber-950/30'>
                        <p className='text-xs text-amber-900 dark:text-amber-100'>
                            <strong>Note:</strong> Column headers must match exactly (lowercase). Only the nine columns above are read — any additional columns are ignored.
                        </p>
                    </div>
                </div>

                {/* Upload card */}
                <div className={card}>
                    <h2 className={heading2}>Upload file</h2>

                    <input
                        ref={inputRef}
                        id='file-upload'
                        type='file'
                        accept='.xlsx,.xls'
                        onChange={handleFileChange}
                        className='sr-only'
                    />

                    {/* Drag-and-drop zone — desktop only */}
                    <div
                        role='button'
                        tabIndex={0}
                        aria-label='Drop an Excel file here or click to browse'
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
                        className={[
                            'mt-6 hidden cursor-pointer select-none flex-col items-center justify-center gap-4 rounded-[1.25rem] border-2 border-dashed px-8 py-12 text-center transition sm:flex',
                            dragOver
                                ? 'border-indigo-500 bg-indigo-50/70 dark:border-indigo-400 dark:bg-indigo-950/40'
                                : preview
                                ? 'border-emerald-400/70 bg-emerald-50/60 dark:border-emerald-600/60 dark:bg-emerald-950/30'
                                : parseError
                                ? 'border-red-300 bg-red-50/60 dark:border-red-800/60 dark:bg-red-950/20'
                                : 'border-stone-300 bg-stone-50/60 hover:border-indigo-400/70 hover:bg-indigo-50/40 dark:border-stone-600 dark:bg-stone-900/30 dark:hover:border-indigo-500/60 dark:hover:bg-indigo-950/20',
                        ].join(' ')}
                    >
                        {preview ? (
                            <>
                                <div className='flex size-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60'>
                                    <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='size-7 text-emerald-600 dark:text-emerald-400' aria-hidden>
                                        <path strokeLinecap='round' strokeLinejoin='round' d='m4.5 12.75 6 6 9-13.5' />
                                    </svg>
                                </div>
                                <div>
                                    <p className='font-mono text-sm font-semibold text-stone-900 dark:text-stone-100'>{file?.name}</p>
                                    <p className='mt-1 text-xs text-stone-500 dark:text-stone-400'>
                                        {preview.rows.length} {preview.rows.length === 1 ? 'row' : 'rows'} &middot; {((file?.size ?? 0) / 1024).toFixed(1)} KB &mdash; click to change
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={['flex size-14 items-center justify-center rounded-2xl transition', dragOver ? 'bg-indigo-100 dark:bg-indigo-900/60' : parseError ? 'bg-red-100 dark:bg-red-950/40' : 'bg-stone-100 dark:bg-stone-800'].join(' ')}>
                                    <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className={['size-7 transition', dragOver ? 'text-indigo-600 dark:text-indigo-300' : parseError ? 'text-red-500 dark:text-red-400' : 'text-stone-400 dark:text-stone-500'].join(' ')} aria-hidden>
                                        <path strokeLinecap='round' strokeLinejoin='round' d='M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5' />
                                    </svg>
                                </div>
                                <div>
                                    <p className={['text-sm font-medium transition', dragOver ? 'text-indigo-700 dark:text-indigo-300' : parseError ? 'text-red-700 dark:text-red-400' : 'text-stone-700 dark:text-stone-300'].join(' ')}>
                                        {dragOver ? 'Drop to upload' : parseError ? 'Try a different file' : 'Drag and drop your Excel file here'}
                                    </p>
                                    <p className='mt-1 text-xs text-stone-400 dark:text-stone-500'>
                                        or click to browse &mdash; .xlsx, .xls
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Mobile file picker */}
                    <div className='mt-6 sm:hidden'>
                        <label htmlFor='file-upload' className='mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'>
                            Excel file (.xlsx, .xls)
                        </label>
                        <label htmlFor='file-upload' className='block w-full cursor-pointer rounded-2xl border border-stone-300/90 bg-white px-4 py-2.5 text-sm text-stone-600 transition hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800'>
                            {file ? file.name : 'Choose file…'}
                        </label>
                    </div>

                    {/* Parse error */}
                    {parseError && (
                        <p className='mt-4 text-sm text-red-700 dark:text-red-400'>{parseError}</p>
                    )}
                </div>

                {/* Preview card */}
                {preview && (
                    <div className={card}>
                        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                            <div>
                                <h2 className={heading2}>Preview</h2>
                                <p className='mt-1 text-sm text-stone-500 dark:text-stone-400'>
                                    {preview.rows.length} {preview.rows.length === 1 ? 'person' : 'people'} ready to import. Review the data below before confirming.
                                </p>
                            </div>
                            <button
                                type='button'
                                onClick={handleClear}
                                className='shrink-0 text-xs text-stone-400 underline-offset-2 hover:text-stone-600 hover:underline dark:text-stone-500 dark:hover:text-stone-300'
                            >
                                Remove file
                            </button>
                        </div>

                        {/* Scrollable table */}
                        <div className='mt-6 overflow-x-auto overflow-y-auto rounded-[1.1rem] border border-stone-200/90 bg-white/95 shadow-sm dark:border-stone-700/80 dark:bg-stone-900/45' style={{ maxHeight: '22rem' }}>
                            <table className='w-full min-w-max text-left text-sm'>
                                <thead className='sticky top-0 z-10'>
                                    <tr className={tableHeadRow}>
                                        {preview.headers.map((h) => (
                                            <th key={h} className={tableTh}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.rows.map((row, i) => (
                                        <tr key={i} className={tableRow}>
                                            {preview.headers.map((h) => (
                                                <td key={h} className={`${tableTd} max-w-[200px] truncate font-mono text-xs`}>
                                                    {row[h] == null ? (
                                                        <span className='text-stone-300 dark:text-stone-600'>—</span>
                                                    ) : String(row[h])}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pre-import validation warnings */}
                        {skipPreview.missingColumns.length > 0 && (
                            <div className='mt-4 rounded-xl border border-red-200/80 bg-red-50/90 p-4 dark:border-red-900/50 dark:bg-red-950/40'>
                                <p className='text-sm font-medium text-red-800 dark:text-red-200'>
                                    Missing required column{skipPreview.missingColumns.length > 1 ? 's' : ''}: {skipPreview.missingColumns.join(', ')}
                                </p>
                                <p className='mt-1 text-xs text-red-700 dark:text-red-300'>
                                    The import will be rejected. Add the column(s) and re-upload.
                                </p>
                            </div>
                        )}
                        {skipPreview.missingColumns.length === 0 && skipPreview.rows.length > 0 && (
                            <div className='mt-4 rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 dark:border-amber-900/40 dark:bg-amber-950/30'>
                                <p className='text-sm font-medium text-amber-900 dark:text-amber-100'>
                                    {skipPreview.rows.length} row{skipPreview.rows.length > 1 ? 's' : ''} will be skipped
                                </p>
                                <ul className='mt-2 max-h-32 space-y-0.5 overflow-y-auto text-xs text-amber-800 dark:text-amber-200'>
                                    {skipPreview.rows.map((r) => (
                                        <li key={r.row}>Row {r.row}: {r.reason}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Action row */}
                        <div className='mt-6 flex items-center justify-between gap-4'>
                            <p className='text-xs text-stone-400 dark:text-stone-500'>
                                Existing records matched by email will be updated.
                            </p>
                            <button
                                type='button'
                                onClick={handleImport}
                                disabled={uploading || skipPreview.missingColumns.length > 0}
                                className={`${btnPrimary} shrink-0 disabled:pointer-events-none disabled:opacity-45`}
                            >
                                {uploading ? (
                                    <>
                                        <svg className='size-4 animate-spin' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' aria-hidden>
                                            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                                            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z' />
                                        </svg>
                                        Importing…
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='size-4' aria-hidden>
                                            <path strokeLinecap='round' strokeLinejoin='round' d='M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z' />
                                        </svg>
                                        Import to roster
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Result banner */}
                {result && (
                    <div
                        className={`rounded-2xl border p-5 ${result.success ? 'border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-900/50 dark:bg-emerald-950/40' : 'border-red-200/80 bg-red-50/90 dark:border-red-900/50 dark:bg-red-950/40'}`}
                        role={result.success ? 'status' : 'alert'}
                        aria-live={result.success ? 'polite' : 'assertive'}
                    >
                        <p className={`text-sm font-medium ${result.success ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200'}`}>
                            {result.message}
                        </p>
                        {result.success && result.data && (
                            <>
                                <p className='mt-2 text-xs text-emerald-700 dark:text-emerald-300'>
                                    {result.data.created ?? 0} created &middot; {result.data.updated ?? 0} updated
                                    {(result.data.skipped ?? 0) > 0 && ` · ${result.data.skipped} skipped`}
                                </p>
                                {result.data.skipped_rows && result.data.skipped_rows.length > 0 && (
                                    <ul className='mt-2 max-h-32 space-y-0.5 overflow-y-auto text-xs text-emerald-700/90 dark:text-emerald-300/90'>
                                        {result.data.skipped_rows.map((r) => (
                                            <li key={r.row}>Row {r.row}: {r.reason}</li>
                                        ))}
                                    </ul>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </SidebarLayout>
    );
}
