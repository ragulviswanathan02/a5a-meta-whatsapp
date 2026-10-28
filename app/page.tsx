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
  Tag,
  Trash2,
  GraduationCap,
  ExternalLink,
  Copy,
  Check,
  Building,
  Calendar,
  Mail,
  Share2,
  Award
} from 'lucide-react';
import { Lead, FormLead } from '@/lib/types';
import { 
  getStoredLeads, 
  saveStoredLeads, 
  getStoredCampaigns, 
  getStoredFormLeads, 
  saveStoredFormLeads 
} from '@/lib/storage';
import { isPortalAuthenticated, logoutPortal, useInactivityTracker } from '@/lib/auth';
import { 
  supabase,
  dbGetLeads, 
  dbUpsertLead, 
  dbDeleteLead,
  dbGetFormLeads,
  dbUpsertFormLead,
  dbDeleteFormLead
} from '@/lib/supabase';

export default function LeadsDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1-Hour Inactivity Auto-Logout Tracker
  useInactivityTracker('leads', () => {
    setIsAuthenticated(false);
  });

  // Main Tab Navigation
  const [activeMainTab, setActiveMainTab] = useState<'campaign_leads' | 'form_leads'>('campaign_leads');

  // WhatsApp Campaign Leads States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [isTesterOpen, setIsTesterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Student Form Leads States
  const [formLeads, setFormLeads] = useState<FormLead[]>([]);
  const [formSearchQuery, setFormSearchQuery] = useState('');
  const [formCollegeFilter, setFormCollegeFilter] = useState('all');
  const [formDeptFilter, setFormDeptFilter] = useState('all');
  const [formYearFilter, setFormYearFilter] = useState('all');
  const [formStatusFilter, setFormStatusFilter] = useState('all');
  const [copiedLink, setCopiedLink] = useState(false);

  // Silent Auto-Load Functions (no UI flickering)
  const loadLeadsSilently = async () => {
    try {
      const cloudLeads = await dbGetLeads();
      if (cloudLeads && Array.isArray(cloudLeads)) {
        setLeads(cloudLeads);
        saveStoredLeads(cloudLeads);
      }
    } catch (err) {
      // quiet fallback
    }
  };

  const loadFormLeadsSilently = async () => {
    try {
      const cloudFormLeads = await dbGetFormLeads();
      if (cloudFormLeads && Array.isArray(cloudFormLeads)) {
        setFormLeads(cloudFormLeads);
        saveStoredFormLeads(cloudFormLeads);
      }
    } catch (err) {
      // quiet fallback
    }
  };

  useEffect(() => {
    const authed = isPortalAuthenticated('leads');
    setIsAuthenticated(authed);

    if (authed) {
      // 1. Initial Load from Local Cache & Cloud
      setLeads(getStoredLeads());
      setFormLeads(getStoredFormLeads());
      loadLeadsSilently();
      loadFormLeadsSilently();

      // 2. Realtime WebSocket Subscription via Supabase
      const channel = supabase
        .channel('realtime_leads_and_forms')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'leads' },
          () => {
            loadLeadsSilently();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'form_leads' },
          () => {
            loadFormLeadsSilently();
          }
        )
        .subscribe();

      // 3. Fallback Auto-Polling (checks every 4 seconds for instant updates without page refresh)
      const pollTimer = setInterval(() => {
        loadLeadsSilently();
        loadFormLeadsSilently();
      }, 4000);

      setLoading(false);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(pollTimer);
      };
    } else {
      setLoading(false);
    }
  }, []);

  const campaigns = useMemo(() => {
    return getStoredCampaigns();
  }, [leads]);

  // ==========================================
  // WHATSAPP LEADS HANDLERS
  // ==========================================
  const handleUpdateLead = (updated: Lead) => {
    const updatedList = leads.map((l) => (l.id === updated.id ? updated : l));
    setLeads(updatedList);
    saveStoredLeads(updatedList);
    setSelectedLead(updated);
    dbUpsertLead(updated);
  };

  const handleDeleteLead = async (leadId: string, leadName?: string) => {
    if (window.confirm(`Are you sure you want to delete lead "${leadName || 'this contact'}"?`)) {
      const nextList = leads.filter((l) => l.id !== leadId);
      setLeads(nextList);
      saveStoredLeads(nextList);
      if (selectedLead?.id === leadId) {
        setSelectedLead(null);
      }
      await dbDeleteLead(leadId);
    }
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
    link.setAttribute('download', `whatsapp_leads_${new Date().toISOString().slice(0, 10)}.csv`);
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

  // ==========================================
  // STUDENT FORM LEADS HANDLERS
  // ==========================================
  const collegesList = useMemo(() => {
    const set = new Set<string>();
    formLeads.forEach((fl) => {
      if (fl.collegeName) set.add(fl.collegeName);
    });
    return Array.from(set);
  }, [formLeads]);

  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    formLeads.forEach((fl) => {
      if (fl.department) set.add(fl.department);
    });
    return Array.from(set);
  }, [formLeads]);

  const filteredFormLeads = useMemo(() => {
    return formLeads.filter((fl) => {
      const matchQuery =
        fl.name.toLowerCase().includes(formSearchQuery.toLowerCase()) ||
        fl.phone.includes(formSearchQuery) ||
        fl.email.toLowerCase().includes(formSearchQuery.toLowerCase()) ||
        fl.collegeName.toLowerCase().includes(formSearchQuery.toLowerCase());
      const matchCollege = formCollegeFilter === 'all' || fl.collegeName === formCollegeFilter;
      const matchDept = formDeptFilter === 'all' || fl.department === formDeptFilter;
      const matchYear = formYearFilter === 'all' || fl.yearOfStudy === formYearFilter;
      const matchStatus = formStatusFilter === 'all' || fl.status === formStatusFilter;
      return matchQuery && matchCollege && matchDept && matchYear && matchStatus;
    });
  }, [formLeads, formSearchQuery, formCollegeFilter, formDeptFilter, formYearFilter, formStatusFilter]);

  const handleUpdateFormLeadStatus = async (leadId: string, newStatus: FormLead['status']) => {
    const updated = formLeads.map((fl) =>
      fl.id === leadId ? { ...fl, status: newStatus, updatedAt: new Date().toISOString() } : fl
    );
    setFormLeads(updated);
    saveStoredFormLeads(updated);
    const target = updated.find((fl) => fl.id === leadId);
    if (target) {
      await dbUpsertFormLead(target);
    }
  };

  const handleDeleteFormLead = async (leadId: string, leadName: string) => {
    if (window.confirm(`Are you sure you want to delete student lead "${leadName}"?`)) {
      const updated = formLeads.filter((fl) => fl.id !== leadId);
      setFormLeads(updated);
      saveStoredFormLeads(updated);
      await dbDeleteFormLead(leadId);
    }
  };

  const handleCopyFormLink = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/form` : 'https://a5ameta.vercel.app/form';
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleExportFormLeadsCSV = () => {
    if (filteredFormLeads.length === 0) return;
    const headers = ['Name', 'Phone', 'Email', 'College', 'Department', 'Year of Study', 'Course Interest', 'City', 'Source', 'Status', 'Applied Date'];
    const rows = filteredFormLeads.map((fl) => [
      `"${fl.name}"`,
      `"${fl.phone}"`,
      `"${fl.email}"`,
      `"${fl.collegeName}"`,
      `"${fl.department}"`,
      `"${fl.yearOfStudy}"`,
      `"${fl.courseInterest || ''}"`,
      `"${fl.city || ''}"`,
      `"${fl.source || ''}"`,
      `"${fl.status}"`,
      `"${new Date(fl.createdAt).toLocaleDateString()}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `student_form_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Student Form metrics
  const totalFormCount = formLeads.length;
  const freshFormCount = formLeads.filter((fl) => fl.status === 'new').length;
  const finalYearOrPassedCount = formLeads.filter(
    (fl) => fl.yearOfStudy.toLowerCase().includes('final') || fl.yearOfStudy.toLowerCase().includes('passed')
  ).length;
  const enrolledFormCount = formLeads.filter((fl) => fl.status === 'enrolled').length;

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
          setFormLeads(getStoredFormLeads());
        }}
      />
    );
  }

  const STAGES: Array<{ key: Lead['status']; title: string; color: string }> = [
    { key: 'new', title: 'New Lead', color: 'var(--wa-green)' },
    { key: 'contacted', title: 'Contacted', color: '#f59e0b' },
    { key: 'qualified', title: 'Qualified', color: '#8b5cf6' },
    { key: 'negotiation', title: 'In Negotiation', color: '#f97316' },
    { key: 'converted', title: 'Won / Converted', color: '#10b981' },
  ];

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

      <main className="container" style={{ marginTop: '24px' }}>

        {/* Top-Level Tabs: WhatsApp Broadcast Leads vs. Student Form Leads */}
        <div style={{
          display: 'inline-flex',
          background: '#f1f5f9',
          padding: '5px',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '26px',
          gap: '6px'
        }}>
          <button
            onClick={() => setActiveMainTab('campaign_leads')}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '12px',
              background: activeMainTab === 'campaign_leads' ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: activeMainTab === 'campaign_leads' ? 'var(--wa-green-dark)' : 'var(--text-muted)',
              boxShadow: activeMainTab === 'campaign_leads' ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <MessageSquare size={17} />
            <span>WhatsApp Campaign Leads</span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              background: activeMainTab === 'campaign_leads' ? 'var(--wa-light)' : '#e2e8f0',
              color: activeMainTab === 'campaign_leads' ? 'var(--wa-green-dark)' : 'var(--text-muted)',
              padding: '2px 8px',
              borderRadius: '999px',
            }}>
              {leads.length}
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('form_leads')}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '12px',
              background: activeMainTab === 'form_leads' ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: activeMainTab === 'form_leads' ? '#6d28d9' : 'var(--text-muted)',
              boxShadow: activeMainTab === 'form_leads' ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <GraduationCap size={18} />
            <span>Student Form Leads</span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              background: activeMainTab === 'form_leads' ? '#faf5ff' : '#e2e8f0',
              color: activeMainTab === 'form_leads' ? '#6d28d9' : 'var(--text-muted)',
              padding: '2px 8px',
              borderRadius: '999px',
            }}>
              {formLeads.length}
            </span>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: WHATSAPP CAMPAIGN LEADS                                      */}
        {/* ==================================================================== */}
        {activeMainTab === 'campaign_leads' && (
          <div>
            {/* Header Banner */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    WhatsApp Leads Command Center
                  </h1>
                  <span className="badge badge-green">
                    <span className="live-dot" /> Live Ingestion Active
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9rem' }}>
                  Real-time inbound prospects captured from Meta WhatsApp broadcasts & interactive quick-replies.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={handleExportCSV} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={16} /> Export CSV
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid-kpi" style={{ marginBottom: '24px' }}>
              <div className="kpi-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="kpi-label">TOTAL INBOUND LEADS</div>
                    <div className="kpi-value">{totalLeadsCount}</div>
                    <div className="kpi-trend" style={{ color: 'var(--wa-green)' }}>
                      <TrendingUp size={14} /> Active Campaign Prospects
                    </div>
                  </div>
                  <div className="kpi-icon" style={{ background: 'var(--wa-light)', color: 'var(--wa-green-dark)' }}>
                    <Users size={22} />
                  </div>
                </div>
              </div>

              <div className="kpi-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="kpi-label">HOT / HIGH INTENT LEADS</div>
                    <div className="kpi-value" style={{ color: '#e11d48' }}>{hotLeadsCount}</div>
                    <div className="kpi-trend" style={{ color: '#e11d48' }}>
                      <Flame size={14} /> Tapped "Interested" or "Call Back"
                    </div>
                  </div>
                  <div className="kpi-icon" style={{ background: '#ffe4e6', color: '#e11d48' }}>
                    <Flame size={22} />
                  </div>
                </div>
              </div>

              <div className="kpi-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="kpi-label">CONVERTED / DEALS WON</div>
                    <div className="kpi-value" style={{ color: 'var(--wa-green)' }}>{convertedCount}</div>
                    <div className="kpi-trend" style={{ color: 'var(--wa-green)' }}>
                      <Trophy size={14} />
                      {totalLeadsCount > 0 ? `${Math.round((convertedCount / totalLeadsCount) * 100)}% Conversion Rate` : '0% Conversion Rate'}
                    </div>
                  </div>
                  <div className="kpi-icon" style={{ background: 'var(--wa-light)', color: 'var(--wa-green)' }}>
                    <Trophy size={22} />
                  </div>
                </div>
              </div>

              <div className="kpi-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="kpi-label">PENDING ACTION / FOLLOW-UP</div>
                    <div className="kpi-value" style={{ color: '#2563eb' }}>{pendingActionCount}</div>
                    <div className="kpi-trend" style={{ color: 'var(--text-muted)' }}>
                      <Clock size={14} /> Awaiting sales agent reply or call
                    </div>
                  </div>
                  <div className="kpi-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                    <Clock size={22} />
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                  <Search size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search lead name or phone..."
                    className="form-input"
                    style={{ paddingLeft: '38px', height: '40px' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '170px', height: '40px' }}
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                >
                  <option value="all">📢 All Campaigns ({campaigns.length})</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '140px', height: '40px' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Stages</option>
                  <option value="new">New Lead</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="negotiation">In Negotiation</option>
                  <option value="converted">Won / Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => setViewMode('table')}
                  className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ border: 'none', borderRadius: '6px' }}
                >
                  <ListFilter size={15} /> Table View
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ border: 'none', borderRadius: '6px' }}
                >
                  <LayoutGrid size={15} /> Card View
                </button>
              </div>
            </div>

            {/* Kanban Pipeline Board */}
            {viewMode === 'kanban' ? (
              <div className="kanban-board">
                {STAGES.map((col) => {
                  const stageLeads = filteredLeads.filter((l) => l.status === col.key);
                  return (
                    <div key={col.key} className="kanban-col">
                      <div className="kanban-header">
                        <span className={`badge ${STATUS_LABELS[col.key]?.badgeClass || 'badge-blue'}`}>
                          {col.title}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          {stageLeads.length}
                        </span>
                      </div>

                      <div className="kanban-cards">
                        {stageLeads.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                            No leads in this stage
                          </div>
                        ) : (
                          stageLeads.map((lead) => (
                            <div
                              key={lead.id}
                              className="kanban-card"
                              onClick={() => setSelectedLead(lead)}
                              style={{ position: 'relative' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '2px' }}>
                                    {lead.name}
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                                    {lead.phone}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {lead.priority === 'hot' && (
                                    <span title="Hot Lead" style={{ color: '#e11d48' }}>
                                      <Flame size={17} />
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteLead(lead.id, lead.name);
                                    }}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: 'var(--text-dim)',
                                      cursor: 'pointer',
                                      padding: '2px',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                    title="Delete Lead"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

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
                                <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={lead.campaignName}>
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
                                <span style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
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
                                  onClick={() => handleDeleteLead(lead.id, lead.name)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ color: '#ef4444' }}
                                  title="Delete Lead"
                                >
                                  <Trash2 size={13} />
                                </button>
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
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: STUDENT FORM LEADS (PUBLIC BIO / VIDEO INQUIRIES)             */}
        {/* ==================================================================== */}
        {activeMainTab === 'form_leads' && (
          <div>
            {/* Header Banner */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    Student Form Admissions Pipeline
                  </h1>
                  <span className="badge badge-purple">
                    <GraduationCap size={14} /> Social & Bio Link Submissions
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9rem' }}>
                  Prospective engineering students captured via your public form link (Instagram bio, YouTube videos, WhatsApp status).
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleCopyFormLink}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {copiedLink ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                  <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Form Link (url/form)'}</span>
                </button>

                <a
                  href="/form"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={16} /> Open Public Form
                </a>

                <button
                  onClick={handleExportFormLeadsCSV}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={16} /> Export Form Leads CSV
                </button>
              </div>
            </div>

            {/* KPI Cards for Student Forms */}
            <div className="grid-kpi" style={{ marginBottom: '24px' }}>
              <div className="kpi-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="kpi-label">TOTAL FORM INQUIRIES</div>
                    <div className="kpi-value">{totalFormCount}</div>
                    <div className="kpi-trend" style={{ color: '#8b5cf6' }}>
                      <GraduationCap size={14} /> Direct Student Submissions
                    </div>
                  </div>
                  <div className="kpi-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
                    <Users size={22} />
                  </div>
                </div>
              </div>

              <div className="kpi-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="kpi-label">FRESH / UNTOUCHED LEADS</div>
                    <div className="kpi-value" style={{ color: '#059669' }}>{freshFormCount}</div>
                    <div className="kpi-trend" style={{ color: '#059669' }}>
                      <Clock size={14} /> Ready for First Counselor Call
                    </div>
                  </div>
                  <div className="kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                    <Sparkles size={22} />
                  </div>
                </div>
              </div>

              <div className="kpi-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="kpi-label">FINAL YEAR & PASSED OUT</div>
                    <div className="kpi-value" style={{ color: '#2563eb' }}>{finalYearOrPassedCount}</div>
                    <div className="kpi-trend" style={{ color: '#2563eb' }}>
                      <Trophy size={14} /> High Placement Readiness
                    </div>
                  </div>
                  <div className="kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                    <Award size={22} />
                  </div>
                </div>
              </div>

              <div className="kpi-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="kpi-label">ENROLLED / CONVERTED</div>
                    <div className="kpi-value" style={{ color: '#10b981' }}>{enrolledFormCount}</div>
                    <div className="kpi-trend" style={{ color: '#10b981' }}>
                      <CheckCircle size={14} />
                      {totalFormCount > 0 ? `${Math.round((enrolledFormCount / totalFormCount) * 100)}% Enrollment Rate` : '0% Enrollment Rate'}
                    </div>
                  </div>
                  <div className="kpi-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                    <CheckCircle size={22} />
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Bar for Form Leads */}
            <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                  <Search size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search name, phone, college..."
                    className="form-input"
                    style={{ paddingLeft: '38px', height: '40px' }}
                    value={formSearchQuery}
                    onChange={(e) => setFormSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '150px', height: '40px' }}
                  value={formCollegeFilter}
                  onChange={(e) => setFormCollegeFilter(e.target.value)}
                >
                  <option value="all">All Colleges ({collegesList.length})</option>
                  {collegesList.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>

                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '150px', height: '40px' }}
                  value={formDeptFilter}
                  onChange={(e) => setFormDeptFilter(e.target.value)}
                >
                  <option value="all">All Departments ({departmentsList.length})</option>
                  {departmentsList.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '140px', height: '40px' }}
                  value={formYearFilter}
                  onChange={(e) => setFormYearFilter(e.target.value)}
                >
                  <option value="all">All Years</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="Final Year">Final Year</option>
                  <option value="Passed Out">Passed Out</option>
                </select>

                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '130px', height: '40px' }}
                  value={formStatusFilter}
                  onChange={(e) => setFormStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="counseled">Counseled</option>
                  <option value="enrolled">Enrolled</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>

            {/* Student Leads Table */}
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student Name & Contact</th>
                    <th>College & Department</th>
                    <th>Year of Study</th>
                    <th>Course of Interest</th>
                    <th>Status Workflow</th>
                    <th>Submitted</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFormLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-dim)' }}>
                        <div style={{ marginBottom: '8px' }}>
                          <GraduationCap size={36} style={{ color: '#cbd5e1', margin: '0 auto' }} />
                        </div>
                        <div style={{ fontWeight: 600, color: '#64748b', fontSize: '0.95rem' }}>No student form leads captured yet</div>
                        <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>
                          Share your form link <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>https://a5ameta.vercel.app/form</code> on social media videos to start collecting inquiries!
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredFormLeads.map((fl) => {
                      const cleanPhone = fl.phone.replace(/[^0-9]/g, '');
                      const whatsappText = encodeURIComponent(
                        `Hello ${fl.name}, thank you for registering with A5A Automation for Industrial Training! We received your application from ${fl.collegeName} (${fl.department}). How can we help you regarding your training & placement?`
                      );

                      return (
                        <tr key={fl.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{fl.name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--wa-green)', fontFamily: 'monospace', fontWeight: 600 }}>
                              {fl.phone}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              {fl.email}
                            </div>
                          </td>

                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.86rem' }}>
                              {fl.collegeName}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              {fl.department}
                            </div>
                            {fl.city && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                                📍 {fl.city}
                              </div>
                            )}
                          </td>

                          <td>
                            <span className="badge badge-purple" style={{ fontSize: '0.74rem' }}>
                              {fl.yearOfStudy}
                            </span>
                          </td>

                          <td>
                            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>
                              {fl.courseInterest || 'Industrial Automation'}
                            </div>
                            {fl.source && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                                Source: {fl.source}
                              </span>
                            )}
                          </td>

                          <td>
                            <select
                              value={fl.status}
                              onChange={(e) => handleUpdateFormLeadStatus(fl.id, e.target.value as FormLead['status'])}
                              className="form-select"
                              style={{
                                fontSize: '0.78rem',
                                height: '32px',
                                padding: '2px 8px',
                                fontWeight: 700,
                                background:
                                  fl.status === 'enrolled'
                                    ? '#ecfdf5'
                                    : fl.status === 'counseled'
                                    ? '#eff6ff'
                                    : fl.status === 'contacted'
                                    ? '#fffbeb'
                                    : '#ffffff',
                                color:
                                  fl.status === 'enrolled'
                                    ? '#059669'
                                    : fl.status === 'counseled'
                                    ? '#2563eb'
                                    : fl.status === 'contacted'
                                    ? '#d97706'
                                    : '#0f172a'
                              }}
                            >
                              <option value="new">New Lead</option>
                              <option value="contacted">Contacted</option>
                              <option value="counseled">Counseled</option>
                              <option value="enrolled">Enrolled / Paid</option>
                              <option value="lost">Not Interested</option>
                            </select>
                          </td>

                          <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                            {new Date(fl.createdAt).toLocaleDateString()}
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <a
                                href={`https://wa.me/${cleanPhone}?text=${whatsappText}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-outline-wa btn-sm"
                                title="Chat with student on WhatsApp"
                              >
                                <MessageSquare size={13} />
                              </a>

                              <a
                                href={`tel:${cleanPhone}`}
                                className="btn btn-secondary btn-sm"
                                title="Call Student"
                              >
                                <Phone size={13} />
                              </a>

                              <a
                                href={`mailto:${fl.email}?subject=A5A%20Automation%20Training%20Inquiry`}
                                className="btn btn-secondary btn-sm"
                                title="Send Email"
                              >
                                <Mail size={13} />
                              </a>

                              <button
                                onClick={() => handleDeleteFormLead(fl.id, fl.name)}
                                className="btn btn-secondary btn-sm"
                                style={{ color: '#ef4444' }}
                                title="Delete Lead"
                              >
                                <Trash2 size={13} />
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
          </div>
        )}

      </main>

      {/* Slide-over Drawer for WhatsApp Lead Details & Direct 1-on-1 Chat */}
      <LeadDetailDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdateLead={handleUpdateLead}
        onDeleteLead={handleDeleteLead}
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
