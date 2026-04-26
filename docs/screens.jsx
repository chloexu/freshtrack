// FreshTrack — Screen Components
// All screens use 390px width (iPhone 14 Pro base)

const T = {
  cream: '#F7F5F0',
  creamDark: '#EEE9DF',
  green900: '#162B1E',
  green800: '#1F3D2A',
  green700: '#2A5238',
  green600: '#3A6B4A',
  green500: '#4C8A60',
  green400: '#6AA87E',
  green200: '#C2DEC9',
  green100: '#E4F2E8',
  amber: '#D97B2A',
  amberLight: '#FFF0DC',
  coral: '#C94040',
  coralLight: '#FDEAEA',
  sage: '#6AA87E',
  sageLight: '#E4F2E8',
  ink: '#1A1F1C',
  inkMid: '#4A5550',
  inkLight: '#8A9690',
  border: '#DDD8CF',
  white: '#FFFFFF',
};

// ─── Shared micro-components ──────────────────────────────────────────────────

function FreshnessOrb({ level }) {
  const map = {
    urgent: T.coral,
    soon: T.amber,
    fresh: T.sage,
    consumed: T.green400,
  };
  return (
    <span style={{
      display: 'inline-block',
      width: 10, height: 10,
      borderRadius: '50%',
      background: map[level] || T.inkLight,
      flexShrink: 0,
    }} />
  );
}

