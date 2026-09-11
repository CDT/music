import { useCallback, useEffect, useRef, useState } from 'react';
import { barBeats } from '../../domain/rhythm';
import { patternById, patternsForMeter } from '../../content/patterns';
import { transport } from '../../services/audio/transport';
import { audioEngine } from '../../services/audio/context';
import { useAudioStatus } from './use-audio-status';
import type { MixSettings } from '../../services/audio/arranger';
import type { Score } from '../../domain/types';
import { Button, StatusNote } from '../../components/ui';

export interface ScorePlayerProps {
  score: Score;
  /** Simple mode hides the mix, loop and pattern controls. */
  compact?: boolean;
  defaultPatternId?: string | null;
  countInBars?: 0 | 1 | 2;
  showTempo?: boolean;
  showMix?: boolean;
  showLoop?: boolean;
  showPattern?: boolean;
  onPlayCountChange?: (count: number) => void;
  label?: string;
}

export function ScorePlayer({
  score,
  compact = false,
  defaultPatternId = null,
  countInBars = 0,
  showTempo = !compact,
  showMix = !compact,
  showLoop = !compact,
  showPattern = !compact,
  onPlayCountChange,
  label,
}: ScorePlayerProps) {
  const audioStatus = useAudioStatus();
  const [playing, setPlaying] = useState(false);
  const [tempo, setTempo] = useState(score.tempoQuarterBpm);
  const [patternId, setPatternId] = useState<string | null>(defaultPatternId);
  const [mix, setMix] = useState<MixSettings>({ melody: true, bass: true, chord: true });
  const [loop, setLoop] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [playCount, setPlayCount] = useState(0);
  const barCount = Math.ceil((score.totalBeats - (score.pickupBeats ?? 0)) / barBeats(score.meter) - 1e-9);
  const [range, setRange] = useState<[number, number]>([1, barCount]);
  const [loadedScoreId, setLoadedScoreId] = useState(score.id);
  const mountedRef = useRef(true);

  // A different score resets the tempo and loop bounds during render, which is
  // cheaper and less surprising than a second render pass from an effect.
  if (loadedScoreId !== score.id) {
    setLoadedScoreId(score.id);
    setTempo(score.tempoQuarterBpm);
    setRange([1, barCount]);
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => transport.subscribe((state) => {
    if (mountedRef.current) setPlaying(state.playing && state.scoreId === score.id);
  }), [score.id]);

  // Stop everything when this player unmounts or the route changes.
  useEffect(() => () => { transport.stop(); }, [score.id]);

  useEffect(() => {
    const onHidden = () => {
      if (document.hidden && transport.playing) {
        transport.stop();
        setMessage('Playback stopped while this tab was inactive.');
      }
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => document.removeEventListener('visibilitychange', onHidden);
  }, []);

  const compatiblePatterns = patternsForMeter(score.meter);

  const start = useCallback(async () => {
    setMessage(null);
    const next = playCount + 1;
    setPlayCount(next);
    onPlayCountChange?.(next);
    await transport.play({
      score,
      pattern: patternId ? patternById(patternId) : null,
      mix,
      tempoQuarterBpm: tempo,
      firstBar: range[0],
      lastBar: range[1],
      loop,
      countInBars,
      onError: (text) => setMessage(text),
      onEnd: () => setPlaying(false),
    });
  }, [score, patternId, mix, tempo, range, loop, countInBars, playCount, onPlayCountChange]);

  const toggle = () => {
    if (playing) transport.stop();
    else void start();
  };

  return (
    <div className="app-transport rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={toggle} aria-live="polite">
          {playing ? '■ Stop' : `▶ Play${label ? ` ${label}` : ''}`}
        </Button>
        {!compact ? (
          <Button
            onClick={() => { transport.stop(); void start(); }}
            disabled={audioStatus === 'unavailable'}
          >
            ↻ Replay
          </Button>
        ) : null}
        {audioStatus !== 'running' ? (
          <Button variant="accent" onClick={() => void audioEngine.enable()}>
            Enable sound
          </Button>
        ) : null}
        {showTempo ? (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-[var(--color-muted)]">Tempo</span>
            <input
              type="range"
              min={30}
              max={180}
              step={1}
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              className="w-28"
              aria-label="Tempo in quarter-note beats per minute"
            />
            <span className="tabular-nums">{tempo} BPM</span>
          </label>
        ) : null}
      </div>

      {showLoop || showPattern || showMix ? (
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
          {showLoop ? (
            <>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} className="h-4 w-4" />
                Loop
              </label>
              <label className="flex items-center gap-1">
                <span className="text-[var(--color-muted)]">Bars</span>
                <input
                  type="number"
                  min={1}
                  max={barCount}
                  value={range[0]}
                  onChange={(e) => setRange(([, end]) => [Math.min(Number(e.target.value), end), end])}
                  className="w-14 rounded border border-[var(--color-line)] px-2 py-1"
                  aria-label="First bar"
                />
                <span aria-hidden="true">–</span>
                <input
                  type="number"
                  min={1}
                  max={barCount}
                  value={range[1]}
                  onChange={(e) => setRange(([start]) => [start, Math.max(Number(e.target.value), start)])}
                  className="w-14 rounded border border-[var(--color-line)] px-2 py-1"
                  aria-label="Last bar"
                />
              </label>
            </>
          ) : null}

          {showPattern && score.chords.length > 0 ? (
            <label className="flex items-center gap-2">
              <span className="text-[var(--color-muted)]">Accompaniment</span>
              <select
                value={patternId ?? ''}
                onChange={(e) => setPatternId(e.target.value || null)}
                className="rounded border border-[var(--color-line)] px-2 py-1"
              >
                <option value="">None (written notes only)</option>
                {compatiblePatterns.map((pattern) => (
                  <option key={pattern.id} value={pattern.id}>{pattern.label}</option>
                ))}
              </select>
            </label>
          ) : null}

          {showMix ? (
            <fieldset className="flex items-center gap-3">
              <legend className="sr-only">Playback mix</legend>
              {(['melody', 'bass', 'chord'] as const).map((voice) => (
                <label key={voice} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={mix[voice]}
                    onChange={(e) => setMix((m) => ({ ...m, [voice]: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <span className="capitalize">{voice === 'chord' ? 'upper chords' : voice}</span>
                </label>
              ))}
            </fieldset>
          ) : null}
        </div>
      ) : null}

      {showLoop || showTempo ? (
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Tempo and loop changes take effect the next time you press Play.
        </p>
      ) : null}

      {audioStatus === 'unavailable' ? (
        <div className="mt-2">
          <StatusNote kind="error">
            This browser did not provide Web Audio, so playback is unavailable. The written notes,
            beat grids and staff views on this page still work.
          </StatusNote>
        </div>
      ) : null}
      {audioStatus === 'suspended' ? (
        <div className="mt-2">
          <StatusNote kind="warning">
            Sound is paused by the browser. Press Enable sound to resume it.
          </StatusNote>
        </div>
      ) : null}
      {message ? <div className="mt-2"><StatusNote kind="warning">{message}</StatusNote></div> : null}
    </div>
  );
}
