import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Enterprise React Error Boundary
 * Prevents full-page unmounting if any child component throws an uncaught error.
 * Maintains UI structure and provides a graceful recovery option.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[HireNova ErrorBoundary Caught]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '#dashboard';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 my-6 rounded-2xl bg-[#0B1210] border border-emerald-500/30 text-[#F8FAFC] max-w-xl mx-auto shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Something interrupted this view</h3>
            <p className="text-xs text-[#94A3A8] mt-1">
              A temporary rendering glitch was safely contained to keep your session active.
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold shadow-md shadow-emerald-700/25 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Workspace</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

