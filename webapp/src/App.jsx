import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import ScanPage from './components/ScanPage';
import ResultsPage from './components/ResultsPage';
import ProfilesManagePage from './components/ProfilesManagePage';
import HistoryPage from './components/HistoryPage';
import SettingsPage from './components/SettingsPage';
import OnboardingFlow from './components/OnboardingFlow';
import LoadingAnalysis from './components/LoadingAnalysis';
import BottomNav from './components/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';
import HowToUsePage from './components/HowToUsePage';
import BrandLogo from './components/BrandLogo';
import { scanBarcode, scanLabel } from './services/api';
import { createProfile, listProfiles } from './services/profileApi';
import evaluateOcrQuality from './utils/evaluateOcrQuality';

function AppInner() {
  const { session, user, loading: authLoading, signOut } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'

  // ── View & tab state ─────────────────────────────
  const [activeTab, setActiveTab] = useState('scan');  // 'scan' | 'history' | 'profiles' | 'settings'
  const [view, setView] = useState('scan');            // 'scan' | 'loading' | 'results' | 'onboarding'
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastBarcode, setLastBarcode] = useState('');
  const [scoredForName, setScoredForName] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);

  // OCR quality gate
  const [ocrQualityInfo, setOcrQualityInfo] = useState(null);

  // ── Check if user needs onboarding ────────────────
  useEffect(() => {
    if (!session || !user) return;
    const onboardingDone = localStorage.getItem(`kwyc_onboarded_${user.id}`);
    if (onboardingDone) return;

    // Check if user has any profiles
    listProfiles()
      .then((profiles) => {
        if (profiles.length === 0) {
          setShowOnboarding(true);
          setView('onboarding');
        } else {
          localStorage.setItem(`kwyc_onboarded_${user.id}`, '1');
        }
      })
      .catch(() => {
        // Silently skip onboarding check on error
      });
  }, [session, user]);

  // Show spinner while Supabase checks session
  if (authLoading) {
    return (
      <div className="min-h-screen bg-cn-surface flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-cn-surface-container-high border-t-cn-primary animate-spin" />
      </div>
    );
  }

  // Not logged in -> auth pages
  if (!session) {
    if (authView === 'signup') {
      return <Signup onSwitch={() => setAuthView('login')} />;
    }
    return <Login onSwitch={() => setAuthView('signup')} />;
  }

  // ── Onboarding flow ───────────────────────────────
  if (showOnboarding && view === 'onboarding') {
    return (
      <OnboardingFlow
        onNavigateHowTo={() => setView('howto')}
        onComplete={async (profileData) => {
          if (profileData) {
            try {
              await createProfile(profileData);
            } catch {
              // Profile creation failed, still continue
            }
          }
          localStorage.setItem(`kwyc_onboarded_${user.id}`, '1');
          setShowOnboarding(false);
          setView('scan');
        }}
      />
    );
  }

  // ── How-to page during onboarding ──────────────────
  if (showOnboarding && view === 'howto') {
    return <HowToUsePage onBack={() => setView('onboarding')} />;
  }

  // ── Scan handler ──────────────────────────────────
  const handleScanResult = async ({ type, barcode, imageFile, userProfile, profileId, profileName, skipQualityCheck }) => {
    setError(null);
    setOcrQualityInfo(null);
    setIsLoading(true);
    setView('loading');
    setScoredForName(profileName || '');

    try {
      let result;
      if (type === 'barcode') {
        setLastBarcode(barcode);
        result = await scanBarcode(barcode, userProfile, profileId);
      } else {
        const barcodeToSend = barcode || lastBarcode;
        result = await scanLabel(imageFile, userProfile, barcodeToSend, profileId);
        setLastBarcode('');

        // OCR quality gate for label scans
        if (!skipQualityCheck) {
          const rawText = result.ingredients_raw_text || '';
          const quality = evaluateOcrQuality(rawText);
          if (!quality.ok) {
            setOcrQualityInfo({ ...quality, rawText, result });
            setView('scan');
            setActiveTab('scan');
            setIsLoading(false);
            return;
          }
        }
      }
      setAnalysisResult(result);
      setView('results');
    } catch (err) {
      const status = err.response?.status;
      let msg;
      if (status === 429) {
        msg = 'You\'ve reached the scan limit. Please wait a moment and try again.';
      } else {
        msg = err.response?.data?.detail || err.message || 'Something went wrong. Please try again.';
      }
      setError(msg);
      setView('scan');
      setActiveTab('scan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setView('scan');
    setActiveTab('scan');
    setAnalysisResult(null);
    setError(null);
    setLastBarcode('');
  };

  // ── Tab handler ────────────────────────────────────
  const handleTabChange = (tab) => {
    if (view === 'loading') return;
    setActiveTab(tab);
    if (tab === 'scan') {
      setView('scan');
    } else {
      setView(tab);
    }
    setError(null);
  };

  // ── View from history ──────────────────────────────
  const handleViewHistoryResult = (result) => {
    setAnalysisResult(result);
    setScoredForName('');
    setView('results');
  };

  // Determine if bottom nav should show
  const showBottomNav = view !== 'loading' && view !== 'results';

  return (
    <div className="min-h-screen bg-cn-surface">
      {/* ── Top bar (Clinical Naturalist) ──────── */}
      <header className="sticky top-0 z-40 bg-cn-surface">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
          <button
            onClick={() => handleTabChange('scan')}
            className="flex items-center gap-2 min-w-0 text-left min-h-[44px]"
            aria-label="Go to home / scan page"
          >
            <BrandLogo variant="icon" className="h-9 w-9 shrink-0" />
            <span className="text-2xl font-bold text-green-800 font-headline tracking-tight">
              KWYC
            </span>
          </button>

          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-cn-outline truncate max-w-[220px] font-body">
              {user?.email}
            </span>
            <button
              onClick={() => handleTabChange('settings')}
              className="p-2 rounded-full hover:bg-cn-surface-container transition-colors text-slate-500"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </div>
        <div className="bg-cn-surface-container-low h-[1px] w-full" />
      </header>

      {/* ── Error toast (Clinical Naturalist) ──── */}
      {error && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm shadow-soft animate-slide-up flex items-center gap-3 max-w-[90vw] font-body ${
            error.includes('limit')
              ? 'bg-amber-50 text-amber-700'
              : 'bg-cn-error-container text-cn-error'
          }`}
          role="alert"
        >
          {error.includes('limit') && (
            <span className="material-symbols-outlined text-amber-500 text-lg shrink-0">schedule</span>
          )}
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-current opacity-60 hover:opacity-100 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Dismiss error">&times;</button>
        </div>
      )}

      {/* ── Main content ────────── */}
      <div className="flex min-h-[calc(100vh-64px)]">

        {/* ── Center content ────────────────────────── */}
        <div className={`flex-1 min-w-0 ${showBottomNav ? 'pb-24' : ''}`}>
          {view === 'scan' && (
            <ErrorBoundary fallbackMessage="The scanner encountered an error. Please try again.">
              <ScanPage
                onScanResult={handleScanResult}
                isLoading={isLoading}
                lastFailedBarcode={lastBarcode}
                ocrQualityInfo={ocrQualityInfo}
                onAcceptPendingResult={() => {
                  if (ocrQualityInfo?.result) {
                    setAnalysisResult(ocrQualityInfo.result);
                    setOcrQualityInfo(null);
                    setView('results');
                  }
                }}
                onClearOcrQuality={() => setOcrQualityInfo(null)}
                onNavigateHowTo={() => setView('howto')}
              />
            </ErrorBoundary>
          )}

          {view === 'loading' && <LoadingAnalysis />}

          {view === 'results' && analysisResult && (
            <ErrorBoundary fallbackMessage="Could not display results. Please scan again.">
              <ResultsPage data={analysisResult} onReset={handleReset} scoredForName={scoredForName} />
            </ErrorBoundary>
          )}

          {view === 'howto' && (
            <HowToUsePage onBack={() => { setView('scan'); setActiveTab('scan'); }} />
          )}

          {view === 'history' && (
            <ErrorBoundary fallbackMessage="Could not load history.">
              <HistoryPage onViewResult={handleViewHistoryResult} />
            </ErrorBoundary>
          )}

          {view === 'profiles' && (
            <ErrorBoundary fallbackMessage="Could not load profiles.">
              <ProfilesManagePage onBack={() => handleTabChange('scan')} />
            </ErrorBoundary>
          )}

          {view === 'settings' && (
            <ErrorBoundary fallbackMessage="Could not load settings.">
              <SettingsPage />
            </ErrorBoundary>
          )}
        </div>

      </div>

      {/* ── Bottom navigation ────────────────────── */}
      {showBottomNav && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          disabled={isLoading}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;
