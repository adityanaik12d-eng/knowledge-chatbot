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
  success: '#2E8B57',
  border: '#E3EEEF',
};

const MAX_QUESTION_LEN = 1000;
const MAX_HISTORY_TURNS = 6;
const MAX_FILE_SIZE_MB = 8;

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
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' && window.innerWidth > 768);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setSidebarOpen(window.innerWidth > 768);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setConversations([]);
        return;
      }
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setConversations(data);
      // Auto-select the most recent conversation if none is active
      if (activeConversationId === null && data.length > 0) {
        setActiveConversationId(data[0].id);
        loadConversationMessages(data[0].id);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadConversationMessages = async (conversationId) => {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      // Transform database rows to match component's expected shape
      const transformedMessages = data.map(msg => ({
        role: msg.role,
        text: msg.content,
        sources: msg.sources || []
      }));
      setMessages(transformedMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInput('');
    setError('');
    // Reset upload states when starting new conversation
    setUploading(false);
    setUploadError('');
    setUploadSuccess(null);
  };

  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    loadConversationMessages(id);
    // Reset upload states when switching conversations
    setUploading(false);
    setUploadError('');
    setUploadSuccess(null);
  };

  const handleFileUpload = async (file) => {
    // Validate file
    if (!file) {
      setUploadError('No file selected');
      return;
    }

    if (file.size === 0) {
      setUploadError('File is empty');
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      setUploadError(`File too large (max ${MAX_FILE_SIZE_MB}MB)`);
      return;
    }

    // Reset previous upload states
    setUploading(true);
    setUploadError('');
    setUploadSuccess(null);

    // Add uploading message to chat
    const uploadMessageId = `upload-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: uploadMessageId,
        role: 'system',
        text: `         📄 Uploading ${file.name}...`,
        type: 'uploading',
        fileName: file.name
      }
    ]);

    try {
      // FIXED: Get access token from session (same as handleSend)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const body = { title: file.name };

      // Determine file type and process accordingly
      const allowedTextExtensions = ['.txt', '.md', '.markdown', '.json', '.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.py', '.java', '.c', '.cpp', '.cs', '.go', '.rb', '.php', '.sql', '.yaml', '.yml', '.sh', '.xml', '.csv'];
      const isTextFile = allowedTextExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      const isPdfFile = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      if (isTextFile) {
        // Read as text
        const content = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.trim());
          reader.onerror = reject;
          reader.readAsText(file);
        });
        body.content = content;
      } else if (isPdfFile) {
        // Read as base64
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result;
            // Remove the data:url prefix to get raw base64
            const base64Data = dataUrl.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        body.pdfBase64 = base64;
      } else {
        throw new Error('Unsupported file type');
      }

      // Upload to knowledge base
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Update upload success message
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== uploadMessageId),
        {
          id: uploadMessageId,
          role: 'system',
          text: `      ✅ Added ${file.name} to the knowledge base (${data.chunksStored} chunks).`,
          type: 'success',
          fileName: file.name,
          chunksStored: data.chunksStored
        }
      ]);

      setUploadSuccess(data);
    } catch (err) {
      console.error('Upload error:', err);
      // Update upload error message
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== uploadMessageId),
        {
          id: uploadMessageId,
          role: 'system',
          text: `      ⚠      ️ Couldn't add ${file.name}: ${err.message}`,
          type: 'error',
          fileName: file.name
        }
      ]);
      setUploadError(err.message);
    } finally {
      setUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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

    // Optimistically add user message to UI
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setSending(true);

    // If this is a new conversation (not yet persisted), create it first
    let conversationId = activeConversationId;
    if (!conversationId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user');
        const title = question.length > 40 ? question.slice(0, 40) + '...' : question;
        const { data, error } = await supabase
          .from('conversations')
          .insert([
            { user_id: user.id, title },
          ])
          .select();
        if (error) throw error;
        conversationId = data[0].id;
        setActiveConversationId(conversationId);
        // Add new conversation to the list at the top
        setConversations((prev) => [
          { id: conversationId, user_id: user.id, title, created_at: new Date(), updated_at: new Date() },
          ...prev.filter((c) => c.id !== conversationId),
        ]);
      } catch (err) {
        console.error('Error creating conversation:', err);
        setMessages((prev) => {
          const next = [...prev];
          next.pop(); // Remove the optimistic user message
          return next;
        });
        setError('Failed to start conversation. Please try again.');
        setSending(false);
        return;
      }
    }

    // Save user message to DB
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('messages').insert([
        {
          conversation_id: conversationId,
          user_id: user.id,
          role: 'user',
          content: question,
        }
      ]);
      // Update conversation's updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date() })
        .eq('id', conversationId);
    } catch (err) {
      console.error('Error saving user message:', err);
      // We'll still proceed with the chat, but note that persistence might fail
    }

    const assistantIndex = messages.length + 1; // +1 for the user message we just added
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
      let sources = [];

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
            sources = evt.sources;
            setMessages((prev) => {
              const next = [...prev];
              next[assistantIndex] = { ...next[assistantIndex], sources };
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

      // Save assistant message to DB after streaming completes
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('messages').insert([
          {
            conversation_id: conversationId,
            user_id: user.id,
            role: 'assistant',
            content: accumulatedText,
            sources: sources,
          }
        ]);
        // Update conversation's updated_at
        await supabase
          .from('conversations')
          .update({ updated_at: new Date() })
          .eq('id', conversationId);
        // Refresh conversations list to update ordering
        loadConversations();
      } catch (err) {
        console.error('Error saving assistant message:', err);
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
      height: '100vh',
      overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? 260 : 60,
        background: COLORS.surface,
        borderRight: `1px solid ${COLORS.border}`,
        overflowY: 'auto',
        transition: 'width 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Hamburger button for mobile */}
        {!sidebarOpen && (
          <div style={{
            padding: '12px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: COLORS.primary,
                fontSize: 20,
                cursor: 'pointer',
                padding: 0,
              }}
            >
                                                                                                                                                                              ☰
            </button>
          </div>
        )}
        {!sidebarOpen && (
          <div style={{ height: 60, borderBottom: `1px solid ${COLORS.border}` }}></div>
        )}
        {sidebarOpen && (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 24px',
              background: COLORS.surface,
              borderBottom: `1px solid ${COLORS.border}`,
            }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0F2A2E' }}>
                Knowledge Assistant
              </div>
              <button
                onClick={handleNewConversation}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: `1px solid ${COLORS.border}`,
                  background: '#FFFFFF',
                  color: COLORS.primary,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + New Chat
              </button>
            </div>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 0',
            }}>
              {loadingConversations ? (
                <div style={{ textAlign: 'center', color: COLORS.muted, fontSize: 13, padding: '20px' }}>
                  Loading conversations...
                </div>
              ) : conversations.length === 0 ? (
                <div style={{ textAlign: 'center', color: COLORS.muted, fontSize: 13, padding: '20px' }}>
                  No conversations yet. Start a new chat!
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 16px',
                      margin: '0 8px',
                      borderRadius: 8,
                      background: activeConversationId === conv.id ? '#EAF3F4' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onClick={() => handleSelectConversation(conv.id)}
                    onMouseEnter={(e) => {
                      if (activeConversationId !== conv.id) {
                        e.currentTarget.style.background = '#F0F4F5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeConversationId !== conv.id) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{
                      flex: 1,
                      fontSize: 13,
                      color: activeConversationId === conv.id ? COLORS.primary : COLORS.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {conv.title || 'New conversation'}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: COLORS.muted,
                      marginLeft: 8,
                    }}>
                      {/* Format date */}
                      {new Date(conv.updated_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Main chat area */}
      <div style={{
        flex: 1,
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
          {sidebarOpen && (
            <Link to="/" style={{ fontSize: 12.5, color: COLORS.primary, fontWeight: 600, textDecoration: 'none' }}>
              ← Back to Home
            </Link>
          )}
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
          overflowY: 'auto',
        }}>
          {messages.length === 0 && activeConversationId === null && (
            <div style={{ textAlign: 'center', color: COLORS.muted, fontSize: 13.5, marginTop: 60 }}>
              Ask me anything — I can help with code, IT questions, troubleshooting, or reference your team's uploaded docs when relevant.
            </div>
          )}

          {messages.map((m, i) => {
            // Handle different message types for styling
            if (m.role === 'system') {
              // System messages (file uploads)
              let bgColor = '#F0F4F5'; // default light gray
              let textColor = COLORS.muted;

              if (m.type === 'success') {
                bgColor = '#EAF6F0'; // light teal/green
                textColor = COLORS.success;
              } else if (m.type === 'error') {
                bgColor = '#FEF3E7'; // light orange/red
                textColor = COLORS.warning;
              } else if (m.type === 'uploading') {
                bgColor = '#EAF3F4'; // light blue/teal
                textColor = COLORS.primary;
              }

              return (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '8px 12px',
                  margin: '4px 0',
                  maxWidth: '80%',
                  background: bgColor,
                  borderRadius: 12,
                  fontSize: 13,
                  color: textColor,
                }}>
                  {m.text}
                </div>
              );
            }

            // Regular user/assistant/error messages
            return (
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
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: COLORS.surface, borderTop: `1px solid ${COLORS.border}`, padding: '16px 20px',
        }}>
          <form onSubmit={handleSend} style={{
            maxWidth: 760, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              {/* File attachment button */}
              <label
                htmlFor="file-input"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  background: uploading ? '#7FA9AF' : '#FFFFFF',
                  color: uploading ? '#6B7280' : COLORS.primary,
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: uploading ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: !uploading ? '#EAF3F4' : 'inherit',
                    borderColor: !uploading ? COLORS.primary : 'inherit'
                  }
                }}
              >
                +
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                  accept=".txt,.md,.markdown,.json,.js,.jsx,.ts,.tsx,.css,.html,.py,.java,.c,.cpp,.cs,.go,.rb,.php,.sql,.yaml,.yml,.sh,.xml,.csv,application/pdf"
                />
              </label>

              {/* Text input */}
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
            </div>
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
    </div>
  );
}