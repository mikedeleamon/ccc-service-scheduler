export type Person = {
    id: number;
    first_name: string;
    last_name: string;
    birth_date?: string | null; // YYYY-MM-DD
    gender: string;
    phone: string;
    parish?: string | null;
    email?: string | null;
    rank: Rank;
    availability?: unknown;
};

export type PersonEditProps = {
    person: Person;
    onClose: () => void;
    onSave: (updated: Person) => void;
};