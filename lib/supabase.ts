import { createClient } from '@supabase/supabase-js';
import { 
  Campaign, 
  Lead, 
  MetaCredentials, 
  WhatsAppTemplate, 
  ContactGroup, 
  Contact,
  FormLead
} from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mffspcgphpygesrfntaj.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZnNwY2dwaHB5Z2VzcmZudGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNzIwNzUsImV4cCI6MjEwODc0ODA3NX0.no0fYBzCXwQ1bkFWvukM_5NBZao7pzR6BtGFM0-C9e8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if Supabase is reachable
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('leads').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// LEADS
// ==========================================
export async function dbGetLeads(): Promise<Lead[]> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      campaignId: row.campaign_id,
      campaignName: row.campaign_name,
      buttonClicked: row.button_clicked || undefined,
      replyMessage: row.reply_message || undefined,
      status: row.status,
      priority: row.priority,
      dealValue: row.deal_value ? Number(row.deal_value) : undefined,
      assignedTo: row.assigned_to || undefined,
      tags: row.tags || [],
      notes: row.notes || [],
      timeline: row.timeline || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.warn('[Supabase dbGetLeads Error]', err);
    return [];
  }
}

export async function dbUpsertLead(lead: Lead): Promise<boolean> {
  try {
    const payload = {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      campaign_id: lead.campaignId,
      campaign_name: lead.campaignName,
      button_clicked: lead.buttonClicked || null,
      reply_message: lead.replyMessage || null,
      status: lead.status,
      priority: lead.priority,
      deal_value: lead.dealValue || 0,
      assigned_to: lead.assignedTo || null,
      tags: lead.tags || [],
      notes: lead.notes || [],
      timeline: lead.timeline || [],
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('leads').upsert(payload);
    return !error;
  } catch (err) {
    console.warn('[Supabase dbUpsertLead Error]', err);
    return false;
  }
}

export async function dbDeleteLead(leadId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('leads').delete().eq('id', leadId);
    return !error;
  } catch (err) {
    console.warn('[Supabase dbDeleteLead Error]', err);
    return false;
  }
}

// ==========================================
// CAMPAIGNS
// ==========================================
export async function dbGetCampaigns(): Promise<Campaign[]> {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      templateId: row.template_id,
      templateName: row.template_name,
      status: row.status,
      totalCount: row.total_count,
      sentCount: row.sent_count,
      deliveredCount: row.delivered_count,
      readCount: row.read_count,
      leadsCount: row.leads_count,
      failedCount: row.failed_count,
      recipients: row.recipients || [],
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn('[Supabase dbGetCampaigns Error]', err);
    return [];
  }
}

export async function dbUpsertCampaign(camp: Campaign): Promise<boolean> {
  try {
    const payload = {
      id: camp.id,
      name: camp.name,
      template_id: camp.templateId,
      template_name: camp.templateName,
      status: camp.status,
      total_count: camp.totalCount,
      sent_count: camp.sentCount,
      delivered_count: camp.deliveredCount,
      read_count: camp.readCount,
      leads_count: camp.leadsCount,
      failed_count: camp.failedCount,
      recipients: camp.recipients || [],
    };

    const { error } = await supabase.from('campaigns').upsert(payload);
    return !error;
  } catch (err) {
    console.warn('[Supabase dbUpsertCampaign Error]', err);
    return false;
  }
}

// ==========================================
// TEMPLATES
// ==========================================
export async function dbGetTemplates(): Promise<WhatsAppTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      language: row.language,
      status: row.status,
      components: row.components || [],
      sampleVariables: row.sample_variables || {},
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn('[Supabase dbGetTemplates Error]', err);
    return [];
  }
}

export async function dbUpsertTemplate(tmpl: WhatsAppTemplate): Promise<boolean> {
  try {
    const payload = {
      id: tmpl.id,
      name: tmpl.name,
      category: tmplCategoryValid(tmpl.category),
      language: tmpl.language,
      status: tmpl.status,
      components: tmpl.components || [],
      sample_variables: tmpl.sampleVariables || {},
    };

    const { error } = await supabase.from('whatsapp_templates').upsert(payload);
    return !error;
  } catch (err) {
    console.warn('[Supabase dbUpsertTemplate Error]', err);
    return false;
  }
}

function tmplCategoryValid(c: string) {
  return c === 'UTILITY' ? 'UTILITY' : 'MARKETING';
}

// ==========================================
// CONTACT GROUPS
// ==========================================
export async function dbGetContactGroups(): Promise<ContactGroup[]> {
  try {
    const { data, error } = await supabase
      .from('contact_groups')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      contactCount: row.contact_count || 0,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn('[Supabase dbGetContactGroups Error]', err);
    return [];
  }
}

export async function dbUpsertContactGroup(grp: ContactGroup): Promise<boolean> {
  try {
    const { error } = await supabase.from('contact_groups').upsert({
      id: grp.id,
      name: grp.name,
      description: grp.description || null,
      contact_count: grp.contactCount || 0,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function dbDeleteContactGroup(groupId: string): Promise<boolean> {
  try {
    await supabase.from('contacts').delete().eq('group_id', groupId);
    const { error } = await supabase.from('contact_groups').delete().eq('id', groupId);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// CONTACTS
// ==========================================
export async function dbGetContacts(): Promise<Contact[]> {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email || undefined,
      city: row.city || undefined,
      tags: row.tags || [],
      groupId: row.group_id,
      groupName: row.group_name,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn('[Supabase dbGetContacts Error]', err);
    return [];
  }
}

export async function dbUpsertContacts(contactList: Contact[]): Promise<boolean> {
  try {
    const rows = contactList.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email || null,
      city: c.city || null,
      tags: c.tags || [],
      group_id: c.groupId,
      group_name: c.groupName,
    }));

    const { error } = await supabase.from('contacts').upsert(rows);
    return !error;
  } catch {
    return false;
  }
}

export async function dbDeleteContact(contactId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('contacts').delete().eq('id', contactId);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// FORM LEADS (Student Inquiries & Social Media Bio Leads)
// ==========================================
export async function dbGetFormLeads(): Promise<FormLead[]> {
  try {
    const { data, error } = await supabase
      .from('form_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      collegeName: row.college_name,
      department: row.department,
      yearOfStudy: row.year_of_study,
      courseInterest: row.course_interest || undefined,
      city: row.city || undefined,
      source: row.source || undefined,
      status: row.status || 'new',
      notes: row.notes || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.warn('[Supabase dbGetFormLeads Error]', err);
    return [];
  }
}

export async function dbUpsertFormLead(lead: FormLead): Promise<boolean> {
  try {
    const payload = {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      college_name: lead.collegeName,
      department: lead.department,
      year_of_study: lead.yearOfStudy,
      course_interest: lead.courseInterest || null,
      city: lead.city || null,
      source: lead.source || null,
      status: lead.status || 'new',
      notes: lead.notes || [],
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('form_leads').upsert(payload);
    return !error;
  } catch (err) {
    console.warn('[Supabase dbUpsertFormLead Error]', err);
    return false;
  }
}

export async function dbDeleteFormLead(leadId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('form_leads').delete().eq('id', leadId);
    return !error;
  } catch (err) {
    console.warn('[Supabase dbDeleteFormLead Error]', err);
    return false;
  }
}

