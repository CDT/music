import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../app/use-store';
import { Button, Card, Field, Muted, SectionHeading, StatusNote, inputClass } from '../components/ui';
import { LABEL_MODE_OPTIONS } from '../features/notation/labels';
import { previewPitches } from '../services/audio/transport';
import { ExerciseRunner } from '../features/exercises/ExerciseRunner';
import { exerciseById } from '../content/exercises';

const PROFILE = [
  'You have a piano and can read sheet music.',
  'You can play chords and an arrangement of Canon in D.',
  'You would like to play melodies you hear, and accompany them.',
  'You like classical, anime and pop music, especially melody with simple accompaniment.',
  'You have no fixed practice schedule.',
];

export function StartPage() {
  const { data, store } = useStore();
  const navigate = useNavigate();
  const [soundTested, setSoundTested] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const diagnostic = exerciseById('q-m01-l01-echo');

  return (
    <div className="reading">
      <h1 className="reading-heading text-3xl font-semibold">A few preferences</h1>
      <p className="mt-2">
        All of this is optional and can be changed later in Settings. Skipping it changes nothing
        about the course.
      </p>

      <Card className="my-5">
        <SectionHeading>What we already assume about you</SectionHeading>
        <ul className="mb-3 list-disc space-y-1 pl-5">
          {PROFILE.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <Muted>
          Edit any of this in Settings if it is wrong. We will not ask you the same background
          questions again.
        </Muted>
      </Card>

      <Card className="my-5">
        <SectionHeading>Comfortable singing range</SectionHeading>
        <Field id="range" label="Where is your voice most comfortable?" hint="Used to suggest a register for singing tasks. It does not change the lessons.">
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

        <Field id="labels" label="Note labels" hint="Degrees are the course's common language; note names are always available.">
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

        <Field id="session" label="Default session length" hint="You can always decide each time on the home page.">
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
      </Card>

      <Card className="my-5">
        <SectionHeading>Sound test</SectionHeading>
        <p className="mb-3">
          Browsers only start audio after a deliberate action. Press the button to hear a C major
          chord. This is a synthesized piano sound, not a piano recording.
        </p>
        <Button
          variant="primary"
          onClick={async () => { setSoundTested(await previewPitches([60, 64, 67], 1.4)); }}
        >
          Play a test chord
        </Button>
        {soundTested ? (
          <div className="mt-3"><StatusNote kind="success">Sound is working.</StatusNote></div>
        ) : null}
      </Card>

      <Card className="my-5">
        <SectionHeading>Optional diagnostic</SectionHeading>
        <p className="mb-3">
          A short self-reported check: echo a three-note phrase, tell up from down, and play a chord
          you already know. It is not a prerequisite, and your existing chord and reading skills will
          never cause the course to skip ear fundamentals.
        </p>
        {showDiagnostic && diagnostic ? (
          <ExerciseRunner exercise={diagnostic} />
        ) : (
          <Button onClick={() => setShowDiagnostic(true)}>Try the diagnostic</Button>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="primary"
          onClick={() => {
            store.update((draft) => { draft.settings.onboarded = true; }, { immediate: true });
            navigate('/lesson/m01-l01');
          }}
        >
          Start lesson m01-l01
        </Button>
        <Button onClick={() => {
          store.update((draft) => { draft.settings.onboarded = true; }, { immediate: true });
          navigate('/course');
        }}>
          Browse the course instead
        </Button>
      </div>
    </div>
  );
}
