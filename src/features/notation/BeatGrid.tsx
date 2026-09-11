import { chordSymbolText } from '../../domain/harmony';
import { degreeLabel, midiFor, pitchName } from '../../domain/pitch';
import { describeDuration, splitIntoBars, trimNumber } from '../../domain/rhythm';
import { chordAt } from '../../domain/score';
import type { LabelMode } from './labels';
import type { Score } from '../../domain/types';

interface Props {
  score: Score;
  labelMode?: LabelMode;
  /** Hide pitch information for a challenge; rhythm stays visible. */
  hidePitches?: boolean;
  highlightNoteId?: string | null;
  firstBar?: number;
  lastBar?: number;
}

/**
 * The required readable musical display: bar lines, note names, durations,
 * chord symbols and scale degrees. Always available as an alternative to staff
 * notation, and readable by screen readers.
 */
export function BeatGrid({
  score, labelMode = 'both', hidePitches = false, highlightNoteId = null, firstBar, lastBar,
}: Props) {
  const tonicMidi = midiFor(score.key.tonic.letter, score.key.tonic.accidental, 4);
  const bars = splitIntoBars(score).filter((bar) => {
    if (firstBar !== undefined && bar.index >= 0 && bar.index + 1 < firstBar) return false;
    if (lastBar !== undefined && bar.index >= 0 && bar.index + 1 > lastBar) return false;
    return true;
  });

  return (
    <div className="beat-grid overflow-x-auto">
      <table className="w-full min-w-[28rem] border-collapse text-sm">
        <caption className="sr-only">
          {`Beat grid for ${score.title}: bars, chord symbols, note names and durations in quarter beats.`}
        </caption>
        <thead>
          <tr className="text-left text-[var(--color-muted)]">
            <th scope="col" className="border-b border-[var(--color-line)] px-2 py-1 font-medium">Bar</th>
            <th scope="col" className="border-b border-[var(--color-line)] px-2 py-1 font-medium">Chord</th>
            <th scope="col" className="border-b border-[var(--color-line)] px-2 py-1 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {bars.map((bar) => {
            const chord = chordAt(score, bar.startBeat);
            return (
              <tr key={bar.index} className="align-top">
                <th scope="row" className="border-b border-[var(--color-line)] px-2 py-2 text-left font-medium">
                  {bar.index === -1 ? 'Pickup' : bar.index + 1}
                </th>
                <td className="border-b border-[var(--color-line)] px-2 py-2 font-medium text-[var(--color-primary)]">
                  {chord ? `${chordSymbolText(chord.symbol)} (${chord.romanLabel})` : '—'}
                </td>
                <td className="border-b border-[var(--color-line)] px-2 py-2">
                  <span className="flex flex-wrap gap-x-3 gap-y-1">
                    {bar.notes.map((note) => {
                      const highlighted = note.id === highlightNoteId;
                      const isRest = note.pitch === null;
                      const name = isRest ? 'rest' : pitchName(note.pitch!);
                      const degree = isRest ? '' : degreeLabel(note.pitch!, score.key, tonicMidi);
                      const shown = hidePitches && !isRest
                        ? '•'
                        : labelMode === 'hidden'
                          ? (isRest ? 'rest' : '•')
                          : labelMode === 'degrees'
                            ? (isRest ? 'rest' : degree)
                            : labelMode === 'notes'
                              ? name
                              : (isRest ? 'rest' : `${name} · ${degree}`);
                      return (
                        <span
                          key={note.id}
                          className={`inline-flex items-baseline gap-1 rounded px-1 ${highlighted ? 'bg-[var(--color-accent-soft)] font-semibold' : ''}`}
                        >
                          <span>{shown}</span>
                          <span className="text-xs text-[var(--color-muted)]">
                            {trimNumber(note.durationBeats)}
                          </span>
                          <span className="sr-only">
                            {` ${describeDuration(note.durationBeats)} note`}
                          </span>
                        </span>
                      );
                    })}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
