import { Link, useLocation } from 'react-router-dom';
import { Card, SectionHeading } from '../components/ui';

export function NotFoundPage() {
  const location = useLocation();
  return (
    <Card className="reading">
      <SectionHeading>That page could not be found</SectionHeading>
      <p className="mb-3">
        {`There is nothing at “${location.pathname}”. If you followed an old bookmark, the route may have changed.`}
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li><Link to="/" className="text-[var(--color-primary)] underline">Home</Link></li>
        <li><Link to="/course" className="text-[var(--color-primary)] underline">The course</Link></li>
        <li><Link to="/notebook" className="text-[var(--color-primary)] underline">Your notebook</Link></li>
      </ul>
    </Card>
  );
}
