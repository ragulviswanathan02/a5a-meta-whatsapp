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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo.jpg" 
              alt="A5A Logo" 
              className="brand-logo-img"
              onError={(e) => {
                // fallback if image fails to load
                (e.target as HTMLElement).style.display = 'none';
              }} 
            />
            <div>
              <div className="brand-title">
                A5A <span style={{ color: 'var(--wa-green)' }}>Meta</span>
                <span className="brand-badge">Enterprise Cloud API</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '0.02em' }}>
                WhatsApp Campaign Engine & Lead Command Center
              </p>
            </div>
          </div>

          <div className="nav-links">
            <Link 
              href="/" 
              className={`nav-pill ${pathname === '/' ? 'active' : ''}`}
            >
              <Users size={17} />
              <span>Leads Command Center</span>
            </Link>

            <Link 
              href="/developera5a" 
              className={`nav-pill ${pathname === '/developera5a' ? 'active' : ''}`}
            >
              <Send size={17} />
              <span>Campaign & Meta HQ</span>
            </Link>

            <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)', margin: '0 4px' }} />

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
