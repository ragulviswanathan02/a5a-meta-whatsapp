'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import LoginGate from '@/components/LoginGate';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import LeadDetailDrawer, { STATUS_LABELS } from '@/components/LeadDetailDrawer';
import WebhookTesterModal from '@/components/WebhookTesterModal';
import { 
  Users, 
  Flame, 
  PhoneCall, 
  Trophy, 
  Filter, 
  Search, 
  Download, 
  Plus, 
  Sparkles, 
  MessageSquare, 
  Phone, 
  ChevronRight, 
  Clock, 
  LayoutGrid, 
  ListFilter,
  CheckCircle,
  TrendingUp,
  Tag
} from 'lucide-react';
import { Lead } from '@/lib/types';
import { getStoredLeads, saveStoredLeads, getStoredCampaigns } from '@/lib/storage';
import { isPortalAuthenticated, logoutPortal } from '@/lib/auth';
import { dbGetLeads, dbUpsertLead } from '@/lib/supabase';

export default function LeadsDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [isTesterOpen, setIsTesterOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');

  useEffect(() => {
    const authed = isPortalAuthenticated('leads');
    setIsAuthenticated(authed);
    if (authed) {
      setLeads(getStoredLeads());

      // Fetch live records from Supabase cloud database
      dbGetLeads().then((cloudLeads) => {
        if (cloudLeads && cloudLeads.length > 0) {
          setLeads(cloudLeads);
          saveStoredLeads(cloudLeads);
        }
      });
    }
    setLoading(false);
  }, []);

  const campaigns = useMemo(() => {
    return getStoredCampaigns();
  }, [leads]);

  const handleUpdateLead = (updated: Lead) => {
    const updatedList = leads.map((l) => (l.id === updated.id ? updated : l));
    setLeads(updatedList);
    saveStoredLeads(updatedList);
    setSelectedLead(updated);
    dbUpsertLead(updated);
  };

  const handleSimulateNewLead = (partial: Partial<Lead>) => {
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: partial.name || 'WhatsApp Prospect',
      phone: partial.phone || '+919876543210',
      campaignId: 'camp-101',
      campaignName: partial.campaignName || 'Active WhatsApp Campaign',
      buttonClicked: partial.buttonClicked,
      replyMessage: partial.replyMessage,
      status: 'new',
      priority: 'hot',
      dealValue: 50000,
      tags: ['Inbound Lead', 'High Intent'],
      notes: [
        {
          id: `n-${Date.now()}`,
          author: 'Meta Webhook Engine',
          text: `Inbound lead captured via ${partial.buttonClicked ? `button tap "${partial.buttonClicked}"` : `text reply: "${partial.replyMessage}"`}`,
          createdAt: new Date().toISOString(),
        },
      ],
      timeline: [
        {
          id: `tl-1-${Date.now()}`,
          type: 'campaign_received',
          content: `Delivered Campaign: ${partial.campaignName || 'Active Campaign'}`,
          timestamp: new Date(Date.now() - 60000).toISOString(),
        },
        {
          id: `tl-2-${Date.now()}`,
          type: partial.buttonClicked ? 'button_clicked' : 'message_received',
          content: partial.buttonClicked ? `Tapped Button: "${partial.buttonClicked}"` : `Customer Reply: "${partial.replyMessage}"`,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextList = [newLead, ...leads];
    setLeads(nextList);
    saveStoredLeads(nextList);
    setSelectedLead(newLead);
    dbUpsertLead(newLead);
  };

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;
    const headers = ['Name', 'Phone', 'Campaign', 'Button Tapped', 'Status', 'Priority', 'Deal Value', 'Date'];
    const rows = filteredLeads.map((l) => [
      `"${l.name}"`,
      `"${l.phone}"`,
      `"${l.campaignName}"`,
      `"${l.buttonClicked || l.replyMessage || ''}"`,
      `"${l.status}"`,
      `"${l.priority}"`,
      l.dealValue || 0,
      `"${new Date(l.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchQuery =
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.phone.includes(searchQuery);
      const matchCampaign =
        selectedCampaign === 'all' || l.campaignName === selectedCampaign;
      const matchStatus = statusFilter === 'all' || l.status === statusFilter;
      return matchQuery && matchCampaign && matchStatus;
    });
  }, [leads, searchQuery, selectedCampaign, statusFilter]);

  // Executive KPI summary calculations
  const totalLeadsCount = leads.length;
  const hotLeadsCount = leads.filter((l) => l.priority === 'hot' || l.status === 'new').length;
  const convertedCount = leads.filter((l) => l.status === 'converted').length;
  const pendingActionCount = leads.filter((l) => l.status === 'new' || l.status === 'contacted').length;

  if (loading) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }} />;
  }

  if (!isAuthenticated) {
    return (
      <LoginGate
        portal="leads"
        onSuccess={() => {
          setIsAuthenticated(true);
          setLeads(getStoredLeads());
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      <Navbar
        portal="leads"
        onOpenChangePassword={() => setIsChangePassOpen(true)}
        onLogout={() => {
          logoutPortal('leads');
          setIsAuthenticated(false);
        }}
      />

      <main className="container" style={{ marginTop: '28px' }}>
        {/* Top Header Banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                WhatsApp Leads Command Center
              </h1>
              <span className="badge badge-green">
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--wa-green)', display: 'inline-block' }} />
                Live Ingestion Active
              </span>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Real-time inbound interested prospects captured from Meta WhatsApp broadcasts & interactive quick-replies.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsTesterOpen(true)}
              className="btn btn-outline-wa"
              title="Test an incoming customer button click without waiting for actual broadcasts"
            >
              <Sparkles size={16} />
              <span>Simulate Webhook Lead</span>
            </button>

            <button onClick={handleExportCSV} className="btn btn-secondary">
              <Download size={16} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Executive KPI Metrics */}
        <div className="grid-cols-4" style={{ marginBottom: '28px' }}>
          <div className="stat-card">
            <div>
              <div className="stat-title">Total Inbound Leads</div>
              <div className="stat-value">{totalLeadsCount}</div>
              <div className="stat-sub">
                <TrendingUp size={14} color="var(--wa-green-dark)" />
                <span style={{ color: 'var(--wa-green-dark)', fontWeight: 600 }}>Active Campaign Prospects</span>
              </div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--wa-light)', color: 'var(--wa-green-dark)' }}>
              <Users size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-title">Hot / High Intent Leads</div>
              <div className="stat-value" style={{ color: '#e11d48' }}>{hotLeadsCount}</div>
              <div className="stat-sub">
                <Flame size={14} color="#e11d48" />
                <span>Tapped "Interested" or "Call Back"</span>
              </div>
            </div>
            <div className="stat-icon" style={{ background: '#fff1f2', color: '#e11d48' }}>
              <Flame size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-title">Converted / Deals Won</div>
              <div className="stat-value" style={{ color: '#059669' }}>{convertedCount}</div>
              <div className="stat-sub">
                <CheckCircle size={14} color="#059669" />
                <span>{totalLeadsCount > 0 ? ((convertedCount / totalLeadsCount) * 100).toFixed(1) : 0}% Conversion Rate</span>
              </div>
            </div>
            <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Trophy size={24} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-title">Pending Action / Follow-up</div>
              <div className="stat-value" style={{ color: '#2563eb' }}>{pendingActionCount}</div>
              <div className="stat-sub">
                <Clock size={14} color="#2563eb" />
                <span>Awaiting sales agent reply or call</span>
              </div>
            </div>
            <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Clock size={24} />
            </div>
          </div>
        </div>

        {/* Filter & View Switcher Bar */}
        <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
              {/* Search */}
              <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search lead name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '38px', height: '40px' }}
                />
              </div>

              {/* Campaign Filter */}
              <div style={{ minWidth: '200px' }}>
                <select
                  className="form-select"
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  style={{ height: '40px' }}
                >
                  <option value="all">📢 All Campaigns ({campaigns.length})</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div style={{ minWidth: '160px' }}>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ height: '40px' }}
                >
                  <option value="all">All Stages</option>
                  <option value="new">New Interest</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="negotiation">In Negotiation</option>
                  <option value="converted">Won / Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="tabs-nav">
              <button
                onClick={() => setViewMode('kanban')}
                className={`tab-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              >
                <LayoutGrid size={16} />
                <span>Kanban Pipeline</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`tab-btn ${viewMode === 'table' ? 'active' : ''}`}
              >
                <ListFilter size={16} />
                <span>Table View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic View: Kanban or Table */}
        {viewMode === 'kanban' ? (
          <div className="kanban-board">
            {(['new', 'contacted', 'qualified', 'negotiation', 'converted'] as const).map((stage) => {
              const stageLeads = filteredLeads.filter((l) => l.status === stage);
              const labelInfo = STATUS_LABELS[stage] || { label: stage, badgeClass: 'badge-blue' };

              return (
                <div key={stage} className="kanban-col">
                  <div className="kanban-col-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${labelInfo.badgeClass}`} style={{ fontSize: '0.8rem' }}>
                        {labelInfo.label}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      {stageLeads.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                    {stageLeads.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-dim)', fontSize: '0.8rem', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                        No leads in this stage
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="kanban-card"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                            <div>
                              <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
                                {lead.name}
                              </h4>
                              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                {lead.phone}
                              </p>
                            </div>

                            {lead.priority === 'hot' && (
                              <span title="Hot Lead" style={{ color: '#e11d48' }}>
                                <Flame size={17} />
                              </span>
                            )}
                          </div>

                          {/* Button clicked highlight */}
                          {lead.buttonClicked && (
                            <div style={{
                              background: 'var(--wa-light)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              fontSize: '0.75rem',
                              color: 'var(--wa-green-dark)',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <Sparkles size={12} />
                              <span>{lead.buttonClicked}</span>
                            </div>
                          )}

                          {lead.replyMessage && !lead.buttonClicked && (
                            <div style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              fontSize: '0.75rem',
                              color: '#1d4ed8',
                              fontStyle: 'italic',
                              lineHeight: 1.3
                            }}>
                              "{lead.replyMessage.slice(0, 50)}..."
                            </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={lead.campaignName}>
                              📢 {lead.campaignName}
                            </span>
                            <span className={`badge ${lead.priority === 'hot' ? 'badge-red' : 'badge-green'}`} style={{ fontSize: '0.68rem' }}>
                              {lead.priority.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Lead Name & Phone</th>
                  <th>Origin Campaign</th>
                  <th>Customer Intent / Action</th>
                  <th>Pipeline Stage</th>
                  <th>Priority</th>
                  <th>Created At</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
                      No leads captured yet. Your live campaign button clicks will appear here!
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
                    return (
                      <tr key={lead.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedLead(lead)}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{lead.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                            {lead.phone}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-purple" style={{ fontSize: '0.74rem' }}>
                            {lead.campaignName}
                          </span>
                        </td>
                        <td>
                          {lead.buttonClicked ? (
                            <span className="badge badge-green" style={{ fontSize: '0.74rem' }}>
                              <Sparkles size={11} />
                              {lead.buttonClicked}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: '#93c5fd', fontStyle: 'italic' }}>
                              {lead.replyMessage ? `"${lead.replyMessage.slice(0, 35)}..."` : 'Direct reply'}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${STATUS_LABELS[lead.status]?.badgeClass || 'badge-blue'}`}>
                            {STATUS_LABELS[lead.status]?.label || lead.status}
                          </span>
                        </td>
                        <td>
                          {lead.priority === 'hot' ? (
                            <span className="badge badge-red" style={{ fontSize: '0.72rem' }}>
                              <Flame size={11} /> HOT
                            </span>
                          ) : lead.priority === 'warm' ? (
                            <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                              WARM
                            </span>
                          ) : (
                            <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
                              COLD
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          {new Date(lead.createdAt).toLocaleDateString()} {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-outline-wa btn-sm"
                              title="Open in WhatsApp"
                            >
                              <MessageSquare size={13} />
                            </a>
                            <a
                              href={`tel:${cleanPhone}`}
                              className="btn btn-secondary btn-sm"
                              title="Direct Phone Call"
                            >
                              <Phone size={13} />
                            </a>
                            <button
                              onClick={() => setSelectedLead(lead)}
                              className="btn btn-secondary btn-sm"
                              title="View Details"
                            >
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Slide-over Drawer for Lead Details & Direct 1-on-1 Chat */}
      <LeadDetailDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdateLead={handleUpdateLead}
      />

      {/* Webhook Tester Modal */}
      <WebhookTesterModal
        isOpen={isTesterOpen}
        onClose={() => setIsTesterOpen(false)}
        onSimulateLead={handleSimulateNewLead}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        portal="leads"
        isOpen={isChangePassOpen}
        onClose={() => setIsChangePassOpen(false)}
      />
    </div>
  );
}
