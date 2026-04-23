// Screen components for Personal CRM

// ── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ contacts, activeId, onSelect, onSearch, onReminders, variation }) => {
  const totalUnread = contacts.reduce((s, c) => s + c.unread, 0);
  return (
    <div style={{
      width: variation === 'B' ? 240 : 260,
      background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100%',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 14px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>People</div>
        </div>
        <IconBtn icon="🔔" label="Reminders" onClick={onReminders} badge={totalUnread} />
        <IconBtn icon="🔍" label="Search" onClick={onSearch} />
      </div>

      {/* Quick search bar */}
      <div style={{ padding: '0 12px 10px' }}>
        <input
          placeholder="Search people…"
          onClick={onSearch}
          readOnly
          style={{
            width: '100%', padding: '7px 12px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--surface)',
            fontSize: 12.5, color: 'var(--text-muted)', cursor: 'pointer',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Contact list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {contacts.map(c => (
          <ContactRow key={c.id} contact={c} active={c.id === activeId} onClick={() => onSelect(c.id)} variation={variation} />
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 14px 14px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar initials="YO" color="var(--accent)" size={28} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', flex: 1 }}>Your account</span>
        <IconBtn icon="⚙" label="Settings" onClick={() => {}} />
      </div>
    </div>
  );
};

const ContactRow = ({ contact: c, active, onClick, variation }) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 8px', borderRadius: 10, border: 'none',
    background: active ? 'var(--accent-subtle)' : 'transparent',
    cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
    marginBottom: 2,
  }}>
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <Avatar initials={c.initials} color={c.avatarColor} size={38} />
      {c.unread > 0 && (
        <span style={{
          position: 'absolute', top: -2, right: -2,
          width: 14, height: 14, borderRadius: '50%',
          background: 'var(--accent)', border: '2px solid var(--sidebar-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, fontWeight: 700, color: '#fff',
        }}>{c.unread}</span>
      )}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
        <span style={{ fontSize: 13.5, fontWeight: c.unread ? 700 : 500, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          {c.name}
        </span>
        <span style={{ fontSize: 10.5, color: 'var(--text-muted)', flexShrink: 0 }}>{c.lastActive}</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginTop: 1 }}>
        {c.lastMsg}
      </div>
      {variation !== 'B' && (
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          {c.sources.map(s => <SourceDot key={s} source={s} />)}
          {c.reminder && <span style={{ fontSize: 10, color: 'oklch(60% 0.1 82)', marginLeft: 2 }}>🔔</span>}
        </div>
      )}
    </div>
  </button>
);

// ── Thread View ───────────────────────────────────────────────────────────────
const ThreadView = ({ contact, onOpenProfile, variation, onQuickCapture }) => {
  const [activeSource, setActiveSource] = React.useState('index');
  const [inputVal, setInputVal] = React.useState('');
  const bottomRef = React.useRef(null);

  React.useEffect(() => {
    setActiveSource('index');
    setInputVal('');
  }, [contact?.id]);

  React.useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollTop = bottomRef.current.scrollHeight;
  }, [contact?.id, activeSource]);

  if (!contact) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 40 }}>👥</div>
      <div style={{ fontSize: 15, color: 'var(--text-muted)', fontWeight: 500 }}>Select a person to open their thread</div>
    </div>
  );

  // Build merged or filtered messages
  const allMessages = (() => {
    const merged = [];
    Object.entries(contact.threads).forEach(([src, msgs]) => {
      msgs.forEach(m => merged.push({ ...m, source: src }));
    });
    return merged.sort((a, b) => (a.id > b.id ? 1 : -1));
  })();

  // Last received message across all sources
  const lastReceived = (() => {
    const received = allMessages.filter(m => m.dir === 'in' && !m.type);
    return received[received.length - 1] || null;
  })();

  // Most recent source for lastReceived
  const lastSource = lastReceived?.source || contact.sources[0];

  // Previous touch-point = last note/call entry
  const prevTouchpoint = (() => {
    const logs = allMessages.filter(m => m.type && m.type !== 'reminder');
    return logs[logs.length - 1] || null;
  })();

  const displayMessages = activeSource === 'index'
    ? []
    : (contact.threads[activeSource] || []).map(m => ({ ...m, source: activeSource }));

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setInputVal('');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
      {/* Thread header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--surface)', flexShrink: 0,
      }}>
        <Avatar initials={contact.initials} color={contact.avatarColor} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>{contact.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{contact.tagline}</div>
        </div>
        <button onClick={onOpenProfile} style={{
          padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)',
          background: 'transparent', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span>👤</span> Profile
        </button>
      </div>

      {/* Source tabs */}
      <div style={{
        padding: '8px 12px', borderBottom: '1px solid var(--border)',
        display: 'flex', gap: 2, background: 'var(--surface)', flexShrink: 0,
      }}>
        <button onClick={() => setActiveSource('index')} style={{
          padding: '4px 10px', borderRadius: 99, border: 'none', cursor: 'pointer',
          fontSize: 12, fontWeight: 500,
          background: activeSource === 'index' ? 'var(--text)' : 'transparent',
          color: activeSource === 'index' ? 'var(--bg)' : 'var(--text-muted)',
          transition: 'all 0.15s',
        }}>Index</button>
        {contact.sources.map(s => (
          <SourcePill key={s} source={s} active={activeSource === s} onClick={() => setActiveSource(s)} />
        ))}
      </div>

      {/* Sticky next touch-point bar */}
      {contact.reminder && (
        <div style={{
          padding: '9px 16px', flexShrink: 0,
          background: 'oklch(96% 0.04 82)', borderBottom: '1px solid oklch(88% 0.06 82)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 13 }}>🔔</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'oklch(48% 0.1 82)' }}>{contact.reminder.text}</span>
            <span style={{ fontSize: 11.5, color: 'oklch(60% 0.08 82)', marginLeft: 8 }}>{contact.reminder.due}</span>
          </div>
          <button style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'oklch(62% 0.07 82)', fontSize: 13, padding: '0 2px', lineHeight: 1,
          }}>✕</button>
        </div>
      )}

      {/* Messages / Index */}
      <div ref={bottomRef} style={{ flex: 1, overflowY: 'auto', padding: activeSource === 'index' ? '20px' : '16px 20px', display: 'flex', flexDirection: 'column' }}>
        {activeSource === 'index' ? (
          <IndexCard
            contact={contact}
            lastReceived={lastReceived}
            lastSource={lastSource}
            prevTouchpoint={prevTouchpoint}
            onSwitchSource={setActiveSource}
            onOpenProfile={onOpenProfile}
          />
        ) : (
          <>
            {displayMessages.map((msg) => {
              if (msg.type) return <NoteEntry key={msg.id} entry={msg} />;
              return <MessageBubble key={msg.id} msg={msg} source={msg.source} showSource={false} />;
            })}
            <div style={{ height: 8 }} />
          </>
        )}
      </div>

      {/* Compose bar */}
      <div style={{
        padding: '10px 16px 14px', borderTop: '1px solid var(--border)',
        background: 'var(--surface)', flexShrink: 0,
      }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder={activeSource === 'notes' ? 'Add a note, call log, reminder…' : activeSource === 'index' ? `Message via ${contact.sources[0]}…` : `Message via ${activeSource}…`}
              style={{
                width: '100%', padding: '9px 38px 9px 13px',
                borderRadius: 10, border: '1.5px solid var(--border)',
                background: 'var(--bg)', fontSize: 13.5, color: 'var(--text)',
                outline: 'none', boxSizing: 'border-box', lineHeight: 1.4,
              }}
            />
            <button type="button" onClick={onQuickCapture} title="Quick capture" style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
              color: 'var(--text-muted)', padding: 2,
            }}>⚡</button>
          </div>
          <button type="submit" style={{
            padding: '9px 14px', borderRadius: 10, border: 'none',
            background: 'var(--accent)', color: '#fff', fontWeight: 600,
            fontSize: 13, cursor: 'pointer', flexShrink: 0,
          }}>Send</button>
        </form>
      </div>
    </div>
  );
};

