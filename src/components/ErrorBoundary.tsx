import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-8 border border-rose-200 bg-rose-50/80 rounded-2xl text-center space-y-4 shadow-sm backdrop-blur-sm max-w-md mx-auto my-10 animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto text-rose-600">
              <span className="text-xl font-extrabold">⚠️</span>
            </div>
            <h2 className="text-lg font-bold text-rose-800">Something went wrong</h2>
            <p className="text-xs text-rose-600 leading-relaxed font-mono bg-rose-100/50 p-3 rounded-lg overflow-x-auto text-left">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold transition shadow-sm"
              >
                Reload &amp; Retry
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
