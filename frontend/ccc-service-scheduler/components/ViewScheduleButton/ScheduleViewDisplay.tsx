'use client';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import type { OfficiantAssignment, DaySchedule, ScheduleWeekDetail, ScheduleViewDisplayProps } from '@/types/scheduleTypes';
import ModalShell from '@/components/modals/ModalShell';
import { api } from '@/lib/api';
import { getAssignmentWarnings } from '@/lib/eligibility';
import { positionsFor } from '@/constants/positions';
import { btnDanger, btnPrimary, btnSecondary, btnTableSecondary, inputBase, selectBase } from '@/lib/ui';

type Person = { id: number; first_name: string; last_name: string; rank: string; gender?: string | null; availability?: unknown };

function exportToExcel(schedule: ScheduleWeekDetail) {
    const rows: Record<string, string>[] = [];
    for (const day of schedule.days) {
        if (day.officiants.length === 0) {
            rows.push({ Day: day.dayOfWeek, Date: day.date, 'Service Type': day.serviceType ?? '', Time: day.time ?? '', Role: '', Person: '', Confirmed: '' });
        } else {
            for (const o of day.officiants) {
                rows.push({ Day: day.dayOfWeek, Date: day.date, 'Service Type': day.serviceType ?? '', Time: day.time ?? '', Role: o.role, Person: o.personName, Confirmed: o.confirmed ? 'Yes' : 'No' });
            }
        }
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
    XLSX.writeFile(wb, `schedule-${schedule.startDate}-to-${schedule.endDate}.xlsx`);
}

type AssignmentFormProps = {
    people: Person[];
    day: DaySchedule;
    initial?: { personId: number; role: string };
    editingId?: number;
    onSave: (personId: number, role: string) => Promise<void>;
    onCancel: () => void;
};

function AssignmentForm({ people, day, initial, editingId, onSave, onCancel }: AssignmentFormProps) {
    const [personId, setPersonId] = useState<number | ''>(initial?.personId ?? '');
    const [role, setRole] = useState(initial?.role ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const roleOptions = positionsFor(day.serviceType);
    const selectedPerson = personId === '' ? undefined : people.find((p) => p.id === personId);
    const warnings =
        selectedPerson && role.trim()
            ? getAssignmentWarnings(
                { id: selectedPerson.id, gender: selectedPerson.gender, rank: selectedPerson.rank },
                {
                    role: role.trim(),
                    date: day.date,
                    officiants: day.officiants,
                    editingAssignmentId: editingId,
                    availability: selectedPerson.availability,
                },
            )
            : [];

    const handleSubmit = async () => {
        if (personId === '') { setError('Select a person.'); return; }
        if (!role.trim()) { setError('Role is required.'); return; }
        setSaving(true);
        setError(null);
        try {
            await onSave(personId as number, role.trim());
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to save.');
            setSaving(false);
        }
    };

    return (
        <div className='mt-3 space-y-2 rounded-xl border border-indigo-200/60 bg-indigo-50/60 p-3 dark:border-indigo-800/40 dark:bg-indigo-950/30'>
            {error && <p className='text-xs text-red-600 dark:text-red-400'>{error}</p>}
            <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                <select
                    value={personId}
                    onChange={(e) => setPersonId(e.target.value === '' ? '' : Number(e.target.value))}
                    className={selectBase}
                >
                    <option value=''>Select person…</option>
                    {people.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.first_name} {p.last_name} ({p.rank})
                        </option>
                    ))}
                </select>
                <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder='Role…'
                    list={roleOptions.length ? `roles-${day.serviceId}` : undefined}
                    className={inputBase}
                />
                {roleOptions.length > 0 && (
                    <datalist id={`roles-${day.serviceId}`}>
                        {roleOptions.map((r) => <option key={r} value={r} />)}
                    </datalist>
                )}
            </div>

            {warnings.length > 0 && (
                <ul className='space-y-1 rounded-lg border border-amber-300/70 bg-amber-50/90 px-3 py-2 text-xs text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200'>
                    {warnings.map((w, i) => (
                        <li key={i} className='flex items-start gap-1.5'>
                            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='mt-0.5 size-3.5 shrink-0' aria-hidden>
                                <path fillRule='evenodd' d='M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z' clipRule='evenodd' />
                            </svg>
                            <span>{w}</span>
                        </li>
                    ))}
                </ul>
            )}

            <div className='flex justify-end gap-2'>
                <button type='button' onClick={onCancel} className={btnSecondary}>Cancel</button>
                <button type='button' onClick={handleSubmit} disabled={saving} className={`${btnPrimary} disabled:pointer-events-none disabled:opacity-45`}>
                    {saving ? 'Saving…' : warnings.length > 0 ? 'Save anyway' : 'Save'}
                </button>
            </div>
        </div>
    );
}

