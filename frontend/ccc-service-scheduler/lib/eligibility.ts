/**
 * Client-side eligibility checks used to warn (not block) when a manual
 * assignment likely violates the scheduling rules. Mirrors the relevant logic
 * in the backend solver (`_gender`, `is_available`) and position rules.
 */
import { Gender } from '@/constants/gender';
import { rankGender } from '@/constants/rank';
import { roleGender } from '@/constants/positions';

// JS Date.getDay(): 0=Sun..6=Sat -> availability JSON key.
const WEEKDAY_KEYS = [
    'sundays',
    'mondays',
    'tuesdays',
    'wednesdays',
    'thursdays',
    'fridays',
    'saturdays',
];

/** Resolve a person's gender from the gender field, falling back to their rank. */
export function personGender(p: { gender?: string | null; rank?: string | null }): Gender | null {
    const g = (p.gender ?? '').trim().toLowerCase();
    if (g.startsWith('m')) return Gender.MALE;
    if (g.startsWith('f')) return Gender.FEMALE;
    return rankGender(p.rank);
}

function parseAvailability(availability: unknown): Record<string, unknown> | null {
    if (availability == null) return null;
    if (typeof availability === 'string') {
        try {
            const p: unknown = JSON.parse(availability);
            return p && typeof p === 'object' && !Array.isArray(p) ? (p as Record<string, unknown>) : null;
        } catch {
            return null;
        }
    }
    if (typeof availability === 'object' && !Array.isArray(availability)) {
        return availability as Record<string, unknown>;
    }
    return null;
}

/**
 * Whether a person is available on the given ISO date. A person with no
 * availability data is treated as always available (matches the solver).
 */
export function isAvailableOn(availability: unknown, isoDate: string): boolean {
    const parsed = parseAvailability(availability);
    if (!parsed) return true;
    const weekday = new Date(isoDate + 'T00:00:00').getDay();
    return parsed[WEEKDAY_KEYS[weekday]] === true;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export type EligibilityContext = {
    role: string;
    date: string;
    /** Other officiants already on this service, for the double-booking check. */
    officiants: { id: number; personId: number; personName: string; role: string }[];
    /** Assignment being edited, so we don't flag a person against their own slot. */
    editingAssignmentId?: number;
};

/**
 * Returns human-readable warnings for assigning `person` to `role` on a service.
 * Empty array means no concerns. These are advisory — the save still proceeds.
 */
export function getAssignmentWarnings(
    person: { id?: number; gender?: string | null; rank?: string | null },
    ctx: EligibilityContext & { availability?: unknown },
): string[] {
    const warnings: string[] = [];

    if (person.id != null) {
        const clash = ctx.officiants.find(
            (o) => o.personId === person.id && o.id !== ctx.editingAssignmentId,
        );
        if (clash) {
            warnings.push(`Already assigned to “${clash.role}” in this service.`);
        }
    }

    const needed = roleGender(ctx.role);
    const pg = personGender(person);
    if (needed && pg && needed !== pg) {
        warnings.push(
            needed === Gender.FEMALE
                ? `“${ctx.role}” is rendered by women, but this person is recorded as male.`
                : `“${ctx.role}” is rendered by men, but this person is recorded as female.`,
        );
    }

    if (ctx.date && !isAvailableOn(ctx.availability, ctx.date)) {
        const dayName = DAY_NAMES[new Date(ctx.date + 'T00:00:00').getDay()];
        warnings.push(`Marked unavailable on ${dayName}s.`);
    }

    return warnings;
}
