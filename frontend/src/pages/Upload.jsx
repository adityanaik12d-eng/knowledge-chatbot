import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

const COLORS = {
  primary: '#0F6E7D',
  bg: '#F7F8FA',
  surface: '#FFFFFF',
  text: '#1A1F24',
  muted: '#6B7280',
  warning: '#D97706',
  success: '#2E8B57',
};

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Upload() {
  const [mode, setMode] = useState('text'); // 'text' | 'pdf'
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isError = status.startsWith('Error');
  const isDone = status.startsWith('Done');

  const handleUpload = async (e) => {
    e.preventDefault();
    setStatus('Uploading...');
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const body = { title };
      if (mode === 'pdf') {
        if (!pdfFile) { setStatus('Error: Please select a PDF file'); return; }
        body.pdfBase64 = await fileToBase64(pdfFile);
      } else {
        body.content = content;
      }

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
      if (!res.ok) { setStatus(`Error: ${data.error}`); return; }
      setStatus(`Done! Stored ${data.chunksStored} chunks.`);
      setTitle(''); setContent(''); setPdfFile(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.bg,
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      padding: 20,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 24px', background: COLORS.surface, borderBottom: '1px solid #E3EEEF',
        marginBottom: 40,
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0F2A2E' }}>
          Knowledge Assistant
        </div>
        <Link
          to="/"
          style={{ fontSize: 12.5, color: COLORS.primary, fontWeight: 600, textDecoration: 'none' }}
        >
          ← Back to Home
        </Link>
      </div>

      <div style={{
        width: '100%',
        maxWidth: 500,
        margin: '0 auto',
        background: COLORS.surface,
        borderRadius: 12,
        padding: '32px 32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(15,110,125,0.08)',
        border: '1px solid #E3EEEF',
      }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: COLORS.text }}>
          Upload Document
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: COLORS.muted }}>
          Paste text or upload a PDF to add it to the knowledge base.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => setMode('text')}
            style={tabStyle(mode === 'text')}
          >
            Paste Text
          </button>
          <button
            type="button"
            onClick={() => setMode('pdf')}
            style={tabStyle(mode === 'pdf')}
          >
            Upload PDF
          </button>
        </div>

        <form onSubmit={handleUpload}>
          <label style={{ display: 'block', fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>
            Title
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. IT Onboarding Guide"
            style={inputStyle}
          />

          {mode === 'text' ? (
            <>
              <label style={{ display: 'block', fontSize: 12, color: COLORS.muted, margin: '14px 0 4px' }}>
                Document text
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Paste document text"
                rows={10}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </>
          ) : (
            <>
              <label style={{ display: 'block', fontSize: 12, color: COLORS.muted, margin: '14px 0 4px' }}>
                PDF file
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={e => setPdfFile(e.target.files?.[0] ?? null)}
                style={{ ...inputStyle, padding: '8px 12px' }}
              />
              {pdfFile && (
                <p style={{ marginTop: 6, fontSize: 12, color: COLORS.muted }}>
                  Selected: {pdfFile.name}
                </p>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', marginTop: 20, padding: '11px 0', border: 'none',
              borderRadius: 8, background: submitting ? '#7FA9AF' : COLORS.primary,
              color: '#fff', fontWeight: 600, fontSize: 14,
              cursor: submitting ? 'default' : 'pointer',
            }}
          >
            {submitting ? 'Uploading…' : 'Upload'}
          </button>
        </form>

        {status && (
          <div style={{
            marginTop: 16, padding: '10px 12px', borderRadius: 8,
            background: isError ? '#FEF3E7' : isDone ? '#EAF6F0' : '#F0F4F5',
            border: `1px solid ${isError ? '#F5D9AE' : isDone ? '#BFE3CE' : '#E3EEEF'}`,
            color: isError ? COLORS.warning : isDone ? COLORS.success : COLORS.muted,
            fontSize: 12.5,
          }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}

function tabStyle(active) {
  return {
    flex: 1,
    padding: '8px 0',
    border: `1px solid ${active ? '#0F6E7D' : '#E3EEEF'}`,
    borderRadius: 8,
    background: active ? '#EAF3F4' : '#FFFFFF',
    color: active ? '#0F6E7D' : '#6B7280',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  };
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #E3EEEF',
  borderRadius: 8,
  fontSize: 14,
  color: '#1A1F24',
  outline: 'none',
  boxSizing: 'border-box',
};