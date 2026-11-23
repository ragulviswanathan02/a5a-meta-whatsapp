'use client';

import React, { useState } from 'react';
import { KeyRound, Check, X, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { getStoredPassword, setStoredPassword, fetchCloudPassword } from '@/lib/auth';

interface ChangePasswordModalProps {
  portal: 'leads' | 'developer';
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({
  portal,
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const portalName = portal === 'leads' ? 'Company Leads Portal' : 'Developer & Campaign HQ';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    let actualCurrent = getStoredPassword(portal);
    if (currentPass !== actualCurrent) {
      const cloudCurrent = await fetchCloudPassword(portal);
      if (currentPass !== cloudCurrent) {
        setErrorMsg('Current password is incorrect. Please try again.');
        return;
      }
    }

    if (newPass.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    if (newPass !== confirmPass) {
      setErrorMsg('New password and confirmation do not match.');
      return;
    }

    await setStoredPassword(portal, newPass);
    setSuccessMsg('Password updated across all devices successfully!');
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => {
      onClose();
      setSuccessMsg('');
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(37, 211, 102, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--wa-green)' }}>
              <KeyRound size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>Change Password</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Updating security passkey for {portalName}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {errorMsg && (
            <div style={{ padding: '12px 16px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-md)', color: '#fb7185', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '12px 16px', background: 'rgba(37, 211, 102, 0.15)', border: '1px solid rgba(37, 211, 102, 0.3)', borderRadius: 'var(--radius-md)', color: 'var(--wa-green)', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your current password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              className="form-input"
              placeholder="Minimum 6 characters"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              className="form-input"
              placeholder="Repeat your new password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Save New Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
