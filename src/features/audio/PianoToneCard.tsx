import { Button, Card, Muted, SectionHeading, StatusNote } from '../../components/ui';
import { SAMPLE_ATTRIBUTION, SAMPLE_FILES, SAMPLE_PACK_BYTES } from '../../services/audio/samples';
import { usePianoTone } from './use-piano-tone';

const MEGABYTES = (SAMPLE_PACK_BYTES / 1048576).toFixed(1);

/**
 * The instrument choice. The synthesized piano is the default and needs no
 * download; the recorded piano is fetched once, on request, and then kept in
 * the browser so later visits start with it immediately.
 */
export function PianoToneCard({ className = '' }: { className?: string }) {
  const { tone, samples, choose, remove } = usePianoTone();
  const busy = samples.status === 'downloading' || samples.status === 'decoding';
  const percent = Math.round(samples.progress * 100);

  return (
    <Card className={className}>
      <SectionHeading>Piano sound</SectionHeading>
      <fieldset className="mb-3">
        <legend className="sr-only">Which piano to play</legend>
        <label className="flex gap-3 py-2">
          <input
            type="radio"
            name="piano-tone"
            className="mt-1.5 self-start"
            value="synthesized"
            checked={tone === 'synthesized'}
            onChange={() => choose('synthesized')}
          />
          <span>
            <strong className="font-medium">Synthesized piano</strong>
            <Muted>Ready at once, nothing to download. Modelled in the browser, not a recording.</Muted>
          </span>
        </label>
        <label className="flex gap-3 py-2">
          <input
            type="radio"
            name="piano-tone"
            className="mt-1.5 self-start"
            value="recorded"
            checked={tone === 'recorded'}
            onChange={() => choose('recorded')}
            disabled={busy}
          />
          <span>
            <strong className="font-medium">Recorded piano — {MEGABYTES} MB, downloaded once</strong>
            <Muted>
              {`${SAMPLE_FILES.length} notes of a recorded grand piano. The download is kept in this browser, so later visits need no network at all. You can delete it again below.`}
            </Muted>
          </span>
        </label>
      </fieldset>

      {busy ? (
        <div className="mb-3">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label="Downloading the recorded piano"
            className="h-2 w-full overflow-hidden rounded bg-[var(--color-line)]"
          >
            <div className="h-full bg-[var(--color-primary)]" style={{ width: `${percent}%` }} />
          </div>
          <Muted className="mt-1">{`Downloading the recorded piano… ${percent}%`}</Muted>
        </div>
      ) : null}

      {samples.status === 'ready' && tone === 'recorded' ? (
        <StatusNote kind="success">The recorded piano is loaded and in use.</StatusNote>
      ) : null}
      {samples.status === 'stored' && tone === 'recorded' ? (
        <StatusNote kind="info">
          The recorded piano is stored in this browser. It loads from there as soon as sound starts.
        </StatusNote>
      ) : null}
      {samples.status === 'failed' ? (
        <StatusNote kind="error">
          {`${samples.message ?? 'The download did not finish.'} The synthesized piano is playing meanwhile.`}
        </StatusNote>
      ) : null}

      {samples.status !== 'absent' && !busy ? (
        <div className="mt-3">
          <Button onClick={remove}>Delete the download</Button>
        </div>
      ) : null}

      <Muted className="mt-3">{SAMPLE_ATTRIBUTION}</Muted>
    </Card>
  );
}
