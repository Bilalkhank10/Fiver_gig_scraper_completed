import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center p-6 text-slate-100">
          <div className="max-w-md w-full bg-slate-900/90 border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="h-12 w-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
            
            <div>
              <h2 className="text-lg font-bold text-white">Something Went Wrong</h2>
              <p className="text-xs text-slate-400 mt-1">
                A rendering glitch occurred in the interface.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[#070a10] border border-white/10 rounded-xl p-3 text-left font-mono text-[11px] text-red-300 max-h-32 overflow-y-auto">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reload Dashboard</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
