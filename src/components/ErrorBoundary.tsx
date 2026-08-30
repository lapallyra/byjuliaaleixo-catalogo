import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error | null; reset: () => void }) => ReactNode);
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function isBenignError(error: any): boolean {
  const errStr = String(error?.message || error?.name || error || '').toLowerCase();
  return (
    errStr.includes('aborted') ||
    errStr.includes('abort') ||
    errStr.includes('failed to fetch') ||
    errStr.includes('load failed') ||
    errStr.includes('loading chunk') ||
    errStr.includes('dynamically imported module') ||
    errStr.includes('network') ||
    errStr.includes('offline') ||
    errStr.includes('domexception') ||
    errStr.includes('resizeobserver') ||
    errStr.includes('websocket')
  );
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    if (isBenignError(error)) {
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (isBenignError(error)) {
      return;
    }
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  public handleReset = () => {
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (e) {
        console.error(e);
      }
    }
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback({ error: this.state.error, reset: this.handleReset });
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#FDFCFA] flex flex-col items-center justify-center p-8 text-center select-none text-[#2C1810]">
          <div className="w-16 h-16 bg-[#FAF7F2] rounded-2xl flex items-center justify-center mb-5 border border-[#E8DFC8] shadow-xs">
            <span className="text-2xl">✨</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#2C1810] font-normal mb-3">
            Atualizando visualização
          </h1>
          <p className="text-[#593E32] mb-6 max-w-md font-sans text-xs sm:text-sm font-light leading-relaxed">
            Estamos restabelecendo os serviços para proporcionar uma experiência tranquila.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="bg-[#2C1810] hover:bg-[#3D261C] text-[#FAF8F5] font-medium py-3 px-8 rounded-full transition-all text-xs tracking-wider uppercase cursor-pointer"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="bg-transparent hover:bg-[#FAF7F2] text-[#2C1810] border border-[#D4AF37]/40 font-medium py-3 px-8 rounded-full transition-all text-xs tracking-wider uppercase cursor-pointer"
            >
              Ir para o Início
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

