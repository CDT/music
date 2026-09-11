import { useRef, useState } from 'react';
import { CONTENT_VERSION } from '../content/course';
import { useStore } from '../app/use-store';
import { audioEngine } from '../services/audio/context';
import { previewPitches } from '../services/audio/transport';
import { metronome } from '../services/audio/metronome';
import { stopAllVoices } from '../services/audio/synth';
import { LABEL_MODE_OPTIONS } from '../features/notation/labels';
import { Button, Card, Field, Muted, SectionHeading, StatusNote, inputClass } from '../components/ui';
import { SCHEMA_VERSION } from '../services/storage/schema';
import type { PersistedData } from '../domain/types';

export function SettingsPage() {
  const { data, store, status } = useStore();
  const [preview, setPreview] = useState<{ data: PersistedData; warnings: string[] } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    const blob = new Blob([store.exportJson()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inner-melody-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage('Backup downloaded. No data was sent anywhere — the file was created in your browser.');
  };

  return (
    <div>
      <h1 className="reading-heading mb-1 text-3xl font-semibold">Settings</h1>
      <Muted className="mb-5">
        Everything here applies to this browser only. There is no account and no cloud sync.
      </Muted>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeading>Display</SectionHeading>
          <Field id="labels" label="Note labels">
            <select
              id="labels"
              className={inputClass}
              value={data.settings.labelMode}
              onChange={(e) => store.update((draft) => {
                draft.settings.labelMode = e.target.value as typeof draft.settings.labelMode;
              })}
            >
              {LABEL_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Field>
          <Field id="text-scale" label="Text size">
            <select
              id="text-scale"
              className={inputClass}
              value={data.settings.textScale}
              onChange={(e) => store.update((draft) => {
                draft.settings.textScale = e.target.value as 'normal' | 'large';
              })}
            >
              <option value="normal">Normal</option>
              <option value="large">Large</option>
            </select>
          </Field>
          <Field id="motion" label="Motion" hint="“System” follows your operating system’s reduced-motion setting.">
            <select
              id="motion"
              className={inputClass}
              value={data.settings.reducedMotion}
              onChange={(e) => store.update((draft) => {
                draft.settings.reducedMotion = e.target.value as 'system' | 'on';
              })}
            >
              <option value="system">Follow the system setting</option>
              <option value="on">Always reduce motion</option>
            </select>
          </Field>
        </Card>

        <Card>
          <SectionHeading>Sound</SectionHeading>
          <Field id="volume" label={`Master volume: ${Math.round(data.settings.masterVolume * 100)}%`}>
            <input
              id="volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={data.settings.masterVolume}
              onChange={(e) => {
                const value = Number(e.target.value);
                audioEngine.setMasterVolume(value);
                store.update((draft) => { draft.settings.masterVolume = value; });
              }}
              className="w-full"
            />
          </Field>
          <Field
            id="latency"
            label={`Metronome latency offset: ${data.settings.metronomeLatencyMs} ms`}
            hint="Only used by the optional beat-aligned rhythm mode. It does not change the target rhythm data."
          >
            <input
              id="latency"
              type="range"
              min={-200}
              max={200}
              step={5}
              value={data.settings.metronomeLatencyMs}
              onChange={(e) => store.update((draft) => {
                draft.settings.metronomeLatencyMs = Number(e.target.value);
              })}
              className="w-full"
            />
          </Field>
          <p className="mb-2 text-sm font-medium">Audio diagnostic</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void audioEngine.enable()}>Enable sound</Button>
            <Button onClick={() => void previewPitches([60], 1, 'melody')}>Play C4</Button>
            <Button onClick={() => void previewPitches([60, 64, 67], 1.4)}>Play a triad</Button>
            <Button onClick={() => void metronome.start({
              meter: { numerator: 4, denominator: 4 },
              tempoQuarterBpm: 60,
              subdivision: false,
              accentFirstBeat: true,
              countInBars: 1,
              onCountInComplete: () => metronome.stop(),
            })}>
              Four-beat count-in
            </Button>
            <Button variant="accent" onClick={() => { metronome.stop(); stopAllVoices(); }}>Stop everything</Button>
          </div>
          <Muted className="mt-3">
            {`Audio status: ${audioEngine.status}. The instrument is a synthesized keyboard sound, not a recorded piano.`}
          </Muted>
        </Card>

        <Card>
          <SectionHeading>Practice defaults</SectionHeading>
          <Field id="session" label="Default session length">
            <select
              id="session"
              className={inputClass}
              value={data.settings.defaultSessionMinutes ?? 'decide'}
              onChange={(e) => store.update((draft) => {
                draft.settings.defaultSessionMinutes = e.target.value === 'decide'
                  ? null
                  : (Number(e.target.value) as 5 | 15 | 30);
              })}
            >
              <option value="decide">Decide each time</option>
              <option value="5">5 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
            </select>
          </Field>
          <Field id="range" label="Comfortable singing range">
            <select
              id="range"
              className={inputClass}
              value={data.settings.comfortableRange}
              onChange={(e) => store.update((draft) => {
                draft.settings.comfortableRange = e.target.value as 'low' | 'middle' | 'high';
              })}
            >
              <option value="low">Lower — around C3</option>
              <option value="middle">Middle — around C4</option>
              <option value="high">Higher — around C5</option>
            </select>
          </Field>
        </Card>

        <Card>
          <SectionHeading>Storage</SectionHeading>
          <Muted className="mb-2">
            {status.kind === 'saved'
              ? `Saved on this browser at ${new Date(status.at).toLocaleString()}.`
              : status.kind === 'saving'
                ? 'Saving…'
                : status.message}
          </Muted>
          <Muted className="mb-3">
            {`Storage key: ${store.storageKeyName} · schema ${SCHEMA_VERSION} · content ${CONTENT_VERSION}`}
          </Muted>
          {status.kind === 'invalid' ? (
            <div className="mb-3">
              <StatusNote kind="error">
                {status.message}
              </StatusNote>
              <Button
                className="mt-2"
                onClick={() => {
                  const blob = new Blob([status.raw], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'inner-melody-unreadable-data.json';
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export the raw stored value
              </Button>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={download}>Export a backup</Button>
            <Button onClick={() => fileRef.current?.click()}>Import a backup…</Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                setImportError(null);
                setPreview(null);
                try {
                  const text = await file.text();
                  setPreview(store.previewImport(text));
                } catch (error) {
                  setImportError(error instanceof Error ? error.message : String(error));
                }
              }}
            />
          </div>
          {message ? <div className="mt-3"><StatusNote kind="success">{message}</StatusNote></div> : null}
          {importError ? <div className="mt-3"><StatusNote kind="error">{importError}</StatusNote></div> : null}

          {preview ? (
            <div className="mt-4 rounded-lg border border-[#E4CFA3] bg-[var(--color-accent-soft)] p-3">
              <h3 className="mb-2 font-medium">Import preview — nothing has changed yet</h3>
              <ul className="mb-2 list-disc space-y-1 pl-5 text-sm">
                <li>{`${Object.keys(preview.data.lessons).length} lesson progress records`}</li>
                <li>{`${preview.data.notebook.length} notebook entries`}</li>
                <li>{`${preview.data.reviews.length} scheduled reviews`}</li>
                <li>{`${preview.data.attempts.length} recorded attempts`}</li>
                <li>{`Saved ${new Date(preview.data.savedAt).toLocaleString()}, schema ${preview.data.schemaVersion}`}</li>
              </ul>
              {preview.warnings.length > 0 ? (
                <ul className="mb-2 list-disc space-y-1 pl-5 text-sm">
                  {preview.warnings.slice(0, 5).map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
              ) : null}
              <StatusNote kind="warning">
                Importing replaces all local data for this app. Export your current data first if you
                want to keep it.
              </StatusNote>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button onClick={download}>Export current data first</Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    store.applyImport(preview.data);
                    setPreview(null);
                    setMessage('Import complete. Your previous local data was replaced.');
                  }}
                >
                  Replace local data
                </Button>
                <Button onClick={() => setPreview(null)}>Cancel</Button>
              </div>
            </div>
          ) : null}
        </Card>

        <Card className="lg:col-span-2">
          <SectionHeading>Reset and delete</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-1 font-medium">Reset progress</h3>
              <Muted className="mb-2">
                Clears lesson progress, reviews, attempts and session history. Your settings and your
                notebook are kept.
              </Muted>
              {confirmReset ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    onClick={() => { store.resetProgress(); setConfirmReset(false); setMessage('Progress reset. Your notebook and settings were kept.'); }}
                  >
                    Yes, reset progress
                  </Button>
                  <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
                </div>
              ) : (
                <Button onClick={() => setConfirmReset(true)}>Reset progress…</Button>
              )}
            </div>
            <div>
              <h3 className="mb-1 font-medium">Delete all local data</h3>
              <Muted className="mb-2">
                Removes only this app’s storage key, including your notebook. Other sites and other
                apps on this hostname are untouched. This is recoverable only from a backup you
                exported earlier.
              </Muted>
              {confirmDelete ? (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={download}>Export first</Button>
                  <Button
                    variant="primary"
                    onClick={() => { store.deleteAll(); setConfirmDelete(false); setMessage('All local data for this app was deleted.'); }}
                  >
                    Yes, delete everything
                  </Button>
                  <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
                </div>
              ) : (
                <Button onClick={() => setConfirmDelete(true)}>Delete all local data…</Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
