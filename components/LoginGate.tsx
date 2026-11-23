'use client';

import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, KeyRound, AlertCircle, Sparkles, Eye, EyeOff } from 'lucide-react';
import { authenticatePortal } from '@/lib/auth';

interface LoginGateProps {
  portal: 'leads' | 'developer';
  onSuccess: () => void;
}

export default function LoginGate({ portal, onSuccess }: LoginGateProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const isLeads = portal === 'leads';
  const portalTitle = isLeads ? 'Leads Command Center' : 'Meta Campaign & Dev HQ';
  const defaultPassHint = isLeads ? 'a5aleads123' : 'a5adeveloper123';

  // Prefetch latest cloud password on gate mount
  React.useEffect(() => {
    import('@/lib/auth').then(({ fetchCloudPassword }) => {
      fetchCloudPassword(portal);
    });
  }, [portal]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const isValid = await authenticatePortal(portal, password);
      if (isValid) {
        onSuccess();
      } else {
        setErrorMsg('Invalid password. Please check your credentials or use the initial passkey.');
        setLoading(false);
      }
    } catch {
      setErrorMsg('Authentication error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '36px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: '#ffffff',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            marginBottom: '12px'
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo.jpg" 
              alt="A5 Automation Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <span className="badge badge-green">
            <ShieldCheck size={13} /> Secure Access
          </span>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>
          {portalTitle}
        </h1>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '28px' }}>
          {isLeads 
            ? 'Access real-time qualified WhatsApp campaign leads, customer responses, and deal pipelines.'
            : 'Configure Meta Cloud API credentials, launch broadcast campaigns, and build approved templates.'}
        </p>

        {errorMsg && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#e11d48',
            fontSize: '0.82rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'left'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">
              <span>Portal Passkey</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Protected</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter access password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '44px' }}
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Enter Portal</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