type DaySectionProps = {
    day: DaySchedule;
    people: Person[];
    onAdd: (serviceId: number, personId: number, role: string) => Promise<void>;
    onEdit: (assignmentId: number, personId: number, role: string) => Promise<void>;
    onRemove: (assignmentId: number) => Promise<void>;
    onToggleConfirm: (assignmentId: number, confirmed: boolean) => Promise<void>;
};

function DaySection({ day, people, onAdd, onEdit, onRemove, onToggleConfirm }: DaySectionProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [addingNew, setAddingNew] = useState(false);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const runAction = async (id: number, action: () => Promise<void>) => {
        setBusyId(id);
        setActionError(null);
        try {
            await action();
        } catch (e) {
            setActionError(e instanceof Error ? e.message : 'Action failed. Please try again.');
        } finally {
            setBusyId(null);
            setRemovingId(null);
        }
    };

    return (
        <section className='relative overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-50/50 pl-4 dark:border-stone-600/50 dark:bg-stone-900/30'>
            <div className='absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-amber-500 to-indigo-700 opacity-90 dark:from-amber-400 dark:to-indigo-500' aria-hidden />
            <div className='py-4 pl-4 pr-4'>
                <h3 className='text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400'>
                    {day.dayOfWeek} — {day.date}
                    {day.serviceType ? ` · ${day.serviceType}${day.time ? ` · ${day.time}` : ''}` : ''}
                </h3>

                {actionError && (
                    <p className='mt-2 text-xs text-red-600 dark:text-red-400'>{actionError}</p>
                )}

                {day.officiants.length === 0 && !addingNew && (
                    <p className='mt-2 text-sm text-stone-500 dark:text-stone-400'>No officiants assigned</p>
                )}

                {day.officiants.length > 0 && (
                    <ul className='mt-3 space-y-2'>
                        {day.officiants.map((o: OfficiantAssignment) => (
                            <li key={o.id} className='rounded-xl border border-stone-200/60 bg-white/90 px-3 py-2.5 dark:border-stone-600/40 dark:bg-stone-950/40'>
                                {editingId === o.id ? (
                                    <AssignmentForm
                                        people={people}
                                        day={day}
                                        initial={{ personId: o.personId, role: o.role }}
                                        editingId={o.id}
                                        onSave={async (pId, r) => {
                                            await onEdit(o.id, pId, r);
                                            setEditingId(null);
                                        }}
                                        onCancel={() => setEditingId(null)}
                                    />
                                ) : (
                                    <div className='flex items-center justify-between gap-4 text-sm'>
                                        <div className='flex flex-wrap items-center gap-2'>
                                            <span className='font-medium text-indigo-900 dark:text-indigo-200'>{o.role}</span>
                                            <span className='text-stone-400 dark:text-stone-500'>·</span>
                                            <span className='text-stone-800 dark:text-stone-100'>{o.personName}</span>
                                            {o.confirmed && (
                                                <span className='rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'>
                                                    Confirmed
                                                </span>
                                            )}
                                        </div>
                                        <div className='flex shrink-0 flex-wrap items-center gap-1'>
                                            <button
                                                type='button'
                                                onClick={() => runAction(o.id, () => onToggleConfirm(o.id, !o.confirmed))}
                                                disabled={busyId === o.id}
                                                className={`${btnTableSecondary} disabled:pointer-events-none disabled:opacity-50`}
                                            >
                                                {busyId === o.id ? '…' : o.confirmed ? 'Unconfirm' : 'Confirm'}
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => { setEditingId(o.id); setRemovingId(null); setAddingNew(false); }}
                                                disabled={busyId === o.id}
                                                className={`${btnTableSecondary} disabled:pointer-events-none disabled:opacity-50`}
                                            >
                                                Edit
                                            </button>
                                            {removingId === o.id ? (
                                                <span className='flex items-center gap-1 text-xs'>
                                                    <span className='text-stone-500 dark:text-stone-400'>Sure?</span>
                                                    <button type='button' onClick={() => runAction(o.id, () => onRemove(o.id))} disabled={busyId === o.id} className={`${btnDanger} disabled:pointer-events-none disabled:opacity-50`}>{busyId === o.id ? '…' : 'Yes'}</button>
                                                    <button type='button' onClick={() => setRemovingId(null)} className='text-xs text-stone-400 hover:text-stone-600'>No</button>
                                                </span>
                                            ) : (
                                                <button type='button' onClick={() => setRemovingId(o.id)} disabled={busyId === o.id} className={`${btnDanger} disabled:pointer-events-none disabled:opacity-50`}>Remove</button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {addingNew ? (
                    <AssignmentForm
                        people={people}
                        day={day}
                        onSave={async (pId, r) => {
                            await onAdd(day.serviceId, pId, r);
                            setAddingNew(false);
                        }}
                        onCancel={() => setAddingNew(false)}
                    />
                ) : (
                    <button
                        type='button'
                        onClick={() => { setAddingNew(true); setEditingId(null); }}
                        className='mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200'
                    >
                        + Add officiant
                    </button>
                )}
            </div>
        </section>
    );
}

export default function ScheduleViewDisplay({ schedule: initialSchedule, onClose, onScheduleChanged }: ScheduleViewDisplayProps) {
    const [schedule, setSchedule] = useState<ScheduleWeekDetail>(initialSchedule);
    const [people, setPeople] = useState<Person[]>([]);

    useEffect(() => {
        api('/people').then((data) => setPeople(Array.isArray(data) ? data : [])).catch(() => {});
    }, []);

    const personName = (personId: number) => {
        const p = people.find((x) => x.id === personId);
        return p ? `${p.first_name} ${p.last_name}` : 'Unknown';
    };

    // Optimistic local mutators — update state immediately, roll back on failure.
    const mapOfficiant = (assignmentId: number, fn: (o: OfficiantAssignment) => OfficiantAssignment) =>
        setSchedule((s) => ({
            ...s,
            days: s.days.map((d) => ({
                ...d,
                officiants: d.officiants.map((o) => (o.id === assignmentId ? fn(o) : o)),
            })),
        }));

    const handleAdd = async (serviceId: number, personId: number, role: string) => {
        // Add can't be shown until the server assigns an id, so we don't render
        // an optimistic row; we insert the real record from the response.
        const created = await api('/assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ service_id: serviceId, person_id: personId, role }),
        });
        const newOfficiant: OfficiantAssignment = {
            id: created.id,
            role: created.role,
            personId: created.person_id,
            personName: personName(created.person_id),
            confirmed: !!created.confirmed,
        };
        setSchedule((s) => ({
            ...s,
            days: s.days.map((d) =>
                d.serviceId === serviceId ? { ...d, officiants: [...d.officiants, newOfficiant] } : d,
            ),
        }));
        onScheduleChanged?.();
    };

    const handleEdit = async (assignmentId: number, personId: number, role: string) => {
        const prev = schedule;
        mapOfficiant(assignmentId, (o) => ({ ...o, personId, personName: personName(personId), role }));
        try {
            await api(`/assignments/${assignmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ person_id: personId, role }),
            });
            onScheduleChanged?.();
        } catch (e) {
            setSchedule(prev);
            throw e;
        }
    };

    const handleRemove = async (assignmentId: number) => {
        const prev = schedule;
        setSchedule((s) => ({
            ...s,
            days: s.days.map((d) => ({
                ...d,
                officiants: d.officiants.filter((o) => o.id !== assignmentId),
            })),
        }));
        try {
            await api(`/assignments/${assignmentId}`, { method: 'DELETE' });
            onScheduleChanged?.();
        } catch (e) {
            setSchedule(prev);
            throw e;
        }
    };

    const handleToggleConfirm = async (assignmentId: number, confirmed: boolean) => {
        const prev = schedule;
        mapOfficiant(assignmentId, (o) => ({ ...o, confirmed }));
        try {
            await api(`/assignments/${assignmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmed }),
            });
            onScheduleChanged?.();
        } catch (e) {
            setSchedule(prev);
            throw e;
        }
    };

    return (
        <ModalShell
            onClose={onClose}
            ariaLabel={`Schedule for ${schedule.startDate} through ${schedule.endDate}`}
            panelClassName='max-w-3xl border-indigo-950/10 shadow-indigo-950/20 dark:border-indigo-300/10'
        >
            <div className='mb-6 flex flex-col gap-4 border-b border-amber-200/40 pb-5 dark:border-amber-400/20 sm:flex-row sm:items-start sm:justify-between sm:pb-6'>
                <div>
                    <p className='font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-amber-700 dark:text-amber-400/90'>
                        Week view
                    </p>
                    <h2 className='mt-2 font-[family-name:var(--font-fraunces),Georgia,serif] text-2xl font-medium tracking-tight text-indigo-950 dark:text-indigo-50 sm:text-3xl'>
                        {schedule.startDate}{' '}
                        <span className='text-amber-600/70 dark:text-amber-400/60'>–</span>{' '}
                        {schedule.endDate}
                    </h2>
                    <p className='mt-1 text-sm text-stone-600 dark:text-stone-400'>
                        {schedule.month} {schedule.year}
                    </p>
                </div>
                <div className='flex shrink-0 gap-2'>
                    <button type='button' onClick={() => exportToExcel(schedule)} className={btnSecondary}>
                        <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='size-4' aria-hidden>
                            <path strokeLinecap='round' strokeLinejoin='round' d='M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3' />
                        </svg>
                        Export
                    </button>
                    <button type='button' onClick={onClose} className={btnSecondary}>
                        Close
                    </button>
                </div>
            </div>
            <div className='max-h-[min(60vh,28rem)] space-y-3 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:thin] sm:max-h-[min(70vh,32rem)]'>
                {schedule.days.map((day) => (
                    <DaySection
                        key={day.date}
                        day={day}
                        people={people}
                        onAdd={handleAdd}
                        onEdit={handleEdit}
                        onRemove={handleRemove}
                        onToggleConfirm={handleToggleConfirm}
                    />
                ))}
            </div>
        </ModalShell>
    );
}
