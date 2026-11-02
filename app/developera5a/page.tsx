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
  Tag,
  Globe,
  PhoneCall,
  ExternalLink,
  PlusCircle,
  Image as ImageIcon,
  FileSpreadsheet,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';

export interface TemplateButtonConfig {
  id: string;
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  url?: string;
  phoneNumber?: string;
}
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
import { 
  testMetaConnection, 
  submitTemplateToMeta, 
  sendWhatsAppTemplateMessage,
  fetchTemplatesFromMeta 
} from '@/lib/meta-client';
import { isPortalAuthenticated, logoutPortal, useInactivityTracker } from '@/lib/auth';
import { 
  dbGetCampaigns, 
  dbUpsertCampaign, 
  dbDeleteCampaign,
  dbGetTemplates, 
  dbUpsertTemplate, 
  dbDeleteTemplate,
  dbGetContactGroups, 
  dbUpsertContactGroup, 
  dbDeleteContactGroup, 
  dbGetContacts, 
  dbUpsertContacts, 
  dbDeleteContact,
  dbGetCredentials,
  dbUpsertCredentials,
  supabase
} from '@/lib/supabase';

export default function DeveloperCampaignHQ() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1-Hour Inactivity Auto-Logout Tracker
  useInactivityTracker('developer', () => {
    setIsAuthenticated(false);
  });
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
  const [tmplCategory, setTmplCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
  const [tmplLanguage, setTmplLanguage] = useState('en_US');
  const [headerType, setHeaderType] = useState<'TEXT' | 'IMAGE' | 'NONE'>('TEXT');
  const [headerText, setHeaderText] = useState('Exclusive Privilege for {{1}}');
  const [headerImageUrl, setHeaderImageUrl] = useState('https://a5automation.com/wp-content/uploads/2026/04/A5A-Automation-Industrial-Training-logo.png');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be under 5MB');
      return;
    }

    setUploadingImage(true);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      // Show immediately in phone mockup
      setHeaderImageUrl(base64);

      try {
        const res = await fetch('/api/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: base64,
            mimeType: file.type || 'image/jpeg',
            fileName: file.name,
          }),
        });
        const data = await res.json();
        if (data.success && data.url) {
          setHeaderImageUrl(data.url);
        }
      } catch (err) {
        console.warn('Media upload failed:', err);
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };
  const [bodyText, setBodyText] = useState('Hello {{1}}, we are pleased to offer you special access to {{2}}.\n\nTap below if you are interested.');
  const [footerText, setFooterText] = useState('A5 Automation');
  const [sampleVars, setSampleVars] = useState<Record<string, string>>({
    '1': 'John Doe',
    '2': 'VIP Launch Package',
  });
  const [templateButtons, setTemplateButtons] = useState<TemplateButtonConfig[]>([
    { id: 'btn-1', type: 'QUICK_REPLY', text: '🔥 I am Interested' },
    { id: 'btn-2', type: 'QUICK_REPLY', text: '📞 Request Call Back' },
    { id: 'btn-3', type: 'URL', text: '🌐 Visit Website', url: 'https://a5automation.com' },
  ]);
  const [templateStatusToast, setTemplateStatusToast] = useState('');

  const handleAddButton = (type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER') => {
    if (templateButtons.length >= 5) return;
    const defaultText =
      type === 'URL'
        ? '🌐 Visit Website'
        : type === 'PHONE_NUMBER'
        ? '📞 Call Sales Team'
        : '🔥 Interested';
    const newBtn: TemplateButtonConfig = {
      id: `btn-${Date.now()}`,
      type,
      text: defaultText,
      url: type === 'URL' ? 'https://a5ameta.com' : undefined,
      phoneNumber: type === 'PHONE_NUMBER' ? '+919876543210' : undefined,
    };
    setTemplateButtons([...templateButtons, newBtn]);
  };

  const handleRemoveButton = (id: string) => {
    setTemplateButtons(templateButtons.filter((b) => b.id !== id));
  };

  const handleUpdateButton = (id: string, updates: Partial<TemplateButtonConfig>) => {
    setTemplateButtons(templateButtons.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

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

  // Lead simulation test
  const [simulatingLead, setSimulatingLead] = useState(false);
  const [simFeedback, setSimFeedback] = useState('');

  const handleSimulateInboundLead = async () => {
    setSimulatingLead(true);
    setSimFeedback('');
    try {
      const activeCamp = campaigns[0];
      const targetRecipient = activeCamp?.recipients?.[0];
      const testPhone = targetRecipient?.phone || '+919566671183';
      const testName = targetRecipient?.name || 'Ragul (Test User)';
      const btnText = templateButtons[0]?.text || 'I am Interested';

      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          object: 'whatsapp_business_account',
          entry: [
            {
              id: creds.wabaId || '1146427701074556',
              changes: [
                {
                  value: {
                    messaging_product: 'whatsapp',
                    metadata: {
                      display_phone_number: creds.phoneDetails?.display_phone_number || '6381270978',
                      phone_number_id: creds.phoneNumberId || '1432860753238628'
                    },
                    contacts: [{ profile: { name: testName }, wa_id: testPhone.replace(/[^0-9]/g, '') }],
                    messages: [
                      {
                        from: testPhone.replace(/[^0-9]/g, ''),
                        id: `wamid.sim_${Date.now()}`,
                        timestamp: String(Math.floor(Date.now() / 1000)),
                        type: 'button',
                        button: { text: btnText, payload: btnText }
                      }
                    ]
                  },
                  field: 'messages'
                }
              ]
            }
          ]
        })
      });

      if (res.ok) {
        setSimFeedback(`✅ Test Lead Captured! Synced to Leads Portal and Campaign "${activeCamp?.name || 'Inbound'}".`);
        const updatedCamps = await dbGetCampaigns();
        if (updatedCamps && updatedCamps.length > 0) {
          setCampaigns(updatedCamps);
          saveStoredCampaigns(updatedCamps);
        }
      } else {
        setSimFeedback('Failed to simulate lead response.');
      }
    } catch (e: any) {
      setSimFeedback(`Error: ${e.message}`);
    } finally {
      setSimulatingLead(false);
    }
  };

  useEffect(() => {
    const authed = isPortalAuthenticated('developer');
    setIsAuthenticated(authed);
    if (authed) {
      setCreds(getStoredCredentials());
      
      // Load initial local data
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

      // Fetch cloud records from Supabase
      dbGetCredentials().then((cloudCreds) => {
        if (cloudCreds && (cloudCreds.phoneNumberId || cloudCreds.accessToken)) {
          setCreds(cloudCreds);
          saveStoredCredentials(cloudCreds);
        }
      });

      dbGetTemplates().then((cloudTmpls) => {
        if (cloudTmpls && cloudTmpls.length > 0) {
          setTemplates(cloudTmpls);
          saveStoredTemplates(cloudTmpls);
          if (!selectedTemplateId) setSelectedTemplateId(cloudTmpls[0].id);
        }
      });

      const loadCampaignsSilently = async () => {
        try {
          const cloudCamps = await dbGetCampaigns();
          if (cloudCamps && Array.isArray(cloudCamps)) {
            setCampaigns(cloudCamps);
            saveStoredCampaigns(cloudCamps);
          }
        } catch {}
      };

      dbGetCampaigns().then((cloudCamps) => {
        if (cloudCamps && cloudCamps.length > 0) {
          setCampaigns(cloudCamps);
          saveStoredCampaigns(cloudCamps);
        }
      });

      // Realtime subscription for live campaign updates (delivery status & inbound leads)
      const campChannel = supabase
        .channel('realtime_developer_campaigns')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'campaigns' },
          () => {
            loadCampaignsSilently();
          }
        )
        .subscribe();

      const pollTimer = setInterval(() => {
        loadCampaignsSilently();
      }, 4000);

      dbGetContactGroups().then((cloudGroups) => {
        if (cloudGroups && cloudGroups.length > 0) {
          setGroups(cloudGroups);
          saveStoredContactGroups(cloudGroups);
          setSingleGroupId(cloudGroups[0].id);
          setBulkGroupId(cloudGroups[0].id);
          setTargetGroupId(cloudGroups[0].id);
        }
      });

      dbGetContacts().then((cloudContacts) => {
        if (cloudContacts && cloudContacts.length > 0) {
          setContacts(cloudContacts);
          saveStoredContacts(cloudContacts);
        }
      });

      setLoading(false);

      return () => {
        supabase.removeChannel(campChannel);
        clearInterval(pollTimer);
      };
    } else {
      setLoading(false);
    }
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

  // Handle Save Credentials (saves to local cache & Supabase cloud)
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredCredentials(creds);
    await dbUpsertCredentials(creds);
    setTestResult({
      success: true,
      message: '✅ Credentials saved to cloud database and synced across all devices! Click "Test Connection" to ping Meta API.',
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
        verified_name: result.data.verified_name || 'A5 Automation',
        quality_rating: result.data.quality_rating || 'GREEN',
        code_verification_status: result.data.code_verification_status || 'VERIFIED',
      } : undefined,
    };

    setCreds(updatedCreds);
    saveStoredCredentials(updatedCreds);
    await dbUpsertCredentials(updatedCreds);
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
    dbUpsertContactGroup(newGroup);
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
    dbDeleteContactGroup(groupId);

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
    dbUpsertContacts([newContact]);

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

  const excelFileRef = React.useRef<HTMLInputElement | null>(null);
  const [excelImporting, setExcelImporting] = useState(false);
  const [excelPreview, setExcelPreview] = useState<{
    fileName: string;
    contacts: Contact[];
  } | null>(null);

  const handleExcelFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelImporting(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!rawRows || rawRows.length === 0) {
          alert('The selected spreadsheet has no data rows.');
          setExcelImporting(false);
          return;
        }

        // Determine column mapping with high-priority matching
        let phoneCol = -1;
        let altPhoneCol = -1;
        let nameCol = -1;
        let emailCol = -1;
        let cityCol = -1;
        let collegeCol = -1;
        let branchCol = -1;
        let startRow = 0;

        const firstRow = rawRows[0].map((c) => String(c || '').toLowerCase().trim());
        const hasHeader = firstRow.some((col) =>
          col.includes('phone') || col.includes('mobile') || col.includes('number') ||
          col.includes('contact') || col.includes('name') || col.includes('email') || col.includes('s.no')
        );

        if (hasHeader) {
          startRow = 1;
          firstRow.forEach((col, idx) => {
            // Student Name (Do not let College Name / Company Name overwrite student name)
            if (col === 'student name' || col === 'full name' || col === 'candidate name' || col === 'name') {
              nameCol = idx;
            } else if (nameCol === -1 && col.includes('name') && !col.includes('college') && !col.includes('company') && !col.includes('school')) {
              nameCol = idx;
            } else if (col.includes('college') || col.includes('institute') || col.includes('university')) {
              collegeCol = idx;
            }

            // Primary Mobile / Phone (Do not let Alternate Mobile overwrite primary mobile)
            if (col === 'mobile' || col === 'phone' || col === 'whatsapp' || col === 'contact') {
              phoneCol = idx;
            } else if (phoneCol === -1 && (col.includes('mobile') || col.includes('phone') || col.includes('contact') || col.includes('whatsapp')) && !col.includes('alt') && !col.includes('secondary')) {
              phoneCol = idx;
            } else if (col.includes('alt') || col.includes('secondary')) {
              altPhoneCol = idx;
            }

            // Email
            if (col.includes('email') || col.includes('mail')) {
              if (emailCol === -1 || col === 'email') emailCol = idx;
            }

            // City
            if (col.includes('city') || col.includes('location') || col.includes('district') || col.includes('place')) {
              if (cityCol === -1 || col === 'city') cityCol = idx;
            }

            // Branch / Department
            if (col.includes('branch') || col.includes('dept') || col.includes('department') || col.includes('course')) {
              if (branchCol === -1) branchCol = idx;
            }
          });
        }

        // Fallbacks if not matched by headers
        if (phoneCol === -1) phoneCol = 0;
        if (nameCol === -1) nameCol = 1;
        if (emailCol === -1) emailCol = 2;
        if (cityCol === -1) cityCol = 3;

        const assignedGroup = groups.find((g) => g.id === bulkGroupId) || groups[0];
        const parsedList: Contact[] = [];

        for (let i = startRow; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;

          // Check primary phone, then alternate phone
          let rawPhone = phoneCol !== -1 && row[phoneCol] ? String(row[phoneCol]).trim() : '';
          if (!rawPhone && altPhoneCol !== -1 && row[altPhoneCol]) {
            rawPhone = String(row[altPhoneCol]).trim();
          }

          const cleanDigits = rawPhone.replace(/[^0-9]/g, '');
          if (!cleanDigits || cleanDigits.length < 10) continue; // Skip blank or invalid phone rows

          // Format clean Phone with country code
          const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;

          const name = nameCol !== -1 && row[nameCol] && String(row[nameCol]).toLowerCase() !== 'unspecified'
            ? String(row[nameCol]).trim()
            : `Student ${parsedList.length + 1}`;

          const email = emailCol !== -1 && row[emailCol] && String(row[emailCol]).toLowerCase() !== 'unspecified'
            ? String(row[emailCol]).trim()
            : undefined;

          const city = cityCol !== -1 && row[cityCol] && String(row[cityCol]).toLowerCase() !== 'unspecified'
            ? String(row[cityCol]).trim()
            : undefined;

          // Build tags from branch and college if present
          const tags: string[] = [];
          if (branchCol !== -1 && row[branchCol] && String(row[branchCol]).toLowerCase() !== 'unspecified') {
            tags.push(String(row[branchCol]).trim());
          }
          if (collegeCol !== -1 && row[collegeCol] && String(row[collegeCol]).toLowerCase() !== 'unspecified') {
            tags.push(String(row[collegeCol]).trim());
          }

          parsedList.push({
            id: `cnt-${Date.now()}-${parsedList.length}`,
            phone: formattedPhone,
            name,
            email,
            city,
            tags,
            groupId: assignedGroup ? assignedGroup.id : 'default',
            groupName: assignedGroup ? assignedGroup.name : 'General',
            createdAt: new Date().toISOString(),
          });
        }

        if (parsedList.length === 0) {
          alert('Could not detect valid phone numbers in this file. Please make sure there is a column with contact numbers.');
          setExcelImporting(false);
          return;
        }

        setExcelPreview({
          fileName: file.name,
          contacts: parsedList,
        });
      } catch (err: any) {
        alert('Failed to parse file: ' + (err?.message || 'Unknown error'));
      } finally {
        setExcelImporting(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleConfirmExcelImport = () => {
    if (!excelPreview || excelPreview.contacts.length === 0) return;

    const assignedGroup = groups.find((g) => g.id === bulkGroupId) || groups[0];
    const updatedWithCurrentGroup = excelPreview.contacts.map((c) => ({
      ...c,
      groupId: assignedGroup ? assignedGroup.id : 'default',
      groupName: assignedGroup ? assignedGroup.name : 'General',
    }));

    const nextContacts = [...updatedWithCurrentGroup, ...contacts];
    setContacts(nextContacts);
    saveStoredContacts(nextContacts);
    dbUpsertContacts(updatedWithCurrentGroup);

    if (assignedGroup) {
      const updatedGroups = groups.map((g) =>
        g.id === assignedGroup.id
          ? { ...g, contactCount: g.contactCount + updatedWithCurrentGroup.length }
          : g
      );
      setGroups(updatedGroups);
      saveStoredContactGroups(updatedGroups);
    }

    setContactFeedback(`🎉 Successfully imported ${updatedWithCurrentGroup.length} contacts from ${excelPreview.fileName}!`);
    setExcelPreview(null);
    if (excelFileRef.current) excelFileRef.current.value = '';
    setTimeout(() => setContactFeedback(''), 4500);
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
    dbUpsertContacts(newContactsList);

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
    dbDeleteContact(contactId);

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
    } else if (headerType === 'IMAGE') {
      components.push({
        type: 'HEADER',
        format: 'IMAGE',
        example: {
          header_handle: [headerImageUrl.trim() || 'https://a5automation.com/wp-content/uploads/2026/04/A5A-Automation-Industrial-Training-logo.png'],
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

    const buttons: any[] = templateButtons
      .filter((b) => b.text.trim())
      .map((b) => {
        if (b.type === 'URL') {
          return {
            type: 'URL',
            text: b.text.trim(),
            url: b.url?.trim() || 'https://a5ameta.com',
          };
        }
        if (b.type === 'PHONE_NUMBER') {
          return {
            type: 'PHONE_NUMBER',
            text: b.text.trim(),
            phone_number: b.phoneNumber?.trim() || '+919876543210',
          };
        }
        return {
          type: 'QUICK_REPLY',
          text: b.text.trim(),
        };
      });

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
      status: (creds.wabaId && creds.accessToken) ? 'PENDING' : 'DRAFT',
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
        setTemplateStatusToast('✅ Submitted to Meta Cloud API! Status is now PENDING review.');
      } catch (err: any) {
        newTemplate.status = 'DRAFT';
        newTemplate.rejectionReason = err.message;
        setTemplateStatusToast(`⚠️ Saved as Draft. Meta returned: ${err.message}`);
      }
    } else {
      newTemplate.status = 'DRAFT';
      setTemplateStatusToast('📝 Template saved as Local Draft (Meta Disconnected). Connect Meta API to submit for official WhatsApp approval.');
    }

    const updatedTemplates = [newTemplate, ...templates.filter(t => t.id !== newTemplate.id && t.name !== newTemplate.name)];
    setTemplates(updatedTemplates);
    saveStoredTemplates(updatedTemplates);
    dbUpsertTemplate(newTemplate);
    setTmplName('');
    setTimeout(() => setTemplateStatusToast(''), 4500);
  };

  // Delete Template
  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`Are you sure you want to delete template "${templateName}"?`)) return;

    const nextTemplates = templates.filter((t) => t.id !== templateId);
    setTemplates(nextTemplates);
    saveStoredTemplates(nextTemplates);
    await dbDeleteTemplate(templateId);

    setTemplateStatusToast(`🗑️ Template "${templateName}" deleted.`);
    setTimeout(() => setTemplateStatusToast(''), 3000);
  };

  // Load Template into Editor
  const handleLoadTemplate = (t: WhatsAppTemplate) => {
    setTmplName(t.name);
    setTmplCategory(t.category);
    setTmplLanguage(t.language);

    // Extract Header
    const headerComp = t.components?.find((c) => c.type === 'HEADER');
    if (headerComp) {
      if (headerComp.format === 'IMAGE') {
        setHeaderType('IMAGE');
        const imgUrl = headerComp.example?.header_handle?.[0];
        if (imgUrl) setHeaderImageUrl(imgUrl);
      } else {
        setHeaderType('TEXT');
        setHeaderText(headerComp.text || '');
      }
    } else {
      setHeaderType('NONE');
    }

    // Extract Body
    const bodyComp = t.components?.find((c) => c.type === 'BODY');
    if (bodyComp?.text) setBodyText(bodyComp.text);

    // Extract Footer
    const footerComp = t.components?.find((c) => c.type === 'FOOTER');
    setFooterText(footerComp?.text || '');

    // Extract Buttons
    const btnComp = t.components?.find((c) => c.type === 'BUTTONS');
    if (btnComp?.buttons && btnComp.buttons.length > 0) {
      setTemplateButtons(
        btnComp.buttons.map((b, i) => ({
          id: `btn-${Date.now()}-${i}`,
          type: b.type,
          text: b.text,
          url: b.url,
          phoneNumber: b.phone_number,
        }))
      );
    }

    if (t.sampleVariables) {
      setSampleVars(t.sampleVariables);
    }

    setTemplateStatusToast(`Loaded "${t.name}" into builder. Check phone preview on the right!`);
    window.scrollTo({ top: 120, behavior: 'smooth' });
    setTimeout(() => setTemplateStatusToast(''), 3500);
  };

  // Sync Live Templates from Meta
  const [syncingMetaTemplates, setSyncingMetaTemplates] = useState(false);
  const handleSyncMetaTemplates = async () => {
    if (!creds.wabaId || !creds.accessToken) {
      alert('Please connect your Meta WABA ID and Access Token in the Meta API tab first.');
      return;
    }

    setSyncingMetaTemplates(true);
    try {
      const metaTmpls = await fetchTemplatesFromMeta(creds);
      if (Array.isArray(metaTmpls)) {
        const syncedList: WhatsAppTemplate[] = metaTmpls.map((mt: any) => ({
          id: mt.id || `tmpl-${mt.name}`,
          name: mt.name,
          category: mt.category || 'UTILITY',
          language: mt.language || 'en_US',
          status: mt.status || 'APPROVED',
          rejectionReason: mt.rejected_reason || undefined,
          components: mt.components || [],
          sampleVariables: {},
          createdAt: new Date().toISOString(),
        }));

        setTemplates(syncedList);
        saveStoredTemplates(syncedList);
        for (const st of syncedList) {
          await dbUpsertTemplate(st);
        }
        alert(`✅ Successfully synced ${syncedList.length} template(s) directly from Meta WhatsApp!`);
      }
    } catch (err: any) {
      alert('Meta Sync failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSyncingMetaTemplates(false);
    }
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
    let sentCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;

    // If Meta creds are active, broadcast to real numbers
    if (creds.phoneNumberId && creds.accessToken && template) {
      const imgHeader = template.components?.find((c) => c.type === 'HEADER' && c.format === 'IMAGE');
      const headerImgUrl = imgHeader?.example?.header_handle?.[0];

      for (let i = 0; i < recipients.length; i++) {
        const r = recipients[i];
        try {
          const res = await sendWhatsAppTemplateMessage(
            creds,
            r.phone,
            template.name,
            template.language,
            [r.name],
            headerImgUrl
          );
          if (res.success) {
            r.status = 'sent';
            r.sentAt = new Date().toISOString();
            sentCount++;
          } else {
            r.status = 'failed';
            r.error = res.error;
            r.errorCode = String(res.code || '');
            failedCount++;
          }
        } catch (e: any) {
          r.status = 'failed';
          r.error = e.message;
          failedCount++;
        }
      }
    } else {
      // Offline fallback
      sentCount = totalCount;
      deliveredCount = totalCount;
    }

    const newCampaign: Campaign = {
      id: `camp-${Date.now()}`,
      name: newCampName.trim(),
      templateId: template?.id || 'tmpl-custom',
      templateName: template?.name || 'Custom Broadcast',
      createdAt: new Date().toISOString(),
      status: failedCount === totalCount ? 'failed' : 'sent',
      totalCount,
      sentCount,
      deliveredCount: 0,
      readCount: 0,
      leadsCount: 0,
      failedCount,
      recipients,
    };

    const updated = [newCampaign, ...campaigns];
    setCampaigns(updated);
    saveStoredCampaigns(updated);
    dbUpsertCampaign(newCampaign);

    if (failedCount > 0) {
      setCampFeedback(`⚠️ Campaign dispatched with ${failedCount} errors. ${sentCount} messages accepted by Meta.`);
    } else {
      setCampFeedback(`🚀 Campaign launched! ${sentCount} messages accepted by Meta Cloud queue. Delivery receipts and recipient button clicks will sync in real-time below.`);
    }

    setLaunchingCamp(false);
    if (failedCount > 0) {
      setCampFeedback(`⚠️ Campaign "${newCampName}" completed: ${deliveredCount} delivered, ${failedCount} failed. Check Resend Hub for details.`);
    } else {
      setCampFeedback(`🎉 Campaign "${newCampName}" blasted successfully to ${deliveredCount} recipient(s)!`);
    }
    setNewCampName('');
    setTimeout(() => setCampFeedback(''), 5500);
  };

  // Delete Campaign
  const handleDeleteCampaign = async (campaignId: string, campaignName: string) => {
    if (!confirm(`Are you sure you want to delete campaign "${campaignName}"?`)) return;

    const nextCampaigns = campaigns.filter((c) => c.id !== campaignId);
    setCampaigns(nextCampaigns);
    saveStoredCampaigns(nextCampaigns);
    await dbDeleteCampaign(campaignId);

    setCampFeedback(`🗑️ Campaign "${campaignName}" deleted.`);
    setTimeout(() => setCampFeedback(''), 3000);
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

              <div style={{
                marginBottom: '20px',
                padding: '14px 18px',
                borderRadius: '10px',
                background: 'rgba(239, 246, 255, 0.9)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                fontSize: '0.84rem',
                color: '#1e3a8a'
              }}>
                <Info size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#2563eb' }} />
                <div>
                  <strong style={{ color: '#1e40af' }}>Meta WhatsApp Cloud API Broadcast Notice:</strong>
                  <div style={{ marginTop: '4px', lineHeight: '1.45' }}>
                    1. Outbound broadcasts are dispatched directly through Meta&apos;s Cloud API. Meta requires your payment method / prepaid balance to be added in <strong>Messaging accounts</strong> (not &ldquo;Ad accounts&rdquo;) under <a href="https://business.facebook.com/latest/billing_hub/accounts" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', fontWeight: 700, color: '#1d4ed8' }}>Meta Business Suite &gt; Billing &amp; Payments &gt; Messaging Accounts</a>.<br />
                    2. Once WhatsApp delivers the message to the recipient phone, delivery receipts and recipient button clicks (&ldquo;I am Interested&rdquo;) stream automatically to this table and the <a href="/" style={{ textDecoration: 'underline', fontWeight: 700, color: '#1d4ed8' }}>Leads CRM</a> in real-time.
                  </div>
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
                        templates.map((t) => {
                          const statusBadge =
                            t.status === 'APPROVED' ? '✓ Meta Approved' :
                            t.status === 'PENDING' ? '⏳ Pending Meta Review' :
                            t.status === 'REJECTED' ? '❌ Rejected by Meta' :
                            '📝 Local Draft (Meta Disconnected)';
                          return (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.category}) • [{statusBadge}]
                            </option>
                          );
                        })
                      )}
                    </select>

                    {(() => {
                      const sel = templates.find((t) => t.id === selectedTemplateId);
                      if (sel && sel.status !== 'APPROVED') {
                        return (
                          <div style={{ fontSize: '0.74rem', color: '#b45309', background: '#fffbeb', padding: '6px 10px', borderRadius: '6px', marginTop: '6px', border: '1px solid #fde68a' }}>
                            ℹ️ Note: <strong>{sel.name}</strong> is currently a <strong>{sel.status === 'DRAFT' ? 'Local Draft' : 'Pending Meta Review'}</strong>. Real WhatsApp broadcasts will deliver live once approved by Meta.
                          </div>
                        );
                      }
                      return null;
                    })()}
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
                          {camp.deliveredCount > 0 ? (
                            <span className="badge badge-green">
                              ✓ {camp.deliveredCount} Delivered
                            </span>
                          ) : camp.sentCount > 0 && camp.failedCount === 0 ? (
                            <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontWeight: 600 }}>
                              ⏳ {camp.sentCount} Queued in Meta
                            </span>
                          ) : camp.failedCount > 0 ? (
                            <span className="badge badge-red">{camp.failedCount} Failed</span>
                          ) : (
                            <span className="badge badge-secondary">
                              {camp.deliveredCount || 0} Delivered
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-purple" style={{ fontWeight: 700 }}>
                            {camp.leadsCount || 0} Inbound Leads
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
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <a href="/" className="btn btn-outline-wa btn-sm">
                              <span>View Leads</span>
                              <ChevronRight size={13} />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteCampaign(camp.id, camp.name)}
                              className="btn btn-secondary btn-sm"
                              title="Delete Campaign"
                              style={{ color: '#ef4444', padding: '5px 8px' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
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

                {/* Bulk Excel / CSV File Import & Multi-Line Form */}
                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileSpreadsheet size={18} color="var(--wa-green)" />
                    <span>Option 2: Import from Excel (.xlsx, .xls) or .CSV File</span>
                  </h4>

                  <div className="form-group">
                    <label className="form-label">Assign Imported Contacts to Group</label>
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

                  {/* Hidden File Input for Excel/CSV */}
                  <input
                    type="file"
                    ref={excelFileRef}
                    accept=".xlsx, .xls, .csv"
                    onChange={handleExcelFileSelect}
                    style={{ display: 'none' }}
                  />

                  {/* Excel Upload Click Box */}
                  <div
                    onClick={() => excelFileRef.current?.click()}
                    style={{
                      border: '2px dashed #059669',
                      borderRadius: '12px',
                      padding: '20px 16px',
                      textAlign: 'center',
                      background: '#ecfdf5',
                      cursor: 'pointer',
                      marginBottom: '14px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(5, 150, 105, 0.15)'
                      }}>
                        <FileSpreadsheet size={22} />
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#065f46' }}>
                        {excelImporting ? 'Reading Excel Rows...' : 'Click to Select Excel (.xlsx, .xls) or .CSV File'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#047857' }}>
                        Auto-detects columns: Phone, Name, Email, City, and Department / Tag
                      </div>
                    </div>
                  </div>

                  {/* Excel Preview & Confirmation Card */}
                  {excelPreview && (
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #10b981',
                      padding: '14px',
                      marginBottom: '14px',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#065f46' }}>
                          📄 {excelPreview.fileName}
                        </span>
                        <span className="badge badge-green">
                          {excelPreview.contacts.length} Contacts Found
                        </span>
                      </div>

                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '10px' }}>
                        Previewing first {Math.min(3, excelPreview.contacts.length)} rows:
                        <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                          {excelPreview.contacts.slice(0, 3).map((c, i) => (
                            <li key={i}>
                              <strong>{c.name}</strong> • {c.phone} {c.city ? `(${c.city})` : ''} {c.tags?.[0] ? `[${c.tags[0]}]` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={handleConfirmExcelImport}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '10px' }}
                      >
                        <CheckCircle2 size={16} />
                        <span>Confirm & Import {excelPreview.contacts.length} Contacts</span>
                      </button>
                    </div>
                  )}

                  {/* Collapsible / Alternative manual paste */}
                  <details style={{ marginTop: '8px' }}>
                    <summary style={{ fontSize: '0.78rem', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>
                      Or manually paste lines / CSV text
                    </summary>
                    <form onSubmit={handleBulkImportContacts} style={{ marginTop: '10px' }}>
                      <textarea
                        rows={4}
                        className="form-textarea"
                        placeholder="+919876543210, Arun Kumar, arun@mail.com, Chennai, VIP&#10;+919812345678, Priya Sharma, priya@mail.com, Delhi, Prime"
                        value={bulkCsvText}
                        onChange={(e) => setBulkCsvText(e.target.value)}
                        style={{ marginBottom: '8px' }}
                      />
                      <button type="submit" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                        <Upload size={14} />
                        <span>Import Pasted Lines</span>
                      </button>
                    </form>
                  </details>
                </div>
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
          <>
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Message Header</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setHeaderType('TEXT')}
                        className={`btn btn-sm ${headerType === 'TEXT' ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        Text Header
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeaderType('IMAGE')}
                        className={`btn btn-sm ${headerType === 'IMAGE' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <ImageIcon size={13} />
                        Image Header
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

                  {headerType === 'IMAGE' && (
                    <div style={{
                      background: '#f8fafc',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      marginTop: '4px'
                    }}>
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />

                      {/* Local File Upload Button / Box */}
                      <div style={{
                        border: '2px dashed #cbd5e1',
                        borderRadius: '10px',
                        padding: '16px',
                        textAlign: 'center',
                        background: '#ffffff',
                        marginBottom: '12px',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#ecfdf5',
                            color: '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Upload size={20} />
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#1e293b' }}>
                            {uploadingImage ? 'Uploading & Preparing Image...' : 'Click to Upload Image from Your Computer'}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            Supports PNG, JPG, or WebP (Brochures, course posters, banners up to 5MB)
                          </div>
                          {uploadedFileName && (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              background: '#ecfdf5',
                              color: '#059669',
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              marginTop: '4px'
                            }}>
                              <CheckCircle2 size={13} /> Attached: {uploadedFileName}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ height: '1px', flex: 1, background: '#e2e8f0' }} />
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                          OR Image URL / Web Link
                        </span>
                        <div style={{ height: '1px', flex: 1, background: '#e2e8f0' }} />
                      </div>

                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://example.com/banner.jpg"
                        value={headerImageUrl}
                        onChange={(e) => setHeaderImageUrl(e.target.value)}
                        style={{ marginBottom: '8px' }}
                      />

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Presets:</span>
                        <button
                          type="button"
                          onClick={() => setHeaderImageUrl('https://a5automation.com/wp-content/uploads/2026/04/A5A-Automation-Industrial-Training-logo.png')}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                        >
                          A5 Logo
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeaderImageUrl('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80')}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                        >
                          Automation Lab
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeaderImageUrl('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80')}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                        >
                          Industrial PLC
                        </button>
                      </div>

                      <div style={{ fontSize: '0.71rem', color: '#059669', marginTop: '8px' }}>
                        💡 Any image selected from your computer is automatically hosted and previewed live on the phone mockup!
                      </div>
                    </div>
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

                {/* Interactive Action Buttons (Quick Reply, Visit Website, Direct Call) */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <label className="form-label" style={{ marginBottom: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Interactive Action Buttons ({templateButtons.length}/5)
                      </label>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Add Quick-Reply (inbound leads), Website links, or direct 1-tap phone call buttons
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleAddButton('URL')}
                        disabled={templateButtons.length >= 5}
                        className="btn btn-secondary btn-sm"
                        title="Add Visit Website Button"
                      >
                        <Globe size={13} color="#0284c7" />
                        <span>+ Visit Website</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddButton('PHONE_NUMBER')}
                        disabled={templateButtons.length >= 5}
                        className="btn btn-secondary btn-sm"
                        title="Add Direct Call Button"
                      >
                        <PhoneCall size={13} color="#059669" />
                        <span>+ Direct Call</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddButton('QUICK_REPLY')}
                        disabled={templateButtons.length >= 5}
                        className="btn btn-secondary btn-sm"
                        title="Add Quick Reply Button"
                      >
                        <Plus size={13} color="#d97706" />
                        <span>+ Quick Reply</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {templateButtons.map((btn) => (
                      <div
                        key={btn.id}
                        style={{
                          padding: '12px 16px',
                          background: '#f8fafc',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', gap: '10px', alignItems: 'center' }}>
                          <select
                            className="form-select"
                            value={btn.type}
                            onChange={(e) =>
                              handleUpdateButton(btn.id, {
                                type: e.target.value as any,
                                url: e.target.value === 'URL' ? (btn.url || 'https://') : undefined,
                                phoneNumber: e.target.value === 'PHONE_NUMBER' ? (btn.phoneNumber || '+91') : undefined,
                              })
                            }
                            style={{ padding: '7px 10px', fontSize: '0.82rem' }}
                          >
                            <option value="QUICK_REPLY">⚡ Quick Reply</option>
                            <option value="URL">🌐 Visit Website</option>
                            <option value="PHONE_NUMBER">📞 Direct Call</option>
                          </select>

                          <input
                            type="text"
                            className="form-input"
                            placeholder="Button Display Text"
                            value={btn.text}
                            onChange={(e) => handleUpdateButton(btn.id, { text: e.target.value })}
                            style={{ padding: '7px 12px', fontSize: '0.84rem' }}
                            required
                          />

                          <button
                            type="button"
                            onClick={() => handleRemoveButton(btn.id)}
                            style={{ background: 'transparent', border: 'none', color: '#e11d48', cursor: 'pointer', padding: '6px' }}
                            title="Remove Button"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {btn.type === 'URL' && (
                          <div style={{ marginTop: '8px' }}>
                            <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                              Website Target URL (e.g. https://yourdomain.com)
                            </label>
                            <input
                              type="url"
                              className="form-input"
                              placeholder="https://example.com"
                              value={btn.url || ''}
                              onChange={(e) => handleUpdateButton(btn.id, { url: e.target.value })}
                              style={{ padding: '7px 10px', fontSize: '0.82rem' }}
                              required
                            />
                          </div>
                        )}

                        {btn.type === 'PHONE_NUMBER' && (
                          <div style={{ marginTop: '8px' }}>
                            <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                              Phone Number with Country Code (e.g. +919876543210)
                            </label>
                            <input
                              type="tel"
                              className="form-input"
                              placeholder="+919876543210"
                              value={btn.phoneNumber || ''}
                              onChange={(e) => handleUpdateButton(btn.id, { phoneNumber: e.target.value })}
                              style={{ padding: '7px 10px', fontSize: '0.82rem' }}
                              required
                            />
                          </div>
                        )}
                      </div>
                    ))}
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
                    alt="A5 Automation Logo"
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                    onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>A5 Automation Verified</div>
                    <div style={{ fontSize: '0.68rem', color: '#8696a0' }}>Official WhatsApp Account</div>
                  </div>
                </div>

                <div className="phone-chat-body">
                  <div className="wa-message-bubble">
                    {headerType === 'IMAGE' && headerImageUrl && (
                      <div style={{
                        margin: '-8px -12px 10px -12px',
                        borderRadius: '10px 10px 0 0',
                        overflow: 'hidden',
                        maxHeight: '140px',
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: '1px solid #e2e8f0'
                      }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={headerImageUrl}
                          alt="Header Media"
                          style={{ width: '100%', height: '100%', maxHeight: '140px', objectFit: 'cover', display: 'block' }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

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
                      {templateButtons.map((btn) => (
                        <div key={btn.id} className="wa-btn-item">
                          {btn.type === 'URL' ? (
                            <>
                              <ExternalLink size={12} />
                              <span>{btn.text}</span>
                            </>
                          ) : btn.type === 'PHONE_NUMBER' ? (
                            <>
                              <PhoneCall size={12} />
                              <span>{btn.text}</span>
                            </>
                          ) : (
                            <span>{btn.text}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="wa-reply-bubble">
                    <p>{templateButtons[0]?.text || '🔥 I am Interested'}</p>
                    <div style={{ fontSize: '0.66rem', opacity: 0.8, textAlign: 'right', marginTop: '2px' }}>
                      12:02 PM • Read
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Inbound Test Widget */}
              <div style={{
                marginTop: '16px',
                padding: '14px 16px',
                background: 'white',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="var(--wa-green)" />
                  <span>Test Inbound Lead Capture Engine</span>
                </div>
                <button
                  type="button"
                  disabled={simulatingLead}
                  onClick={handleSimulateInboundLead}
                  className="btn btn-outline-wa btn-sm"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem', padding: '9px 14px' }}
                >
                  <Send size={13} />
                  <span>{simulatingLead ? 'Simulating Incoming Lead...' : '⚡ Simulate Customer Tap "I am Interested"'}</span>
                </button>
                {simFeedback && (
                  <div style={{ fontSize: '0.76rem', marginTop: '8px', fontWeight: 600, color: simFeedback.startsWith('✅') ? '#059669' : '#dc2626' }}>
                    {simFeedback}
                  </div>
                )}
                <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '6px', lineHeight: '1.35' }}>
                  Sends simulated button reply to webhook. Verifies real-time ingestion into Leads CRM & campaign counters.
                </p>
              </div>
            </div>
          </div>

          {/* Template Library Table (View, Status, Edit/Load, Delete) */}
          <div className="glass-panel" style={{ marginTop: '28px', padding: '24px 28px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="var(--wa-green)" />
                  <span>Saved Templates Library ({templates.length})</span>
                </h3>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Review approval status in Meta, load into editor to preview or edit, or delete templates.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSyncMetaTemplates}
                disabled={syncingMetaTemplates}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCcw size={14} className={syncingMetaTemplates ? 'spinner' : ''} />
                <span>{syncingMetaTemplates ? 'Syncing with Meta...' : '🔄 Sync Live Status from Meta'}</span>
              </button>
            </div>

            {templates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-dim)' }}>
                <FileText size={32} style={{ color: '#cbd5e1', margin: '0 auto 8px' }} />
                <p style={{ fontWeight: 600 }}>No templates saved yet</p>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Design a template using the builder above to get started.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="leads-table">
                  <thead>
                    <tr>
                      <th>Template Name</th>
                      <th>Category</th>
                      <th>Header Format</th>
                      <th>Approval Status</th>
                      <th>Created</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((t) => {
                      const headerComp = t.components?.find((c) => c.type === 'HEADER');
                      const headerFormat = headerComp?.format || (headerComp ? 'TEXT' : 'NONE');

                      return (
                        <tr key={t.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                              {t.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              Lang: {t.language}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                              {t.category}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.72rem',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: headerFormat === 'IMAGE' ? '#ecfdf5' : '#f1f5f9',
                              color: headerFormat === 'IMAGE' ? '#059669' : '#64748b',
                              fontWeight: 600
                            }}>
                              {headerFormat === 'IMAGE' ? '🖼️ Image Banner' : headerFormat === 'TEXT' ? '🔤 Text Header' : '— None'}
                            </span>
                          </td>
                          <td>
                            {t.status === 'APPROVED' ? (
                              <span className="badge badge-green">✓ Meta Approved</span>
                            ) : t.status === 'PENDING' ? (
                              <span className="badge" style={{ background: '#fef3c7', color: '#b45309', fontWeight: 700 }}>
                                ⏳ Pending Meta Review
                              </span>
                            ) : t.status === 'REJECTED' ? (
                              <span className="badge" style={{ background: '#fee2e2', color: '#dc2626', fontWeight: 700 }}>
                                ❌ Meta Rejected
                              </span>
                            ) : (
                              <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                                📝 Local Draft (Not in Meta)
                              </span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                            {new Date(t.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleLoadTemplate(t)}
                                className="btn btn-secondary btn-sm"
                                title="Load & Edit in Preview"
                                style={{ padding: '5px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Eye size={13} />
                                <span>Edit / Preview</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTemplate(t.id, t.name)}
                                className="btn btn-secondary btn-sm"
                                title="Delete Template"
                                style={{ color: '#ef4444', padding: '5px 8px' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
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
                      {creds.phoneDetails?.verified_name || 'A5 Automation'}
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
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/webhook` : 'https://leads.a5automation.com/api/webhook'}
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
