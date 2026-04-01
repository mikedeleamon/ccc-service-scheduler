import type { Person } from '@/types/types';

export function formatAvailability(availability: unknown): string {
    if (availability == null) return '—';
    if (typeof availability === 'string') return availability;
    try {
        return JSON.stringify(availability);
    } catch {
        return String(availability);
    }
}

export function calculateAge(birthDate?: string | null): number | null {
    if (!birthDate) return null;

    const today = new Date();
    const dob = new Date(birthDate);

    if (isNaN(dob.getTime())) return null;

    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }

    return age;
}

export function fullName(p: Person): string {
    return `${p.first_name} ${p.last_name}`;
}
