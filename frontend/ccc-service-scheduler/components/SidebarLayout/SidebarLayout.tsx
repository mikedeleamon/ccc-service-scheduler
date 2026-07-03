'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useParish } from '@/lib/ParishContext';
import { btnClose, btnMenu } from '@/lib/ui';

type SidebarLayoutProps = {
    children: React.ReactNode;
};

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/services', label: 'Services' },
    { href: '/schedules', label: 'Schedules' },
    { href: '/lessons', label: 'Lessons' },
    { href: '/roster', label: 'Roster' },
    { href: '/upload', label: 'Upload sheet' },
];

export default function SidebarLayout({ children }: SidebarLayoutProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const navRef = useRef<HTMLDivElement>(null);
    const { parish } = useParish();

    const closeSidebar = () => setIsOpen(false);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (isOpen && navRef.current && !navRef.current.contains(event.target as Node)) {
                closeSidebar();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key !== 'Escape') return;
            if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
            closeSidebar();
        }
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <div className='relative flex min-h-dvh flex-col'>

            {/* ── Mobile overlay ── */}
            {isOpen && (
                <div
                    className='fixed inset-0 z-40 bg-indigo-950/40 backdrop-blur-[2px] sm:hidden'
                    aria-hidden
                />
            )}

            {/* ── Mobile slide-in sidebar ── */}
            <nav
                id='app-sidebar'
                ref={navRef}
                aria-label='Main navigation'
                className={`
                    fixed top-0 left-0 z-50 h-full w-[min(18rem,88vw)]
                    border-r border-stone-200/90 bg-[#fdfcfa]/96 shadow-2xl shadow-indigo-950/10 backdrop-blur-md
                    transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
                    dark:border-stone-700/80 dark:bg-stone-900/98 dark:shadow-black/40
                    sm:hidden
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
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
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`relative block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                                        isActive
                                            ? 'bg-indigo-700 text-white shadow-md shadow-indigo-950/30 dark:bg-indigo-500'
                                            : 'text-stone-700 hover:bg-amber-50/80 hover:text-indigo-950 dark:text-stone-300 dark:hover:bg-stone-800/80 dark:hover:text-stone-100'
                                    }`}
                                >
                                    {isActive && (
                                        <span className='absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-amber-400' aria-hidden />
                                    )}
                                    <span className={isActive ? 'pl-2' : ''}>{link.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>

            {/* ── Shared header ── */}
            <header className='sticky top-0 z-30 shrink-0 border-b border-stone-200/80 bg-[#fdfcfa]/80 backdrop-blur-md dark:border-stone-800/80 dark:bg-stone-900/80'>

                {/* Mobile header — hamburger + title */}
                <div className='flex items-center gap-3 px-3 py-3 sm:hidden'>
                    <button
                        type='button'
                        className={btnMenu}
                        onClick={() => setIsOpen((v) => !v)}
                        aria-expanded={isOpen}
                        aria-controls='app-sidebar'
                        aria-label='Open menu'
                    >
                        <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.75} stroke='currentColor' className='size-5' aria-hidden>
                            <path strokeLinecap='round' strokeLinejoin='round' d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5' />
                        </svg>
                    </button>
                    <div className='flex min-w-0 items-center gap-2'>
                        <p className='truncate text-sm font-semibold text-indigo-950 dark:text-stone-100'>
                            Service Scheduler
                        </p>
                        {parish && (
                            <span className='shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'>
                                {parish}
                            </span>
                        )}
                    </div>
                </div>

                {/* Desktop header — brand + nav links */}
                <div className='mx-auto hidden max-w-6xl items-center justify-between px-6 py-0 sm:flex'>
                    <div className='flex items-center gap-3 py-4'>
                        <Link href='/' className='flex items-center gap-2.5'>
                            <span className='font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-700 dark:text-amber-400/90'>
                                CCC
                            </span>
                            <span className='h-3.5 w-px bg-stone-300 dark:bg-stone-600' aria-hidden />
                            <span className='text-sm font-semibold text-indigo-950 dark:text-stone-100'>
                                Service Scheduler
                            </span>
                        </Link>
                        {parish && (
                            <span className='rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'>
                                {parish}
                            </span>
                        )}
                    </div>

                    <nav aria-label='Main navigation' className='flex items-center gap-1'>
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`relative rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                                        isActive
                                            ? 'bg-indigo-700 text-white shadow-sm shadow-indigo-950/20 dark:bg-indigo-500'
                                            : 'text-stone-600 hover:bg-amber-50/80 hover:text-indigo-950 dark:text-stone-400 dark:hover:bg-stone-800/70 dark:hover:text-stone-100'
                                    }`}
                                >
                                    {isActive && (
                                        <span className='absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-amber-400' aria-hidden />
                                    )}
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </header>

            <main className='relative w-full flex-1 px-4 pb-14 pt-6 sm:px-6 md:px-8 md:pb-20 md:pt-8'>
                {children}
            </main>
        </div>
    );
}
