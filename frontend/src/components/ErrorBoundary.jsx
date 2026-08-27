import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleClearCacheAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 select-none">
          <div className="max-w-lg w-full bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">System Render Exception</h1>
                <p className="text-xs text-slate-400">ResQ Command Center UI caught an unhandled exception.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-md border border-slate-800 font-mono text-xs text-red-300 overflow-x-auto max-h-40">
              <p className="font-bold text-red-400">{this.state.error?.toString()}</p>
              {this.state.errorInfo?.componentStack && (
                <pre className="mt-2 text-[10px] text-slate-500 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
              <button
                onClick={this.handleClearCacheAndReload}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 px-4 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Clear Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
