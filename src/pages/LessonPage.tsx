import { Link, useParams, useSearchParams } from 'react-router-dom';
import { lessonById } from '../content/course';
import { LessonReader } from '../features/lessons/LessonReader';
import type { TimeBudget } from '../features/lessons/LessonReader';
import { Card, SectionHeading } from '../components/ui';

export function LessonPage() {
  const { lessonId } = useParams();
  const [params] = useSearchParams();
  const lesson = lessonId ? lessonById(lessonId) : undefined;

  if (!lesson) {
    return (
      <Card className="reading">
        <SectionHeading>That lesson could not be found</SectionHeading>
        <p className="mb-3">
          {`There is no lesson with the id “${lessonId ?? ''}”. It may be from an older version of the course.`}
        </p>
        <p>
          <Link to="/course" className="text-[var(--color-primary)] underline">Browse the course</Link>
          {' or '}
          <Link to="/" className="text-[var(--color-primary)] underline">go back home</Link>
          .
        </p>
      </Card>
    );
  }

  const minutes = params.get('minutes');
  const budget: TimeBudget = minutes === '5' ? 5 : minutes === '15' ? 15 : minutes === '30' ? 30 : null;

  return <LessonReader lesson={lesson} budget={budget} />;
}
