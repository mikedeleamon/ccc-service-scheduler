'use client';

import { useEffect, useMemo, useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout/SidebarLayout';
import BackButton from '@/components/BackButton/BackButton';
import ServiceEditModal, { ServiceDraft } from '@/components/modals/ServiceEditModal';
import ServiceDetailsModal from '@/components/modals/ServiceDetailsModal';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import { api } from '@/lib/api';
import { useParish } from '@/lib/ParishContext';
import {
    btnPrimary,
    heading1,
    lead,
    pageContent,
    table,
    tableHeadRow,
    tableRow,
    tableTd,
    tableTh,
    tableWrap,
    btnTableSecondary,
    btnDanger,
} from '@/lib/ui';

type Service = {
    id: number;
    date: string;
    time: string | null;
    service_type: string;
    parish: string | null;
};

function formatDate(iso: string): string {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ServicesPage() {
    const { parish } = useParish();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [editing, setEditing] = useState<ServiceDraft | null>(null);
    const [viewing, setViewing] = useState<Service | null>(null);
    const [deletingService, setDeletingService] = useState<Service | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const load = () => {
        setLoading(true);
        const params = parish ? `?parish=${encodeURIComponent(parish)}` : '';
        return api(`/services${params}`)
            .then((data) => setServices(Array.isArray(data) ? data : []))
            .catch((err) => setError(err.message ?? 'Failed to load services'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [parish]);

    const totalRows = services.length;
    const showPagination = totalRows > pageSize;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);

    const pageRows = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return services.slice(start, start + pageSize);
    }, [services, safePage]);

    const handleSave = async (draft: ServiceDraft) => {
        const payload = { date: draft.date, time: draft.time || null, service_type: draft.service_type, parish: parish || null };
        if (draft.id) {
            const updated = await api(`/services/${draft.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        } else {
            const created = await api('/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            setServices((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
        }
    };

    const confirmDeleteService = async () => {
        if (!deletingService) return;
        const svc = deletingService;
        setDeletingService(null);
        setDeleteError(null);
        try {
            await api(`/services/${svc.id}`, { method: 'DELETE' });
            setServices((prev) => prev.filter((s) => s.id !== svc.id));
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Failed to delete service. Please try again.');
        }
    };

    const blankDraft: ServiceDraft = { date: '', time: '', service_type: '' };

    return (
        <SidebarLayout>
            <div className={`${pageContent} relative max-w-5xl`}>
                <div className='flex flex-col gap-6 sm:flex-row sm:items-start'>
                    <BackButton />
                    <header className='min-w-0 flex-1 space-y-4 pt-1 sm:pt-0'>
                        <div>
                            <h1 className={heading1}>Services</h1>
                            <p className={`${lead} mt-2 max-w-xl`}>
                                Church services that need officiants assigned.
                            </p>
                        </div>
                        <button
                            type='button'
                            onClick={() => setEditing(blankDraft)}
                            className={btnPrimary}
                        >
                            <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='size-4' aria-hidden>
                                <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
                            </svg>
                            Add service
                        </button>
                    </header>
                </div>

                {/* Delete error banner */}
                {deleteError && (
                    <div className='rounded-2xl border border-red-200/80 bg-red-50/90 p-4 dark:border-red-900/50 dark:bg-red-950/40'>
                        <p className='text-sm text-red-800 dark:text-red-200'>{deleteError}</p>
                    </div>
                )}

                {/* Fetch error */}
                {error && (
                    <div className='rounded-2xl border border-red-200/80 bg-red-50/90 p-4 dark:border-red-900/50 dark:bg-red-950/40'>
                        <p className='text-sm text-red-800 dark:text-red-200'>{error}</p>
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && (
                    <div className={tableWrap}>
                        <table className={`${table} min-w-[520px]`}>
                            <thead>
                                <tr className={tableHeadRow}>
                                    <th className={tableTh}>Date</th>
                                    <th className={tableTh}>Time</th>
                                    <th className={tableTh}>Service type</th>
                                    <th className={tableTh}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className='border-b border-stone-100 dark:border-stone-800/90'>
                                        <td className={tableTd}><div className='h-3.5 w-40 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700' /></td>
                                        <td className={tableTd}><div className='h-3.5 w-14 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700' /></td>
                                        <td className={tableTd}><div className='h-3.5 w-32 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700' /></td>
                                        <td className={tableTd}><div className='h-3.5 w-24 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700' /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && services.length === 0 && (
                    <div className='flex flex-col items-center justify-center gap-6 rounded-[1.35rem] border border-dashed border-stone-300 bg-stone-50/60 px-8 py-20 text-center dark:border-stone-600 dark:bg-stone-900/30'>
                        <div className='flex size-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950/60'>
                            <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='size-8 text-indigo-500 dark:text-indigo-400' aria-hidden>
                                <path strokeLinecap='round' strokeLinejoin='round' d='M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5' />
                            </svg>
                        </div>
                        <div className='max-w-sm'>
                            <h2 className='font-[family-name:var(--font-fraunces),Georgia,serif] text-xl font-medium tracking-tight text-indigo-950 dark:text-indigo-50'>
                                No services yet
                            </h2>
                            <p className='mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400'>
                                Add your first service to get started. Services are the church gatherings that need officiants assigned.
                            </p>
                        </div>
                        <button type='button' onClick={() => setEditing(blankDraft)} className={btnPrimary}>
                            <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='size-4' aria-hidden>
                                <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
                            </svg>
                            Add first service
                        </button>
                    </div>
                )}

                {!loading && !error && services.length > 0 && (
                    <div className={tableWrap}>
                        <table className={table}>
                            <thead>
                                <tr className={tableHeadRow}>
                                    <th className={tableTh}>Date</th>
                                    <th className={tableTh}>Time</th>
                                    <th className={tableTh}>Service type</th>
                                    <th className={tableTh}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((svc) => (
                                    <tr key={svc.id} className={tableRow}>
                                        <td className={`${tableTd} font-medium text-stone-900 dark:text-stone-100`}>
                                            {formatDate(svc.date)}
                                        </td>
                                        <td className={tableTd}>
                                            {svc.time ?? <span className='text-stone-400 dark:text-stone-500'>—</span>}
                                        </td>
                                        <td className={tableTd}>{svc.service_type}</td>
                                        <td className={tableTd}>
                                            <div className='flex items-center gap-2'>
                                                <button
                                                    type='button'
                                                    onClick={() => setViewing(svc)}
                                                    className={btnTableSecondary}
                                                >
                                                    View
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => setEditing({ id: svc.id, date: svc.date, time: svc.time ?? '', service_type: svc.service_type })}
                                                    className={btnTableSecondary}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => setDeletingService(svc)}
                                                    className={btnDanger}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {showPagination && (
                    <div className='flex items-center justify-between'>
                        <p className='text-sm text-stone-600 dark:text-stone-400'>
                            Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, totalRows)} of {totalRows}
                        </p>
                        <div className='flex items-center gap-2'>
                            <button type='button' onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className='rounded-2xl border border-stone-300/90 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-stone-50 disabled:opacity-40 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800'>Prev</button>
                            <span className='min-w-[6rem] text-center text-sm text-stone-600 dark:text-stone-400'>Page {safePage} of {totalPages}</span>
                            <button type='button' onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className='rounded-2xl border border-stone-300/90 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-stone-50 disabled:opacity-40 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800'>Next</button>
                        </div>
                    </div>
                )}

                {viewing && (
                    <ServiceDetailsModal
                        service={viewing}
                        parish={parish}
                        onClose={() => setViewing(null)}
                        onEdit={(svc) => {
                            setViewing(null);
                            setEditing({ id: svc.id, date: svc.date, time: svc.time ?? '', service_type: svc.service_type });
                        }}
                        onDelete={(svc) => {
                            setViewing(null);
                            setDeletingService(svc);
                        }}
                    />
                )}

                {editing && (
                    <ServiceEditModal
                        service={editing}
                        onClose={() => setEditing(null)}
                        onSave={handleSave}
                    />
                )}

                {deletingService && (
                    <DeleteConfirmModal
                        label={`${formatDate(deletingService.date)} — ${deletingService.service_type}`}
                        onCancel={() => setDeletingService(null)}
                        onConfirm={confirmDeleteService}
                    />
                )}
            </div>
        </SidebarLayout>
    );
}
