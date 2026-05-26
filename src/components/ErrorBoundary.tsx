import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  title?: string;
  message?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('View crashed:', error, info.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-[24rem] bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">
            {this.props.title || 'This view could not be displayed'}
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            {this.props.message || 'Something went wrong while rendering this page.'}
          </p>
          <p className="text-xs text-slate-400 mt-3 font-mono break-words">
            {this.state.error.message}
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-dict-blue text-white text-sm font-medium hover:bg-blue-900"
          >
            <RotateCcw size={14} />
            Try Again
          </button>
        </div>
      </div>
    );
  }
}
