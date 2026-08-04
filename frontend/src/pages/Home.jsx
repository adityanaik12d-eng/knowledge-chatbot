import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const { user, signOut } = useAuth();
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F8FA',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 24px', background: '#FFFFFF', borderBottom: '1px solid #E3EEEF',
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0F2A2E' }}>
          Knowledge Assistant
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: '#6B7280' }}>{user?.email}</span>
          <button
            onClick={() => signOut()}
            style={{
              padding: '7px 14px', borderRadius: 7, border: '1px solid #E3EEEF',
              background: '#F7F8FA', color: '#1A1F24', fontSize: 12.5, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Log out
          </button>
        </div>
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px', textAlign: 'center',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: '#0F6E7D',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 18,
        }}>
          ✓
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 18, color: '#0F2A2E' }}>
          You're logged in — Phase 1 complete
        </h2>
        <p style={{ margin: 0, fontSize: 13.5, color: '#6B7280', maxWidth: 380 }}>
          The chat interface arrives in Phase 3. Next up per <code>docs/Phases.md</code>: Phase 2 —
          document ingestion pipeline.
        </p>
        <Link
          to="/upload"
          style={{
            marginTop: 24,
            padding: '10px 20px',
            borderRadius: 8,
            background: '#0F6E7D',
            color: '#fff',
            fontSize: 13.5,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Go to Upload →
        </Link>
      </div>
    </div>
  );
}