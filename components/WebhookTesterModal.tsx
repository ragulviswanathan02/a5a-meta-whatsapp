'use client';

import React, { useState } from 'react';
import { Sparkles, X, Check, ArrowRight, Play, Terminal, HelpCircle } from 'lucide-react';
import { Lead } from '@/lib/types';

interface WebhookTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateLead: (lead: Partial<Lead>) => void;
}

export default function WebhookTesterModal({
  isOpen,
  onClose,
  onSimulateLead,
}: WebhookTesterModalProps) {
  const [customerName, setCustomerName] = useState('Rahul Nair');
  const [customerPhone, setCustomerPhone] = useState('+919876543210');
  const [buttonClicked, setButtonClicked] = useState('🔥 I am Interested');
  const [campaignName, setCampaignName] = useState('Diwali Festive Blast - High Networth');
  const [customText, setCustomText] = useState('Hi, I saw your WhatsApp offer and want to book a call today.');
  const [mode, setMode] = useState<'button' | 'text'>('button');
  const [simulating, setSimulating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);

    setTimeout(() => {
      onSimulateLead({
        name: customerName,
        phone: customerPhone,
        campaignName: campaignName,
        buttonClicked: mode === 'button' ? buttonClicked : undefined,
        replyMessage: mode === 'text' ? customText : undefined,
      });

      setSimulating(false);
      setSuccessMsg('Webhook event received! A new hot lead was created in your dashboard.');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1400);
    }, 500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(37, 211, 102, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--wa-green)' }}>
              <Terminal size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>
                Meta WhatsApp Webhook Simulator
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Test incoming customer button clicks and lead generation in real-time
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSimulate} style={{ padding: '24px' }}>
          {successMsg && (
            <div style={{ padding: '12px 16px', background: 'rgba(37, 211, 102, 0.15)', border: '1px solid rgba(37, 211, 102, 0.3)', borderRadius: 'var(--radius-md)', color: 'var(--wa-green)', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setMode('button')}
              className={`btn btn-sm ${mode === 'button' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
            >
              Simulate Button Click ("Interested")
            </button>
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`btn btn-sm ${mode === 'text' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
            >
              Simulate Direct WhatsApp Reply
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Customer Name</label>
              <input
                type="text"
                className="form-input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp Number</label>
              <input
                type="text"
                className="form-input"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Associated Campaign</label>
            <input
              type="text"
              className="form-input"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              required
            />
          </div>

          {mode === 'button' ? (
            <div className="form-group">
              <label className="form-label">Quick-Reply Button Tapped by User</label>
              <select
                className="form-select"
                value={buttonClicked}
                onChange={(e) => setButtonClicked(e.target.value)}
              >
                <option value="🔥 I am Interested">🔥 I am Interested</option>
                <option value="📞 Request Call Back">📞 Request Call Back</option>
                <option value="🔥 Interested in Masterplan">🔥 Interested in Masterplan</option>
                <option value="💬 Chat on WhatsApp">💬 Chat on WhatsApp</option>
                <option value="Claim 40% Discount">Claim 40% Discount</option>
              </select>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Customer's Text Reply</label>
              <textarea
                rows={2}
                className="form-textarea"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                required
              />
            </div>
          )}

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={simulating} className="btn btn-primary" style={{ flex: 1 }}>
              <Play size={16} />
              <span>{simulating ? 'Firing Webhook...' : 'Fire Simulation Webhook'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
