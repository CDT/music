import { useMemo, useState } from 'react';
import { EXERCISES } from '../content/exercises';
import { AUTHORED_PROMPT_COUNT, GENERATOR_VERSION, LEVELS, SEED_PROMPTS, generateLevelD, seedPromptToScore } from '../domain/generator';
import type { GeneratorLevel } from '../domain/generator';
import { ExerciseRunner } from '../features/exercises/ExerciseRunner';
import { ScorePlayer } from '../features/transport/ScorePlayer';
import { BeatGrid } from '../features/notation/BeatGrid';
import { Button, Card, Muted, Pill, SectionHeading, inputClass } from '../components/ui';
import type { ExerciseMode } from '../domain/types';

const MODE_LABELS: Record<ExerciseMode, string> = {
  contour: 'Contour choice',
  degree: 'Degree in context',
  phrase: 'Phrase reconstruction',
  rhythm: 'Rhythm imitation',
  'chord-quality': 'Chord quality',
  function: 'Functional listening',
  'free-echo': 'Free piano echo',
};

export function EarTrainerPage() {
  const [mode, setMode] = useState<ExerciseMode | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [level, setLevel] = useState<GeneratorLevel>('A');
  const [seed, setSeed] = useState(1);
  const [activeSeed, setActiveSeed] = useState<number | null>(null);

  const filtered = useMemo(
    () => EXERCISES.filter((exercise) => mode === 'all' || exercise.mode === mode),
    [mode],
  );
  const selected = filtered.find((e) => e.id === selectedId) ?? filtered[0];

  const levelPrompts = SEED_PROMPTS.filter((prompt) => prompt.level === level);
  const generated = useMemo(
    () => (activeSeed === null ? null : generateLevelD(activeSeed)),
    [activeSeed],
  );

  return (
    <div>
      <h1 className="reading-heading mb-1 text-3xl font-semibold">Ear trainer</h1>
      <Muted className="mb-5">
        Choose an exercise type, listen, answer, and record how it went. Replays and hints are counted
        separately; a revealed answer marks the attempt as assisted.
      </Muted>

      <Card className="mb-6">
        <SectionHeading>Configure</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="mode" className="mb-1 block text-sm font-medium">Exercise type</label>
            <select
              id="mode"
              className={inputClass}
              value={mode}
              onChange={(e) => { setMode(e.target.value as ExerciseMode | 'all'); setSelectedId(null); }}
            >
              <option value="all">All types</option>
              {Object.entries(MODE_LABELS).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="prompt" className="mb-1 block text-sm font-medium">Prompt</label>
            <select
              id="prompt"
              className={inputClass}
              value={selected?.id ?? ''}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {filtered.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {`${exercise.title} (${MODE_LABELS[exercise.mode]})`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {selected ? <ExerciseRunner exercise={selected} /> : null}

      <Card className="mt-8">
        <SectionHeading>Starter prompts and deterministic generation</SectionHeading>
        <Muted className="mb-3">
          {`${AUTHORED_PROMPT_COUNT} authored starter prompts, plus bounded generation for later practice. A prompt's identity includes its generator version (${GENERATOR_VERSION}) and seed, so the same seed always produces the same phrase.`}
        </Muted>
        <div className="mb-4 flex flex-wrap gap-2">
          {(['A', 'B', 'C', 'D'] as GeneratorLevel[]).map((id) => (
            <Button key={id} variant={level === id ? 'primary' : 'secondary'} onClick={() => setLevel(id)}>
              {`Level ${id}`}
            </Button>
          ))}
        </div>
        <p className="mb-3">{LEVELS[level].description}</p>

        {level !== 'D' ? (
          <ul className="space-y-4">
            {levelPrompts.map((prompt) => {
              const score = seedPromptToScore(prompt);
              return (
                <li key={prompt.id} className="rounded-lg border border-[var(--color-line)] p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Pill>{prompt.id}</Pill>
                    <span className="text-sm text-[var(--color-muted)]">{`Degrees: ${prompt.degrees}`}</span>
                  </div>
                  <ScorePlayer score={score} compact />
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-[var(--color-primary)]">Show the notes</summary>
                    <BeatGrid score={score} labelMode="both" />
                  </details>
                </li>
              );
            })}
          </ul>
        ) : (
          <div>
            <div className="mb-3 flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="seed" className="mb-1 block text-sm font-medium">Seed</label>
                <input
                  id="seed"
                  type="number"
                  min={0}
                  max={99999}
                  value={seed}
                  onChange={(e) => setSeed(Number(e.target.value))}
                  className="w-28 rounded border border-[var(--color-line)] px-2 py-2"
                />
              </div>
              <Button variant="primary" onClick={() => setActiveSeed(seed)}>Generate this seed</Button>
              {activeSeed !== null ? (
                <Muted>{`Active prompt: seed ${activeSeed}. Refreshing the page will not change it.`}</Muted>
              ) : null}
            </div>
            {generated ? (
              <div className="rounded-lg border border-[var(--color-line)] p-3">
                <Pill>{generated.id}</Pill>
                <div className="mt-2">
                  <ScorePlayer score={generated.score} />
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-[var(--color-primary)]">Show the notes</summary>
                  <BeatGrid score={generated.score} labelMode="both" />
                </details>
              </div>
            ) : (
              <Muted>Choose a seed and press Generate. The same seed always gives the same phrase.</Muted>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
