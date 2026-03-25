/**
 * BottomNav – persistent bottom tab navigation bar.
 * Clinical Naturalist glassmorphic design.
 */
export default function BottomNav({ activeTab, onTabChange, disabled }) {
  const tabs = [
    { key: 'scan', label: 'Home', icon: 'home' },
    { key: 'history', label: 'History', icon: 'history' },
    { key: 'profiles', label: 'Profiles', icon: 'person' },
    { key: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white/80 backdrop-blur-xl shadow-[0_-4px_20px_0_rgba(25,28,29,0.06)] rounded-t-3xl"
      role="tablist"
      aria-label="Main navigation"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
            disabled={disabled}
            onClick={() => onTabChange(tab.key)}
            className={`flex flex-col items-center justify-center rounded-2xl px-5 py-2 transition-all duration-200 ${
              isActive
                ? 'bg-green-100 text-green-900 scale-90'
                : 'text-slate-500 hover:bg-slate-50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className="material-symbols-outlined mb-1"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {tab.icon}
            </span>
            <span className="font-body text-[11px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
