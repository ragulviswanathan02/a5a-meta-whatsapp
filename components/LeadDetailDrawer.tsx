'use client';

import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Tag, 
  User, 
  DollarSign, 
  Clock, 
  Send, 
  CheckCircle2, 
  Flame, 
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Lead } from '@/lib/types';
import { getStoredCredentials } from '@/lib/storage';
import { sendWhatsAppDirectMessage } from '@/lib/meta-client';

interface LeadDetailDrawerProps {
  lead: Lead | null;
  onClose: () => void;
  onUpdateLead: (updated: Lead) => void;
}

export const STATUS_LABELS: Record<string, { label: string; badgeClass: string }> = {
  new: { label: 'New Lead', badgeClass: 'badge-blue' },
  contacted: { label: 'Contacted', badgeClass: 'badge-amber' },
  qualified: { label: 'Qualified', badgeClass: 'badge-purple' },
  negotiation: { label: 'In Negotiation', badgeClass: 'badge-amber' },
  converted: { label: 'Won / Converted', badgeClass: 'badge-green' },
  lost: { label: 'Lost / Closed', badgeClass: 'badge-red' },
};

export default function LeadDetailDrawer({
  lead,
  onClose,
  onUpdateLead,
}: LeadDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'info'>('chat');
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  if (!lead) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleStatusChange = (newStatus: Lead['status']) => {
    const updated: Lead = {
      ...lead,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      timeline: [
        ...lead.timeline,
        {
          id: `tl-${Date.now()}`,
          type: 'status_change',
          content: `Status updated to ${STATUS_LABELS[newStatus]?.label || newStatus}`,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    onUpdateLead(updated);
    showToast(`Status updated to ${STATUS_LABELS[newStatus]?.label}`);
  };

  const handlePriorityChange = (newPriority: Lead['priority']) => {
    const updated: Lead = {
      ...lead,
      priority: newPriority,
      updatedAt: new Date().toISOString(),
    };
    onUpdateLead(updated);
    showToast(`Priority marked as ${newPriority.toUpperCase()}`);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const note = {
      id: `n-${Date.now()}`,
      author: 'Sales Agent',
      text: newNoteText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated: Lead = {
      ...lead,
      notes: [note, ...lead.notes],
      updatedAt: new Date().toISOString(),
    };

    onUpdateLead(updated);
    setNewNoteText('');
    showToast('Internal note saved!');
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || sendingReply) return;

    setSendingReply(true);
    const textToSend = replyText.trim();
    setReplyText('');

    try {
      const creds = getStoredCredentials();
      if (creds.phoneNumberId && creds.accessToken) {
        await sendWhatsAppDirectMessage(creds, lead.phone, textToSend);
      }

      const updated: Lead = {
        ...lead,
        updatedAt: new Date().toISOString(),
        timeline: [
          ...lead.timeline,
          {
            id: `tl-${Date.now()}`,
            type: 'message_sent',
            content: textToSend,
            timestamp: new Date().toISOString(),
            author: 'You',
          },
        ],
      };

      onUpdateLead(updated);
      showToast('WhatsApp message sent directly to customer!');
    } catch (err: any) {
      showToast(`Sent locally (Meta API: ${err.message})`);
    } finally {
      setSendingReply(false);
    }
  };

  const cleanPhone = lead.phone.replace(/[^0-9]/g, '');

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lead.name}
                </h2>
                {lead.priority === 'hot' && (
                  <span className="badge badge-red">
                    <Flame size={12} /> Hot Lead
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {lead.phone}
                </span>
                <span className={`badge ${STATUS_LABELS[lead.status]?.badgeClass || 'badge-blue'}`}>
                  {STATUS_LABELS[lead.status]?.label || lead.status}
                </span>
                <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                  Campaign: {lead.campaignName}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={22} />
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary btn-sm"
              style={{ flex: 1 }}
            >
              <MessageSquare size={15} />
              <span>WhatsApp Web</span>
              <ExternalLink size={13} />
            </a>

            <a
              href={`tel:${cleanPhone}`}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
            >
              <Phone size={15} />
              <span>Direct Call</span>
            </a>
          </div>

          {toastMsg && (
            <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(37, 211, 102, 0.15)', border: '1px solid rgba(37, 211, 102, 0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--wa-green)', fontSize: '0.8rem', textAlign: 'center' }}>
              {toastMsg}
            </div>
          )}
        </div>

        {/* Lead Settings Bar */}
        <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Pipeline Stage</label>
            <select
              className="form-select"
              value={lead.status}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              style={{ padding: '7px 10px', fontSize: '0.82rem' }}
            >
              <option value="new">🆕 New Interest</option>
              <option value="contacted">📞 Contacted</option>
              <option value="qualified">⭐ Qualified Deal</option>
              <option value="negotiation">🤝 In Negotiation</option>
              <option value="converted">🏆 Won / Converted</option>
              <option value="lost">❌ Lost / Closed</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Interest Priority</label>
            <select
              className="form-select"
              value={lead.priority}
              onChange={(e) => handlePriorityChange(e.target.value as any)}
              style={{ padding: '7px 10px', fontSize: '0.82rem' }}
            >
              <option value="hot">🔥 Hot (Immediate Action)</option>
              <option value="warm">⚡ Warm (Follow-up Soon)</option>
              <option value="cold">❄️ Cold (Nurture)</option>
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: '#f8fafc' }}>
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              flex: 1,
              padding: '12px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'chat' ? '2px solid var(--wa-green)' : '2px solid transparent',
              color: activeTab === 'chat' ? 'var(--wa-green)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <MessageSquare size={16} />
            <span>Chat & Timeline ({lead.timeline.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            style={{
              flex: 1,
              padding: '12px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'notes' ? '2px solid var(--wa-green)' : '2px solid transparent',
              color: activeTab === 'notes' ? 'var(--wa-green)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Tag size={16} />
            <span>Notes ({lead.notes.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {activeTab === 'chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Campaign Origin Banner */}
              <div style={{ padding: '12px 14px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem' }}>
                <div style={{ color: '#93c5fd', fontWeight: 600, marginBottom: '4px' }}>
                  📢 Campaign Broadcast Origin
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  Recipient received <strong>{lead.campaignName}</strong>
                </div>
                {lead.buttonClicked && (
                  <div style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(37, 211, 102, 0.2)', color: 'var(--wa-green)', padding: '3px 10px', borderRadius: '6px', fontWeight: 700 }}>
                    Button Tapped: {lead.buttonClicked}
                  </div>
                )}
              </div>

              {/* Timeline Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                {lead.timeline.map((evt) => {
                  const isSent = evt.type === 'message_sent';
                  const isReceived = evt.type === 'message_received' || evt.type === 'button_clicked';

                  if (isSent) {
                    return (
                      <div key={evt.id} style={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
                        <div className="wa-reply-bubble">
                          <p>{evt.content}</p>
                          <div style={{ fontSize: '0.68rem', opacity: 0.7, textAlign: 'right', marginTop: '4px' }}>
                            {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Sent by Agent
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (isReceived) {
                    return (
                      <div key={evt.id} style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                        <div className="wa-message-bubble">
                          <div style={{ fontSize: '0.72rem', color: '#53bdeb', fontWeight: 700, marginBottom: '2px' }}>
                            {lead.name}
                          </div>
                          <p>{evt.content}</p>
                          <div style={{ fontSize: '0.68rem', color: '#8696a0', textAlign: 'right', marginTop: '4px' }}>
                            {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={evt.id} style={{ textAlign: 'center', margin: '6px 0' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 12px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                        {evt.content} • {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <form onSubmit={handleAddNote}>
                <div className="form-group">
                  <label className="form-label">Add Internal Note</label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder="Log a client conversation, budget details, or next action steps..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                  Save Note
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                {lead.notes.length === 0 ? (
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>
                    No notes recorded yet. Add your first note above.
                  </p>
                ) : (
                  lead.notes.map((n) => (
                    <div key={n.id} style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--wa-green)' }}>{n.author}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5 }}>{n.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Reply Bar (WhatsApp Cloud API Direct Reply) */}
        {activeTab === 'chat' && (
          <form onSubmit={handleSendReply} style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', background: '#ffffff', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="form-input"
              placeholder={`Send WhatsApp reply to ${lead.name}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={sendingReply}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!replyText.trim() || sendingReply}
              style={{ padding: '0 18px', flexShrink: 0 }}
            >
              {sendingReply ? <Clock size={18} /> : <Send size={18} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
