import { useState } from 'react';
import ScanPage from './components/ScanPage';
import ResultsPage from './components/ResultsPage';
import { scanBarcode, scanLabel } from './services/api';

function App() {
  const [view, setView] = useState('scan');       // 'scan' | 'loading' | 'results'
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleScanResult = async ({ type, barcode, imageFile, userProfile }) => {
    setError(null);
    setIsLoading(true);
    setView('loading');

    try {
      let result;
      if (type === 'barcode') {
        result = await scanBarcode(barcode, userProfile);
      } else {
        result = await scanLabel(imageFile, userProfile);
      }
      setAnalysisResult(result);
      setView('results');
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Something went wrong. Please try again.';
      setError(msg);
      setView('scan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setView('scan');
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Error toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass-strong border border-red-500/40 text-red-300 px-6 py-3 rounded-xl text-sm shadow-lg animate-slide-up flex items-center gap-3">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white">✕</button>
        </div>
      )}

      {view === 'scan' && (
        <ScanPage onScanResult={handleScanResult} isLoading={isLoading} />
      )}

      {view === 'loading' && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-strong p-12 text-center animate-fade-in max-w-sm">
            <div className="text-6xl mb-6 animate-pulse">🔬</div>
            <h2 className="text-2xl font-bold mb-3 gradient-text">Analyzing…</h2>
            <p className="text-gray-400 text-sm">Identifying ingredients, checking conflicts, and generating your personalized summary.</p>
            <div className="mt-6 w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full animate-pulse" style={{ width: '70%' }} />
            </div>
          </div>
        </div>
      )}

      {view === 'results' && analysisResult && (
        <ResultsPage data={analysisResult} onReset={handleReset} />
      )}
    </div>
  );
}

export default App;

