import { Campaign, Lead, MetaCredentials, WhatsAppTemplate, ContactGroup, Contact } from './types';

const STORAGE_KEYS = {
  CREDENTIALS: 'a5a_meta_credentials',
  TEMPLATES: 'a5a_meta_templates',
  CAMPAIGNS: 'a5a_meta_campaigns',
  LEADS: 'a5a_meta_leads',
  GROUPS: 'a5a_meta_contact_groups',
  CONTACTS: 'a5a_meta_contacts',
  LIVE_INITIALIZED: 'a5a_live_clean_v1',
};

// Clean Production Initial Data (Zero sample data for live launch)
export const INITIAL_CREDENTIALS: MetaCredentials = {
  phoneNumberId: '',
  wabaId: '',
  accessToken: '',
  verifyToken: 'a5a_meta_webhook_secret_2026',
  status: 'disconnected',
};

export const INITIAL_TEMPLATES: WhatsAppTemplate[] = [];
export const INITIAL_CAMPAIGNS: Campaign[] = [];
export const INITIAL_LEADS: Lead[] = [];
export const INITIAL_CONTACT_GROUPS: ContactGroup[] = [];
export const INITIAL_CONTACTS: Contact[] = [];

// Helper to ensure clean slate for production
function checkAndCleanSampleData() {
  if (typeof window === 'undefined') return;
  const isCleaned = localStorage.getItem(STORAGE_KEYS.LIVE_INITIALIZED);
  if (!isCleaned) {
    // Clear out any old preloaded sample data from earlier dev test
    localStorage.removeItem(STORAGE_KEYS.LEADS);
    localStorage.removeItem(STORAGE_KEYS.CAMPAIGNS);
    localStorage.removeItem(STORAGE_KEYS.TEMPLATES);
    localStorage.setItem(STORAGE_KEYS.LIVE_INITIALIZED, 'true');
  }
}

// Credentials
export function getStoredCredentials(): MetaCredentials {
  if (typeof window === 'undefined') return INITIAL_CREDENTIALS;
  const data = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
  return data ? JSON.parse(data) : INITIAL_CREDENTIALS;
}

export function saveStoredCredentials(creds: MetaCredentials): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(creds));
}

// Templates
export function getStoredTemplates(): WhatsAppTemplate[] {
  if (typeof window === 'undefined') return INITIAL_TEMPLATES;
  checkAndCleanSampleData();
  const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
  return data ? JSON.parse(data) : INITIAL_TEMPLATES;
}

export function saveStoredTemplates(templates: WhatsAppTemplate[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
}

// Campaigns
export function getStoredCampaigns(): Campaign[] {
  if (typeof window === 'undefined') return INITIAL_CAMPAIGNS;
  checkAndCleanSampleData();
  const data = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
  return data ? JSON.parse(data) : INITIAL_CAMPAIGNS;
}

export function saveStoredCampaigns(campaigns: Campaign[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
}

// Leads
export function getStoredLeads(): Lead[] {
  if (typeof window === 'undefined') return INITIAL_LEADS;
  checkAndCleanSampleData();
  const data = localStorage.getItem(STORAGE_KEYS.LEADS);
  return data ? JSON.parse(data) : INITIAL_LEADS;
}

export function saveStoredLeads(leads: Lead[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
}

// Contact Groups
export function getStoredContactGroups(): ContactGroup[] {
  if (typeof window === 'undefined') return INITIAL_CONTACT_GROUPS;
  const data = localStorage.getItem(STORAGE_KEYS.GROUPS);
  return data ? JSON.parse(data) : INITIAL_CONTACT_GROUPS;
}

export function saveStoredContactGroups(groups: ContactGroup[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
}

// Contacts
export function getStoredContacts(): Contact[] {
  if (typeof window === 'undefined') return INITIAL_CONTACTS;
  const data = localStorage.getItem(STORAGE_KEYS.CONTACTS);
  return data ? JSON.parse(data) : INITIAL_CONTACTS;
}

export function saveStoredContacts(contacts: Contact[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
}
