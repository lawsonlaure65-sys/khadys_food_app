import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Khady App Error caught by boundary:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#1A0F0D] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h2 className="text-xl font-black italic uppercase text-amber-400">
                {this.props.fallbackTitle || "Une interruption a été interceptée"}
              </h2>
              <p className="text-xs text-white/70 mt-2 font-medium">
                Vos plats et vos données sont protégés dans le stockage persistant.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full bg-amber-500 hover:bg-amber-600 text-[#1A0F0D] py-3.5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <RefreshCw size={16} /> Relancer l'Application en toute sécurité
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
