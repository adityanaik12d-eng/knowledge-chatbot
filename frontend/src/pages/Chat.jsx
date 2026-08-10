import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../lib/supabase.js';

const COLORS = {
  primary: '#0F6E7D',
  bg: '#F7F8FA',
  surface: '#FFFFFF',
  text: '#1A1F24',
  muted: '#6B7280',
  warning: '#D97706',
  border: '#E3EEEF',
};

const MAX_QUESTION_LEN = 1000;
const MAX_HISTORY_TURNS = 6;

function Markdown({ children }) {
  return (
    <div style={{ fontSize: 14, lineHeight: 1.6, color: COLORS.text }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p style={{ margin: '0 0 8px' }}>{children}</p>,
          ul: ({ children }) => <ul style={{ margin: '0 0 8px', paddingLeft: 20 }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ margin: '0 0 8px', paddingLeft: 20 }}>{children}</ol>,
          li: ({ children }) => <li style={{ marginBottom: 3 }}>{children}</li>,
          strong: ({ children }) => <strong style={{ color: COLORS.text }}>{children}</strong>,
          code: ({ inline, children }) =>
            inline ? (
              <code style={{
                background: '#F0F4F5', padding: '2px 5px', borderRadius: 4,
                fontSize: 12.5, fontFamily: 'Consolas, Monaco, monospace', color: '#0F6E7D',
              }}>
                {children}
              </code>
            ) : (
              <pre style={{
                background: '#0F2A2E', color: '#E8F4F5', padding: '12px 14px', borderRadius: 8,
                overflowX: 'auto', fontSize: 12.5, fontFamily: 'Consolas, Monaco, monospace',
                margin: '8px 0', lineHeight: 1.5,
              }}>
                <code>{children}</code>
              </pre>
            ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || sending) return;
    if (question.length > MAX_QUESTION_LEN) {
      setError(`Question is too long (max ${MAX_QUESTION_LEN} characters).`);
      return;
    }

    setError('');
    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-MAX_HISTORY_TURNS)
      .map((m) => ({ role: m.role, content: m.text }));

    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setSending(true);

    const assistantIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: 'assistant', text: '', sources: [] }]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ question, history }),
        }
      );

      if (!res.ok || !res.body) {
        let errMsg = 'Something went wrong.';
        try { const data = await res.json(); errMsg = data.error || errMsg; } catch {}
        setMessages((prev) => {
          const next = [...prev];
          next[assistantIndex] = { role: 'error', text: errMsg };
          return next;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          let evt;
          try { evt = JSON.parse(line); } catch { continue; }

          if (evt.type === 'sources') {
            setMessages((prev) => {
              const next = [...prev];
              next[assistantIndex] = { ...next[assistantIndex], sources: evt.sources };
              return next;
            });
          } else if (evt.type === 'token') {
            accumulatedText += evt.text;
            setMessages((prev) => {
              const next = [...prev];
              next[assistantIndex] = { ...next[assistantIndex], text: accumulatedText };
              return next;
            });
          } else if (evt.type === 'error') {
            setMessages((prev) => {
              const next = [...prev];
              next[assistantIndex] = { role: 'error', text: evt.error };
              return next;
            });
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev];
        next[assistantIndex] = { role: 'error', text: 'Network error. Please try again.' };
        return next;
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.bg,
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 24px', background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0F2A2E' }}>
          Knowledge Assistant
        </div>
        <Link to="/" style={{ fontSize: 12.5, color: COLORS.primary, fontWeight: 600, textDecoration: 'none' }}>
          ← Back to Home
        </Link>
      </div>

      <div style={{
        flex: 1,
        maxWidth: 760,
        width: '100%',
        margin: '0 auto',
        padding: '24px 20px 140px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: COLORS.muted, fontSize: 13.5, marginTop: 60 }}>
            Ask a question about anything in the IT/CSE knowledge base — answers are always sourced.
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'user' && (
              <div style={{
                maxWidth: '75%', background: COLORS.primary, color: '#fff',
                padding: '10px 14px', borderRadius: '14px 14px 2px 14px', fontSize: 14, lineHeight: 1.5,
              }}>
                {m.text}
              </div>
            )}
            {m.role === 'assistant' && (
              <div style={{
                maxWidth: '85%', background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                padding: '12px 14px', borderRadius: '14px 14px 14px 2px',
              }}>
                {m.text ? <Markdown>{m.text}</Markdown> : (
                  <span style={{ fontSize: 13, color: COLORS.muted }}>Thinking…</span>
                )}
                {m.sources && m.sources.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6, fontWeight: 600 }}>
                      SOURCES
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {m.sources.map((s, si) => (
                        <span key={si} style={{
                          fontSize: 11, padding: '3px 8px', borderRadius: 12,
                          background: '#EAF3F4', color: COLORS.primary, fontWeight: 600,
                        }}>
                          {s.title} · {s.similarity}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {m.role === 'error' && (
              <div style={{
                maxWidth: '85%', background: '#FEF3E7', border: '1px solid #F5D9AE',
                padding: '10px 14px', borderRadius: 10, fontSize: 13, color: COLORS.warning,
              }}>
                {m.text}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: COLORS.surface, borderTop: `1px solid ${COLORS.border}`, padding: '16px 20px',
      }}>
        <form onSubmit={handleSend} style={{
          maxWidth: 760, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end',
        }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Ask a question…"
            rows={1}
            maxLength={MAX_QUESTION_LEN}
            style={{
              flex: 1, padding: '10px 14px', border: `1px solid ${COLORS.border}`,
              borderRadius: 10, fontSize: 14, fontFamily: 'inherit', resize: 'none',
              outline: 'none', maxHeight: 120,
            }}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            style={{
              padding: '10px 20px', border: 'none', borderRadius: 10,
              background: (sending || !input.trim()) ? '#7FA9AF' : COLORS.primary,
              color: '#fff', fontWeight: 600, fontSize: 14,
              cursor: (sending || !input.trim()) ? 'default' : 'pointer',
            }}
          >
            Send
          </button>
        </form>
        {error && (
          <div style={{ maxWidth: 760, margin: '8px auto 0', fontSize: 12, color: COLORS.warning }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}