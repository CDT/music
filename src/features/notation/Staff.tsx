import { accidentalsOfKey, keyPrefersFlats, LETTERS, pitchName } from '../../domain/pitch';
import { describeDuration, splitIntoBars } from '../../domain/rhythm';
import { chordSymbolText } from '../../domain/harmony';
import { chordAt } from '../../domain/score';
import type { NoteEvent, Pitch, Score } from '../../domain/types';

/**
 * Simple SVG staff notation generated from the same event data the audio uses,
 * so nothing decorative can contradict playback. Every staff has an equivalent
 * beat-grid view elsewhere on the page.
 */

const LINE_GAP = 9;            // distance between staff lines
const STEP = LINE_GAP / 2;     // one diatonic step
const STAFF_TOP = 40;
const BOTTOM_LINE_Y = STAFF_TOP + LINE_GAP * 4;
const BAR_PADDING = 14;
const BEAT_WIDTH = 26;
const HEIGHT = 130;

/** Diatonic index: C0 = 0. E4 (bottom treble line) = 30. */
function diatonicIndex(pitch: Pitch): number {
  return pitch.octave * 7 + LETTERS.indexOf(pitch.letter);
}

function yForPitch(pitch: Pitch): number {
  return BOTTOM_LINE_Y - (diatonicIndex(pitch) - 30) * STEP;
}

const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
const SHARP_Y = [0, 1.5, -0.5, 1, 2.5, 0.5, 2];   // steps below the top line
const FLAT_Y = [2, 0.5, 2.5, 1, 3, 1.5, 3.5];

interface Props {
  score: Score;
  firstBar?: number;
  lastBar?: number;
  highlightNoteId?: string | null;
  showChords?: boolean;
}