// ── Index Card ────────────────────────────────────────────────────────────────
const IndexCard = ({ contact, lastReceived, lastSource, prevTouchpoint, onSwitchSource, onOpenProfile }) => {
  const srcCfg = window.SOURCE_CONFIG[lastSource];

  // Format: "Today 2:45 PM" / "Mon 9:02 AM" / "Apr 18"
  const fmtTs = (msg) => {
    if (!msg) return null;
    const date = msg.date || msg.ts;
    const time = msg.ts;
    // If date already contains a time colon, it IS the time
    if (date === time) return time;
    return `${date} · ${time}`;
  };

  const touchpointIcons = { note: '📝', call: '📞', meeting: '🤝', reminder: '🔔' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 520 }}>

      {/* 1 — Compressed profile */}
      <div style={{
        display: 'flex', gap: 14, alignItems: 'center',
        padding: '14px 16px', borderRadius: 14,
        background: 'var(--surface)', border: '1px solid var(--border)',
      }}>
        <Avatar initials={contact.initials} color={contact.avatarColor} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{contact.name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{contact.tagline}</div>
          {contact.location && (
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>📍 {contact.location}</div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {contact.sources.map(s => (
              <button key={s} onClick={() => onSwitchSource(s)} title={window.SOURCE_CONFIG[s]?.label} style={{
                width: 10, height: 10, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
                background: window.SOURCE_CONFIG[s]?.color,
              }} />
            ))}
          </div>
          <button onClick={onOpenProfile} style={{
            fontSize: 11, color: 'var(--text-muted)', background: 'none',
            border: '1px solid var(--border)', borderRadius: 6,
            padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit',
          }}>Profile →</button>
        </div>
      </div>

      {/* 2 — Last message received */}
      <div style={{
        padding: '14px 16px', borderRadius: 14,
        background: 'var(--surface)', border: '1px solid var(--border)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-muted)' }}>LAST MESSAGE</div>
          {lastReceived && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <SourceChip source={lastSource} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtTs(lastReceived)}</span>
            </div>
          )}
        </div>
        {lastReceived ? (
          <div style={{
            fontSize: 13.5, color: 'var(--text)', lineHeight: 1.55,
            padding: '10px 13px', borderRadius: 10,
            background: 'var(--bg)',
          }}>
            {lastReceived.text}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No messages yet.</div>
        )}
      </div>

      {/* 3 — Previous touch-point */}
      <div style={{
        padding: '13px 14px', borderRadius: 14,
        background: 'var(--surface)', border: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>PREVIOUS</div>
        {prevTouchpoint ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>
              {touchpointIcons[prevTouchpoint.type] || '📝'} {prevTouchpoint.text}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 5 }}>{prevTouchpoint.ts}</div>
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>No logged interactions</div>
        )}
      </div>

    </div>
  );
};

