'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { btnClose, btnMenu } from '@/lib/ui';

type SidebarLayoutProps = {
    children: React.ReactNode;
};

export default function SidebarLayout({ children }: SidebarLayoutProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const navRef = useRef<HTMLDivElement>(null);

    const toggleSidebar = () => setIsOpen((prev) => !prev);

    const closeSidebar = () => setIsOpen(false);

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

    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key !== 'Escape') return;
            if (document.querySelector('[role="dialog"][aria-modal="true"]')) {
                return;
            }
            closeSidebar();
        }

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/schedules', label: 'Schedules' },
        { href: '/upload', label: 'Upload sheet' },
        { href: '/roster', label: 'Roster' },
        { href: '/auto-schedule', label: 'Auto schedule' },
    ];

    return (
        <div className='relative flex min-h-dvh flex-col'>
            {isOpen && (
                <div
                    className='fixed inset-0 z-40 bg-indigo-950/40 backdrop-blur-[2px] transition-opacity duration-300 dark:bg-stone-950/60'
                    aria-hidden
                />
            )}

            <nav
                id='app-sidebar'
                ref={navRef}
                className={`
                    fixed top-0 left-0 z-50 h-full w-[min(18rem,88vw)]
                    border-r border-stone-200/90 bg-[#fdfcfa]/96 shadow-2xl shadow-indigo-950/10 backdrop-blur-md
                    transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
                    dark:border-stone-700/80 dark:bg-stone-900/98 dark:shadow-black/40
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
                aria-label='Main navigation'
            >
                <div className='flex h-full flex-col pt-5'>
                    <div className='flex items-center justify-between px-5 pb-5'>
                        <span className='font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-700 dark:text-amber-400/90'>
                            CCC
                        </span>
                        <button
                            type='button'
                            className={btnClose}
                            onClick={closeSidebar}
                            aria-label='Close menu'
                        >
                            <span className='text-lg leading-none'>×</span>
                        </button>
                    </div>
                    <div className='flex-1 space-y-0.5 px-3'>
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={closeSidebar}
                                    className={`relative block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                                        isActive
                                            ? 'bg-indigo-700 text-white shadow-md shadow-indigo-950/30 dark:bg-indigo-500 dark:shadow-indigo-950/40'
                                            : 'text-stone-700 hover:bg-amber-50/80 hover:text-indigo-950 dark:text-stone-300 dark:hover:bg-stone-800/80 dark:hover:text-stone-100'
                                    }`}
                                >
                                    {isActive ? (
                                        <span
                                            className='absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-amber-400'
                                            aria-hidden
                                        />
                                    ) : null}
                                    <span className={isActive ? 'pl-2' : ''}>
                                        {link.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>

            <header className='sticky top-0 z-30 shrink-0 border-b border-stone-200/80 bg-[#fdfcfa]/80 px-3 py-3 shadow-sm backdrop-blur-md dark:border-stone-800/80 dark:bg-stone-900/80 sm:px-5'>
                <div className='mx-auto flex max-w-6xl items-center gap-3'>
                    <button
                        type='button'
                        className={btnMenu}
                        onClick={toggleSidebar}
                        aria-expanded={isOpen}
                        aria-controls='app-sidebar'
                        aria-label='Open menu'
                    >
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                            strokeWidth={1.75}
                            stroke='currentColor'
                            className='size-5'
                            aria-hidden
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
                            />
                        </svg>
                    </button>
                    <div className='min-w-0'>
                        <p className='truncate text-sm font-semibold text-indigo-950 dark:text-stone-100'>
                            Service Scheduler
                        </p>
                        <p className='hidden truncate text-xs text-stone-600 dark:text-stone-400 sm:block'>
                            Parish scheduling
                        </p>
                    </div>
                </div>
            </header>

            <main className='relative w-full flex-1 px-4 pb-14 pt-6 sm:px-6 md:px-8 md:pb-20 md:pt-8'>
                {children}
            </main>
        </div>
    );
}