export function Staff({ score, firstBar, lastBar, highlightNoteId = null, showChords = true }: Props) {
  const bars = splitIntoBars(score).filter((bar) => {
    if (firstBar !== undefined && bar.index >= 0 && bar.index + 1 < firstBar) return false;
    if (lastBar !== undefined && bar.index >= 0 && bar.index + 1 > lastBar) return false;
    return true;
  });
  const accidentals = accidentalsOfKey(score.key);
  const flats = keyPrefersFlats(score.key);
  const signatureWidth = accidentals.length * 8;
  const clefWidth = 34 + signatureWidth + 22;

  const barPositions = bars.reduce<Array<{ bar: (typeof bars)[number]; x: number; width: number }>>(
    (positions, bar) => {
      const previous = positions[positions.length - 1];
      const x = previous ? previous.x + previous.width : clefWidth;
      positions.push({ bar, x, width: BAR_PADDING * 2 + bar.beats * BEAT_WIDTH });
      return positions;
    },
    [],
  );
  const last = barPositions[barPositions.length - 1];
  const totalWidth = (last ? last.x + last.width : clefWidth) + 6;

  const description = bars
    .map((bar) => {
      const chord = chordAt(score, bar.startBeat);
      const notes = bar.notes
        .map((n) => (n.pitch ? `${pitchName(n.pitch)} ${describeDuration(n.durationBeats)}` : `${describeDuration(n.durationBeats)} rest`))
        .join(', ');
      return `Bar ${bar.index === -1 ? 'pickup' : bar.index + 1}${chord ? ` on ${chordSymbolText(chord.symbol)}` : ''}: ${notes}.`;
    })
    .join(' ');

  return (
    <figure className="my-3 overflow-x-auto">
      <svg
        viewBox={`0 0 ${totalWidth} ${HEIGHT}`}
        width={totalWidth}
        height={HEIGHT}
        role="img"
        aria-label={`Staff notation for ${score.title}. ${description}`}
        className="max-w-full"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={4}
            x2={totalWidth - 4}
            y1={STAFF_TOP + i * LINE_GAP}
            y2={STAFF_TOP + i * LINE_GAP}
            stroke="var(--color-ink)"
            strokeWidth={0.8}
          />
        ))}

        <TrebleClef />

        {accidentals.map((pc, index) => {
          const order = flats ? FLAT_ORDER : SHARP_ORDER;
          const table = flats ? FLAT_Y : SHARP_Y;
          const slot = order.indexOf(pc.letter);
          if (slot < 0) return null;
          const y = STAFF_TOP + table[slot] * LINE_GAP;
          return (
            <text
              key={pc.letter}
              x={36 + index * 8}
              y={y + 4}
              fontSize={16}
              fill="var(--color-ink)"
            >
              {flats ? '♭' : '♯'}
            </text>
          );
        })}

        <text x={clefWidth - 18} y={STAFF_TOP + LINE_GAP * 1.6} fontSize={13} fontWeight="600" fill="var(--color-ink)">
          {score.meter.numerator}
        </text>
        <text x={clefWidth - 18} y={STAFF_TOP + LINE_GAP * 3.6} fontSize={13} fontWeight="600" fill="var(--color-ink)">
          {score.meter.denominator}
        </text>

        {barPositions.map(({ bar, x: barX, width }) => {
          const chord = chordAt(score, bar.startBeat);
          return (
            <g key={bar.index}>
              {showChords && chord ? (
                <text x={barX + BAR_PADDING} y={STAFF_TOP - 12} fontSize={12} fontWeight="600" fill="var(--color-primary)">
                  {chordSymbolText(chord.symbol)}
                </text>
              ) : null}
              {bar.notes.map((note) => (
                <NoteGlyph
                  key={note.id}
                  note={note}
                  x={barX + BAR_PADDING + (note.startBeat - bar.startBeat) * BEAT_WIDTH}
                  highlighted={note.id === highlightNoteId}
                />
              ))}
              <line
                x1={barX + width}
                x2={barX + width}
                y1={STAFF_TOP}
                y2={BOTTOM_LINE_Y}
                stroke="var(--color-ink)"
                strokeWidth={bar === bars[bars.length - 1] ? 2.2 : 0.9}
              />
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">{description}</figcaption>
    </figure>
  );
}

function TrebleClef() {
  // A simplified treble clef drawn from a path, so no music font is required.
  return (
    <g transform={`translate(10, ${STAFF_TOP - 12})`} aria-hidden="true">
      <text x={0} y={52} fontSize={56} fill="var(--color-ink)" fontFamily="serif">&#119070;</text>
    </g>
  );
}

function NoteGlyph({ note, x, highlighted }: { note: NoteEvent; x: number; highlighted: boolean }) {
  const colour = highlighted ? 'var(--color-accent)' : 'var(--color-ink)';
  const dotted = [0.75, 1.5, 3].includes(Math.round(note.durationBeats * 100) / 100);
  const base = dotted ? (note.durationBeats * 2) / 3 : note.durationBeats;

  if (!note.pitch) {
    return <RestGlyph x={x} beats={note.durationBeats} colour={colour} dotted={dotted} />;
  }

  const y = yForPitch(note.pitch);
  const open = base >= 2;
  const stemUp = y > STAFF_TOP + LINE_GAP * 2;
  const stemX = stemUp ? x + 5 : x - 5;
  const stemY = stemUp ? y - 28 : y + 28;
  const flags = base <= 0.25 ? 2 : base <= 0.5 ? 1 : 0;

  const ledgerLines: number[] = [];
  for (let ly = BOTTOM_LINE_Y + LINE_GAP; ly <= y + 0.1; ly += LINE_GAP) ledgerLines.push(ly);
  for (let ly = STAFF_TOP - LINE_GAP; ly >= y - 0.1; ly -= LINE_GAP) ledgerLines.push(ly);

  return (
    <g>
      {ledgerLines.map((ly) => (
        <line key={ly} x1={x - 9} x2={x + 9} y1={ly} y2={ly} stroke={colour} strokeWidth={0.8} />
      ))}
      {note.pitch.accidental !== 0 ? (
        <text x={x - 17} y={y + 4} fontSize={15} fill={colour}>
          {note.pitch.accidental > 0 ? '♯' : '♭'}
        </text>
      ) : null}
      <ellipse
        cx={x}
        cy={y}
        rx={5.2}
        ry={3.9}
        transform={`rotate(-18 ${x} ${y})`}
        fill={open ? 'none' : colour}
        stroke={colour}
        strokeWidth={1.4}
      />
      {base < 4 ? (
        <line x1={stemX} x2={stemX} y1={y} y2={stemY} stroke={colour} strokeWidth={1.2} />
      ) : null}
      {Array.from({ length: flags }, (_, i) => (
        <path
          key={i}
          d={`M ${stemX} ${stemY + (stemUp ? i * 6 : -i * 6)} q 7 5 6 13`}
          fill="none"
          stroke={colour}
          strokeWidth={1.6}
        />
      ))}
      {dotted ? <circle cx={x + 10} cy={y - 2} r={1.6} fill={colour} /> : null}
    </g>
  );
}

function RestGlyph({ x, beats, colour, dotted }: {
  x: number; beats: number; colour: string; dotted: boolean;
}) {
  const middle = STAFF_TOP + LINE_GAP * 2;
  if (beats >= 4) {
    return <rect x={x - 5} y={STAFF_TOP + LINE_GAP} width={10} height={4} fill={colour} />;
  }
  if (beats >= 2) {
    return (
      <g>
        <rect x={x - 5} y={middle - 4} width={10} height={4} fill={colour} />
        {dotted ? <circle cx={x + 9} cy={middle - 6} r={1.6} fill={colour} /> : null}
      </g>
    );
  }
  if (beats >= 1) {
    return (
      <g>
        <path
          d={`M ${x - 2} ${middle - 11} l 5 6 l -5 6 l 5 6`}
          fill="none"
          stroke={colour}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
        {dotted ? <circle cx={x + 9} cy={middle - 6} r={1.6} fill={colour} /> : null}
      </g>
    );
  }
  return (
    <g>
      <line x1={x + 2} x2={x - 2} y1={middle - 8} y2={middle + 6} stroke={colour} strokeWidth={1.4} />
      <circle cx={x - 2} cy={middle - 7} r={2} fill={colour} />
      {dotted ? <circle cx={x + 8} cy={middle - 6} r={1.6} fill={colour} /> : null}
    </g>
  );
}
