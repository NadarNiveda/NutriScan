import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import ScanButton from './ScanButton';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-950 border border-red-500/50 flex items-center justify-center text-red-400 mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Something unexpected happened</h2>
          <p className="text-slate-400 text-sm max-w-xs mb-6">
            NutriScan encountered a temporary interface glitch. Your saved preferences and history remain safe.
          </p>
          <div className="w-full max-w-xs">
            <ScanButton onClick={this.handleReset} variant="primary" icon={RefreshCw}>
              Reload NutriScan
            </ScanButton>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