// ── Context Panel (Variation A only) ─────────────────────────────────────────
const ContextPanel = ({ contact, onOpenProfile }) => {
  if (!contact) return (
    <div style={{
      width: 240, borderLeft: '1px solid var(--border)',
      background: 'var(--surface)', flexShrink: 0,
    }} />
  );
  return (
    <div style={{
      width: 240, borderLeft: '1px solid var(--border)',
      background: 'var(--surface)', flexShrink: 0,
      overflowY: 'auto', padding: '16px 14px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <Avatar initials={contact.initials} color={contact.avatarColor} size={52} />
        <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{contact.name}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{contact.tagline}</div>
        <button onClick={onOpenProfile} style={{
          marginTop: 8, padding: '5px 14px', borderRadius: 8,
          border: '1px solid var(--border)', background: 'transparent',
          fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)', cursor: 'pointer',
        }}>View full profile</button>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 8 }}>DETAILS</div>
        {contact.location && <InfoRow icon="📍" val={contact.location} />}
        {contact.birthday && <InfoRow icon="🎂" val={contact.birthday} />}
        {contact.url && <InfoRow icon="🔗" val={contact.url} />}
      </div>

      {contact.reminder && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 8 }}>REMINDER</div>
          <ReminderChip reminder={contact.reminder} />
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 8 }}>CONNECTED</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {contact.sources.map(s => {
            const cfg = window.SOURCE_CONFIG[s];
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{cfg.label}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>synced</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, val }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
    <span style={{ fontSize: 13 }}>{icon}</span>
    <span style={{ fontSize: 12, color: 'var(--text)' }}>{val}</span>
  </div>
);

// ── Profile View ─────────────────────────────────────────────────────────────
const ProfileView = ({ contact, onBack }) => {
  const notes = Object.values(contact.threads).flat().filter(m => m.type);
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 24px 48px' }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: 13, fontWeight: 500,
        }}>← Back to thread</button>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 24 }}>
          <Avatar initials={contact.initials} color={contact.avatarColor} size={64} />
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>{contact.name}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--text-muted)' }}>{contact.tagline}</p>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {contact.sources.map(s => <SourceChip key={s} source={s} />)}
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24,
        }}>
          {[['📍', 'Location', contact.location], ['🎂', 'Birthday', contact.birthday], ['🔗', 'Link', contact.url]].filter(r => r[2]).map(([icon, label, val]) => (
            <div key={label} style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 4 }}>{icon} {label.toUpperCase()}</div>
              <div style={{ fontSize: 13, color: 'var(--text)' }}>{val}</div>
            </div>
          ))}
        </div>

        {contact.reminder && (
          <div style={{ marginBottom: 20 }}>
            <SectionLabel>Upcoming</SectionLabel>
            <ReminderChip reminder={contact.reminder} />
          </div>
        )}

        <div>
          <SectionLabel>Notes & logs</SectionLabel>
          {notes.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No notes yet.</p>}
          {notes.map(n => <NoteEntry key={n.id} entry={n} />)}
        </div>
      </div>
    </div>
  );
};

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 10 }}>{children}</div>
);

