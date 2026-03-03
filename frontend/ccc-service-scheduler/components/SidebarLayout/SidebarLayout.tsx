'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type SidebarLayoutProps = {
    children: React.ReactNode;
};

export default function SidebarLayout({ children }: SidebarLayoutProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const navRef = useRef<HTMLDivElement>(null);

    const toggleSidebar = () => setIsOpen((prev) => !prev);

    const closeSidebar = () => setIsOpen(false);

    /* -----------------------------
       Close on outside click
    ------------------------------*/
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                isOpen &&
                navRef.current &&
                !navRef.current.contains(event.target as Node)
            ) {
                closeSidebar();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);

        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    /* -----------------------------
       Close on Escape
    ------------------------------*/
    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                closeSidebar();
            }
        }

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    /* -----------------------------
       Prevent background scroll
    ------------------------------*/
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }, [isOpen]);

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/schedules', label: 'View Schedules' },
        { href: '/upload', label: 'Upload Sheet' },
        { href: '/roster', label: 'View Roster' },
        { href: '/auto-schedule', label: 'Auto Schedule' },
    ];

    return (
        <div className='relative min-h-screen bg-zinc-50 dark:bg-black'>
            {/* Backdrop */}
            {isOpen && (
                <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300' />
            )}

            {/* Sidebar */}
            <nav
                ref={navRef}
                className={`
                    fixed top-0 left-0 h-full w-72
                    bg-white dark:bg-zinc-900
                    shadow-2xl
                    transform transition-transform duration-300 ease-in-out
                    z-50
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Close Button */}
                <button
                    className='absolute top-4 right-4 text-xl text-zinc-600 dark:text-zinc-400'
                    onClick={closeSidebar}
                >
                    ✕
                </button>

                <div className='mt-16 space-y-2 px-6'>
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={closeSidebar}
                                className={`
                                    block px-4 py-2 rounded-lg transition-all
                                    ${
                                        isActive
                                            ? 'bg-zinc-200 dark:bg-zinc-800 font-semibold text-black dark:text-white'
                                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }
                                `}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Header */}
            <header className='p-4 bg-white dark:bg-zinc-900 shadow-md flex items-center'>
                <button
                    className='text-xl text-zinc-600 dark:text-zinc-400'
                    onClick={toggleSidebar}
                >
                    ☰
                </button>
            </header>

            {/* Main Content */}
            <main className='p-6 md:p-10'>{children}</main>
        </div>
    );
}
