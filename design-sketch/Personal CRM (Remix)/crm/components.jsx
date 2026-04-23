// Shared micro-components for Personal CRM

const Avatar = ({ initials, color, size = 36 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: color, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.36, fontWeight: 600, flexShrink: 0,
    letterSpacing: '-0.01em',
  }}>{initials}</div>
);

const SourcePill = ({ source, active, onClick, compact }) => {
  const cfg = window.SOURCE_CONFIG[source];
  if (!cfg) return null;
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: compact ? '3px 8px' : '4px 10px',
      borderRadius: 99, border: 'none', cursor: 'pointer',
      fontSize: compact ? 11 : 12, fontWeight: 500,
      background: active ? cfg.color : 'transparent',
      color: active ? '#fff' : 'var(--text-muted)',
      transition: 'all 0.15s',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: active ? 'rgba(255,255,255,0.8)' : cfg.color,
        flexShrink: 0,
      }} />
      {cfg.label}
    </button>
  );
};

const SourceDot = ({ source }) => {
  const cfg = window.SOURCE_CONFIG[source];
  if (!cfg) return null;
  return <span title={cfg.label} style={{
    display: 'inline-block', width: 7, height: 7,
    borderRadius: '50%', background: cfg.color,
  }} />;
};

const SourceChip = ({ source }) => {
  const cfg = window.SOURCE_CONFIG[source];
  if (!cfg) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px', borderRadius: 99,
      background: cfg.bg, color: cfg.color,
      fontSize: 10, fontWeight: 600, letterSpacing: '0.02em',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color }} />
      {cfg.label.toUpperCase()}
    </span>
  );
};

const ReminderChip = ({ reminder, onDismiss }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 12px', borderRadius: 10,
    background: 'oklch(96% 0.04 82)', border: '1px solid oklch(88% 0.06 82)',
    marginBottom: 4,
  }}>
    <span style={{ fontSize: 14 }}>🔔</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'oklch(50% 0.1 82)' }}>{reminder.text}</div>
      <div style={{ fontSize: 11, color: 'oklch(62% 0.08 82)' }}>{reminder.due}</div>
    </div>
    {onDismiss && (
      <button onClick={onDismiss} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'oklch(65% 0.06 82)', fontSize: 14, padding: '0 2px',
      }}>✕</button>
    )}
  </div>
);

const NoteEntry = ({ entry }) => {
  const icons = { note: '📝', call: '📞', reminder: '🔔', meeting: '🤝' };
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '10px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icons[entry.type] || '📝'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{entry.text}</p>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, display: 'block' }}>{entry.ts}</span>
      </div>
    </div>
  );
};

const MessageBubble = ({ msg, source, showSource }) => {
  const isOut = msg.dir === 'out';
  const cfg = window.SOURCE_CONFIG[source];
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: isOut ? 'flex-end' : 'flex-start',
      marginBottom: 6,
    }}>
      {showSource && !isOut && (
        <div style={{ marginBottom: 3, marginLeft: 2 }}>
          <SourceChip source={source} />
        </div>
      )}
      <div style={{
        maxWidth: '70%', padding: '9px 13px', borderRadius: isOut ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        background: isOut ? 'var(--accent)' : 'var(--surface)',
        color: isOut ? '#fff' : 'var(--text)',
        fontSize: 13.5, lineHeight: 1.55,
        boxShadow: isOut ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        {msg.subject && !isOut && (
          <div style={{ fontSize: 10.5, fontWeight: 600, opacity: 0.6, marginBottom: 4, letterSpacing: '0.03em' }}>
            {msg.subject.toUpperCase()}
          </div>
        )}
        {msg.text}
      </div>
      <span style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3, marginLeft: isOut ? 0 : 2, marginRight: isOut ? 2 : 0 }}>
        {msg.ts}
      </span>
    </div>
  );
};

const IconBtn = ({ icon, label, onClick, active, badge }) => (
  <button title={label} onClick={onClick} style={{
    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 34, height: 34, borderRadius: 8, border: 'none',
    background: active ? 'var(--accent-subtle)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    cursor: 'pointer', fontSize: 16, transition: 'all 0.15s',
  }}>
    {icon}
    {badge > 0 && (
      <span style={{
        position: 'absolute', top: 4, right: 4,
        width: 8, height: 8, borderRadius: '50%',
        background: 'var(--accent)', border: '1.5px solid var(--bg)',
      }} />
    )}
  </button>
);

Object.assign(window, {
  Avatar, SourcePill, SourceDot, SourceChip,
  ReminderChip, NoteEntry, MessageBubble, IconBtn,
});
