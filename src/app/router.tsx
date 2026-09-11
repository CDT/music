import { Suspense, lazy } from 'react';
import { createHashRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { ErrorBoundary } from './ErrorBoundary';
import { HomePage } from '../pages/HomePage';
import { StartPage } from '../pages/StartPage';
import { CoursePage } from '../pages/CoursePage';
import { LessonPage } from '../pages/LessonPage';
import { PracticePage } from '../pages/PracticePage';
const EarTrainerPage = lazy(() => import('../pages/EarTrainerPage').then((m) => ({ default: m.EarTrainerPage })));
const HarmonyPage = lazy(() => import('../pages/HarmonyPage').then((m) => ({ default: m.HarmonyPage })));
import { StudiesPage } from '../pages/StudiesPage';
const StudyPage = lazy(() => import('../pages/StudyPage').then((m) => ({ default: m.StudyPage })));
import { NotebookPage } from '../pages/NotebookPage';
const NotebookEntryPage = lazy(() => import('../pages/NotebookEntryPage').then((m) => ({ default: m.NotebookEntryPage })));
const ReferencePage = lazy(() => import('../pages/ReferencePage').then((m) => ({ default: m.ReferencePage })));
import { ProgressPage } from '../pages/ProgressPage';
const SettingsPage = lazy(() => import('../pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const PrintCoursePage = lazy(() => import('../pages/PrintCoursePage').then((m) => ({ default: m.PrintCoursePage })));
import { NotFoundPage } from '../pages/NotFoundPage';

/** Routes that are loaded on demand are wrapped so nothing renders blank. */
function Deferred({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-4 text-[var(--color-muted)]">Loading this page…</p>}>
      {children}
    </Suspense>
  );
}

export const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorBoundary><NotFoundPage /></ErrorBoundary>,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'start', element: <StartPage /> },
      { path: 'course', element: <CoursePage /> },
      { path: 'lesson/:lessonId', element: <LessonPage /> },
      { path: 'practice', element: <PracticePage /> },
      { path: 'practice/ear', element: <Deferred><EarTrainerPage /></Deferred> },
      { path: 'harmony', element: <Deferred><HarmonyPage /></Deferred> },
      { path: 'studies', element: <StudiesPage /> },
      { path: 'studies/:studyId', element: <Deferred><StudyPage /></Deferred> },
      { path: 'notebook', element: <NotebookPage /> },
      { path: 'notebook/:entryId', element: <Deferred><NotebookEntryPage /></Deferred> },
      { path: 'reference', element: <Deferred><ReferencePage /></Deferred> },
      { path: 'progress', element: <ProgressPage /> },
      { path: 'settings', element: <Deferred><SettingsPage /></Deferred> },
      { path: 'print/course', element: <Deferred><PrintCoursePage /></Deferred> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
