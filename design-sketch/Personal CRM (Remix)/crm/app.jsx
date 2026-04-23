const { useState, useEffect } = React;

const App = () => {
  const TWEAK_DEFAULTS_REF = window.__TWEAK_DEFAULTS || {
    variation: 'A',
    accentHue: 150,
    warmth: 65,
  };

  const contacts = window.CRM_DATA.contacts;

  const [variation, setVariation] = useState(TWEAK_DEFAULTS_REF.variation);
  const [activeId, setActiveId] = useState('alex');
  const [screen, setScreen] = useState('thread'); // 'thread' | 'profile' | 'onboarding'
  const [showSearch, setShowSearch] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  const activeContact = contacts.find(c => c.id === activeId) || null;

  // Persist position
  useEffect(() => {
    const saved = localStorage.getItem('crm_activeId');
    if (saved && contacts.find(c => c.id === saved)) setActiveId(saved);
    const savedScreen = localStorage.getItem('crm_screen');
    if (savedScreen) setScreen(savedScreen);
  }, []);

  useEffect(() => {
    localStorage.setItem('crm_activeId', activeId);
    localStorage.setItem('crm_screen', screen);
  }, [activeId, screen]);

  // Tweaks protocol
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const setTweak = (key, val) => {
    if (key === 'variation') setVariation(val);
    if (key === 'accentHue') {
      document.documentElement.style.setProperty('--accent', `oklch(60% 0.14 ${val})`);
      document.documentElement.style.setProperty('--accent-subtle', `oklch(95% 0.05 ${val})`);
    }
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*');
  };

  const handleSelectContact = (id) => {
    setActiveId(id);
    setScreen('thread');
  };

  const isOnboarding = screen === 'onboarding';

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Onboarding overlay */}
      {isOnboarding ? (
        <OnboardingView onDone={() => setScreen('thread')} />
      ) : (
        <>
          <Sidebar
            contacts={contacts}
            activeId={activeId}
            onSelect={handleSelectContact}
            onSearch={() => setShowSearch(true)}
            onReminders={() => setShowReminders(true)}
            variation={variation}
          />

          {screen === 'profile' && activeContact ? (
            <ProfileView
              contact={activeContact}
              onBack={() => setScreen('thread')}
            />
          ) : (
            <ThreadView
              contact={activeContact}
              onOpenProfile={() => setScreen('profile')}
              variation={variation}
              onQuickCapture={() => setShowQuickCapture(true)}
            />
          )}

          {variation === 'A' && screen !== 'profile' && (
            <ContextPanel
              contact={activeContact}
              onOpenProfile={() => setScreen('profile')}
            />
          )}
        </>
      )}

      {/* Overlays */}
      {showSearch && (
        <SearchOverlay
          contacts={contacts}
          onClose={() => setShowSearch(false)}
          onSelectContact={handleSelectContact}
        />
      )}
      {showReminders && (
        <RemindersPanel
          contacts={contacts}
          onClose={() => setShowReminders(false)}
          onSelectContact={handleSelectContact}
        />
      )}
      {showQuickCapture && (
        <QuickCaptureModal
          contacts={contacts}
          onClose={() => setShowQuickCapture(false)}
        />
      )}

      {/* Tweaks Panel */}
      {tweaksOpen && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 200,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '16px 18px', width: 240,
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 14 }}>TWEAKS</div>

          <TweakRow label="Layout">
            <div style={{ display: 'flex', gap: 6 }}>
              {['A', 'B'].map(v => (
                <button key={v} onClick={() => setTweak('variation', v)} style={{
                  padding: '4px 14px', borderRadius: 8, border: '1.5px solid var(--border)',
                  background: variation === v ? 'var(--accent)' : 'transparent',
                  color: variation === v ? '#fff' : 'var(--text)', fontSize: 12.5,
                  fontWeight: 600, cursor: 'pointer',
                }}>
                  {v === 'A' ? '3-col' : '2-col'}
                </button>
              ))}
            </div>
          </TweakRow>

          <TweakRow label="Accent hue">
            <input type="range" min={0} max={360} defaultValue={TWEAK_DEFAULTS_REF.accentHue}
              onChange={e => setTweak('accentHue', e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </TweakRow>

          <TweakRow label="Screens">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[['thread','Thread view'],['profile','Contact profile'],['onboarding','Onboarding']].map(([s, l]) => (
                <button key={s} onClick={() => setScreen(s)} style={{
                  padding: '4px 10px', borderRadius: 7, border: '1px solid var(--border)',
                  background: screen === s ? 'var(--accent-subtle)' : 'transparent',
                  color: screen === s ? 'var(--accent)' : 'var(--text)', fontSize: 11.5,
                  fontWeight: screen === s ? 600 : 400, cursor: 'pointer', textAlign: 'left',
                }}>{l}</button>
              ))}
            </div>
          </TweakRow>
        </div>
      )}
    </div>
  );
};

const TweakRow = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 6 }}>{label}</div>
    {children}
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
