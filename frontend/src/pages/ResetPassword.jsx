import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const COLORS = {
  primary: '#0F6E7D',
  bg: '#F7F8FA',
  surface: '#FFFFFF',
  text: '#1A1F24',
  muted: '#6B7280',
  warning: '#D97706',
};

export default function ResetPassword() {
  const { updatePassword, signOut } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await updatePassword(password);
      if (updateError) {
        setError('Could not update password. The reset link may have expired — request a new one.');
        return;
      }
      setDone(true);
      await signOut();
      setTimeout(() => navigate('/login'), 2000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: COLORS.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif", padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 380, background: COLORS.surface, borderRadius: 12,
        padding: '36px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(15,110,125,0.08)',
        border: '1px solid #E3EEEF',
      }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, background: COLORS.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', color: '#fff', fontSize: 20, fontWeight: 700,
          }}>
            K
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: COLORS.text }}>
            Set a new password
          </h1>
        </div>

        {done ? (
          <div style={{
            padding: '10px 12px', borderRadius: 8, background: '#EAF6F0',
            border: '1px solid #BFE3CE', color: '#2E8B57', fontSize: 12.5,
          }}>
            Password updated. Redirecting to sign in…
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              style={inputStyle}
            />

            <label style={{ display: 'block', fontSize: 12, color: COLORS.muted, margin: '14px 0 4px' }}>
              Confirm new password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              style={inputStyle}
            />

            {error && (
              <div style={{
                marginTop: 14, padding: '10px 12px', borderRadius: 8,
                background: '#FEF3E7', border: '1px solid #F5D9AE',
                color: COLORS.warning, fontSize: 12.5,
              }}>
                {error}
              </div>
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
              {submitting ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #E3EEEF',
  borderRadius: 8,
  fontSize: 14,
  color: '#1A1F24',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};