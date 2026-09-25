# Repository Guidelines

## Project Structure & Module Organization

This is a browser-only React and TypeScript music-learning app. Keep music theory and exercise logic in `src/domain/`, typed lessons and studies in `src/content/`, audio and browser persistence in `src/services/`, reusable UI in `src/features/` and `src/components/`, route views in `src/pages/`, and routing and app state in `src/app/`. Unit and content tests live in `src/tests/`; browser journeys live in `e2e/`. Static assets, including optional piano recordings, belong in `public/`. Consult `GUIDE.md` for the product and curriculum specification.

## Build, Test, and Development Commands

Use Node 24 (`.nvmrc`) and install locked dependencies with `npm ci`.

- `npm run dev` starts Vite at `http://localhost:5173`.
- `npm run typecheck` checks the TypeScript projects; `npm run lint` applies ESLint rules.
- `npm test` runs Vitest once; `npm run test:watch` reruns tests while editing.
- `npm run build` type-checks and writes the production site to `dist/`; `npm run preview` serves that build.
- `npm run test:e2e` runs Playwright against a production build under `/music/`. Install its browser once with `npx playwright install chromium`.

## Coding Style & Naming Conventions

Follow the existing two-space indentation, single quotes, semicolons, and TypeScript types. Use PascalCase for React component files and exported components (`LessonReader.tsx`), and descriptive kebab-case for utilities and hooks (`use-piano-tone.ts`). Keep domain functions independent of React. ESLint enforces TypeScript, React Hooks, and React Refresh rules; run `npm run lint` before submitting.

## Testing Guidelines

Name unit tests `*.test.ts` in `src/tests/` and browser tests `*.spec.ts` in `e2e/`. Add focused tests when changing music calculations, course content, storage, or user journeys. Run `npm test` and the relevant Playwright journey; CI also runs lint, typecheck, build, and Chromium e2e tests. There is no stated coverage percentage target.

## Commit & Pull Request Guidelines

Recent commits use short, imperative subjects, such as “Add an opt-in recorded piano” and “Verify the print views.” Keep each commit focused. In pull requests, describe the behavior changed, link any relevant issue, include screenshots for visible UI changes, and report the checks run.

## Deployment & Browser Data

The app uses hash routes and stores progress locally in the browser. For a project-site build, set `PAGES_BASE_PATH=/music/`; use imported asset URLs or `import.meta.env.BASE_URL` so assets work under that path. Avoid adding server or secret-dependent behavior to browser features.
