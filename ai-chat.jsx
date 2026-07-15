// ai-chat.jsx — "المساعد الذكي": a real, free-form chat grounded in ريالك's
// real (backend-served) financial data. Calls POST /api/chat — the server
// builds the system prompt from live DB data and proxies to the configured
// LLM provider (see server/.env for GROQ_API_KEY).
// Layout/interaction modeled after Claude's own chat UI (plain assistant
// text, tinted user bubble, growing composer, live word-reveal on reply) —
// but in ريالك's own warm palette, not Claude's colors.

const { useState: useStateChat, useEffect: useEffectChat, useRef: useRefChat } = React;

const CHAT_HISTORY_KEY = 'waffer-ai-chat-history';
const SAR_CHAT = 'ر.س';

const QUICK_QUESTIONS = [
  'كم صرفت على المطاعم آخر شهر؟',
  'وش أكبر شي يقدر يوفّرلي فلوس؟',
  'متى بوصل لهدف العمرة؟',
  'أخبرني عن دوري في الجمعية',
];

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '2px 0 6px' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: 'var(--sadu-brown)',
          opacity: 0.6, animation: `chatDot 1.1s ${i * 0.15}s infinite ease-in-out`,
        }} />
      ))}
      <style>{`@keyframes chatDot { 0%,80%,100% { transform: scale(0.6); opacity: 0.3; } 40% { transform: scale(1); opacity: 0.95; } }
      @keyframes chatFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

// Assistant turns: a small mark-avatar sits at the bubble's near corner,
// which is why that one corner (top-right, since the avatar renders first
// in DOM and RTL row layout puts it there) is squared off instead of
// rounded — a little "tab" reads as a speech-bubble tail without needing
// an actual triangle. Assistant is anchored to the reading-start (right)
// side; user turns mirror this to the opposite (left) side below.
function AssistantTurn({ content, streaming }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'flex-start', animation: 'chatFadeIn 0.25s ease' }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 2,
        background: 'var(--green)', color: 'var(--cream)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icon.sparkle size={11} /></div>
      <div style={{
        maxWidth: '80%', padding: '10px 14px', borderRadius: '18px 4px 18px 18px',
        background: '#fff', border: '1px solid rgba(27,52,36,0.10)',
        fontSize: 14, lineHeight: 1.8, color: 'var(--ink)', whiteSpace: 'pre-wrap',
      }}>
        {content}
        {streaming && <span className="chat-caret" />}
      </div>
    </div>
  );
}

// User turns mirror AssistantTurn: avatar on the left, bubble's near
// (top-left) corner squared off, whole row pushed to the far side.
function UserTurn({ content }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16, alignItems: 'flex-start', animation: 'chatFadeIn 0.2s ease' }}>
      <div style={{
        maxWidth: '78%', padding: '10px 14px', borderRadius: '4px 18px 18px 18px',
        background: 'var(--vanilla-soft)', border: '1px solid rgba(168,117,74,0.18)',
        color: 'var(--ink)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap',
      }}>{content}</div>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 2,
        background: 'var(--sadu-brown)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icon.users size={11} /></div>
    </div>
  );
}

function AIChatScreen({ goto }) {
  const [messages, setMessages] = useStateChat(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || 'null');
      if (saved && saved.length) return saved;
    } catch (e) { /* ignore */ }
    return [];
  });
  const [input, setInput] = useStateChat('');
  const [loading, setLoading] = useStateChat(false);
  const [streamText, setStreamText] = useStateChat(null); // word-reveal buffer for the in-flight reply
  const scrollRef = useRefChat(null);
  const textareaRef = useRefChat(null);
  const streamTimerRef = useRefChat(null);

  useEffectChat(() => {
    try { localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages)); } catch (e) { /* ignore */ }
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffectChat(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [streamText, loading]);

  useEffectChat(() => () => { if (streamTimerRef.current) clearInterval(streamTimerRef.current); }, []);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  // Reveal the finished reply word-by-word so it reads like it's arriving
  // live, then commit it to real message history.
  const revealReply = (fullText) => {
    const words = fullText.split(' ');
    let i = 0;
    setStreamText('');
    streamTimerRef.current = setInterval(() => {
      i += 1;
      setStreamText(words.slice(0, i).join(' '));
      if (i >= words.length) {
        clearInterval(streamTimerRef.current);
        setMessages(m => [...m, { role: 'assistant', content: fullText }]);
        setStreamText(null);
        setLoading(false);
      }
    }, 28);
  };

  const send = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    const next = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setInput('');
    requestAnimationFrame(autoResize);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error('chat request failed');
      const data = await res.json();
      revealReply((data.reply || '').trim() || 'ما قدرت أجاوب هالمرة، جرّب مرة ثانية.');
    } catch (e) {
      setLoading(false);
      setMessages(m => [...m, { role: 'assistant', content: 'صار خطأ بسيط بالاتصال، جرّب تسأل مرة ثانية.' }]);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Resets to a fresh conversation — clears in-flight streaming/loading
  // state too, since a stale timer could otherwise keep writing into the
  // new message list.
  const startNewChat = () => {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    setStreamText(null);
    setLoading(false);
    setInput('');
    setMessages([]);
    try { localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify([])); } catch (e) { /* ignore */ }
  };

  const hasUserMessage = messages.some(m => m.role === 'user');
  const canSend = !loading && input.trim().length > 0;

  return (
    <div className="screen-enter" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', background: 'var(--vanilla)' }}>
      {/* Empty-state mark: a faint tiled wordmark confined to the top-left
          corner (never spans full width, so it can't drift under content),
          plus one solid, deliberate logo mark centered in the empty middle
          of the screen — a splash-screen moment rather than a background
          texture. Both sit at zIndex 0, below the header/messages/composer
          (zIndex 1/101), and only render before the first user message. */}
      {!hasUserMessage && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', top: -10, left: -20, width: '70%', height: 170,
            backgroundImage: 'url(logo.png)', backgroundRepeat: 'repeat',
            backgroundSize: '100px 59px', opacity: 0.05,
            transform: 'rotate(-10deg) scale(1.5)', transformOrigin: 'top left',
            maskImage: 'linear-gradient(135deg, black 0%, transparent 80%)',
            WebkitMaskImage: 'linear-gradient(135deg, black 0%, transparent 80%)',
          }} />
          <img src="logo.png" alt="" style={{
            position: 'absolute', top: '32%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 118,
          }} />
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '18px 18px 10px', flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <button onClick={() => goto('home')} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'inline-flex', alignItems: 'center', gap: 4,
            color: 'var(--sadu-brown)', fontSize: 11, fontWeight: 600,
            fontFamily: 'IBM Plex Sans Arabic, sans-serif',
          }}><Icon.arrowRight size={13} /> رجوع</button>
          {hasUserMessage && (
            <button onClick={startNewChat} style={{
              background: 'rgba(27,52,36,0.06)', border: 'none', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 4,
              color: 'var(--green)', fontSize: 11, fontWeight: 600,
              fontFamily: 'IBM Plex Sans Arabic, sans-serif',
              borderRadius: 999, padding: '6px 11px',
            }}><Icon.plus size={12} /> محادثة جديدة</button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 11, flexShrink: 0,
            background: 'var(--green)', color: 'var(--cream)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon.sparkle size={16} /></div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--green)', fontFamily: 'Rubik, sans-serif' }}>المساعد الذكي</div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-soft)' }}>يعرف تفاصيل صرفك وأهدافك وجمعيتك</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '4px 16px', position: 'relative', zIndex: 1 }}>
        {messages.map((m, i) => m.role === 'user'
          ? <UserTurn key={i} content={m.content} />
          : <AssistantTurn key={i} content={m.content} />
        )}

        {loading && (
          streamText !== null
            ? <AssistantTurn content={streamText} streaming />
            : (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                  background: 'var(--green)', color: 'var(--cream)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><Icon.sparkle size={11} /></div>
                <TypingDots />
              </div>
            )
        )}
      </div>

      {/* Quick-question chips — live just above the composer rather than
          under the header, so they never compete with the centered splash
          logo for space. Only shown before the first user message. */}
      {!hasUserMessage && !loading && (
        <div style={{
          flexShrink: 0, padding: '0 16px 6px', position: 'relative', zIndex: 1,
          display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end',
        }}>
          {QUICK_QUESTIONS.map(q => (
            <button key={q} onClick={() => send(q)} style={{
              background: 'rgba(27,52,36,0.06)', color: 'var(--green)', border: 'none',
              borderRadius: 999, padding: '9px 13px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'IBM Plex Sans Arabic, sans-serif',
            }}>{q}</button>
          ))}
        </div>
      )}

      {/* Composer — grows with content, mirrors Claude's input treatment.
          Bottom padding clears BottomNav (~82px tall, position:absolute,
          zIndex:100) so the send button isn't hidden underneath it. A row
          of sadu diamonds rides the pill's top edge like a woven trim, and
          the send button uses a diagonal arrow to match it. */}
      <div style={{
        flexShrink: 0, padding: '10px 14px calc(env(safe-area-inset-bottom, 0px) + 74px)',
        background: 'var(--vanilla)', position: 'relative', zIndex: 101,
      }}>
        <div style={{ position: 'relative' }}>
          <SaduStrip variant="diamonds" style={{
            position: 'absolute', top: -7, left: 18, right: 18, gap: 0,
            padding: 0, justifyContent: 'space-between', pointerEvents: 'none',
          }} />
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 8,
            background: '#fff', borderRadius: 20, padding: '8px 8px 8px 14px',
            border: '1.5px solid rgba(27,52,36,0.14)',
          }}>
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={e => { setInput(e.target.value); autoResize(); }}
              onKeyDown={onKeyDown}
              placeholder="اكتب سؤالك..."
              style={{
                flex: 1, resize: 'none', border: 'none', outline: 'none', background: 'transparent',
                fontSize: 16, fontFamily: 'IBM Plex Sans Arabic, sans-serif', direction: 'rtl',
                color: 'var(--ink)', lineHeight: 1.5, maxHeight: 120, padding: '6px 0',
              }}
            />
            <button onClick={() => send()} disabled={!canSend} style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0, border: 'none',
              background: canSend ? 'var(--green)' : 'rgba(27,52,36,0.12)',
              color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: canSend ? 'pointer' : 'default', transition: 'background 0.15s ease',
            }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M8 7h9v9" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style>{`.chat-caret { display:inline-block; width:2px; height:14px; background:var(--sadu-brown); margin-inline-start:2px; vertical-align:-2px; animation: chatCaret 0.8s step-end infinite; }
      @keyframes chatCaret { 50% { opacity: 0; } }`}</style>
    </div>
  );
}

Object.assign(window, { AIChatScreen });
