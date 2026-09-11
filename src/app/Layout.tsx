import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { transport } from '../services/audio/transport';
import { metronome } from '../services/audio/metronome';
import { useStore } from './use-store';
import { StatusNote } from '../components/ui';

const PRIMARY_LINKS: Array<{ to: string; label: string; end?: boolean }> = [
  { to: '/', label: 'Home', end: true },
  { to: '/course', label: 'Course' },
  { to: '/practice', label: 'Practice' },
  { to: '/notebook', label: 'Notebook' },
];

const SECONDARY_LINKS: Array<{ to: string; label: string; end?: boolean }> = [
  { to: '/studies', label: 'Studies' },
  { to: '/harmony', label: 'Harmony Lab' },
  { to: '/reference', label: 'Reference' },
  { to: '/progress', label: 'Progress' },
  { to: '/settings', label: 'Settings' },
];

export function Layout() {
  const location = useLocation();
  const { status, store } = useStore();

  // Navigation stops all sounding notes and scheduled events.
  useEffect(() => {
    transport.stop();
    metronome.stop();
    store.flush();
  }, [location.pathname, store]);

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-ground)]">
      <a href="#main" className="skip-link">Skip to main content</a>

      <header className="app-nav border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <NavLink to="/" className="reading-heading text-lg font-semibold text-[var(--color-primary)]">
            Inner Melody
          </NavLink>
          <nav aria-label="Main" className="flex flex-wrap gap-x-4 gap-y-1">
            {[...PRIMARY_LINKS, ...SECONDARY_LINKS].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `min-h-11 rounded px-1 py-2 text-base ${isActive ? 'font-semibold text-[var(--color-primary)] underline' : 'text-[var(--color-ink)] hover:underline'}`}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {status.kind === 'unavailable' || status.kind === 'conflict' || status.kind === 'invalid' ? (
        <div className="mx-auto max-w-6xl px-4 pt-3">
          <StatusNote kind={status.kind === 'conflict' ? 'warning' : 'error'}>
            {status.message}
            {status.kind === 'conflict' ? (
              <span className="ml-2 inline-flex gap-2">
                <button type="button" className="underline" onClick={() => store.reloadSavedVersion()}>
                  Reload saved version
                </button>
                <button type="button" className="underline" onClick={() => store.keepLocalEdits()}>
                  Keep my unsaved copy
                </button>
              </span>
            ) : null}
          </StatusNote>
        </div>
      ) : null}

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 md:pb-6">
        <Outlet />
      </main>

      <nav
        aria-label="Primary, compact"
        className="app-nav fixed inset-x-0 bottom-0 z-10 flex border-t border-[var(--color-line)] bg-[var(--color-surface)] md:hidden"
      >
        {PRIMARY_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex min-h-14 flex-1 items-center justify-center text-sm ${isActive ? 'font-semibold text-[var(--color-primary)]' : 'text-[var(--color-ink)]'}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <footer className="app-nav border-t border-[var(--color-line)] px-4 py-6 text-center text-xs text-[var(--color-muted)]">
        From Inner Melody to Piano. All course content and study pieces are original to this app.
        Your progress is saved in this browser only — there is no account and no cloud sync.
      </footer>
    </div>
  );
}
