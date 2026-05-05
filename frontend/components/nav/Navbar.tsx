'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletConnect } from '@frontend/components/wallet/WalletConnect';
import { ThemeToggle } from '@frontend/components/shared/ThemeToggle';
import { MobileNav } from './MobileNav';

interface NavbarProps {
  variant?: 'public' | 'admin';
}

export function Navbar({ variant = 'public' }: NavbarProps) {
  const path = usePathname();
  const isActive = (p: string) => path === p || (p !== '/' && (path?.startsWith(p) ?? false));

  if (variant === 'admin') {
    return (
      <>
        <nav className="flex items-center justify-between px-4 md:px-8 py-4 bg-always-dark text-always-light">
          <Link href="/" className="flex items-center gap-2">
            <span className="display text-[18px] md:text-[20px] tracking-[-0.02em] leading-none">PS</span>
            <span className="brand-dot" />
          </Link>
          <div className="hidden sm:block tag-lime">Admin panel</div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block"><ThemeToggle /></div>
            <WalletConnect compact />
          </div>
        </nav>
        <MobileNav />
      </>
    );
  }

  return (
    <>
      <nav className="flex items-center justify-between px-4 md:px-8 py-4 bg-bg heavy-divider">
        <Link href="/" className="flex items-center gap-2">
          <span className="display text-[18px] md:text-[20px] tracking-[-0.02em] leading-none text-ink">PS</span>
          <span className="brand-dot" />
        </Link>

        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          <NavLink href="/" active={path === '/'}>Home</NavLink>
          <NavLink href="/how-it-works" active={isActive('/how-it-works')}>How it works</NavLink>
          <NavLink href="/ledger" active={isActive('/ledger') || isActive('/content')}>Ledger</NavLink>
          <NavLink href="/upload" active={isActive('/upload')}>For creators</NavLink>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:block"><ThemeToggle /></div>
          <WalletConnect />
        </div>
      </nav>
      <MobileNav />
    </>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`mono text-[11px] uppercase tracking-label pb-[2px] ${
        active ? 'text-ink' : 'text-muted hover:text-ink'
      }`}
    >
      {children}
    </Link>
  );
}
