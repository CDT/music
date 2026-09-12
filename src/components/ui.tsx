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

type CardTone = 'plain' | 'raised' | 'feature';

/**
 * Three weights, so a grid of cards has somewhere for the eye to land first.
 * `plain` is the default page furniture, `raised` lifts a card the reader acts
 * on, and `feature` marks the one card a page is really about.
 */
const CARD_TONES: Record<CardTone, string> = {
  plain: 'border-[var(--color-line)] bg-[var(--color-surface)] shadow-[0_1px_2px_rgb(32_40_37_/_0.04)]',
  raised: 'border-[var(--color-line)] bg-[var(--color-surface)] shadow-[0_2px_10px_rgb(32_40_37_/_0.07)]',
  feature:
    'border-[color-mix(in_srgb,var(--color-primary)_28%,var(--color-line))] bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-surface))] shadow-[0_2px_12px_rgb(23_107_91_/_0.10)]',
};

export function Card({ children, className = '', tone = 'plain', as: Tag = 'section' }: {
  children: ReactNode; className?: string; tone?: CardTone; as?: 'section' | 'article' | 'div';
}) {
  return (
    // min-w-0 so a card used as a grid item can shrink below the intrinsic
    // width of its content. Without it a fixed-width child — the piano keyboard
    // — widens the whole page instead of scrolling inside its own container.
    <Tag className={`min-w-0 rounded-xl border p-5 ${CARD_TONES[tone]} ${className}`}>
      {children}
    </Tag>
  );
}

/**
 * A plain proportion bar. It carries its own progressbar semantics so the
 * number beside it is never the only way to read the value.
 */
export function Meter({ value, max, label, className = '' }: {
  value: number; max: number; label: string; className?: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={`h-2.5 w-full overflow-hidden rounded-full border border-[var(--color-line)] bg-[var(--color-ground)] ${className}`}
    >
      <div
        className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/**
 * A proportion bar split across named parts, for showing a distribution — how
 * many readiness answers were comfortable, with help, or not yet — rather than
 * a single fraction. Segments of zero are dropped so the bar stays readable.
 */
export function SegmentBar({ segments, label, className = '' }: {
  segments: Array<{ key: string; value: number; tone: 'good' | 'help' | 'notyet' }>;
  label: string;
  className?: string;
}) {
  const tones: Record<string, string> = {
    good: 'bg-[var(--color-primary)]',
    help: 'bg-[#C89A3C]',
    notyet: 'bg-[#B08163]',
  };
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  if (total === 0) return null;
  return (
    <div
      aria-label={label}
      className={`flex h-2.5 w-full overflow-hidden rounded-full border border-[var(--color-line)] bg-[var(--color-ground)] ${className}`}
    >
      {segments.filter((segment) => segment.value > 0).map((segment) => (
        <div
          key={segment.key}
          className={tones[segment.tone]}
          style={{ width: `${(segment.value / total) * 100}%` }}
        />
      ))}
    </div>
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
