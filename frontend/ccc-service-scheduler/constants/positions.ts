/**
 * Service positions and the positions each service type needs.
 *
 * Mirrors the backend `app/scheduling/positions.py` so the UI can validate and
 * preview assignments without a round-trip. Keep the two in sync.
 *
 * Gender partition (church rules): women may ONLY render the 2nd member prayer
 * and the closing prayer; men fill every other position.
 */

// ---- Position names (also used as the assignment `role` value) ----
export const SERVICE_CONDUCTOR = 'Service Conductor';
export const FIRST_MEMBER_PRAYER = '1st member prayer';
export const SECOND_MEMBER_PRAYER = '2nd member prayer';
export const THIRD_MEMBER_PRAYER = '3rd member prayer';
export const FIRST_LESSON = '1st lesson';
export const SECOND_LESSON = '2nd lesson';
export const PREACHER = 'Preacher';
export const CLOSING_PRAYER = 'Closing prayer';

/** Positions that women fill; everything else is filled by men. */
export const WOMEN_POSITIONS = new Set<string>([SECOND_MEMBER_PRAYER, CLOSING_PRAYER]);

const DEVOTIONAL_POSITIONS = [
    SERVICE_CONDUCTOR,
    FIRST_MEMBER_PRAYER,
    SECOND_MEMBER_PRAYER,
    THIRD_MEMBER_PRAYER,
    FIRST_LESSON,
    SECOND_LESSON,
    PREACHER,
    CLOSING_PRAYER,
];

// Mercy-style set: same, minus the 2nd lesson.
const MERCY_POSITIONS = [
    SERVICE_CONDUCTOR,
    FIRST_MEMBER_PRAYER,
    SECOND_MEMBER_PRAYER,
    THIRD_MEMBER_PRAYER,
    FIRST_LESSON,
    PREACHER,
    CLOSING_PRAYER,
];

const SERVICE_POSITIONS: Record<string, string[]> = {
    'Devotional Service': DEVOTIONAL_POSITIONS,
    'Easter Service': DEVOTIONAL_POSITIONS,
    'Youth Service': DEVOTIONAL_POSITIONS,
    'Mercy Day Service': MERCY_POSITIONS,
    'Power Day Service': MERCY_POSITIONS,
    'New Moon Service': MERCY_POSITIONS,
    'Christmas Service': MERCY_POSITIONS,
    'New Years Service': MERCY_POSITIONS,
};

/** Ordered positions for a service type (empty array if the type is unknown/custom). */
export function positionsFor(serviceType?: string | null): string[] {
    if (!serviceType) return [];
    return SERVICE_POSITIONS[serviceType] ?? [];
}

/** True when `role` is a recognized position name (case-insensitive). */
export function isKnownRole(role: string): boolean {
    const r = role.trim().toLowerCase();
    return DEVOTIONAL_POSITIONS.some((p) => p.toLowerCase() === r);
}

/**
 * The gender required for a role, or null when the role isn't recognized.
 * Recognized women's roles require 'Female'; all other recognized roles 'Male'.
 */
export function roleGender(role: string): 'Male' | 'Female' | null {
    if (!isKnownRole(role)) return null;
    const match = [...WOMEN_POSITIONS].some((p) => p.toLowerCase() === role.trim().toLowerCase());
    return match ? 'Female' : 'Male';
}
