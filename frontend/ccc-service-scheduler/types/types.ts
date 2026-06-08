import { Rank } from '@/constants/rank';

export type Person = {
    id: number;
    first_name: string;
    last_name: string;
    birth_date?: string | null; // YYYY-MM-DD
    gender?: string | null;
    phone?: string | null;
    parish?: string | null;
    email?: string | null;
    rank: Rank | '';
    availability?: unknown;
    is_shepherd?: boolean;
};

export type PersonEditProps = {
    person: Person;
    onClose: () => void;
    onSave: (updated: Person) => void;
};