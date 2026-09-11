import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'quiet' | 'accent';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-strong)] border-transparent',
  secondary: 'bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-line)] hover:border-[var(--color-primary)]',
  quiet: 'bg-transparent text-[var(--color-primary)] border-transparent hover:underline',
  accent: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)] hover:border-[var(--color-accent)]',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({ variant = 'secondary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-base font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = '', as: Tag = 'section' }: {
  children: ReactNode; className?: string; as?: 'section' | 'article' | 'div';
}) {
  return (
    <Tag className={`rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 ${className}`}>
      {children}
    </Tag>
  );
}

export function SectionHeading({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="reading-heading mb-3 text-xl font-semibold text-[var(--color-ink)]">
      {children}
    </h2>
  );
}

export function Muted({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-sm text-[var(--color-muted)] ${className}`}>{children}</p>;
}

export function Pill({ children, tone = 'neutral' }: {
  children: ReactNode; tone?: 'neutral' | 'good' | 'help' | 'notyet' | 'accent';
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-[var(--color-ground)] text-[var(--color-muted)] border-[var(--color-line)]',
    good: 'bg-[#E7F2EE] text-[var(--color-primary-strong)] border-[#BCDCD3]',
    help: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[#E4CFA3]',
    notyet: 'bg-[#F3EEE9] text-[#6B4A2F] border-[#DCCBBA]',
    accent: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[#E4CFA3]',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function StatusNote({ kind, children }: {
  kind: 'info' | 'warning' | 'error' | 'success'; children: ReactNode;
}) {
  const styles: Record<string, string> = {
    info: 'border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-muted)]',
    warning: 'border-[#E4CFA3] bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
    error: 'border-[#D9B4A8] bg-[#FBEFEA] text-[#7A2E12]',
    success: 'border-[#BCDCD3] bg-[#E7F2EE] text-[var(--color-primary-strong)]',
  };
  return (
    <p role={kind === 'error' ? 'alert' : undefined} className={`rounded-lg border px-3 py-2 text-sm ${styles[kind]}`}>
      {children}
    </p>
  );
}

export function Field({ label, hint, id, children }: {
  label: string; hint?: string; id: string; children: ReactNode;
}) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
        {label}
      </label>
      {children}
      {hint ? <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span> : null}
    </div>
  );
}

export const inputClass =
  'w-full min-h-11 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-base text-[var(--color-ink)]';

export function Details({ summary, children, className = '' }: {
  summary: string; children: ReactNode; className?: string;
}) {
  return (
    <details className={`rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] ${className}`}>
      <summary className="cursor-pointer px-4 py-3 text-base font-medium">{summary}</summary>
      <div className="border-t border-[var(--color-line)] px-4 py-3">{children}</div>
    </details>
  );
}
