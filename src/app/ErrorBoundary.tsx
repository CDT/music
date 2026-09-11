import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { transport } from '../services/audio/transport';
import { metronome } from '../services/audio/metronome';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

/** Stops all audio and shows a recoverable message rather than a blank screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    transport.stop();
    metronome.stop();
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="reading-heading mb-3 text-2xl font-semibold">Something went wrong on this page</h1>
        <p className="mb-3">
          Your saved progress has not been changed. Sound has been stopped. You can go back to the
          course, or reload the page.
        </p>
        <pre className="mb-4 overflow-x-auto rounded border border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-xs">
          {this.state.error.message}
        </pre>
        <div className="flex flex-wrap gap-3">
          <a href="#/course" className="text-[var(--color-primary)] underline">Back to the course</a>
          <button type="button" className="text-[var(--color-primary)] underline" onClick={() => window.location.reload()}>
            Reload the page
          </button>
        </div>
      </div>
    );
  }
}
