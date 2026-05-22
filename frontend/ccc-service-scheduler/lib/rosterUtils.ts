import type { Person } from '@/types/types';

/** Canonical day keys and their display labels. */
const DAY_LABELS: Record<string, string> = {
    sundays: 'Sundays',
    mondays: 'Mondays',
    tuesdays: 'Tuesdays',
    wednesdays: 'Wednesdays',
    thursdays: 'Thursdays',
    fridays: 'Fridays',
    saturdays: 'Saturdays',
};

/**
 * Converts an availability value (JSON object or string) to a human-readable
 * list of days, e.g. "Sundays, Wednesdays". Returns "—" for null/undefined and
 * "Not available" when no days are marked true.
 */
export function formatAvailability(availability: unknown): string {
    if (availability == null) return '—';

    let parsed: Record<string, unknown>;

    if (typeof availability === 'string') {
        try {
            const p: unknown = JSON.parse(availability);
            if (typeof p !== 'object' || p === null || Array.isArray(p)) return availability;
            parsed = p as Record<string, unknown>;
        } catch {
            return availability;
        }
    } else if (typeof availability === 'object' && !Array.isArray(availability)) {
        parsed = availability as Record<string, unknown>;
    } else {
        return String(availability);
    }

    const available = Object.entries(parsed)
        .filter(([, v]) => v === true)
        .map(([k]) => DAY_LABELS[k.toLowerCase()] ?? k);

    if (available.length === 0) return 'Not available';
    return available.join(', ');
}

export function calculateAge(birthDate?: string | null): number | null {
    if (!birthDate) return null;
    const today = new Date();
    const dob = new Date(birthDate);
    if (isNaN(dob.getTime())) return null;
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
}

export function fullName(p: Person): string {
    return `${p.first_name} ${p.last_name}`;
}
