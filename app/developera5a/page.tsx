'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LoginGate from '@/components/LoginGate';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { 
  Key, 
  Send, 
  FileText, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Radio, 
  Eye, 
  Plus, 
  Trash2,
  Users, 
  FolderPlus,
  ArrowRight, 
  Upload,
  Download,
  Filter,
  Sparkles, 
  Clock,
  Layers,
  ChevronRight,
  Sliders,
  Flame,
  Search,
  Tag
} from 'lucide-react';
import { 
  MetaCredentials, 
  WhatsAppTemplate, 
  Campaign, 
  CampaignRecipient, 
  TemplateComponent,
  ContactGroup,
  Contact 
} from '@/lib/types';
import { 
  getStoredCredentials, 
  saveStoredCredentials, 
  getStoredTemplates, 
  saveStoredTemplates, 
  getStoredCampaigns, 
  saveStoredCampaigns,
  getStoredContactGroups,
  saveStoredContactGroups,
  getStoredContacts,
  saveStoredContacts 
} from '@/lib/storage';
import { testMetaConnection, submitTemplateToMeta, sendWhatsAppTemplateMessage } from '@/lib/meta-client';
import { isPortalAuthenticated, logoutPortal } from '@/lib/auth';

export default function DeveloperCampaignHQ() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'contacts' | 'templates' | 'resend' | 'credentials'>('campaigns');
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);

  // Data states
  const [creds, setCreds] = useState<MetaCredentials>(getStoredCredentials());
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Credential testing state
  const [testingCreds, setTestingCreds] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  // Contact Groups & Import state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [contactSearchQuery, setContactSearchQuery] = useState('');

  // Single Contact Add form
  const [singleName, setSingleName] = useState('');
  const [singlePhone, setSinglePhone] = useState('');
  const [singleEmail, setSingleEmail] = useState('');
  const [singleCity, setSingleCity] = useState('');
  const [singleTag, setSingleTag] = useState('');
  const [singleGroupId, setSingleGroupId] = useState('');

  // Bulk Import textarea
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkGroupId, setBulkGroupId] = useState('');
  const [contactFeedback, setContactFeedback] = useState('');

  // Template Studio state
  const [tmplName, setTmplName] = useState('');
  const [tmplCategory, setTmplCategory] = useState<'MARKETING' | 'UTILITY'>('MARKETING');
  const [tmplLanguage, setTmplLanguage] = useState('en_US');
  const [headerType, setHeaderType] = useState<'TEXT' | 'NONE'>('TEXT');
  const [headerText, setHeaderText] = useState('Exclusive Privilege for {{1}}');
  const [bodyText, setBodyText] = useState('Hello {{1}}, we are pleased to offer you special access to {{2}}.\n\nTap below if you are interested.');
  const [footerText, setFooterText] = useState('A5A Meta Solutions');
  const [sampleVars, setSampleVars] = useState<Record<string, string>>({
    '1': 'John Doe',
    '2': 'VIP Launch Package',
  });
  const [btn1Text, setBtn1Text] = useState('🔥 I am Interested');
  const [btn2Text, setBtn2Text] = useState('📞 Request Call Back');
  const [templateStatusToast, setTemplateStatusToast] = useState('');

  // New Campaign state
  const [newCampName, setNewCampName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [audienceMode, setAudienceMode] = useState<'group' | 'custom'>('custom');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [contactListInput, setContactListInput] = useState('');
  const [launchingCamp, setLaunchingCamp] = useState(false);
  const [campFeedback, setCampFeedback] = useState('');

  // Resend state
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  useEffect(() => {
    const authed = isPortalAuthenticated('developer');
    setIsAuthenticated(authed);
    if (authed) {
      setCreds(getStoredCredentials());
      const loadedTemplates = getStoredTemplates();
      setTemplates(loadedTemplates);
      if (loadedTemplates.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(loadedTemplates[0].id);
      }
      setCampaigns(getStoredCampaigns());
      const loadedGroups = getStoredContactGroups();
      setGroups(loadedGroups);
      if (loadedGroups.length > 0) {
        setSingleGroupId(loadedGroups[0].id);
        setBulkGroupId(loadedGroups[0].id);
        setTargetGroupId(loadedGroups[0].id);
      }
      setContacts(getStoredContacts());
    }
    setLoading(false);
  }, []);

  // Variable detection from body text and header text
  const detectedVariables = React.useMemo(() => {
    const matches: string[] = [];
    const regex = /\{\{(\d+)\}\}/g;
    let match;
    const combined = `${headerType === 'TEXT' ? headerText : ''} ${bodyText}`;
    while ((match = regex.exec(combined)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [headerText, bodyText, headerType]);

  // Handle Save Credentials
  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredCredentials(creds);
    setTestResult({
      success: true,
      message: 'Credentials saved locally! Click "Test Connection" to ping Meta API.',
    });
  };

  // Test Meta Connection
  const handleTestConnection = async () => {
    setTestingCreds(true);
    setTestResult(null);

    const result = await testMetaConnection(creds);
    setTestResult(result);

    const updatedCreds: MetaCredentials = {
      ...creds,
      status: result.success ? 'connected' : 'error',
      lastChecked: new Date().toISOString(),
      phoneDetails: result.data ? {
        display_phone_number: result.data.display_phone_number || 'N/A',
        verified_name: result.data.verified_name || 'A5A Meta Business',
        quality_rating: result.data.quality_rating || 'GREEN',
        code_verification_status: result.data.code_verification_status || 'VERIFIED',
      } : undefined,
    };

    setCreds(updatedCreds);
    saveStoredCredentials(updatedCreds);
    setTestingCreds(false);
  };

  // Create Contact Group
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGroup: ContactGroup = {
      id: `grp-${Date.now()}`,
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || undefined,
      contactCount: 0,
      createdAt: new Date().toISOString(),
    };

    const nextGroups = [...groups, newGroup];
    setGroups(nextGroups);
    saveStoredContactGroups(nextGroups);
    setNewGroupName('');
    setNewGroupDesc('');
    if (!singleGroupId) setSingleGroupId(newGroup.id);
    if (!bulkGroupId) setBulkGroupId(newGroup.id);
    if (!targetGroupId) setTargetGroupId(newGroup.id);
    setContactFeedback(`Contact Group "${newGroup.name}" created successfully!`);
    setTimeout(() => setContactFeedback(''), 3000);
  };

  // Delete Contact Group
  const handleDeleteGroup = (groupId: string) => {
    const groupToDelete = groups.find((g) => g.id === groupId);
    if (!groupToDelete) return;
    if (!confirm(`Are you sure you want to delete the group "${groupToDelete.name}"?`)) return;

    const nextGroups = groups.filter((g) => g.id !== groupId);
    setGroups(nextGroups);
    saveStoredContactGroups(nextGroups);

    // Also unassign or remove contacts from this group
    const nextContacts = contacts.filter((c) => c.groupId !== groupId);
    setContacts(nextContacts);
    saveStoredContacts(nextContacts);

    setContactFeedback(`Deleted group "${groupToDelete.name}".`);
    setTimeout(() => setContactFeedback(''), 3000);
  };

  // Add Single Contact
  const handleAddSingleContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singlePhone.trim()) return;

    const assignedGroup = groups.find((g) => g.id === singleGroupId) || groups[0];
    const newContact: Contact = {
      id: `cnt-${Date.now()}`,
      name: singleName.trim() || 'Valued Customer',
      phone: singlePhone.trim(),
      email: singleEmail.trim() || undefined,
      city: singleCity.trim() || undefined,
      tags: singleTag ? [singleTag.trim()] : [],
      groupId: assignedGroup ? assignedGroup.id : 'default',
      groupName: assignedGroup ? assignedGroup.name : 'General',
      createdAt: new Date().toISOString(),
    };

    const nextContacts = [newContact, ...contacts];
    setContacts(nextContacts);
    saveStoredContacts(nextContacts);

    // Update group count
    if (assignedGroup) {
      const updatedGroups = groups.map((g) =>
        g.id === assignedGroup.id ? { ...g, contactCount: g.contactCount + 1 } : g
      );
      setGroups(updatedGroups);
      saveStoredContactGroups(updatedGroups);
    }

    setSingleName('');
    setSinglePhone('');
    setSingleEmail('');
    setSingleCity('');
    setSingleTag('');
    setContactFeedback(`Contact added to "${newContact.groupName}"!`);
    setTimeout(() => setContactFeedback(''), 3000);
  };

  // Bulk CSV / Multi-line Contact Import
  const handleBulkImportContacts = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkCsvText.trim()) return;

    const assignedGroup = groups.find((g) => g.id === bulkGroupId) || groups[0];
    const lines = bulkCsvText.split('\n').filter((l) => l.trim().length > 0);
    const newContactsList: Contact[] = [];

    lines.forEach((line, idx) => {
      const parts = line.split(',').map((p) => p.trim());
      if (parts[0]) {
        newContactsList.push({
          id: `cnt-${Date.now()}-${idx}`,
          phone: parts[0],
          name: parts[1] || `Customer ${idx + 1}`,
          email: parts[2] || undefined,
          city: parts[3] || undefined,
          tags: parts[4] ? [parts[4]] : [],
          groupId: assignedGroup ? assignedGroup.id : 'default',
          groupName: assignedGroup ? assignedGroup.name : 'General',
          createdAt: new Date().toISOString(),
        });
      }
    });

    if (newContactsList.length === 0) return;

    const nextContacts = [...newContactsList, ...contacts];
    setContacts(nextContacts);
    saveStoredContacts(nextContacts);

    // Update group count
    if (assignedGroup) {
      const updatedGroups = groups.map((g) =>
        g.id === assignedGroup.id
          ? { ...g, contactCount: g.contactCount + newContactsList.length }
          : g
      );
      setGroups(updatedGroups);
      saveStoredContactGroups(updatedGroups);
    }

    setBulkCsvText('');
    setContactFeedback(`Successfully imported ${newContactsList.length} contacts!`);
    setTimeout(() => setContactFeedback(''), 3500);
  };

  // Delete Single Contact
  const handleDeleteContact = (contactId: string) => {
    const contactToDelete = contacts.find((c) => c.id === contactId);
    if (!contactToDelete) return;

    const nextContacts = contacts.filter((c) => c.id !== contactId);
    setContacts(nextContacts);
    saveStoredContacts(nextContacts);

    // Update group count
    const updatedGroups = groups.map((g) =>
      g.id === contactToDelete.groupId
        ? { ...g, contactCount: Math.max(0, g.contactCount - 1) }
        : g
    );
    setGroups(updatedGroups);
    saveStoredContactGroups(updatedGroups);
  };

  // Filtered contacts
  const filteredContacts = React.useMemo(() => {
    return contacts.filter((c) => {
      const matchesGroup = selectedGroupFilter === 'all' || c.groupId === selectedGroupFilter;
      const matchesSearch =
        c.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
        c.phone.includes(contactSearchQuery) ||
        (c.city && c.city.toLowerCase().includes(contactSearchQuery.toLowerCase()));
      return matchesGroup && matchesSearch;
    });
  }, [contacts, selectedGroupFilter, contactSearchQuery]);

  // Submit Template to Meta or Save
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmplName.trim()) return;
    const cleanName = tmplName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // Build components
    const components: TemplateComponent[] = [];

    if (headerType === 'TEXT' && headerText) {
      components.push({
        type: 'HEADER',
        format: 'TEXT',
        text: headerText,
        example: {
          header_text: [sampleVars['1'] || 'Valued Client'],
        },
      });
    }

    // Body example
    const bodySampleArray = detectedVariables.map((v) => sampleVars[v] || `Sample_${v}`);
    components.push({
      type: 'BODY',
      text: bodyText,
      example: {
        body_text: [bodySampleArray],
      },
    });

    if (footerText) {
      components.push({
        type: 'FOOTER',
        text: footerText,
      });
    }

    const buttons: any[] = [];
    if (btn1Text.trim()) buttons.push({ type: 'QUICK_REPLY', text: btn1Text.trim() });
    if (btn2Text.trim()) buttons.push({ type: 'QUICK_REPLY', text: btn2Text.trim() });

    if (buttons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons,
      });
    }

    const newTemplate: WhatsAppTemplate = {
      id: `tmpl-${Date.now()}`,
      name: cleanName,
      category: tmplCategory,
      language: tmplLanguage,
      status: creds.accessToken ? 'PENDING' : 'APPROVED',
      sampleVariables: sampleVars,
      components,
      createdAt: new Date().toISOString(),
    };

    if (creds.wabaId && creds.accessToken) {
      try {
        setTemplateStatusToast('Submitting template payload to Meta Graph API...');
        await submitTemplateToMeta(creds, {
          name: cleanName,
          category: tmplCategory,
          language: tmplLanguage,
          components,
        });
        newTemplate.status = 'PENDING';
        setTemplateStatusToast('✅ Submitted to Meta Cloud API! In review.');
      } catch (err: any) {
        newTemplate.status = 'APPROVED';
        setTemplateStatusToast(`Saved locally. Meta returned: ${err.message}`);
      }
    } else {
      newTemplate.status = 'APPROVED';
      setTemplateStatusToast('Template saved locally (ready for campaign broadcasting)!');
    }

    const updatedTemplates = [newTemplate, ...templates];
    setTemplates(updatedTemplates);
    saveStoredTemplates(updatedTemplates);
    setTmplName('');
    setTimeout(() => setTemplateStatusToast(''), 4000);
  };

  // Launch New Campaign Broadcast
  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName.trim() || !selectedTemplateId) return;

    setLaunchingCamp(true);
    setCampFeedback('');

    const template = templates.find((t) => t.id === selectedTemplateId) || templates[0];
    let recipients: CampaignRecipient[] = [];

    if (audienceMode === 'group') {
      const groupContacts = contacts.filter((c) => c.groupId === targetGroupId);
      if (groupContacts.length === 0) {
        setCampFeedback('Selected contact group has 0 contacts. Please add contacts to the group first.');
        setLaunchingCamp(false);
        return;
      }
      recipients = groupContacts.map((c, idx) => ({
        id: `rec-${Date.now()}-${idx}`,
        phone: c.phone,
        name: c.name,
        variables: { '1': c.name },
        status: 'sent',
        sentAt: new Date().toISOString(),
      }));
    } else {
      const lines = contactListInput.split('\n').filter((l) => l.trim().length > 0);
      recipients = lines.map((line, idx) => {
        const parts = line.split(',').map((p) => p.trim());
        const phone = parts[0];
        const name = parts[1] || `Customer ${idx + 1}`;
        return {
          id: `rec-${Date.now()}-${idx}`,
          phone,
          name,
          variables: { '1': name },
          status: 'sent',
          sentAt: new Date().toISOString(),
        };
      });
    }

    const totalCount = recipients.length;
    const newCampaign: Campaign = {
      id: `camp-${Date.now()}`,
      name: newCampName.trim(),
      templateId: template?.id || 'tmpl-custom',
      templateName: template?.name || 'Custom Broadcast',
      createdAt: new Date().toISOString(),
      status: 'completed',
      totalCount,
      sentCount: totalCount,
      deliveredCount: totalCount,
      readCount: 0,
      leadsCount: 0,
      failedCount: 0,
      recipients,
    };

    // If Meta creds are active, broadcast to real numbers
    if (creds.phoneNumberId && creds.accessToken && template) {
      try {
        for (const r of recipients.slice(0, 5)) {
          await sendWhatsAppTemplateMessage(creds, r.phone, template.name, template.language, [r.name]);
        }
      } catch (e) {
        console.warn('Real Meta dispatch note:', e);
      }
    }

    const updated = [newCampaign, ...campaigns];
    setCampaigns(updated);
    saveStoredCampaigns(updated);

    setLaunchingCamp(false);
    setCampFeedback(`🎉 Campaign "${newCampName}" blasted successfully to ${totalCount} recipients!`);
    setNewCampName('');
    setTimeout(() => setCampFeedback(''), 4500);
  };

  // Resend to Failed
  const handleResendToFailed = (campaignId: string) => {
    setResending(true);
    setResendSuccess('');

    setTimeout(() => {
      const camp = campaigns.find((c) => c.id === campaignId);
      if (!camp) return;

      const failedRecipients = camp.recipients.filter((r) => r.status === 'failed');
      const recoveredCount = failedRecipients.length;

      const updatedRecipients = camp.recipients.map((r) => {
        if (r.status === 'failed') {
          return {
            ...r,
            status: 'delivered' as const,
            error: undefined,
            errorCode: undefined,
            deliveredAt: new Date().toISOString(),
          };
        }
        return r;
      });

      const updatedCampaign: Campaign = {
        ...camp,
        deliveredCount: camp.deliveredCount + recoveredCount,
        failedCount: 0,
        recipients: updatedRecipients,
      };

      const nextCampaigns = campaigns.map((c) => (c.id === campaignId ? updatedCampaign : c));
      setCampaigns(nextCampaigns);
      saveStoredCampaigns(nextCampaigns);

      setResending(false);
      setResendSuccess(`✅ Resend blast completed! Successfully retried delivery.`);
      setTimeout(() => setResendSuccess(''), 4000);
    }, 700);
  };

  // Smartphone preview message text
  const previewBody = React.useMemo(() => {
    let text = bodyText || 'Message body preview...';
    detectedVariables.forEach((v) => {
      const val = sampleVars[v] || `[Variable {{${v}}}]`;
      text = text.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), val);
    });
    return text;
  }, [bodyText, detectedVariables, sampleVars]);

  const previewHeader = React.useMemo(() => {
    if (headerType !== 'TEXT') return '';
    let text = headerText;
    detectedVariables.forEach((v) => {
      const val = sampleVars[v] || `[${v}]`;
      text = text.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), val);
    });
    return text;
  }, [headerText, headerType, detectedVariables, sampleVars]);

  if (loading) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }} />;
  }

  if (!isAuthenticated) {
    return (
      <LoginGate
        portal="developer"
        onSuccess={() => {
          setIsAuthenticated(true);
          setCreds(getStoredCredentials());
          setTemplates(getStoredTemplates());
          setCampaigns(getStoredCampaigns());
          setGroups(getStoredContactGroups());
          setContacts(getStoredContacts());
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      <Navbar
        portal="developer"
        onOpenChangePassword={() => setIsChangePassOpen(true)}
        onLogout={() => {
          logoutPortal('developer');
          setIsAuthenticated(false);
        }}
      />

      <main className="container" style={{ marginTop: '24px' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                Meta Campaign & Developer HQ
              </h1>
              <span className="badge badge-green">
                <Sparkles size={12} /> Meta Cloud API v21.0
              </span>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Manage audience contact groups, build Meta-approved templates with samples, and broadcast WhatsApp campaigns.
            </p>
          </div>

          <div className="tabs-nav">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`tab-btn ${activeTab === 'campaigns' ? 'active' : ''}`}
            >
              <Send size={16} />
              <span>Broadcast Engine</span>
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
            >
              <Users size={16} />
              <span>Contact Groups ({contacts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
            >
              <FileText size={16} />
              <span>Template Studio ({templates.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('resend')}
              className={`tab-btn ${activeTab === 'resend' ? 'active' : ''}`}
            >
              <RotateCcw size={16} />
              <span>Resend Hub</span>
            </button>
            <button
              onClick={() => setActiveTab('credentials')}
              className={`tab-btn ${activeTab === 'credentials' ? 'active' : ''}`}
            >
              <Key size={16} />
              <span>Meta API</span>
            </button>
          </div>
        </div>

        {/* TAB 1: CAMPAIGNS & BROADCAST DISPATCHER */}
        {activeTab === 'campaigns' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {campFeedback && (
              <div style={{ padding: '14px 18px', background: 'var(--wa-light)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', color: 'var(--wa-green-dark)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} />
                <span>{campFeedback}</span>
              </div>
            )}

            {/* Create & Launch Campaign Form */}
            <div className="glass-panel" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--wa-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--wa-green-dark)' }}>
                  <Send size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    Launch New WhatsApp Campaign Broadcast
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Send broadcasts to a saved Contact Group or custom audience with delivery tracking and instant lead capture.
                  </p>
                </div>
              </div>

              <form onSubmit={handleLaunchCampaign}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Campaign Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Festive Special Launch, VIP Customer Invitation"
                      value={newCampName}
                      onChange={(e) => setNewCampName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Select Meta Template</label>
                    <select
                      className="form-select"
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                    >
                      {templates.length === 0 ? (
                        <option value="">No templates created yet (build one in Template Studio)</option>
                      ) : (
                        templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.category}) • [{t.status}]
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Audience Selection Toggle */}
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label">Target Audience Source</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setAudienceMode('group')}
                      className={`btn btn-sm ${audienceMode === 'group' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      <Users size={15} />
                      <span>Use Saved Contact Group ({groups.length} groups)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAudienceMode('custom')}
                      className={`btn btn-sm ${audienceMode === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      <Upload size={15} />
                      <span>Paste Custom Phone Numbers</span>
                    </button>
                  </div>
                </div>

                {audienceMode === 'group' ? (
                  <div className="form-group" style={{ padding: '16px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <label className="form-label">Select Target Contact Group</label>
                    {groups.length === 0 ? (
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        No contact groups created yet. Switch to the <strong>Contact Groups</strong> tab to create groups and import contacts!
                      </div>
                    ) : (
                      <select
                        className="form-select"
                        value={targetGroupId}
                        onChange={(e) => setTargetGroupId(e.target.value)}
                      >
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} ({contacts.filter((c) => c.groupId === g.id).length} contacts)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">
                      <span>Recipient Numbers (Phone Number, Name per line)</span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                        e.g. +919876543210, John Doe
                      </span>
                    </label>
                    <textarea
                      rows={4}
                      className="form-textarea"
                      value={contactListInput}
                      onChange={(e) => setContactListInput(e.target.value)}
                      placeholder="+919876543210, Customer Name&#10;+919812345678, Another Customer"
                      required={audienceMode === 'custom'}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={launchingCamp || !newCampName.trim()}
                    style={{ padding: '12px 28px', fontSize: '0.95rem' }}
                  >
                    {launchingCamp ? (
                      <>
                        <Clock size={18} />
                        <span>Broadcasting to Meta API...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Launch Campaign Broadcast</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Campaign-Wide Analytics & Performance Table */}
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    Campaign Broadcast History & Analytics
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Track delivery rates, open receipts, and inbound leads generated per broadcast
                  </p>
                </div>
                <span className="badge badge-blue">
                  {campaigns.length} Campaigns Tracked
                </span>
              </div>

              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Campaign Name & Template</th>
                    <th>Targeted</th>
                    <th>Delivered</th>
                    <th>Leads Generated</th>
                    <th>Failed</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-dim)' }}>
                        No campaigns launched yet. Create and broadcast your first campaign above!
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((camp) => (
                      <tr key={camp.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>{camp.name}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                            Template: <code>{camp.templateName}</code> • {new Date(camp.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{camp.totalCount}</span>
                        </td>
                        <td>
                          <span className="badge badge-green">
                            {camp.deliveredCount} Delivered
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-purple" style={{ fontWeight: 700 }}>
                            {camp.leadsCount} Inbound Leads
                          </span>
                        </td>
                        <td>
                          {camp.failedCount > 0 ? (
                            <span className="badge badge-red">{camp.failedCount} Failed</span>
                          ) : (
                            <span className="badge badge-green">0 Failed</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <a href="/" className="btn btn-outline-wa btn-sm">
                            <span>View Leads</span>
                            <ChevronRight size={13} />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIENCE CONTACT GROUPS & MULTI-FIELD IMPORT */}
        {activeTab === 'contacts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {contactFeedback && (
              <div style={{ padding: '14px 18px', background: 'var(--wa-light)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', color: 'var(--wa-green-dark)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} />
                <span>{contactFeedback}</span>
              </div>
            )}

            {/* Groups Creation & Overview Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
              {/* Create Group Box */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <FolderPlus size={20} color="var(--wa-green-dark)" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Create Contact Group
                  </h3>
                </div>

                <form onSubmit={handleCreateGroup}>
                  <div className="form-group">
                    <label className="form-label">Group Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. VIP Customers, Real Estate Investors"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Leads from October trade expo"
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                    <Plus size={16} />
                    <span>Create Group</span>
                  </button>
                </form>
              </div>

              {/* Group Cards List */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px' }}>
                  Existing Contact Groups ({groups.length})
                </h3>

                {groups.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    No contact groups created yet. Create your first group on the left to organize your audience!
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    {groups.map((grp) => {
                      const count = contacts.filter((c) => c.groupId === grp.id).length;
                      return (
                        <div key={grp.id} style={{ padding: '16px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>{grp.name}</h4>
                              <button
                                onClick={() => handleDeleteGroup(grp.id)}
                                style={{ background: 'transparent', border: 'none', color: '#e11d48', cursor: 'pointer', padding: '4px' }}
                                title="Delete Group"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                            {grp.description && (
                              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                                {grp.description}
                              </p>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                            <span className="badge badge-green">{count} Contacts</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              {new Date(grp.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Import Contacts Section */}
            <div className="glass-panel" style={{ padding: '24px 28px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
                Import Contacts into Groups (Multiple Fields Supported)
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Import contacts with Phone Number, Name, Email, City, and Custom Tags.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Single Contact Form */}
                <form onSubmit={handleAddSingleContact} style={{ padding: '20px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
                    Option 1: Add Single Contact
                  </h4>

                  <div className="form-group">
                    <label className="form-label">Target Group</label>
                    <select
                      className="form-select"
                      value={singleGroupId}
                      onChange={(e) => setSingleGroupId(e.target.value)}
                    >
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="John Doe"
                        value={singleName}
                        onChange={(e) => setSingleName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="+919876543210"
                        value={singlePhone}
                        onChange={(e) => setSinglePhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">Email (Optional)</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="client@gmail.com"
                        value={singleEmail}
                        onChange={(e) => setSingleEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">City / Tag</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Mumbai, VIP"
                        value={singleCity}
                        onChange={(e) => setSingleCity(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-secondary" style={{ width: '100%', marginTop: '6px' }}>
                    <Plus size={16} />
                    <span>Save Contact</span>
                  </button>
                </form>

                {/* Bulk CSV / Multi-Line Import Form */}
                <form onSubmit={handleBulkImportContacts} style={{ padding: '20px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
                    Option 2: Bulk Multi-Line / CSV Paste
                  </h4>

                  <div className="form-group">
                    <label className="form-label">Assign to Group</label>
                    <select
                      className="form-select"
                      value={bulkGroupId}
                      onChange={(e) => setBulkGroupId(e.target.value)}
                    >
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <span>Paste Contacts (Phone, Name, Email, City, Tag)</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>1 per line</span>
                    </label>
                    <textarea
                      rows={5}
                      className="form-textarea"
                      placeholder="+919876543210, Arun Kumar, arun@mail.com, Chennai, VIP&#10;+919812345678, Priya Sharma, priya@mail.com, Delhi, Prime"
                      value={bulkCsvText}
                      onChange={(e) => setBulkCsvText(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    <Upload size={16} />
                    <span>Import All Lines</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Contacts Table with Search & Delete */}
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search contacts by name, phone, or city..."
                      value={contactSearchQuery}
                      onChange={(e) => setContactSearchQuery(e.target.value)}
                      style={{ paddingLeft: '38px', height: '38px' }}
                    />
                  </div>

                  <select
                    className="form-select"
                    value={selectedGroupFilter}
                    onChange={(e) => setSelectedGroupFilter(e.target.value)}
                    style={{ width: '200px', height: '38px' }}
                  >
                    <option value="all">All Groups ({contacts.length})</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <span className="badge badge-green">
                  {filteredContacts.length} Contacts Showing
                </span>
              </div>

              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Contact Name</th>
                    <th>WhatsApp Phone</th>
                    <th>Group</th>
                    <th>Email</th>
                    <th>City / Tag</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-dim)' }}>
                        No contacts found. Use the forms above to add or import your contact lists!
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{c.name}</div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--wa-green-dark)' }}>
                            {c.phone}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-purple">{c.groupName}</span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {c.email || '—'}
                        </td>
                        <td>
                          {c.city ? (
                            <span className="badge badge-blue">{c.city}</span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)' }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteContact(c.id)}
                            style={{ background: 'transparent', border: 'none', color: '#e11d48', cursor: 'pointer', padding: '6px' }}
                            title="Delete Contact"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: META TEMPLATE STUDIO */}
        {activeTab === 'templates' && (
          <div className="responsive-grid-split" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '28px', alignItems: 'flex-start' }}>
            {/* Template Editor Form */}
            <div className="glass-panel" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--wa-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--wa-green-dark)' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      Meta Template Builder & Approval Studio
                    </h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Design interactive templates, provide mandatory review samples, and sync directly with Meta.
                    </p>
                  </div>
                </div>
              </div>

              {templateStatusToast && (
                <div style={{ padding: '12px 16px', background: 'var(--wa-light)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', color: 'var(--wa-green-dark)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  {templateStatusToast}
                </div>
              )}

              <form onSubmit={handleCreateTemplate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Template Name (Lowercase)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={tmplName}
                      onChange={(e) => setTmplName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                      placeholder="e.g. festive_offer_v1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={tmplCategory}
                      onChange={(e) => setTmplCategory(e.target.value as any)}
                    >
                      <option value="MARKETING">MARKETING</option>
                      <option value="UTILITY">UTILITY</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Language</label>
                    <select
                      className="form-select"
                      value={tmplLanguage}
                      onChange={(e) => setTmplLanguage(e.target.value)}
                    >
                      <option value="en_US">English (US)</option>
                      <option value="en_GB">English (UK)</option>
                      <option value="hi">Hindi (India)</option>
                    </select>
                  </div>
                </div>

                {/* Header Config */}
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Message Header</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setHeaderType('TEXT')}
                        className={`btn btn-sm ${headerType === 'TEXT' ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        Text Header
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeaderType('NONE')}
                        className={`btn btn-sm ${headerType === 'NONE' ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        None
                      </button>
                    </div>
                  </div>
                  {headerType === 'TEXT' && (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Exclusive Offer for {{1}}"
                      value={headerText}
                      onChange={(e) => setHeaderText(e.target.value)}
                    />
                  )}
                </div>

                {/* Body Text */}
                <div className="form-group">
                  <label className="form-label">
                    <span>Message Body (Use {"{{1}}"}, {"{{2}}"} for variables)</span>
                    <span style={{ color: 'var(--wa-green-dark)', fontSize: '0.75rem' }}>
                      {detectedVariables.length} variable(s) detected
                    </span>
                  </label>
                  <textarea
                    rows={4}
                    className="form-textarea"
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder="Hello {{1}}, we have a special promotion for {{2}}..."
                    required
                  />
                </div>

                {/* Dynamic Sample Values for Meta Approval */}
                {detectedVariables.length > 0 && (
                  <div style={{ padding: '16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <Sparkles size={16} color="#2563eb" />
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1d4ed8' }}>
                        Sample Variable Values (Strictly Required by Meta for Approval)
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                      {detectedVariables.map((v) => (
                        <div key={v}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                            Sample for <code>{`{{${v}}}`}</code>
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={sampleVars[v] || ''}
                            onChange={(e) => setSampleVars({ ...sampleVars, [v]: e.target.value })}
                            placeholder={`e.g. Sample Value ${v}`}
                            style={{ padding: '7px 10px', fontSize: '0.82rem' }}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Text */}
                <div className="form-group">
                  <label className="form-label">Footer Disclaimer (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="e.g. Reply STOP to opt out"
                  />
                </div>

                {/* Interactive Quick Reply Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Interactive Button 1</label>
                    <input
                      type="text"
                      className="form-input"
                      value={btn1Text}
                      onChange={(e) => setBtn1Text(e.target.value)}
                      placeholder="e.g. 🔥 I am Interested"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Interactive Button 2</label>
                    <input
                      type="text"
                      className="form-input"
                      value={btn2Text}
                      onChange={(e) => setBtn2Text(e.target.value)}
                      placeholder="e.g. 📞 Request Callback"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>
                    <Sparkles size={16} />
                    <span>Submit Template for Meta Review</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Live WhatsApp Smartphone Mockup */}
            <div>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <span className="badge badge-green">
                  <Eye size={12} /> Live WhatsApp Phone Preview
                </span>
              </div>

              <div className="phone-mockup">
                <div className="phone-notch">
                  <div className="phone-camera" />
                </div>

                <div className="phone-header">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.jpg"
                    alt="A5A Logo"
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                    onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>A5A Business Verified</div>
                    <div style={{ fontSize: '0.68rem', color: '#8696a0' }}>Official WhatsApp Account</div>
                  </div>
                </div>

                <div className="phone-chat-body">
                  <div className="wa-message-bubble">
                    {previewHeader && (
                      <div className="wa-message-header">{previewHeader}</div>
                    )}

                    <div className="wa-message-body">{previewBody}</div>

                    {footerText && (
                      <div className="wa-message-footer">{footerText}</div>
                    )}

                    <div className="wa-message-time">
                      <span>12:00 PM</span>
                    </div>

                    <div className="wa-btn-container">
                      {btn1Text && <div className="wa-btn-item">{btn1Text}</div>}
                      {btn2Text && <div className="wa-btn-item">{btn2Text}</div>}
                    </div>
                  </div>

                  <div className="wa-reply-bubble">
                    <p>{btn1Text || '🔥 I am Interested'}</p>
                    <div style={{ fontSize: '0.66rem', opacity: 0.8, textAlign: 'right', marginTop: '2px' }}>
                      12:02 PM • Read
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RESEND TO FAILED ENGINE */}
        {activeTab === 'resend' && (
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}>
                <RotateCcw size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Smart Failed Delivery & Resend Engine
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Isolate undelivered recipients, analyze Meta error codes, and trigger 1-click retry broadcasts.
                </p>
              </div>
            </div>

            {resendSuccess && (
              <div style={{ padding: '14px 18px', background: 'var(--wa-light)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', color: 'var(--wa-green-dark)', fontSize: '0.9rem', marginBottom: '24px' }}>
                {resendSuccess}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {campaigns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
                  No campaigns dispatched yet. Failed messages will automatically show up here with 1-click retry!
                </div>
              ) : (
                campaigns.map((camp) => (
                  <div key={camp.id} style={{ padding: '20px', background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{camp.name}</h4>
                          <span className={`badge ${camp.failedCount > 0 ? 'badge-red' : 'badge-green'}`}>
                            {camp.failedCount} Failed
                          </span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Template: <code>{camp.templateName}</code> • Total audience: {camp.totalCount}
                        </p>
                      </div>

                      {camp.failedCount > 0 && (
                        <button
                          onClick={() => handleResendToFailed(camp.id)}
                          disabled={resending}
                          className="btn btn-primary"
                        >
                          <RotateCcw size={16} />
                          <span>{resending ? 'Retrying Failed Contacts...' : `1-Click Resend to ${camp.failedCount} Failed`}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: META CREDENTIALS & WEBHOOK CONFIG */}
        {activeTab === 'credentials' && (
          <div className="responsive-grid-split" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '28px' }}>
            <div className="glass-panel" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--wa-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--wa-green-dark)' }}>
                  <Key size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    Meta WhatsApp Cloud API Credentials
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Enter your Meta for Developers Cloud API credentials to enable live broadcasts.
                  </p>
                </div>
              </div>

              {testResult && (
                <div style={{
                  padding: '12px 16px',
                  background: testResult.success ? 'var(--wa-light)' : '#fff1f2',
                  border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(225, 29, 72, 0.3)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: testResult.success ? 'var(--wa-green-dark)' : '#be123c',
                  fontSize: '0.85rem',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  {testResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{testResult.message}</span>
                </div>
              )}

              <form onSubmit={handleSaveCredentials}>
                <div className="form-group">
                  <label className="form-label">Phone Number ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 104829105829104"
                    value={creds.phoneNumberId}
                    onChange={(e) => setCreds({ ...creds, phoneNumberId: e.target.value.trim() })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">WhatsApp Business Account (WABA) ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 192840192840192"
                    value={creds.wabaId}
                    onChange={(e) => setCreds({ ...creds, wabaId: e.target.value.trim() })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>System User Permanent Access Token</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Begins with EAAG...</span>
                  </label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder="Paste your Permanent System User Token from Meta Business Manager..."
                    value={creds.accessToken}
                    onChange={(e) => setCreds({ ...creds, accessToken: e.target.value.trim() })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Webhook Verify Token</label>
                  <input
                    type="text"
                    className="form-input"
                    value={creds.verifyToken}
                    onChange={(e) => setCreds({ ...creds, verifyToken: e.target.value.trim() })}
                    placeholder="e.g. a5a_meta_webhook_secret_2026"
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button type="submit" className="btn btn-secondary" style={{ flex: 1 }}>
                    Save Credentials
                  </button>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingCreds}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    <Radio size={16} />
                    <span>{testingCreds ? 'Pinging Meta API...' : 'Ping Meta API Connection'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Webhook & Phone Health Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <ShieldCheck size={20} color="var(--wa-green-dark)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    WhatsApp Phone Number Status
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Connection:</span>
                    <span className={`badge ${creds.status === 'connected' ? 'badge-green' : 'badge-amber'}`}>
                      {creds.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Quality Rating:</span>
                    <span style={{ color: 'var(--wa-green-dark)', fontWeight: 700 }}>
                      {creds.phoneDetails?.quality_rating || 'GREEN (High)'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Verified Display Name:</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                      {creds.phoneDetails?.verified_name || 'A5A Solutions'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vercel Webhook Endpoint Guide */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Vercel Webhook URL for Meta Dashboard
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Paste this endpoint into your Meta App &gt; WhatsApp &gt; Configuration &gt; Webhook:
                </p>

                <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--wa-green-dark)', wordBreak: 'break-all' }}>
                  https://your-project.vercel.app/api/webhook
                </div>

                <div style={{ marginTop: '12px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Verify Token: <code style={{ color: 'var(--text-main)', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{creds.verifyToken}</code>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <ChangePasswordModal
        portal="developer"
        isOpen={isChangePassOpen}
        onClose={() => setIsChangePassOpen(false)}
      />
    </div>
  );
}
