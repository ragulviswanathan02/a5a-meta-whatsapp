'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  Send, 
  Lock, 
  LogOut, 
  KeyRound, 
  Sparkles, 
  ExternalLink,
  ShieldCheck 
} from 'lucide-react';
import { logoutPortal } from '@/lib/auth';

interface NavbarProps {
  portal: 'leads' | 'developer';
  onOpenChangePassword: () => void;
  onLogout: () => void;
}

export default function Navbar({ portal, onOpenChangePassword, onLogout }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="app-header">
      <div className="container">
        <div className="nav-row">
          <div className="brand-wrapper">
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#ffffff',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              flexShrink: 0
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/logo.jpg" 
                alt="A5A Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }} 
              />
            </div>
            <div>
              <div className="brand-title">
                A5A <span style={{ color: 'var(--wa-green)' }}>Meta</span>
                <span className="brand-badge">WhatsApp Cloud API</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', letterSpacing: '0.01em' }}>
                {portal === 'leads' ? 'Inbound Lead Management Portal' : 'Campaign Engine & Meta Developer HQ'}
              </p>
            </div>
          </div>

          <div className="nav-links">
            {portal === 'developer' && (
              <Link 
                href="/" 
                className="nav-pill"
                title="Switch to Leads Portal"
              >
                <Users size={17} />
                <span>View Leads Portal</span>
              </Link>
            )}

            <button 
              onClick={onOpenChangePassword}
              className="btn btn-secondary btn-sm"
              title="Change Portal Password"
            >
              <KeyRound size={15} />
              <span>Change Pass</span>
            </button>

            <button 
              onClick={onLogout}
              className="btn btn-danger btn-sm"
              title="Log Out"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
