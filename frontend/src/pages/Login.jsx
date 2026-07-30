import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const COLORS = {
  primary: '#0F6E7D',
  bg: '#F7F8FA',
  surface: '#FFFFFF',
  text: '#1A1F24',
  muted: '#6B7280',
  warning: '#D97706',
};

export default function Login() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Already logged in? Skip the login screen entirely.
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!email.trim() || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        const { error: signInError } = await signIn(email.trim(), password);
        if (signInError) {
          setError(signInError.message);
          return;
        }
        navigate('/');
      } else {
        const { error: signUpError } = await signUp(email.trim(), password);
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        setInfo('Account created. Check your email to confirm, then sign in.');
        setMode('signin');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: COLORS.surface,
        borderRadius: 12,
        padding: '36px 32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(15,110,125,0.08)',
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
            Knowledge Assistant
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: COLORS.muted }}>
            {mode === 'signin' ? 'Sign in with your company email' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@venusremedies.com"
            autoComplete="email"
            style={inputStyle}
          />

          <label style={{ display: 'block', fontSize: 12, color: COLORS.muted, margin: '14px 0 4px' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
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

          {info && (
            <div style={{
              marginTop: 14, padding: '10px 12px', borderRadius: 8,
              background: '#EAF6F0', border: '1px solid #BFE3CE',
              color: '#2E8B57', fontSize: 12.5,
            }}>
              {info}
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
            {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: 'center', fontSize: 12.5, color: COLORS.muted }}>
          {mode === 'signin' ? (
            <>
              New here?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); setInfo(''); }}
                style={linkButtonStyle}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(''); setInfo(''); }}
                style={linkButtonStyle}
              >
                Sign in
              </button>
            </>
          )}
        </div>
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

const linkButtonStyle = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: '#0F6E7D',
  fontWeight: 600,
  fontSize: 12.5,
  cursor: 'pointer',
  textDecoration: 'underline',
};
