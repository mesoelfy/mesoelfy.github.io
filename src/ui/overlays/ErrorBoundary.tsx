import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WebGLErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("WebGL Context Crash:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black text-critical-red p-8 text-center font-mono">
          <div className="border border-critical-red/50 bg-critical-red/10 p-8 max-w-lg shadow-[0_0_50px_rgba(255,0,60,0.2)]">
            <div className="flex justify-center mb-4">
               <AlertTriangle size={48} className="animate-pulse" />
            </div>
            <h2 className="text-2xl font-black tracking-widest mb-4">GRAPHICS_CORE_FAILURE</h2>
            <p className="text-sm mb-6 text-critical-red/80">
              The neural interface encountered a critical WebGL error.
              <br/>
              <span className="text-xs opacity-50 mt-2 block font-mono">{this.state.error?.message}</span>
            </p>
            <button 
              onClick={this.handleReload}
              className="flex items-center justify-center gap-2 w-full py-3 bg-critical-red text-black font-bold tracking-widest hover:bg-white transition-colors"
            >
              <RefreshCw size={16} />
              REBOOT_SYSTEM
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
