# From Inner Melody to Piano

A personal music-learning app: forty-eight written lessons, six original study
pieces, and practice tools that turn a melody you can hear into one you can play
and accompany.

Everything runs in the browser. There is no backend, no account, no API key, no
subscription and no cloud database. All sound is synthesized locally, and your
progress is stored in the browser you use.

The complete product, curriculum and implementation specification is in
[`GUIDE.md`](./GUIDE.md).

## What is in the release

- **48 lessons** across 12 modules, each with an observable outcome, a playable
  example, on-screen tasks, an acoustic-piano task, a remedy for difficulty and
  a self-reported readiness check.
- **Six original study pieces** — First Light, Small Steps, Evening Window,
  Little Waltz, Skyward Letter and Ground and Wings — playable, learnable in
  chunks, transposable, with reference harmony and accompaniment patterns.
- **Practice tools**: an ear trainer with seven exercise types, a virtual piano,
  a metronome supporting 4/4, 3/4 and 6/8, phrase looping and a mix of melody,
  bass and upper chords.
- **Harmony Lab** for comparing two harmonizations of the same phrase at an
  identical tempo and melody volume.
- **Melody notebook** with a practice journal, a structured melody editor, saved
  arrangements, drafts and a printable worksheet.
- **Reference** covering every term the course introduces, key and chord tables,
  and the accompaniment pattern specification.
- **Progress and review** with a transparent 1/3/7/14/30-day scheduler, per-skill
  self-reported readiness, JSON backup and import, and printable lessons.

Nothing here listens to your piano. Acoustic-piano tasks are self-reported, and
their results are kept separate from on-screen exercise results.

## Local setup

This project targets the Node version in [`.nvmrc`](./.nvmrc) — **Node 24**.

```bash
nvm use            # or install the version in .nvmrc
npm ci
npm run dev        # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run typecheck` | Strict TypeScript project check |
| `npm run lint` | ESLint over the whole repository |
| `npm test` | Unit and content-validation tests (Vitest) |
| `npm run test:watch` | The same tests in watch mode |
| `npm run build` | Type check, then build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run test:e2e` | Core browser journeys (Playwright) |

The end-to-end suite builds the site and serves it under `/music/`, so hash-route
refresh and subpath asset URLs are exercised the way GitHub Pages serves them.
It needs a browser once:

```bash
npx playwright install chromium
```

## Base path configuration

Vite's `base` is read from `PAGES_BASE_PATH`, defaulting to `/`.

- A project site at `https://<user>.github.io/music/` needs `/music/`.
- A user, organisation or custom-domain site at the root needs `/`.

```powershell
# PowerShell
$env:PAGES_BASE_PATH = '/music/'; npm run build
```

```bash
# POSIX shells
PAGES_BASE_PATH=/music/ npm run build
```

Routing is independent of this: the app uses a **hash router**, so
`https://example.github.io/music/#/lesson/m01-l01` can be refreshed or
bookmarked without any server rewrite. Never repeat the project path inside a
hash route, and never hardcode `/assets/…`; use imported asset URLs or
`import.meta.env.BASE_URL`.

## GitHub Pages setup

1. In the repository, open **Settings → Pages** and set **Source** to
   **GitHub Actions**.
2. Push to `main`. [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)
   lints, tests, builds and deploys the `dist` artifact.
3. For a root or custom-domain site, add a repository variable
   `PAGES_BASE_PATH` with the value `/`. Otherwise the workflow uses the
   repository name as the project subpath.

[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs on pull requests
and other branches. It lints, type checks, tests, builds and runs the core
browser journeys, and it has no Pages write permission.

A local build and a prepared workflow are not evidence that a hosted deployment
succeeded. Check the Actions run and the deployed URL separately.

## Storage, backup and privacy

Your work is saved in this browser's `localStorage`, namespaced by app and
deployment path (for example `inner-melody:music:v1`), because different
repositories on one `github.io` hostname share an origin.

- The app shows **Saved on this browser** with a timestamp. If a write fails, it
  says so and keeps your work in memory rather than reporting a false success.
- **Export a backup** writes a UTF-8 JSON file from your browser. No request is
  sent anywhere. GitHub Pages never stores your notebook.
- **Import** previews a file before changing anything. The supported mode is
  *replace local data*, confirmed explicitly, and it offers to export your
  current data first.
- **Reset progress** keeps your settings and notebook. **Delete all local data**
  removes only this app's namespaced key, and is recoverable only from a backup
  you exported earlier.
- If saved data cannot be read, it is left untouched and offered for export
  rather than being overwritten.
- Another tab saving newer data while you have unsaved edits pauses autosaving
  and offers to reload the saved version or keep your copy.

## Sound

The instrument is a synthesized keyboard tone made with Web Audio — a triangle
fundamental with a quieter harmonic layer. It is not a recorded piano, and it is
not intended to sound like one.

- Audio starts only after a deliberate action such as **Play** or **Enable
  sound**, which is what browsers require.
- If audio is suspended or unavailable, the app says so and the written lessons,
  beat grids and staff views continue to work.
- Playback stops when the tab is hidden, and the app tells you that it did.
  Uninterrupted background playback is not promised.
- Melody, bass, upper chords and the metronome have separate gains, polyphony is
  capped, and a limiter reduces clipping. Timing uses the audio clock with a
  short scheduling lookahead; it is not a claim of sample-accurate timing on
  every device.
- Settings contains an audio diagnostic: play C4, play a triad, play a four-beat
  count-in, and stop everything.

Web MIDI and microphone input are outside the required release. Nothing in the
course needs them.

## Project layout

```text
src/
  domain/      music theory, rhythm, generation, assessment, review scheduling
  content/     the 12 module files, six studies, exercises, glossary, patterns
  services/    audio (context, synthesis, scheduling, transport) and storage
  features/    lesson reader, exercises, piano, transport, harmony, notation
  pages/       route-level views
  app/         router, shell, providers, error boundary
  tests/       unit and content-validation tests
e2e/           core browser journeys
```

The music engine in `src/domain` is independent of React, and `GUIDE.md` is
never parsed at runtime — all lesson content lives in typed source files.

## What the automated checks do and do not cover

The unit and content tests verify pitch and interval mathematics, chord spelling
in every course key, transposition round trips, bar totals for all six studies,
deterministic phrase generation across many seeds, answer comparison including
missing and extra notes, rhythm matching, review scheduling across daylight
saving and year boundaries, and storage round trips including corrupt data,
blocked storage and cross-tab conflicts.

They cannot establish that the synthesized sound is pleasant, that the
acoustic-piano instructions are effective, or that the app behaves identically on
hardware that has not been tested. Audition examples yourself, and practise with
a real piano where you can.
