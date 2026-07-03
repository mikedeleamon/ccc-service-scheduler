/**
 * Date logic for the recurring CCC service calendar.
 *
 * Mirrors the backend `app/scheduling/calendar.py` so the UI can preview
 * which service (and time) occurs on a given date without a round-trip.
 * Keep the two in sync.
 */

const SUNDAY = 0;
const WEDNESDAY = 3;
const THURSDAY = 4;
const FRIDAY = 5;

function easterSunday(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

function isNthWeekday(d: Date, weekday: number, n: number): boolean {
    return d.getDay() === weekday && Math.floor((d.getDate() - 1) / 7) === n - 1;
}

function lastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
    const lastDay = new Date(year, month + 1, 0).getDate();
    const d = new Date(year, month, lastDay);
    const offset = (d.getDay() - weekday + 7) % 7;
    d.setDate(d.getDate() - offset);
    return d;
}

export type ServiceForDate = { serviceType: string; time: string };

/** Returns the service type + time occurring on `dateIso` (YYYY-MM-DD), or null. */
export function serviceForDate(dateIso: string): ServiceForDate | null {
    const [y, m, day] = dateIso.split('-').map(Number);
    const d = new Date(y, m - 1, day);

    if (m === 12 && day === 24) return { serviceType: 'Christmas Service', time: '18:00' };
    if (m === 12 && day === 31) return { serviceType: 'New Years Service', time: '22:00' };

    const wd = d.getDay();
    if (wd === SUNDAY) {
        const easter = easterSunday(y);
        if (easter.getFullYear() === y && easter.getMonth() === d.getMonth() && easter.getDate() === d.getDate()) {
            return { serviceType: 'Easter Service', time: '10:00' };
        }
        if (isNthWeekday(d, SUNDAY, 3)) return { serviceType: 'Youth Service', time: '10:00' };
        return { serviceType: 'Devotional Service', time: '10:00' };
    }
    if (wd === WEDNESDAY) return { serviceType: 'Mercy Day Service', time: '18:00' };
    if (wd === FRIDAY) return { serviceType: 'Power Day Service', time: '18:00' };
    if (wd === THURSDAY) {
        const lastThu = lastWeekdayOfMonth(y, m - 1, THURSDAY);
        if (lastThu.getDate() === day) return { serviceType: 'New Moon Service', time: '22:00' };
    }
    return null;
}
