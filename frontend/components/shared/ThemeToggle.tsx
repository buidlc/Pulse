'use client';

import { useTheme } from '@frontend/hooks/useTheme';

export function ThemeToggle({ variant = 'inline' }: { variant?: 'inline' | 'row' }) {
  const { theme, toggle, mounted } = useTheme();
  if (!mounted) return null;

  if (variant === 'row') {
    return (
      <button
        onClick={toggle}
        className="w-full flex justify-between items-center px-6 py-4 row-divider mono text-[12px] uppercase tracking-label text-ink"
      >
        <span>Theme</span>
        <span className="tag-lime">{theme === 'dark' ? 'Dark' : 'Light'}</span>
      </button>
    );
  }

  return (
    <button onClick={toggle} className="btn-small">
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
