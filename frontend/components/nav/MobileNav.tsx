'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { MobileMenu } from './MobileMenu';

interface Tab {
  label: string;
  href?: string;
  match?: (path: string) => boolean;
  isMenu?: boolean;
}

const TABS: Tab[] = [
  { label: 'Home', href: '/', match: (p) => p === '/' },
  { label: 'How it works', href: '/how-it-works', match: (p) => p.startsWith('/how-it-works') },
  { label: 'Create', href: '/upload', match: (p) => p.startsWith('/upload') },
  { label: 'Menu', isMenu: true },
];

export function MobileNav() {
  const path = usePathname() ?? '/';
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg grid grid-cols-4"
        style={{ borderTop: '1px solid rgb(var(--ink))' }}
      >
        {TABS.map((t) => {
          const active = t.match ? t.match(path) : false;
          const inner = (
            <span
              className={`flex flex-col items-center justify-center h-16 mono text-[10px] uppercase tracking-label ${
                active ? 'bg-ink text-bg' : open && t.isMenu ? 'bg-accent text-always-dark' : 'text-ink'
              }`}
            >
              {t.label}
            </span>
          );
          if (t.isMenu) {
            return (
              <button
                key={t.label}
                onClick={() => setOpen((v) => !v)}
                className="block"
                aria-label="Open menu"
              >
                {inner}
              </button>
            );
          }
          return (
            <Link key={t.label} href={t.href ?? '/'} onClick={() => setOpen(false)} className="block">
              {inner}
            </Link>
          );
        })}
      </nav>
      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
