import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackId?: string;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class SafePanelContent extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[SafePanelContent] Crash in ${this.props.fallbackId}:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-[100] p-2 text-center border border-critical-red/50">
          <AlertTriangle className="text-critical-red mb-1 animate-pulse" size={24} />
          <span className="text-[10px] text-critical-red font-mono font-bold tracking-widest">
            VISUAL_CORE_ERR
          </span>
          <span className="text-[8px] text-critical-red/60 font-mono mt-1 max-w-[150px] truncate">
            {this.state.errorMsg}
          </span>
        </div>
      );
    }

    return this.props.children;
  }
}
