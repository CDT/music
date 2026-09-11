import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { compareChoice, comparePitchSequence, compareRhythm } from '../../domain/assessment';
import type { ChoiceResult, PitchSequenceResult, RhythmResult } from '../../domain/assessment';
import { pitchName, spellInKey } from '../../domain/pitch';
import { barBeats } from '../../domain/rhythm';
import { transport } from '../../services/audio/transport';
import { audioEngine } from '../../services/audio/context';
import { useStore } from '../../app/use-store';
import { recordAttempt } from '../../app/progress';
import { Button, Card, Muted, Pill, StatusNote } from '../../components/ui';
import { Keyboard, NoteEntry } from '../piano/Keyboard';
import { BeatGrid } from '../notation/BeatGrid';
import { buildEstablishScore, buildPromptScore } from './prompt';
import type { Attempt, Exercise, InputMode, LessonId, Readiness } from '../../domain/types';

type Phase = 'ready' | 'listening' | 'awaiting-response' | 'feedback' | 'complete';

interface State {
  phase: Phase;
  hints: string[];
  revealed: boolean;
  replayCount: number;
  startedAt: string;
}

type Action =
  | { type: 'listen' }
  | { type: 'listened' }
  | { type: 'hint'; hint: string }
  | { type: 'reveal' }
  | { type: 'answered' }
  | { type: 'retry' }
  | { type: 'complete' }
  | { type: 'stop' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'listen':
      return { ...state, phase: 'listening', replayCount: state.replayCount + 1 };
    case 'listened':
      return { ...state, phase: state.phase === 'listening' ? 'awaiting-response' : state.phase };
    case 'stop':
      // Stopping returns to ready without logging a failed attempt.
      return { ...state, phase: state.phase === 'listening' ? 'ready' : state.phase };
    case 'hint':
      return state.hints.includes(action.hint)
        ? state
        : { ...state, hints: [...state.hints, action.hint] };
    case 'reveal':
      return {
        ...state,
        revealed: true,
        hints: state.hints.includes('answer-revealed') ? state.hints : [...state.hints, 'answer-revealed'],
      };
    case 'answered':
      return { ...state, phase: 'feedback' };
    case 'retry':
      return { ...state, phase: 'awaiting-response' };
    case 'complete':
      return { ...state, phase: 'complete' };
    default:
      return state;
  }
}

/** Manual tasks and unscored rhythm prompts never receive a numeric result. */
function screenResultFor(
  result: PitchSequenceResult | ChoiceResult | RhythmResult | null,
): Attempt['screenResult'] {
  if (!result) return undefined;
  if (result.metric === 'rhythm-spacing' || result.metric === 'beat-aligned') {
    if (!result.scored) return undefined;
  }
  return { correct: result.correct, total: result.total, metric: result.metric };
}

function initialState(): State {
  return { phase: 'ready', hints: [], revealed: false, replayCount: 0, startedAt: new Date().toISOString() };
}

export interface ExerciseRunnerProps {
  exercise: Exercise;
  lessonId?: LessonId;
  onFinished?: (readiness: Readiness | null) => void;
}

