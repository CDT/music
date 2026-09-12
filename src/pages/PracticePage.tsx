import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { compoundPulseBpm } from '../domain/rhythm';
import { metronome } from '../services/audio/metronome';
import { audioEngine } from '../services/audio/context';
import { previewPitches } from '../services/audio/transport';
import { useStore } from '../app/use-store';
import { Button, Card, Muted, SectionHeading, StatusNote, inputClass } from '../components/ui';
import { Keyboard } from '../features/piano/Keyboard';
import { majorKey } from '../domain/score';
import type { Meter } from '../domain/types';

const METERS: Array<{ id: string; label: string; meter: Meter }> = [
  { id: '4/4', label: '4/4', meter: { numerator: 4, denominator: 4 } },
  { id: '3/4', label: '3/4', meter: { numerator: 3, denominator: 4 } },
  { id: '6/8', label: '6/8 (two compound beats)', meter: { numerator: 6, denominator: 8 } },
];

export function PracticePage() {
  const { data } = useStore();
  const [meterId, setMeterId] = useState('4/4');
  const [tempo, setTempo] = useState(60);
  const [subdivision, setSubdivision] = useState(false);
  const [accent, setAccent] = useState(true);
  const [countIn, setCountIn] = useState<0 | 1 | 2>(1);
  const [running, setRunning] = useState(false);
  const [volume, setVolume] = useState(data.settings.masterVolume);
  const meter = METERS.find((m) => m.id === meterId)!.meter;

  useEffect(() => metronome.subscribe(setRunning), []);
  useEffect(() => () => metronome.stop(), []);

  return (
    <div>
      <h1 className="reading-heading mb-1 text-3xl font-semibold">Practice</h1>
      <Muted className="mb-5">
        Ear training, a metronome and a free piano. Nothing here is recorded, and the app cannot hear
        your instrument.
      </Muted>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeading>Ear trainer</SectionHeading>
          <p className="mb-3">
            Seven exercise types: contour, degrees in context, phrase reconstruction, rhythm imitation,
            chord quality, functional listening, and free piano echo.
          </p>
          <Link to="/practice/ear" className="inline-block">
            <Button variant="primary">Open the ear trainer</Button>
          </Link>
        </Card>

        <Card>
          <SectionHeading>Metronome</SectionHeading>
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="meter" className="mb-1 block text-sm font-medium">Meter</label>
              <select id="meter" className={inputClass} value={meterId} onChange={(e) => setMeterId(e.target.value)}>
                {METERS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="tempo" className="mb-1 block text-sm font-medium">
                {`Tempo: ${tempo} quarter BPM`}
              </label>
              <input
                id="tempo"
                type="range"
                min={30}
                max={180}
                value={tempo}
                onChange={(e) => setTempo(Number(e.target.value))}
                className="w-full"
              />
              {meterId === '6/8' ? (
                <Muted>{`Dotted-quarter pulse: ${compoundPulseBpm(tempo).toFixed(1)} per minute.`}</Muted>
              ) : null}
            </div>
          </div>
          <div className="mb-3 flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={subdivision} onChange={(e) => setSubdivision(e.target.checked)} className="h-4 w-4" />
              Eighth-note subdivision
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={accent} onChange={(e) => setAccent(e.target.checked)} className="h-4 w-4" />
              Accent the first beat
            </label>
            <label className="flex items-center gap-2">
              <span>Count-in</span>
              <select
                className="rounded border border-[var(--color-line)] px-2 py-1"
                value={countIn}
                onChange={(e) => setCountIn(Number(e.target.value) as 0 | 1 | 2)}
              >
                <option value={0}>None</option>
                <option value={1}>One bar</option>
                <option value={2}>Two bars</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              onClick={() => {
                if (running) metronome.stop();
                else void metronome.start({
                  meter, tempoQuarterBpm: tempo, subdivision, accentFirstBeat: accent, countInBars: countIn,
                });
              }}
            >
              {running ? '■ Stop' : '▶ Start'}
            </Button>
            <label className="flex items-center gap-2 text-sm">
              <span>Volume</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setVolume(value);
                  audioEngine.setMasterVolume(value);
                }}
              />
            </label>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <SectionHeading>Free piano</SectionHeading>
          <Muted className="mb-3">
            A synthesized piano for checking a note or trying a shape. Playing several keys at once
            is never required anywhere in this app.
          </Muted>
          <Keyboard musicKey={majorKey('C')} labelMode={data.settings.labelMode} lowMidi={48} highMidi={84} />
        </Card>

        <Card>
          <SectionHeading>Sound check</SectionHeading>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void previewPitches([60], 1, 'melody')}>Play C4</Button>
            <Button onClick={() => void previewPitches([60, 64, 67], 1.4)}>Play a C major triad</Button>
            <Button onClick={() => void metronome.start({
              meter: { numerator: 4, denominator: 4 },
              tempoQuarterBpm: 60,
              subdivision: false,
              accentFirstBeat: true,
              countInBars: 1,
              onCountInComplete: () => metronome.stop(),
            })}>
              Play a four-beat count-in
            </Button>
            <Button variant="accent" onClick={() => { metronome.stop(); }}>Stop</Button>
          </div>
          {audioEngine.status === 'unavailable' ? (
            <div className="mt-3">
              <StatusNote kind="error">
                Web Audio is unavailable in this browser, so playback will not work. All written
                content still does.
              </StatusNote>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