// ── Reminders Panel ───────────────────────────────────────────────────────────
const RemindersPanel = ({ contacts, onClose, onSelectContact }) => {
  const withReminders = contacts.filter(c => c.reminder);
  return (
    <Overlay onClose={onClose} title="Reminders">
      {withReminders.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '0 4px' }}>No reminders set. Log an interaction and set one!</p>
      )}
      {withReminders.map(c => (
        <div key={c.id} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Avatar initials={c.initials} color={c.avatarColor} size={26} />
            <button onClick={() => { onSelectContact(c.id); onClose(); }} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: 13, fontWeight: 600, color: 'var(--text)',
            }}>{c.name}</button>
          </div>
          <ReminderChip reminder={c.reminder} />
        </div>
      ))}
    </Overlay>
  );
};

// ── Search Overlay ────────────────────────────────────────────────────────────
const SearchOverlay = ({ contacts, onClose, onSelectContact }) => {
  const [q, setQ] = React.useState('');
  const inputRef = React.useRef(null);
  React.useEffect(() => { inputRef.current?.focus(); }, []);

  const results = q.trim()
    ? contacts.filter(c =>
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.tagline.toLowerCase().includes(q.toLowerCase()) ||
        Object.values(c.threads).flat().some(m => m.text?.toLowerCase().includes(q.toLowerCase()))
      )
    : contacts;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '10vh', zIndex: 100,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 520, borderRadius: 16,
        background: 'var(--surface)', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>🔍</span>
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Search people, messages, notes…"
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 15, color: 'var(--text)', background: 'transparent',
            }}
          />
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}>Esc</button>
        </div>
        <div style={{ maxHeight: 340, overflowY: 'auto', padding: '8px 0' }}>
          {results.map(c => (
            <button key={c.id} onClick={() => { onSelectContact(c.id); onClose(); }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 16px', border: 'none', background: 'transparent',
              cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Avatar initials={c.initials} color={c.avatarColor} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.tagline}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {c.sources.map(s => <SourceDot key={s} source={s} />)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Quick Capture ─────────────────────────────────────────────────────────────
const QuickCaptureModal = ({ onClose, contacts }) => {
  const [val, setVal] = React.useState('');
  const [parsed, setParsed] = React.useState(null);
  const inputRef = React.useRef(null);
  React.useEffect(() => { inputRef.current?.focus(); }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setVal(v);
    // naive NL parsing for demo
    if (v.toLowerCase().includes('call') || v.toLowerCase().includes('called')) {
      setParsed({ type: 'call', icon: '📞', label: 'Call log' });
    } else if (v.toLowerCase().includes('meet') || v.toLowerCase().includes('coffee')) {
      setParsed({ type: 'meeting', icon: '🤝', label: 'Meeting' });
    } else if (v.toLowerCase().includes('remind') || v.toLowerCase().includes('follow up')) {
      setParsed({ type: 'reminder', icon: '🔔', label: 'Reminder' });
    } else if (v.length > 5) {
      setParsed({ type: 'note', icon: '📝', label: 'Note' });
    } else {
      setParsed(null);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '14vh', zIndex: 100,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 480, borderRadius: 16,
        background: 'var(--surface)', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        padding: '16px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 10 }}>⚡ QUICK CAPTURE</div>
        <textarea ref={inputRef} value={val} onChange={handleChange}
          placeholder={'Describe what happened…\ne.g. "called Alex yesterday about the workshop"'}
          rows={3}
          style={{
            width: '100%', border: '1.5px solid var(--border)', borderRadius: 10,
            padding: '10px 13px', fontSize: 14, color: 'var(--text)', background: 'var(--bg)',
            outline: 'none', resize: 'none', lineHeight: 1.55, boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />
        {parsed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 10,
            padding: '8px 12px', borderRadius: 8, background: 'var(--accent-subtle)',
          }}>
            <span>{parsed.icon}</span>
            <span style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 600 }}>Detected: {parsed.label}</span>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginLeft: 4 }}>— will log to Notes</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button onClick={onClose} style={{
            padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'transparent', fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={onClose} style={{
            padding: '7px 16px', borderRadius: 8, border: 'none',
            background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Log it</button>
        </div>
      </div>
    </div>
  );
};

// ── Onboarding ────────────────────────────────────────────────────────────────
const OnboardingView = ({ onDone }) => {
  const sources = ['bluesky', 'email', 'telegram', 'signal'];
  const [connected, setConnected] = React.useState([]);
  const toggle = s => setConnected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 40,
    }}>
      <div style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>
          Connect your inboxes
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          People aggregates all your conversations in one place. Connect sources to get started.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {sources.map(s => {
            const cfg = window.SOURCE_CONFIG[s];
            const on = connected.includes(s);
            return (
              <button key={s} onClick={() => toggle(s)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                borderRadius: 12, border: `2px solid ${on ? cfg.color : 'var(--border)'}`,
                background: on ? cfg.bg : 'var(--surface)', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s',
              }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: on ? cfg.color : 'var(--text)', flex: 1 }}>{cfg.label}</span>
                {on && <span style={{ fontSize: 13, color: cfg.color }}>✓ Connected</span>}
              </button>
            );
          })}
        </div>
        <button onClick={onDone} style={{
          width: '100%', padding: '12px', borderRadius: 12, border: 'none',
          background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700,
          cursor: 'pointer',
        }}>
          {connected.length > 0 ? `Continue with ${connected.length} source${connected.length > 1 ? 's' : ''}` : 'Skip for now'}
        </button>
      </div>
    </div>
  );
};

// ── Overlay wrapper ───────────────────────────────────────────────────────────
const Overlay = ({ onClose, title, children }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    paddingTop: '10vh', zIndex: 100,
  }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} style={{
      width: '100%', maxWidth: 440, borderRadius: 16,
      background: 'var(--surface)', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      padding: '20px', maxHeight: '70vh', overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{title}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

Object.assign(window, {
  Sidebar, ThreadView, ContextPanel, ProfileView,
  RemindersPanel, SearchOverlay, QuickCaptureModal, OnboardingView, IndexCard,
});
