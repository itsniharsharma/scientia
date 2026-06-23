import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Render error:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            background: '#f8fafc',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              maxWidth: '28rem',
              width: '100%',
              borderRadius: '12px',
              border: '1px solid #fca5a5',
              background: '#ffffff',
              padding: '1.5rem',
              boxShadow: '0 1px 4px rgba(0,0,0,.08)',
            }}
          >
            <p
              style={{
                margin: '0 0 .25rem',
                fontWeight: 700,
                fontSize: '1rem',
                color: '#dc2626',
              }}
            >
              Something went wrong
            </p>
            <p
              style={{
                margin: '0 0 .75rem',
                fontSize: '.875rem',
                color: '#475569',
                wordBreak: 'break-word',
              }}
            >
              {error.message}
            </p>
            <pre
              style={{
                background: '#f1f5f9',
                borderRadius: '6px',
                padding: '.625rem',
                fontSize: '.7rem',
                color: '#64748b',
                overflow: 'auto',
                maxHeight: '10rem',
                margin: '0 0 1rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {error.stack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#1d4ed8',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '.5rem 1.25rem',
                fontSize: '.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
