import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { degreeLabel, isBlackKey, midiFor, spellInKey } from '../../domain/pitch';
import { audioEngine } from '../../services/audio/context';
import { playNote } from '../../services/audio/synth';
import type { KeySpec } from '../../domain/types';
import type { LabelMode } from '../notation/labels';

const WHITE_WIDTH = 34;
const WHITE_HEIGHT = 150;
const BLACK_WIDTH = 21;
const BLACK_HEIGHT = 94;

/** A S D F G H J K play the white keys; W E T Y U play the black keys. */
const WHITE_SHORTCUTS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];
const BLACK_SHORTCUTS: Record<string, number> = { w: 1, e: 3, t: 6, y: 8, u: 10 };
const WHITE_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

interface Props {
  lowMidi?: number;
  highMidi?: number;
  musicKey: KeySpec;
  labelMode?: LabelMode;
  /** Highlighted target notes. Never pass answers while a challenge is hidden. */
  highlighted?: number[];
  /** Notes the learner has played, always safe to show. */
  played?: number[];
  onNoteOn?: (midi: number) => void;
  onNoteOff?: (midi: number) => void;
  enableShortcuts?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

export function Keyboard({
  lowMidi = 60,
  highMidi = 84,
  musicKey,
  labelMode = 'notes',
  highlighted = [],
  played = [],
  onNoteOn,
  onNoteOff,
  enableShortcuts = true,
  disabled = false,
  ariaLabel = 'Virtual piano',
}: Props) {
  const [pressed, setPressed] = useState<number[]>([]);
  const heldRef = useRef(new Map<number, { release: (when?: number) => void } | null>());
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const [shortcutsOn, setShortcutsOn] = useState(false);

  const keys = useMemo(() => {
    const out: Array<{ midi: number; black: boolean; whiteIndex: number }> = [];
    let whiteIndex = 0;
    for (let midi = lowMidi; midi <= highMidi; midi += 1) {
      const black = isBlackKey(midi);
      out.push({ midi, black, whiteIndex: black ? whiteIndex - 1 : whiteIndex });
      if (!black) whiteIndex += 1;
    }
    return out;
  }, [lowMidi, highMidi]);

  const whiteCount = keys.filter((k) => !k.black).length;

  const noteOn = useCallback((midi: number) => {
    if (disabled) return;
    setPressed((current) => (current.includes(midi) ? current : [...current, midi]));
    void audioEngine.enable().then(() => {
      if (heldRef.current.has(midi)) return;
      heldRef.current.set(midi, playNote({ midi, velocity: 0.85, voice: 'melody' }));
    });
    onNoteOn?.(midi);
  }, [disabled, onNoteOn]);

  const noteOff = useCallback((midi: number) => {
    setPressed((current) => current.filter((m) => m !== midi));
    const handle = heldRef.current.get(midi);
    handle?.release();
    heldRef.current.delete(midi);
    onNoteOff?.(midi);
  }, [onNoteOff]);

  const releaseAll = useCallback(() => {
    for (const [midi, handle] of heldRef.current) {
      handle?.release();
      onNoteOff?.(midi);
    }
    heldRef.current.clear();
    setPressed([]);
  }, [onNoteOff]);

  useEffect(() => releaseAll, [releaseAll]);

  useEffect(() => {
    const onBlur = () => releaseAll();
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onBlur);
    return () => {
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onBlur);
    };
  }, [releaseAll]);

  const baseOctaveMidi = Math.floor(lowMidi / 12) * 12;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      setFocusIndex((index) => {
        const next = event.key === 'ArrowRight' ? index + 1 : index - 1;
        return Math.min(Math.max(next, 0), keys.length - 1);
      });
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      noteOn(keys[focusIndex].midi);
      return;
    }
    if (!shortcutsOn || !enableShortcuts || event.ctrlKey || event.metaKey || event.altKey) return;
    const whiteIndex = WHITE_SHORTCUTS.indexOf(key);
    if (whiteIndex >= 0) {
      event.preventDefault();
      const midi = baseOctaveMidi + (whiteIndex < 7 ? WHITE_SEMITONES[whiteIndex] : 12);
      noteOn(midi);
      return;
    }
    if (key in BLACK_SHORTCUTS) {
      event.preventDefault();
      noteOn(baseOctaveMidi + BLACK_SHORTCUTS[key]);
    }
  };

  const handleKeyUp = (event: React.KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (event.key === 'Enter' || event.key === ' ') {
      noteOff(keys[focusIndex].midi);
      return;
    }
    if (!shortcutsOn || !enableShortcuts) return;
    const whiteIndex = WHITE_SHORTCUTS.indexOf(key);
    if (whiteIndex >= 0) {
      noteOff(baseOctaveMidi + (whiteIndex < 7 ? WHITE_SEMITONES[whiteIndex] : 12));
      return;
    }
    if (key in BLACK_SHORTCUTS) noteOff(baseOctaveMidi + BLACK_SHORTCUTS[key]);
  };

  const tonicMidi = midiFor(musicKey.tonic.letter, musicKey.tonic.accidental, 4);

  const labelFor = (midi: number): string => {
    if (labelMode === 'hidden') return '';
    const pitch = spellInKey(midi, musicKey);
    const name = `${pitch.letter}${pitch.accidental > 0 ? '♯' : pitch.accidental < 0 ? '♭' : ''}${pitch.octave}`;
    const degree = degreeLabel(pitch, musicKey, tonicMidi).replace(/['`,]/g, '');
    if (labelMode === 'notes') return name;
    if (labelMode === 'degrees') return degree;
    return `${name}\n${degree}`;
  };

  const width = whiteCount * WHITE_WIDTH;

  return (
    <div className="practice-panel">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <input
            type="checkbox"
            checked={shortcutsOn}
            onChange={(e) => setShortcutsOn(e.target.checked)}
            disabled={!enableShortcuts}
            className="h-4 w-4"
          />
          Computer-keyboard shortcuts
        </label>
        {shortcutsOn ? (
          <span className="text-xs text-[var(--color-muted)]">
            A S D F G H J K = white keys · W E T Y U = black keys, in the lowest visible octave.
          </span>
        ) : null}
      </div>
      <div
        ref={containerRef}
        role="group"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={releaseAll}
        className="relative overflow-x-auto rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-2 focus-visible:outline-3"
      >
        {/* The keys are a fixed pixel width, so centre them rather than leaving a
            void on a wide card. Auto margins collapse to zero once the keyboard
            is wider than its scroll container, which keeps the left edge
            reachable. */}
        <div className="relative mx-auto" style={{ width, height: WHITE_HEIGHT }}>
          {keys.filter((k) => !k.black).map((k, index) => (
            <PianoKey
              key={k.midi}
              midi={k.midi}
              black={false}
              left={index * WHITE_WIDTH}
              label={labelFor(k.midi)}
              pressed={pressed.includes(k.midi)}
              played={played.includes(k.midi)}
              highlighted={highlighted.includes(k.midi)}
              focused={keys[focusIndex]?.midi === k.midi}
              disabled={disabled}
              onDown={noteOn}
              onUp={noteOff}
            />
          ))}
          {keys.filter((k) => k.black).map((k) => (
            <PianoKey
              key={k.midi}
              midi={k.midi}
              black
              left={(k.whiteIndex + 1) * WHITE_WIDTH - BLACK_WIDTH / 2}
              label={labelFor(k.midi)}
              pressed={pressed.includes(k.midi)}
              played={played.includes(k.midi)}
              highlighted={highlighted.includes(k.midi)}
              focused={keys[focusIndex]?.midi === k.midi}
              disabled={disabled}
              onDown={noteOn}
              onUp={noteOff}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PianoKey({
  midi, black, left, label, pressed, played, highlighted, focused, disabled, onDown, onUp,
}: {
  midi: number; black: boolean; left: number; label: string;
  pressed: boolean; played: boolean; highlighted: boolean; focused: boolean; disabled: boolean;
  onDown: (midi: number) => void; onUp: (midi: number) => void;
}) {
  const background = black
    ? (pressed ? '#3C4A44' : highlighted ? 'var(--color-accent)' : played ? 'var(--color-primary)' : '#21282A')
    : (pressed ? '#CFE3DC' : highlighted ? 'var(--color-accent-soft)' : played ? '#E7F2EE' : '#FFFFFF');

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`Play ${label.replace('\n', ', degree ')} `}
      aria-pressed={pressed}
      onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); onDown(midi); }}
      onPointerUp={() => onUp(midi)}
      onPointerCancel={() => onUp(midi)}
      onPointerLeave={(e) => { if (e.buttons > 0) onUp(midi); }}
      onLostPointerCapture={() => onUp(midi)}
      tabIndex={-1}
      style={{
        position: 'absolute',
        left,
        top: 0,
        width: black ? BLACK_WIDTH : WHITE_WIDTH,
        height: black ? BLACK_HEIGHT : WHITE_HEIGHT,
        background,
        zIndex: black ? 2 : 1,
        touchAction: 'none',
      }}
      className={`flex select-none items-end justify-center rounded-b-md border border-[var(--color-line)] pb-1 text-[10px] leading-tight ${black ? 'text-white' : 'text-[var(--color-muted)]'} ${focused ? 'ring-2 ring-[var(--color-primary)]' : ''}`}
    >
      <span className="pointer-events-none whitespace-pre text-center">{label}</span>
    </button>
  );
}

/** Accessible/mobile alternative: sequential note entry with no simultaneous keys. */
export function NoteEntry({ musicKey, lowMidi = 60, highMidi = 84, onAdd }: {
  musicKey: KeySpec; lowMidi?: number; highMidi?: number; onAdd: (midi: number) => void;
}) {
  const [octave, setOctave] = useState(Math.floor(lowMidi / 12) - 1);
  const names = useMemo(() => {
    const out: Array<{ midi: number; label: string }> = [];
    for (let semitone = 0; semitone < 12; semitone += 1) {
      const midi = (octave + 1) * 12 + semitone;
      if (midi < lowMidi || midi > highMidi) continue;
      const pitch = spellInKey(midi, musicKey);
      out.push({
        midi,
        label: `${pitch.letter}${pitch.accidental > 0 ? '♯' : pitch.accidental < 0 ? '♭' : ''}${pitch.octave}`,
      });
    }
    return out;
  }, [octave, lowMidi, highMidi, musicKey]);

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          className="min-h-11 rounded-lg border border-[var(--color-line)] px-3"
          onClick={() => setOctave((o) => Math.max(1, o - 1))}
        >
          Lower octave
        </button>
        <span className="text-sm text-[var(--color-muted)]">Octave {octave}</span>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-[var(--color-line)] px-3"
          onClick={() => setOctave((o) => Math.min(7, o + 1))}
        >
          Higher octave
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {names.map((note) => (
          <button
            key={note.midi}
            type="button"
            className="min-h-11 min-w-11 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3"
            onClick={() => {
              void audioEngine.enable().then(() => playNote({ midi: note.midi, duration: 0.6, voice: 'melody' }));
              onAdd(note.midi);
            }}
          >
            {note.label}
          </button>
        ))}
      </div>
    </div>
  );
}
