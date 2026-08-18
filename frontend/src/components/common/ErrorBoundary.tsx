import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('[ErrorBoundary Caught Exception]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '100vh',
            background: 'var(--background, #F5F3EB)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            boxSizing: 'border-box',
            fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif",
            color: 'var(--foreground, #20201D)',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              background: 'var(--surface, #FFFDF8)',
              border: '1px solid var(--border, #DDD9CC)',
              borderRadius: '20px',
              padding: '36px 32px',
              textAlign: 'center',
              boxShadow: '0 12px 36px rgba(35, 31, 20, 0.08)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: '#F5E1DB',
                color: '#9F5141',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '8px' }}>
              Something went wrong
            </h2>

            <p style={{ fontSize: '0.875rem', color: 'var(--foreground-secondary)', lineHeight: 1.5, margin: '0 0 20px' }}>
              An unexpected issue occurred while rendering this interface.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: 'var(--surface-secondary, #EEEADF)',
                  border: '1px solid var(--border, #DDD9CC)',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  color: '#9F5141',
                  textAlign: 'left',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  marginBottom: '24px',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => (window.location.href = '/')}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 650,
                  cursor: 'pointer',
                  border: '1px solid var(--border, #DDD9CC)',
                  background: 'var(--surface, #FFFDF8)',
                  color: 'var(--foreground, #20201D)',
                }}
              >
                <Home size={15} /> Return Home
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: 'var(--primary, #F5AE4D)',
                  color: '#20201D',
                }}
              >
                <RotateCcw size={15} /> Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
