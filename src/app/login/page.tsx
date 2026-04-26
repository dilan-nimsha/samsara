'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Golden ratio φ ≈ 1.618
// Spacing scale derived from base 16px:
//   16 → 26 → 42 → 68 → 110
// Vertical position: content center at φ⁻¹ = 61.8% from top
// Achieved via paddingBottom: 23.6vh with justify-content: center

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    });
    setLoading(false);
    if (authError) {
      setError('Invalid credentials. Please try again.');
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      identifier,
      { redirectTo: `${window.location.origin}/auth/reset-password` }
    );
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      setResetSent(true);
    }
  }

  function switchMode(next: 'login' | 'forgot') {
    setMode(next);
    setError('');
    setResetSent(false);
    setIdentifier('');
    setPassword('');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0C0C0C',
        padding: '24px 16px',
      }}
    >
      {/* Wordmark */}
      <div style={{ marginBottom: '42px', textAlign: 'center', userSelect: 'none' }}>
        <h1
          style={{
            fontSize: 'clamp(40px, 5.5vw, 56px)',
            fontWeight: 300,
            letterSpacing: '0.14em',
            color: '#E8E3DB',
            lineHeight: 1,
            margin: 0,
          }}
        >
          Sam&#x1E63;āra
        </h1>
      </div>

      {/* Login form */}
      <div
        style={{
          width: 'min(400px, 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Subtitle */}
        <p
          style={{
            width: '100%',
            fontSize: '13px',
            color: 'rgba(232,227,219,0.45)',
            marginBottom: '26px',
            lineHeight: 1.65,
            textAlign: 'center',
          }}
        >
          {mode === 'login'
            ? 'Please enter your credentials to sign-in to Samsara System:'
            : 'Enter your email address to receive a password reset link:'}
        </p>

        <form onSubmit={mode === 'login' ? handleSignIn : handleReset} noValidate style={{ width: '100%' }}>
          {/* Username / Email field */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>
              {mode === 'login' ? 'Username' : 'Email'}
            </label>
            <input
              className="inp"
              type={mode === 'login' ? 'text' : 'email'}
              placeholder="Username or Email"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'username' : 'email'}
              autoFocus
            />
          </div>

          {/* Password field — login only */}
          {mode === 'login' && (
            <div style={{ marginBottom: '26px' }}>
              <label style={labelStyle}>Password</label>
              <input
                className="inp"
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          )}

          {/* Forgot-password spacer */}
          {mode === 'forgot' && (
            <div style={{ marginBottom: '26px' }} />
          )}

          {/* Error */}
          {error && (
            <p style={{ fontSize: '12px', color: '#e07070', marginBottom: '14px' }}>
              {error}
            </p>
          )}

          {/* Success */}
          {resetSent && (
            <p style={{ fontSize: '12px', color: 'rgba(201,168,76,0.8)', marginBottom: '14px' }}>
              Reset link sent — check your inbox.
            </p>
          )}

          {/* Submit */}
          <SubmitButton loading={loading} mode={mode} />
        </form>

        {/* Forgot / Back link */}
        <div style={{ marginTop: '16px', width: '100%', textAlign: 'center' }}>
          <FlatButton
            onClick={() => switchMode(mode === 'login' ? 'forgot' : 'login')}
          >
            {mode === 'login' ? 'Forgot Password?' : '← Back to Sign In'}
          </FlatButton>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'rgba(232,227,219,0.45)',
  marginBottom: '7px',
};

function SubmitButton({ loading, mode }: { loading: boolean; mode: 'login' | 'forgot' }) {
  const label = loading
    ? mode === 'login' ? 'Signing in…' : 'Sending…'
    : mode === 'login' ? 'Sign in' : 'Send Reset Link';

  // Golden ratio: button width = input width (100%) ÷ φ ≈ 61.8%
  // Button height: input padding 7px → button padding 7px ÷ φ ≈ 4px (vertically tighter)
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        display: 'block',
        width: '61.8%',
        margin: '0 auto',
        padding: '6px 10px',
        background: 'rgba(255,255,255,0.055)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: '5px',
        color: 'rgba(232,227,219,0.80)',
        fontSize: '13px',
        fontWeight: 500,
        letterSpacing: '0.04em',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s, border-color 0.15s, opacity 0.15s',
        opacity: loading ? 0.55 : 1,
      }}
      onMouseEnter={e => {
        if (!loading)
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.09)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.055)';
      }}
    >
      {label}
    </button>
  );
}

function FlatButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        color: 'rgba(232,227,219,0.30)',
        fontSize: '12px',
        cursor: 'pointer',
        textDecoration: 'underline',
        textUnderlineOffset: '3px',
        transition: 'color 0.12s',
        padding: 0,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,227,219,0.60)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,227,219,0.30)';
      }}
    >
      {children}
    </button>
  );
}