function TabBar({ active }) {
  const tabs = [
    { id: 'fridge', label: 'Fridge', icon: FridgeIcon },
    { id: 'add', label: 'Add', icon: CameraIcon },
    { id: 'reminders', label: 'Reminders', icon: BellIcon },
  ];
  return (
    <div style={{
      display: 'flex',
      borderTop: `1px solid ${T.border}`,
      background: T.white,
      paddingBottom: 20,
    }}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = tab.id === active;
        return (
          <div key={tab.id} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', paddingTop: 10, gap: 3,
            cursor: 'pointer',
          }}>
            <Icon size={22} color={isActive ? T.green700 : T.inkLight} />
            <span style={{
              fontSize: 11, fontWeight: isActive ? 600 : 400,
              color: isActive ? T.green700 : T.inkLight,
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: 0.1,
            }}>{tab.label}</span>
            {isActive && (
              <div style={{
                width: 4, height: 4, borderRadius: '50%',
                background: T.green600, marginTop: -2,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, letterSpacing: 1.2,
      color: T.inkLight, textTransform: 'uppercase',
      padding: '0 20px', marginBottom: 6,
    }}>{children}</div>
  );
}

function PillBadge({ label, color, bg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 9px', borderRadius: 20,
      background: bg, color: color,
      fontSize: 11, fontWeight: 500,
      fontFamily: "'DM Sans', sans-serif",
    }}>{label}</span>
  );
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function FridgeIcon({ size = 20, color = T.inkLight }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <line x1="4" y1="10" x2="20" y2="10"/>
      <line x1="9" y1="6" x2="9" y2="8"/>
      <line x1="9" y1="14" x2="9" y2="18"/>
    </svg>
  );
}
function CameraIcon({ size = 20, color = T.inkLight }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}
function BellIcon({ size = 20, color = T.inkLight }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}
function SearchIcon({ size = 16, color = T.inkLight }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function ChevronRightIcon({ size = 14, color = T.inkLight }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
function CheckIcon({ size = 14, color = T.white }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function ArrowUpIcon({ size = 18, color = T.white }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
    </svg>
  );
}
function SparkleIcon({ size = 16, color = T.white }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  );
}
function XIcon({ size = 12, color = T.coral }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function PlusIcon({ size = 16, color = T.green700 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

// ─── SCREEN 1: Add Groceries ──────────────────────────────────────────────────
function AddGroceriesScreen() {
  const items = [
    { name: 'Strawberries', qty: '1 pint', days: 5, level: 'soon' },
    { name: 'Greek Yogurt', qty: '32 oz', days: 10, level: 'fresh' },
    { name: 'Spinach', qty: 'bag', days: 6, level: 'soon' },
    { name: 'Chicken Breast', qty: '2 lbs', days: 3, level: 'urgent' },
    { name: 'Mango', qty: '2', days: 7, level: 'fresh' },
  ];

  return (
    <div style={{
      width: 390, height: 844,
      background: T.cream,
      display: 'flex', flexDirection: 'column',
      fontFamily: "'DM Sans', sans-serif",
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '54px 20px 12px', background: T.cream }}>
        <div style={{
          fontSize: 26, fontWeight: 700, color: T.ink,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          letterSpacing: -0.5,
        }}>Add Groceries</div>
        <div style={{ fontSize: 13, color: T.inkMid, marginTop: 2 }}>
          Snap your cart or receipt to import
        </div>
      </div>

      {/* Camera zone */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{
          background: T.green900,
          borderRadius: 20,
          height: 200,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 12,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* subtle grid texture */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `radial-gradient(circle at 60% 40%, ${T.green700}44 0%, transparent 60%)`,
          }}/>
          {/* corner brackets */}
          {[{t:16,l:16}, {t:16,r:16}, {b:16,l:16}, {b:16,r:16}].map((pos, i) => (
            <div key={i} style={{
              position: 'absolute', ...pos,
              width: 20, height: 20,
              borderTop: i < 2 ? `2px solid ${T.green400}` : 'none',
              borderBottom: i >= 2 ? `2px solid ${T.green400}` : 'none',
              borderLeft: (i === 0 || i === 2) ? `2px solid ${T.green400}` : 'none',
              borderRight: (i === 1 || i === 3) ? `2px solid ${T.green400}` : 'none',
            }}/>
          ))}
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CameraIcon size={26} color="rgba(255,255,255,0.7)" />
          </div>
          <div style={{ textAlign: 'center', zIndex: 1 }}>
            <div style={{ color: T.white, fontSize: 15, fontWeight: 500 }}>
              Take a photo
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>
              cart · receipt · shelf label
            </div>
          </div>
        </div>

        {/* Analyze button */}
        <button style={{
          width: '100%', marginTop: 12,
          background: T.green700,
          border: 'none', borderRadius: 14,
          padding: '16px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer',
        }}>
          <SparkleIcon size={15} />
          <span style={{
            color: T.white, fontSize: 16, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
          }}>Analyze Photo</span>
        </button>
      </div>

      {/* Confirmed items */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        <SectionLabel>Detected Items — tap to edit</SectionLabel>
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {items.map((item, i) => {
            const urgencyColor = item.level === 'urgent' ? T.coral : item.level === 'soon' ? T.amber : T.sage;
            const urgencyBg = item.level === 'urgent' ? T.coralLight : item.level === 'soon' ? T.amberLight : T.sageLight;
            return (
              <div key={i} style={{
                background: T.white,
                borderRadius: i === 0 ? '12px 12px 4px 4px' : i === items.length - 1 ? '4px 4px 12px 12px' : 4,
                padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
                borderLeft: `3px solid ${urgencyColor}`,
              }}>
                <FreshnessOrb level={item.level} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: T.ink }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: T.inkLight }}>{item.qty}</div>
                </div>
                <div style={{
                  background: urgencyBg, color: urgencyColor,
                  fontSize: 11, fontWeight: 600,
                  padding: '3px 8px', borderRadius: 20,
                }}>~{item.days}d</div>
                <ChevronRightIcon />
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '12px 20px 8px', background: T.cream, borderTop: `1px solid ${T.border}` }}>
        <button style={{
          width: '100%', background: T.green900,
          border: 'none', borderRadius: 14,
          padding: '16px 0',
          color: T.white, fontSize: 16, fontWeight: 600,
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
        }}>
          Save 5 Items to Fridge →
        </button>
      </div>

      <TabBar active="add" />
    </div>
  );
}

// ─── SCREEN 2: Fridge Home ─────────────────────────────────────────────────────
function FridgeHomeScreen() {
  const [expanded, setExpanded] = React.useState(1);
  const [consumed, setConsumed] = React.useState({});
  const [toast, setToast] = React.useState(null);

  function markConsumed(key, name) {
    setConsumed(prev => ({ ...prev, [key]: true }));
    setExpanded(null);
    const messages = [
      `Nice work using up the ${name}! 🌿`,
      `${name} done! Zero waste win 🎉`,
      `Way to go — ${name} used before it expired! ✨`,
      `Fresh fridge vibes — ${name} cleared! 🙌`,
    ];
    setToast(messages[Math.floor(Math.random() * messages.length)]);
    setTimeout(() => setToast(null), 3000);
  }

  const groups = [
    {
      id: 'urgent', label: 'Use Today', color: T.coral, bg: T.coralLight,
      items: [
        { name: 'Chicken Breast', detail: '2 lbs', days: 1, exp: 'exp. tomorrow' },
      ]
    },
    {
      id: 'soon', label: 'Use Soon', color: T.amber, bg: T.amberLight,
      items: [
        { name: 'Strawberries', detail: '1 pint', days: 5 },
        { name: 'Spinach', detail: 'bag', days: 6 },
      ]
    },
    {
      id: 'fresh', label: 'Still Fresh', color: T.sage, bg: T.sageLight,
      items: [
        { name: 'Mango', detail: '2', days: 7 },
        { name: 'Greek Yogurt', detail: '32 oz', days: 10, consumed: true },
      ]
    },
  ];

  return (
    <div style={{
      width: 390, height: 844,
      background: T.cream,
      display: 'flex', flexDirection: 'column',
      fontFamily: "'DM Sans', sans-serif",
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Celebratory Toast */}
      <div style={{
        position: 'absolute', top: 70, left: 20, right: 20, zIndex: 100,
        transform: toast ? 'translateY(0)' : 'translateY(-20px)',
        opacity: toast ? 1 : 0,
        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        pointerEvents: 'none',
      }}>
        <div style={{
          background: T.green900,
          borderRadius: 16,
          padding: '13px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: `0 8px 32px ${T.green900}55`,
        }}>
          {/* Confetti burst */}
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: `linear-gradient(135deg, ${T.green500}, ${T.amber})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            animation: toast ? 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
          }}>
            <span style={{ fontSize: 18 }}>✓</span>
          </div>
          <span style={{ color: T.white, fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>{toast}</span>
        </div>
      </div>
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '54px 20px 12px',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: T.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: -0.5 }}>
            My Fridge
          </div>
          <div style={{ fontSize: 13, color: T.inkMid, marginTop: 2 }}>5 items · 1 expiring soon</div>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: T.green100, border: `1px solid ${T.green200}`,
          borderRadius: 20, padding: '7px 14px',
          cursor: 'pointer', color: T.green700, fontSize: 13, fontWeight: 600,
        }}>
          <PlusIcon size={14} /> Add
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{
          background: T.white, borderRadius: 12,
          border: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 14px',
        }}>
          <SearchIcon />
          <span style={{ fontSize: 15, color: T.inkLight }}>Search your fridge…</span>
        </div>
      </div>

      {/* Groups */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        {groups.map((group, gi) => (
          <div key={group.id} style={{ marginBottom: 16 }}>
            {/* Group header */}
            <div style={{
              padding: '0 20px', marginBottom: 6,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: group.color }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: group.color, textTransform: 'uppercase' }}>
                {group.label}
              </span>
              <div style={{ flex: 1, height: 1, background: `${group.color}33` }} />
              <span style={{ fontSize: 11, color: group.color, fontWeight: 500 }}>{group.items.length}</span>
            </div>

            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {group.items.map((item, ii) => {
                const key = `${gi}-${ii}`;
                const isExpanded = expanded === key;
                const isConsumed = consumed[key] || item.consumed;
                return (
                  <div key={ii}>
                    <div
                      onClick={() => setExpanded(isExpanded ? null : key)}
                      style={{
                        background: isConsumed ? T.sageLight : T.white,
                        borderRadius: isExpanded ? '12px 12px 0 0' : 12,
                        padding: '13px 14px',
                        display: 'flex', alignItems: 'center', gap: 10,
                        cursor: 'pointer',
                        borderLeft: `3px solid ${group.color}`,
                        opacity: isConsumed ? 0.6 : 1,
                      }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        border: isConsumed ? 'none' : `1.5px solid ${T.border}`,
                        background: isConsumed ? T.sage : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {isConsumed && <CheckIcon size={12} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 15, fontWeight: 500, color: T.ink,
                          textDecoration: isConsumed ? 'line-through' : 'none',
                        }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: T.inkLight }}>{item.detail}</div>
                      </div>
                      {item.exp && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: group.color, background: group.bg, padding: '3px 8px', borderRadius: 20 }}>
                          {item.exp}
                        </span>
                      )}
                      <div style={{
                        fontSize: 13, fontWeight: 600, color: group.color,
                        minWidth: 34, textAlign: 'right',
                      }}>{item.days}d</div>
                    </div>

                    {/* Inline action row */}
                    {isExpanded && (
                      <div style={{
                        background: T.white, borderRadius: '0 0 12px 12px',
                        borderLeft: `3px solid ${group.color}`,
                        borderTop: `1px solid ${T.border}`,
                        display: 'flex',
                      }}>
                        {[
                          { label: '✓ Used it', color: T.sage, bg: T.sageLight, action: () => markConsumed(key, item.name) },
                          { label: '✎ Edit', color: T.inkMid, bg: T.creamDark, action: () => {} },
                          { label: '✕ Remove', color: T.coral, bg: T.coralLight, action: () => {} },
                        ].map((action, ai) => (
                          <button key={ai} onClick={action.action} style={{
                            flex: 1, padding: '11px 0',
                            background: action.bg, border: 'none',
                            borderRight: ai < 2 ? `1px solid ${T.border}` : 'none',
                            borderRadius: ai === 0 ? '0 0 0 9px' : ai === 2 ? '0 0 9px 0' : 0,
                            color: action.color, fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                          }}>{action.label}</button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <TabBar active="fridge" />
    </div>
  );
}

// ─── SCREEN 3: Reminders ──────────────────────────────────────────────────────
function RemindersScreen() {
  const reminders = [
    {
      emoji: '🍓', title: 'Fruit reminder',
      sub: '~2 hours after lunch (≈ 2:00 PM)',
      freqs: ['Daily', 'Every 2 days', 'Weekly'],
      active: 'Daily',
      color: T.coral, bg: T.coralLight,
    },
    {
      emoji: '🍽️', title: 'Dinner prep ideas',
      sub: '1 hour before dinner (≈ 5:30 PM)',
      freqs: ['Daily', 'Every 2 days', 'Weekly'],
      active: 'Daily',
      color: T.amber, bg: T.amberLight,
    },
    {
      emoji: '☀️', title: 'Breakfast ideas',
      sub: '7:00 AM',
      freqs: ['Daily', 'Every 2 days', 'Weekly'],
      active: 'Every 2 days',
      color: T.green500, bg: T.green100,
    },
  ];

  const messages = [
    { from: 'system', text: 'What reminders would you like? Try: "remind me about fruit 2 hours after lunch" or "warn me 1 hour before dinner about what I can cook."' },
    { from: 'user', text: 'Remind me about fruit 2 hours after lunch, warn me an hour before dinner. Also breakfast ideas at 7am.' },
    { from: 'system', text: "Got it! I've set up 3 reminders:" },
  ];

  return (
    <div style={{
      width: 390, height: 844,
      background: T.cream,
      display: 'flex', flexDirection: 'column',
      fontFamily: "'DM Sans', sans-serif",
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '54px 20px 12px' }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: T.ink, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: -0.5 }}>
          Reminders
        </div>
        <div style={{ fontSize: 13, color: T.inkMid, marginTop: 2 }}>3 active · next at 7:00 AM</div>
      </div>

      {/* Chat setup */}
      <div style={{ padding: '0 20px', marginBottom: 16 }}>
        <div style={{
          background: T.white, borderRadius: 16,
          border: `1px solid ${T.border}`,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 14px',
            borderBottom: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <SparkleIcon size={12} color={T.green600} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8, color: T.green600, textTransform: 'uppercase' }}>
              Tell me when to remind you
            </span>
          </div>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: msg.from === 'user' ? T.green700 : T.creamDark,
                color: msg.from === 'user' ? T.white : T.ink,
                padding: '9px 13px', borderRadius: 12,
                fontSize: 13, lineHeight: 1.5,
                borderBottomRightRadius: msg.from === 'user' ? 3 : 12,
                borderBottomLeftRadius: msg.from !== 'user' ? 3 : 12,
              }}>{msg.text}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Active reminders */}
      <SectionLabel>Active Reminders</SectionLabel>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {reminders.map((r, i) => (
          <div key={i} style={{
            background: T.white, borderRadius: 14,
            padding: '13px 14px',
            display: 'flex', flexDirection: 'column', gap: 8,
            borderLeft: `3px solid ${r.color}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{r.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>{r.title}</div>
                <div style={{ fontSize: 12, color: T.inkLight, marginTop: 1 }}>{r.sub}</div>
              </div>
              <div style={{
                width: 32, height: 20, borderRadius: 20,
                background: r.color, position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', right: 2, top: 2,
                  width: 16, height: 16, borderRadius: '50%',
                  background: T.white,
                }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {r.freqs.map(f => (
                <button key={f} style={{
                  padding: '5px 11px', borderRadius: 20,
                  background: f === r.active ? r.color : T.creamDark,
                  color: f === r.active ? T.white : T.inkMid,
                  border: 'none', fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}>{f}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 20px 8px',
        borderTop: `1px solid ${T.border}`,
        background: T.cream,
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <div style={{
          flex: 1, background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: 24, padding: '12px 16px',
          fontSize: 14, color: T.inkLight,
        }}>Add or change a reminder…</div>
        <button style={{
          width: 44, height: 44, borderRadius: '50%',
          background: T.green700, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}>
          <ArrowUpIcon size={18} />
        </button>
      </div>

      <TabBar active="reminders" />
    </div>
  );
}

// ─── Component Detail Cards ───────────────────────────────────────────────────
function UrgencyStates() {
  const states = [
    { label: 'Urgent — Use today', color: T.coral, bg: T.coralLight, days: '1d', level: 'urgent', name: 'Chicken Breast' },
    { label: 'Use soon', color: T.amber, bg: T.amberLight, days: '5d', level: 'soon', name: 'Strawberries' },
    { label: 'Still fresh', color: T.sage, bg: T.sageLight, days: '10d', level: 'fresh', name: 'Greek Yogurt' },
    { label: 'Consumed', color: T.green400, bg: T.green100, days: '—', level: 'consumed', name: 'Mango' },
  ];
  return (
    <div style={{ background: T.cream, padding: 20, width: 390, height: 320, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.inkLight, letterSpacing: 0.5, marginBottom: 12 }}>FRESHNESS STATES</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {states.map((s, i) => (
          <div key={i} style={{
            background: T.white, borderRadius: 10, padding: '11px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            borderLeft: `3px solid ${s.color}`,
          }}>
            <FreshnessOrb level={s.level} />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: T.ink }}>{s.name}</span>
            <span style={{ fontSize: 11, color: T.inkLight }}>{s.label}</span>
            <span style={{
              background: s.bg, color: s.color,
              fontSize: 11, fontWeight: 600,
              padding: '3px 9px', borderRadius: 20,
            }}>{s.days}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        {[
          { label: '1–2d', color: T.coral },
          { label: '3–6d', color: T.amber },
          { label: '7d+', color: T.sage },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, background: T.white, borderRadius: 8,
            padding: '8px 0', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4,
            borderTop: `2px solid ${s.color}`,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ItemRowExpanded() {
  return (
    <div style={{ background: T.cream, padding: 20, width: 390, height: 260, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.inkLight, letterSpacing: 0.5, marginBottom: 12 }}>ITEM ROW — TAPPED STATE</div>
      <div>
        <div style={{
          background: T.white, borderRadius: '12px 12px 0 0',
          padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 10,
          borderLeft: `3px solid ${T.coral}`,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            border: `1.5px solid ${T.border}`,
            flexShrink: 0,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: T.ink }}>Chicken Breast</div>
            <div style={{ fontSize: 12, color: T.inkLight }}>2 lbs · added Apr 23</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.coral, background: T.coralLight, padding: '3px 8px', borderRadius: 20 }}>
            exp. tomorrow
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.coral }}>1d</span>
        </div>
        <div style={{
          background: T.white, borderRadius: '0 0 12px 12px',
          borderLeft: `3px solid ${T.coral}`,
          borderTop: `1px solid ${T.border}`,
          display: 'flex',
        }}>
          {[
            { label: '✓ Used it', color: T.sage, bg: T.sageLight },
            { label: '✎ Edit', color: T.inkMid, bg: T.creamDark },
            { label: '✕ Remove', color: T.coral, bg: T.coralLight },
          ].map((a, ai) => (
            <button key={ai} style={{
              flex: 1, padding: '13px 0',
              background: a.bg, border: 'none',
              borderRight: ai < 2 ? `1px solid ${T.border}` : 'none',
              borderRadius: ai === 0 ? '0 0 0 9px' : ai === 2 ? '0 0 9px 0' : 0,
              color: a.color, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>{a.label}</button>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: T.inkLight }}>
        Tap any row to reveal inline actions · tap again to collapse
      </div>
    </div>
  );
}

function ReminderCardDetail() {
  return (
    <div style={{ background: T.cream, padding: 20, width: 390, height: 280, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.inkLight, letterSpacing: 0.5, marginBottom: 12 }}>REMINDER CARD</div>
      <div style={{
        background: T.white, borderRadius: 14,
        padding: '14px 14px', borderLeft: `3px solid ${T.amber}`,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🍽️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>Dinner prep ideas</div>
            <div style={{ fontSize: 12, color: T.inkLight, marginTop: 2 }}>1 hour before dinner (≈ 5:30 PM)</div>
            <div style={{ fontSize: 12, color: T.inkMid, marginTop: 4 }}>
              Suggests recipes using items expiring soon
            </div>
          </div>
          <div style={{ width: 32, height: 20, borderRadius: 20, background: T.amber, position: 'relative' }}>
            <div style={{ position: 'absolute', right: 2, top: 2, width: 16, height: 16, borderRadius: '50%', background: T.white }} />
          </div>
        </div>
        <div style={{ height: 1, background: T.border }} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.inkLight, letterSpacing: 0.8, marginBottom: 7, textTransform: 'uppercase' }}>Frequency</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Daily', 'Every 2 days', 'Weekly'].map(f => (
              <button key={f} style={{
                padding: '5px 12px', borderRadius: 20,
                background: f === 'Daily' ? T.amber : T.creamDark,
                color: f === 'Daily' ? T.white : T.inkMid,
                border: 'none', fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}>{f}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: -2 }}>
          <button style={{
            flex: 1, padding: '9px 0', borderRadius: 10,
            background: T.creamDark, border: 'none',
            color: T.inkMid, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>Edit</button>
          <button style={{
            flex: 1, padding: '9px 0', borderRadius: 10,
            background: T.coralLight, border: 'none',
            color: T.coral, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// Export to window for main script
Object.assign(window, {
  AddGroceriesScreen,
  FridgeHomeScreen,
  RemindersScreen,
  UrgencyStates,
  ItemRowExpanded,
  ReminderCardDetail,
  TabBar,
  FreshnessOrb,
  SectionLabel,
  T,
});
