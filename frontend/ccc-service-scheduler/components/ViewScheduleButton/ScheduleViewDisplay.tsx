'use client';

import type { ScheduleWeekDetail } from './scheduleTypes';

type ScheduleViewDisplayProps = {
  schedule: ScheduleWeekDetail;
  onClose: () => void;
};

export default function ScheduleViewDisplay({ schedule, onClose }: ScheduleViewDisplayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Schedule: {schedule.startDate} – {schedule.endDate} ({schedule.month} {schedule.year})
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          >
            Close
          </button>
        </div>
        <div className="space-y-6">
          {schedule.days.map((day) => (
            <section
              key={day.date}
              className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
            >
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                {day.dayOfWeek} — {day.date}
                {day.serviceType ? ` · ${day.serviceType}` : ''}
              </h3>
              {day.officiants.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No officiants assigned</p>
              ) : (
                <ul className="space-y-1.5">
                  {day.officiants.map((o, i) => (
                    <li
                      key={`${day.date}-${o.role}-${i}`}
                      className="flex justify-between gap-4 text-sm text-zinc-800 dark:text-zinc-200"
                    >
                      <span className="font-medium text-zinc-600 dark:text-zinc-400">{o.role}</span>
                      <span>{o.personName}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
