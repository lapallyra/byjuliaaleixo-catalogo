import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    const errStr = String(error?.message || error || '');
    if (
      errStr.includes('The user aborted a request') ||
      errStr.includes('Failed to fetch') ||
      errStr.includes('Load failed') ||
      errStr.includes('AbortError') ||
      errStr.includes('domexception')
    ) {
      return { hasError: false };
    }
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errStr = String(error?.message || error || '');
    if (
      errStr.includes('The user aborted a request') ||
      errStr.includes('Failed to fetch') ||
      errStr.includes('Load failed') ||
      errStr.includes('AbortError') ||
      errStr.includes('domexception')
    ) {
      return;
    }
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
