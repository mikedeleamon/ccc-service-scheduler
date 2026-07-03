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
    btnSecondary,
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

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

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

    // PDF state
    const now = new Date();
    const [pdfMonth, setPdfMonth] = useState(now.getMonth()); // 0-indexed
    const [pdfYear, setPdfYear] = useState(now.getFullYear());
    const [pdfGenerating, setPdfGenerating] = useState(false);

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

    const handleSaveMany = async (drafts: ServiceDraft[]) => {
        const results = await Promise.allSettled(
            drafts.map((draft) =>
                api('/services', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: draft.date,
                        time: draft.time || null,
                        service_type: draft.service_type,
                        parish: parish || null,
                    }),
                }),
            ),
        );
        const created = results
            .filter((r): r is PromiseFulfilledResult<Service> => r.status === 'fulfilled')
            .map((r) => r.value);
        if (created.length > 0) {
            setServices((prev) =>
                [...prev, ...created].sort((a, b) => a.date.localeCompare(b.date)),
            );
        }
        const failures = results.length - created.length;
        if (failures > 0) {
            throw new Error(`Added ${created.length} of ${results.length} services. ${failures} could not be created.`);
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

    const handleDownloadPdf = async () => {
        setPdfGenerating(true);
        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');

            const firstDay = `${pdfYear}-${String(pdfMonth + 1).padStart(2, '0')}-01`;
            const lastDay = new Date(pdfYear, pdfMonth + 1, 0).getDate();
            const lastDayStr = `${pdfYear}-${String(pdfMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            const params = new URLSearchParams({ start_date: firstDay, end_date: lastDayStr });
            if (parish) params.set('parish', parish);

            const weeks = await api(`/schedule?${params.toString()}`);

            type RawOfficiant = { role: string; personName: string };
            type RawDay = {
                date: string; dayOfWeek?: string; time?: string | null; serviceType?: string; officiants: RawOfficiant[];
                firstLessonVerse?: string | null; secondLessonVerse?: string | null;
            };
            const days: RawDay[] = (Array.isArray(weeks) ? weeks : [])
                .flatMap((w: { days: RawDay[] }) => w.days ?? [])
                .sort((a: RawDay, b: RawDay) => a.date.localeCompare(b.date));

            const ordinal = (n: number) => {
                const s = ['th', 'st', 'nd', 'rd'];
                const v = n % 100;
                return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
            };

            const officiantFor = (officiants: RawOfficiant[], role: string) => {
                const match = officiants.find((o) => o.role.toLowerCase() === role.toLowerCase());
                return match ? match.personName.toUpperCase() : 'TBD';
            };

            const lessonCellFor = (officiants: RawOfficiant[], role: string, verse: string | null | undefined) => {
                const name = officiantFor(officiants, role);
                return verse ? `${name}\n${verse}` : name;
            };

            const formatTime12 = (time: string | null | undefined) => {
                if (!time) return '—';
                const [h, m] = time.split(':').map(Number);
                const period = h >= 12 ? 'PM' : 'AM';
                const hour = h % 12 || 12;
                return m === 0 ? `${hour}${period}` : `${hour}:${String(m).padStart(2, '0')}${period}`;
            };

            // Group days by calendar week (Mon–Sun)
            const getMondayOf = (dateStr: string) => {
                const d = new Date(dateStr + 'T00:00:00');
                const dow = d.getDay(); // 0=Sun
                const diff = dow === 0 ? -6 : 1 - dow;
                const mon = new Date(d);
                mon.setDate(d.getDate() + diff);
                return mon;
            };
            const weekLabel = (monday: Date) => {
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                const fmt = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                return `${fmt(monday)} – ${fmt(sunday)}`;
            };
            const weekMap = new Map<string, RawDay[]>();
            for (const day of days) {
                const key = getMondayOf(day.date).toISOString().slice(0, 10);
                if (!weekMap.has(key)) weekMap.set(key, []);
                weekMap.get(key)!.push(day);
            }
            const sortedWeeks = [...weekMap.entries()].sort(([a], [b]) => a.localeCompare(b));

            // Build table body with week group header rows
            type CellDef = { content: string; colSpan?: number; styles?: object };
            const body: (string | CellDef)[][] = [];
            for (const [mondayKey, weekDays] of sortedWeeks) {
                const monday = new Date(mondayKey + 'T00:00:00');
                body.push([{
                    content: weekLabel(monday),
                    colSpan: 7,
                    styles: { fillColor: [20, 20, 80], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left', fontSize: 10 },
                }]);
                for (const day of weekDays) {
                    const d = new Date(day.date + 'T00:00:00');
                    const dayNum = `${d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} ${ordinal(d.getDate()).toUpperCase()}`;
                    const dayName = (day.dayOfWeek ?? d.toLocaleDateString('en-US', { weekday: 'long' })).toUpperCase();
                    const officiants = day.officiants ?? [];
                    body.push([
                        dayName,
                        dayNum,
                        formatTime12(day.time),
                        officiantFor(officiants, 'Service Conductor'),
                        lessonCellFor(officiants, '1st lesson', day.firstLessonVerse),
                        lessonCellFor(officiants, '2nd lesson', day.secondLessonVerse),
                        officiantFor(officiants, 'Preacher'),
                    ]);
                }
            }

            const doc = new jsPDF({ orientation: 'landscape' });
            const pageW = doc.internal.pageSize.getWidth();

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(20, 20, 80);
            doc.text(
                `OFFICIATING DUTY ROSTER FOR ${MONTHS[pdfMonth].toUpperCase()} ${pdfYear}`,
                pageW / 2, 16, { align: 'center' },
            );

            if (parish) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(80, 80, 80);
                doc.text(`${parish.toUpperCase()} PARISH`, pageW / 2, 23, { align: 'center' });
            }

            if (days.length === 0) {
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text('No services found for this month.', 14, 36);
            } else {
                autoTable(doc, {
                    startY: parish ? 29 : 24,
                    head: [['SERVICE DAYS', 'DATES', 'TIME', 'SERVICE CONDUCTOR', 'FIRST LESSON', 'SECOND LESSON', 'PREACHER']],
                    body,
                    styles: { fontSize: 10, cellPadding: 3, fontStyle: 'bold', lineColor: [200, 200, 200], lineWidth: 0.3 },
                    headStyles: { fillColor: [20, 20, 80], textColor: 255, fontStyle: 'bold', fontSize: 10, halign: 'center' },
                    alternateRowStyles: { fillColor: [245, 245, 255] },
                    columnStyles: {
                        0: { cellWidth: 32 },
                        1: { cellWidth: 28, halign: 'center' },
                        2: { cellWidth: 18, halign: 'center' },
                        3: { cellWidth: 50 },
                        4: { cellWidth: 44 },
                        5: { cellWidth: 44 },
                        6: { cellWidth: 50 },
                    },
                });
            }

            const footerY = doc.internal.pageSize.getHeight() - 10;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(120, 120, 120);
            doc.text('Prepared by the Secretary and Approved by the Shepherd.', 14, footerY);

            doc.save(`duty-roster-${MONTHS[pdfMonth].toLowerCase()}-${pdfYear}.pdf`);
        } finally {
            setPdfGenerating(false);
        }
    };

    const blankDraft: ServiceDraft = { date: '', time: '', service_type: '' };

    const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 1 + i);

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
                        <div className='flex flex-wrap items-center gap-3'>
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

                            {/* PDF download controls */}
                            <div className='flex items-center gap-2'>
                                <select
                                    value={pdfMonth}
                                    onChange={(e) => setPdfMonth(Number(e.target.value))}
                                    className='rounded-xl border border-stone-300/90 bg-white px-2.5 py-2 text-sm text-stone-800 shadow-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200'
                                    aria-label='Month for PDF'
                                >
                                    {MONTHS.map((m, i) => (
                                        <option key={m} value={i}>{m}</option>
                                    ))}
                                </select>
                                <select
                                    value={pdfYear}
                                    onChange={(e) => setPdfYear(Number(e.target.value))}
                                    className='rounded-xl border border-stone-300/90 bg-white px-2.5 py-2 text-sm text-stone-800 shadow-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200'
                                    aria-label='Year for PDF'
                                >
                                    {yearOptions.map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <button
                                    type='button'
                                    onClick={handleDownloadPdf}
                                    disabled={pdfGenerating || loading}
                                    className={btnSecondary}
                                >
                                    <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='size-4' aria-hidden>
                                        <path strokeLinecap='round' strokeLinejoin='round' d='M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3' />
                                    </svg>
                                    {pdfGenerating ? 'Generating…' : 'Download PDF'}
                                </button>
                            </div>
                        </div>
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
                        onSaveMany={handleSaveMany}
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
