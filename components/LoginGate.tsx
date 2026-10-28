'use client';

import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
import { authenticatePortal } from '@/lib/auth';

interface LoginGateProps {
  portal: 'leads' | 'developer';
  onSuccess: () => void;
}

export default function LoginGate({ portal, onSuccess }: LoginGateProps) {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const isLeads = portal === 'leads';
  const portalTitle = isLeads ? 'Leads Command Center' : 'Meta Campaign & Dev HQ';
  const defaultPassHint = isLeads ? 'a5aleads123' : 'a5adeveloper123';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    setTimeout(() => {
      const isValid = authenticatePortal(portal, password);
      if (isValid) {
        onSuccess();
      } else {
        setErrorMsg('Invalid password. Please check your credentials or use the initial passkey.');
        setLoading(false);
      }
    }, 400);
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
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '36px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ display: 'inline-flex', padding: '14px', borderRadius: '18px', background: 'rgba(37, 211, 102, 0.12)', border: '1px solid rgba(37, 211, 102, 0.25)', marginBottom: '20px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/logo.jpg" 
            alt="A5A Logo" 
            style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        <div style={{ display: 'inline-block', marginBottom: '8px' }}>
          <span className="badge badge-green">
            <ShieldCheck size={13} /> Secure Access
          </span>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
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
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#fb7185',
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
                type="password"
                className="form-input"
                placeholder="Enter access password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
              />
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

        <div style={{
          marginTop: '28px',
          padding: '12px 14px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.76rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>Default Passkey:</span>
          <code style={{
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '2px 8px',
            borderRadius: '4px',
            color: 'var(--wa-green)',
            fontFamily: 'monospace'
          }}>
            {defaultPassHint}
          </code>
        </div>
      </div>
    </div>
  );
}
