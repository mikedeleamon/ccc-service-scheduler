'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

type ParishContextValue = {
    parish: string;
    setParish: (p: string) => void;
    parishes: string[];
    loading: boolean;
};

const ParishContext = createContext<ParishContextValue>({
    parish: '',
    setParish: () => {},
    parishes: [],
    loading: true,
});

export function ParishProvider({ children }: { children: React.ReactNode }) {
    const [parish, setParishRaw] = useState('');
    const [parishes, setParishes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api('/parishes')
            .then((data) => {
                const list = Array.isArray(data) ? data : [];
                setParishes(list);
                const saved = typeof window !== 'undefined' ? localStorage.getItem('ccc-parish') : null;
                if (saved && list.includes(saved)) setParishRaw(saved);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const setParish = (p: string) => {
        setParishRaw(p);
        if (typeof window !== 'undefined') {
            if (p) localStorage.setItem('ccc-parish', p);
            else localStorage.removeItem('ccc-parish');
        }
    };

    return (
        <ParishContext.Provider value={{ parish, setParish, parishes, loading }}>
            {children}
        </ParishContext.Provider>
    );
}

export function useParish() {
    return useContext(ParishContext);
}