export function ExerciseRunner({ exercise, lessonId, onFinished }: ExerciseRunnerProps) {
  const { store, data } = useStore();
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [screenResult, setScreenResult] = useState<PitchSequenceResult | ChoiceResult | RhythmResult | null>(null);
  const [entered, setEntered] = useState<number[]>([]);
  const [taps, setTaps] = useState<number[]>([]);
  const [choice, setChoice] = useState<string | null>(null);
  const [selfReport, setSelfReport] = useState<Readiness | null>(null);
  const [octaveEquivalent, setOctaveEquivalent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const tapStartRef = useRef<number | null>(null);

  const promptScore = useMemo(() => buildPromptScore(exercise), [exercise]);
  const establishScore = useMemo(() => buildEstablishScore(exercise), [exercise]);

  useEffect(() => () => transport.stop(), [exercise.id]);

  const manualOnly = exercise.mode === 'free-echo';
  const inputMode: InputMode = manualOnly ? 'manual-piano' : 'screen';

  const listen = useCallback(async () => {
    dispatch({ type: 'listen' });
    setMessage(null);
    const ok = await audioEngine.enable();
    if (!ok) {
      setMessage('Sound is not available yet. Press Enable sound, then Listen again.');
      dispatch({ type: 'stop' });
      return;
    }
    if (establishScore) {
      await transport.play({
        score: establishScore,
        pattern: { id: 'held', label: 'Held chord', description: '', meters: ['4/4', '3/4', '6/8'], sustained: true, events: [] },
        onEnd: () => {
          void transport.play({ score: promptScore, onEnd: () => dispatch({ type: 'listened' }) });
        },
      });
    } else {
      await transport.play({
        score: promptScore,
        pattern: promptScore.chords.length > 0 && exercise.mode === 'chord-quality'
          ? { id: 'held', label: 'Held chord', description: '', meters: ['4/4', '3/4', '6/8'], sustained: true, events: [] }
          : null,
        onEnd: () => dispatch({ type: 'listened' }),
      });
    }
  }, [establishScore, promptScore, exercise.mode]);

  const stop = () => {
    transport.stop();
    dispatch({ type: 'stop' });
  };

  const saveAttempt = useCallback((
    result: PitchSequenceResult | ChoiceResult | RhythmResult | null,
    readiness: Readiness | null,
  ) => {
    recordAttempt(store, {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      exerciseId: exercise.id,
      lessonId,
      inputMode,
      startedAt: state.startedAt,
      completedAt: new Date().toISOString(),
      hints: state.hints,
      replayCount: state.replayCount,
      readiness: readiness ?? undefined,
      screenResult: screenResultFor(result),
    });
  }, [store, exercise.id, lessonId, inputMode, state.startedAt, state.hints, state.replayCount]);

  const submitPitches = () => {
    if (exercise.mode !== 'phrase') return;
    const result = comparePitchSequence(exercise.answerMidi, entered, octaveEquivalent);
    setScreenResult(result);
    dispatch({ type: 'answered' });
    saveAttempt(result, null);
  };

  const submitChoice = (id: string) => {
    setChoice(id);
    const answerId = exercise.mode === 'contour' || exercise.mode === 'chord-quality' || exercise.mode === 'function'
      ? exercise.answerId
      : exercise.mode === 'degree'
        ? exercise.answerDegree
        : '';
    const explanation = exercise.mode === 'function' ? exercise.explanation : undefined;
    const result = compareChoice(id, answerId, explanation);
    setScreenResult(result);
    dispatch({ type: 'answered' });
    saveAttempt(result, null);
  };

  const submitTaps = () => {
    if (exercise.mode !== 'rhythm') return;
    const result = compareRhythm(exercise.onsetBeats, taps, {
      mode: 'spacing',
      tempoQuarterBpm: exercise.tempoQuarterBpm,
      toleranceBeats: 0.2,
    });
    setScreenResult(result);
    dispatch({ type: 'answered' });
    saveAttempt(result, null);
  };

  const finish = (readiness: Readiness) => {
    setSelfReport(readiness);
    dispatch({ type: 'complete' });
    saveAttempt(screenResult, readiness);
    onFinished?.(readiness);
  };

  const retry = () => {
    setScreenResult(null);
    setEntered([]);
    setTaps([]);
    setChoice(null);
    tapStartRef.current = null;
    dispatch({ type: 'retry' });
  };

  const hideAnswerVisuals = !state.revealed && state.phase !== 'feedback' && state.phase !== 'complete';

  return (
    <Card className="my-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="reading-heading text-lg font-semibold">{exercise.title}</h3>
        <div className="flex items-center gap-2">
          <Pill tone={state.hints.length > 0 ? 'help' : 'neutral'}>
            {state.hints.length > 0 ? 'Assisted attempt' : 'Unassisted'}
          </Pill>
          <Pill>{manualOnly ? 'At your piano' : 'On screen'}</Pill>
        </div>
      </div>

      <p className="mb-3 text-base">{exercise.instructions}</p>

      <div className="mb-3 flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => (state.phase === 'listening' ? stop() : void listen())}>
          {state.phase === 'listening' ? '■ Stop' : state.replayCount > 0 ? '↻ Listen again' : '▶ Listen'}
        </Button>
        {exercise.hints.length > 0 ? (
          <Button
            variant="accent"
            onClick={() => dispatch({ type: 'hint', hint: exercise.hints[Math.min(state.hints.length, exercise.hints.length - 1)] })}
            disabled={state.hints.filter((h) => h !== 'answer-revealed').length >= exercise.hints.length}
          >
            Show a hint
          </Button>
        ) : null}
        <Button onClick={() => dispatch({ type: 'reveal' })} disabled={state.revealed}>
          Reveal the answer
        </Button>
        {state.replayCount > 0 ? (
          <span className="self-center text-xs text-[var(--color-muted)]">
            Replays: {state.replayCount}
            {state.hints.length > 0 ? ` · Hints used: ${state.hints.length}` : ''}
          </span>
        ) : null}
      </div>

      {message ? <div className="mb-3"><StatusNote kind="warning">{message}</StatusNote></div> : null}

      {state.hints.filter((h) => h !== 'answer-revealed').length > 0 ? (
        <ul className="mb-3 list-disc space-y-1 rounded-lg border border-[#E4CFA3] bg-[var(--color-accent-soft)] px-6 py-3 text-sm text-[var(--color-accent)]">
          {state.hints.filter((h) => h !== 'answer-revealed').map((hint) => <li key={hint}>{hint}</li>)}
        </ul>
      ) : null}

      {/* Response controls */}
      {exercise.mode === 'contour' || exercise.mode === 'chord-quality' || exercise.mode === 'function' ? (
        <ChoiceResponse
          options={exercise.options}
          chosen={choice}
          disabled={state.phase === 'complete'}
          onChoose={submitChoice}
        />
      ) : null}

      {exercise.mode === 'degree' ? (
        <ChoiceResponse
          options={exercise.options}
          chosen={choice}
          disabled={state.phase === 'complete'}
          onChoose={submitChoice}
        />
      ) : null}

      {exercise.mode === 'phrase' ? (
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <Muted>Enter the notes in order. Your entry so far:</Muted>
            <span className="font-medium">
              {entered.length === 0
                ? '—'
                : entered.map((midi) => pitchName(spellInKey(midi, exercise.key))).join(' ')}
            </span>
            <Button onClick={() => setEntered((e) => e.slice(0, -1))} disabled={entered.length === 0}>
              Undo last note
            </Button>
            <Button onClick={() => setEntered([])} disabled={entered.length === 0}>Clear</Button>
          </div>
          <label className="mb-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={octaveEquivalent}
              onChange={(e) => setOctaveEquivalent(e.target.checked)}
              className="h-4 w-4"
            />
            Octave-equivalent practice mode — compares pitch classes and says so in the result.
          </label>
          <Keyboard
            musicKey={exercise.key}
            labelMode="notes"
            played={entered}
            highlighted={hideAnswerVisuals ? [] : exercise.answerMidi}
            onNoteOn={(midi) => setEntered((current) => [...current, midi])}
            lowMidi={60}
            highMidi={84}
          />
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-[var(--color-primary)]">
              Use sequential note entry instead
            </summary>
            <div className="mt-2">
              <NoteEntry musicKey={exercise.key} onAdd={(midi) => setEntered((c) => [...c, midi])} />
            </div>
          </details>
          <div className="mt-3">
            <Button variant="primary" onClick={submitPitches} disabled={entered.length === 0}>
              Check my answer
            </Button>
          </div>
          {exercise.showRhythmFirst ? (
            <div className="mt-3">
              <Muted>Rhythm of the prompt, shown before pitches:</Muted>
              <BeatGrid score={promptScore} hidePitches={hideAnswerVisuals} labelMode="notes" />
            </div>
          ) : null}
        </div>
      ) : null}

      {exercise.mode === 'rhythm' ? (
        <RhythmResponse
          taps={taps}
          onTap={(time) => {
            if (tapStartRef.current === null) tapStartRef.current = time;
            setTaps((current) => [...current, time]);
          }}
          onClear={() => { setTaps([]); tapStartRef.current = null; }}
          onSubmit={submitTaps}
          barBeatsValue={barBeats(exercise.meter)}
        />
      ) : null}

      {manualOnly ? (
        <StatusNote kind="info">
          This task happens at your piano. The app cannot hear you, so nothing here is scored.
          Play it, then tell us how it went below.
        </StatusNote>
      ) : null}

      {/* Feedback */}
      {screenResult ? (
        <div className="mt-3">
          <StatusNote kind={'isCorrect' in screenResult ? (screenResult.isCorrect ? 'success' : 'warning') : 'info'}>
            {screenResult.summary}
          </StatusNote>
          {'comparisons' in screenResult ? (
            <ul className="mt-2 space-y-1 text-sm">
              {screenResult.comparisons.map((comparison) => (
                <li key={comparison.index}>
                  {`Note ${comparison.index + 1}: `}
                  {comparison.status === 'correct' ? 'matched'
                    : comparison.status === 'missing' ? 'not played'
                      : comparison.status === 'extra' ? 'extra note'
                        : `${comparison.status === 'too-high' ? 'higher' : 'lower'} than the target by ${Math.abs(comparison.distanceSemitones ?? 0)} semitones`}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-2 flex gap-2">
            <Button onClick={retry}>Try again</Button>
          </div>
        </div>
      ) : null}

      {state.revealed ? (
        <div className="mt-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-ground)] p-3">
          <h4 className="mb-1 font-medium">The answer</h4>
          <RevealedAnswer exercise={exercise} />
        </div>
      ) : null}

      {/* Self-report */}
      <div className="mt-4 border-t border-[var(--color-line)] pt-3">
        <p className="mb-2 text-sm font-medium">How did it go?</p>
        <div className="flex flex-wrap gap-2">
          {(['not-yet', 'with-help', 'comfortable'] as const).map((readiness) => (
            <Button
              key={readiness}
              variant={selfReport === readiness ? 'primary' : 'secondary'}
              onClick={() => finish(readiness)}
            >
              {readiness === 'not-yet' ? 'Not yet' : readiness === 'with-help' ? 'With help' : 'Comfortable'}
            </Button>
          ))}
        </div>
        <Muted className="mt-2">
          All three answers let you continue. “With help” includes repeated listening, trial and error,
          displayed notes, or a slower tempo — it is useful information, not a failure.
          {data.settings.labelMode === 'hidden' ? ' Labels are currently hidden in Settings.' : ''}
        </Muted>
      </div>
    </Card>
  );
}

function ChoiceResponse({ options, chosen, disabled, onChoose }: {
  options: Array<{ id: string; label: string }>;
  chosen: string | null;
  disabled: boolean;
  onChoose: (id: string) => void;
}) {
  return (
    <fieldset className="mb-3" disabled={disabled}>
      <legend className="mb-2 text-sm font-medium">Choose your answer</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.id}
            variant={chosen === option.id ? 'primary' : 'secondary'}
            onClick={() => onChoose(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </fieldset>
  );
}

function RhythmResponse({ taps, onTap, onClear, onSubmit, barBeatsValue }: {
  taps: number[]; onTap: (time: number) => void; onClear: () => void; onSubmit: () => void;
  barBeatsValue: number;
}) {
  return (
    <div className="mb-3">
      <Muted className="mb-2">
        Tap the pad, or clap at your piano and use the manual self-report below. Screen taps are
        compared by spacing only; this does not measure acoustic-piano timing.
      </Muted>
      <button
        type="button"
        onPointerDown={() => onTap(performance.now())}
        className="mb-2 h-28 w-full rounded-xl border-2 border-dashed border-[var(--color-primary)] bg-[var(--color-surface)] text-lg font-medium"
      >
        Tap here ({taps.length} tap{taps.length === 1 ? '' : 's'})
      </button>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={onSubmit} disabled={taps.length === 0}>Check my rhythm</Button>
        <Button onClick={onClear} disabled={taps.length === 0}>Clear taps</Button>
        <span className="self-center text-xs text-[var(--color-muted)]">
          One bar is {barBeatsValue} quarter beats.
        </span>
      </div>
    </div>
  );
}

function RevealedAnswer({ exercise }: { exercise: Exercise }) {
  switch (exercise.mode) {
    case 'contour':
    case 'chord-quality':
      return <p>{exercise.options.find((o) => o.id === exercise.answerId)?.label ?? exercise.answerId}</p>;
    case 'function':
      return (
        <div>
          <p>{exercise.options.find((o) => o.id === exercise.answerId)?.label ?? exercise.answerId}</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{exercise.explanation}</p>
        </div>
      );
    case 'degree':
      return <p>{`Degree ${exercise.answerDegree}`}</p>;
    case 'phrase':
      return <p>{exercise.answerMidi.map((midi) => pitchName(spellInKey(midi, exercise.key))).join(' ')}</p>;
    case 'rhythm':
      return <p>{`Onsets at quarter beats: ${exercise.onsetBeats.join(', ')}.`}</p>;
    case 'free-echo':
      return <p>{exercise.revealText}</p>;
  }
}
