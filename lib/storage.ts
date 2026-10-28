import { Campaign, Lead, MetaCredentials, WhatsAppTemplate } from './types';

const STORAGE_KEYS = {
  CREDENTIALS: 'a5a_meta_credentials',
  TEMPLATES: 'a5a_meta_templates',
  CAMPAIGNS: 'a5a_meta_campaigns',
  LEADS: 'a5a_meta_leads',
};

// Initial Realistic Mock Data
export const INITIAL_CREDENTIALS: MetaCredentials = {
  phoneNumberId: '',
  wabaId: '',
  accessToken: '',
  verifyToken: 'a5a_meta_webhook_secret_2026',
  status: 'disconnected',
};

export const INITIAL_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'festive_offer_vip',
    category: 'MARKETING',
    language: 'en_US',
    status: 'APPROVED',
    createdAt: '2026-10-20T10:00:00Z',
    sampleVariables: {
      '1': 'Ragul',
      '2': 'VIP Festive Pass',
      '3': '40% discount',
    },
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: '🎉 Exclusive Festive Privilege for {{1}}',
        example: { header_text: ['Ragul'] },
      },
      {
        type: 'BODY',
        text: 'Hello {{1}}, we are excited to unveil our {{2}} with up to {{3}} off for our prime customers.\n\nTap below to claim your benefits or speak directly with our private advisor.',
        example: {
          body_text: [['Ragul', 'VIP Festive Pass', '40% discount']],
        },
      },
      {
        type: 'FOOTER',
        text: 'A5A Meta Solutions • Limited seats available',
      },
      {
        type: 'BUTTONS',
        buttons: [
          { type: 'QUICK_REPLY', text: '🔥 I am Interested' },
          { type: 'QUICK_REPLY', text: '📞 Request Call Back' },
          { type: 'URL', text: '🌐 View Brochure', url: 'https://a5ameta.com' },
        ],
      },
    ],
  },
  {
    id: 'tmpl-2',
    name: 'real_estate_showcase_q4',
    category: 'MARKETING',
    language: 'en_US',
    status: 'APPROVED',
    createdAt: '2026-10-22T14:30:00Z',
    sampleVariables: {
      '1': 'Investor',
      '2': 'Palm Luxury Villas',
      '3': '₹1.85 Cr',
    },
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: '🏡 Ultra Luxury Waterfront Villas: {{2}}',
        example: { header_text: ['Palm Luxury Villas'] },
      },
      {
        type: 'BODY',
        text: 'Dear {{1}}, pre-launch booking is now open for {{2}} starting at {{3}} with guaranteed 12% rental yield.\n\nAre you interested in receiving the masterplan & pricing breakdown?',
        example: {
          body_text: [['Investor', 'Palm Luxury Villas', '₹1.85 Cr']],
        },
      },
      {
        type: 'FOOTER',
        text: 'RERA Approved Project',
      },
      {
        type: 'BUTTONS',
        buttons: [
          { type: 'QUICK_REPLY', text: '🔥 Interested in Masterplan' },
          { type: 'QUICK_REPLY', text: '💬 Chat on WhatsApp' },
          { type: 'PHONE_NUMBER', text: '📞 Call Sales Team', phone_number: '+919876543210' },
        ],
      },
    ],
  },
  {
    id: 'tmpl-3',
    name: 'software_demo_invite',
    category: 'UTILITY',
    language: 'en_US',
    status: 'APPROVED',
    createdAt: '2026-10-25T09:15:00Z',
    sampleVariables: {
      '1': 'Alex',
      '2': 'Enterprise CRM Suite',
      '3': '30-Day Free Trial',
    },
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, thank you for your inquiry about {{2}}. Your {{3}} is ready for activation.\n\nWould you like our tech team to guide you through a 10-minute setup?',
        example: {
          body_text: [['Alex', 'Enterprise CRM Suite', '30-Day Free Trial']],
        },
      },
      {
        type: 'BUTTONS',
        buttons: [
          { type: 'QUICK_REPLY', text: '🔥 Yes, Schedule Demo' },
          { type: 'QUICK_REPLY', text: 'Not Now' },
        ],
      },
    ],
  },
];

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-101',
    name: 'Diwali Festive Blast - High Networth',
    templateId: 'tmpl-1',
    templateName: 'festive_offer_vip',
    createdAt: '2026-10-26T10:00:00Z',
    status: 'completed',
    totalCount: 500,
    sentCount: 500,
    deliveredCount: 486,
    readCount: 392,
    leadsCount: 68,
    failedCount: 14,
    recipients: [
      {
        id: 'rec-1',
        name: 'Arun Kumar',
        phone: '+919840123456',
        variables: { '1': 'Arun Kumar', '2': 'VIP Festive Pass', '3': '40% discount' },
        status: 'read',
        sentAt: '2026-10-26T10:02:00Z',
        deliveredAt: '2026-10-26T10:02:15Z',
        readAt: '2026-10-26T10:04:30Z',
        respondedAt: '2026-10-26T10:06:00Z',
        responseContent: '🔥 I am Interested',
      },
      {
        id: 'rec-2',
        name: 'Priya Sharma',
        phone: '+919871234567',
        variables: { '1': 'Priya Sharma', '2': 'VIP Festive Pass', '3': '40% discount' },
        status: 'read',
        sentAt: '2026-10-26T10:02:00Z',
        deliveredAt: '2026-10-26T10:02:18Z',
        readAt: '2026-10-26T10:15:10Z',
        respondedAt: '2026-10-26T10:16:00Z',
        responseContent: '📞 Request Call Back',
      },
      {
        id: 'rec-3',
        name: 'Vikram Seth',
        phone: '+919940567890',
        variables: { '1': 'Vikram Seth', '2': 'VIP Festive Pass', '3': '40% discount' },
        status: 'failed',
        errorCode: '131026',
        error: 'Message undeliverable: User phone unreachable or WhatsApp account inactive',
        sentAt: '2026-10-26T10:02:00Z',
      },
      {
        id: 'rec-4',
        name: 'Deepa Narayanan',
        phone: '+919711223344',
        variables: { '1': 'Deepa Narayanan', '2': 'VIP Festive Pass', '3': '40% discount' },
        status: 'delivered',
        sentAt: '2026-10-26T10:02:00Z',
        deliveredAt: '2026-10-26T10:03:00Z',
      },
      {
        id: 'rec-5',
        name: 'Karthik Raja',
        phone: '+919884556677',
        variables: { '1': 'Karthik Raja', '2': 'VIP Festive Pass', '3': '40% discount' },
        status: 'failed',
        errorCode: '131047',
        error: 'Rate limit or re-engagement window expired',
        sentAt: '2026-10-26T10:02:00Z',
      },
    ],
  },
  {
    id: 'camp-102',
    name: 'Luxury Villas Pre-Launch VIP Showcase',
    templateId: 'tmpl-2',
    templateName: 'real_estate_showcase_q4',
    createdAt: '2026-10-27T11:30:00Z',
    status: 'completed',
    totalCount: 300,
    sentCount: 300,
    deliveredCount: 292,
    readCount: 245,
    leadsCount: 42,
    failedCount: 8,
    recipients: [],
  },
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'Arun Kumar',
    phone: '+919840123456',
    campaignId: 'camp-101',
    campaignName: 'Diwali Festive Blast - High Networth',
    buttonClicked: '🔥 I am Interested',
    status: 'new',
    priority: 'hot',
    dealValue: 75000,
    assignedTo: 'Ragul (Sales Lead)',
    tags: ['VIP', 'Festive Offer', 'High Intent'],
    notes: [
      {
        id: 'n-1',
        author: 'System Bot',
        text: 'Customer clicked "🔥 I am Interested" within 2 minutes of opening the festive campaign message.',
        createdAt: '2026-10-26T10:06:05Z',
      },
    ],
    timeline: [
      {
        id: 'tl-1',
        type: 'campaign_received',
        content: 'Received Campaign: Diwali Festive Blast - High Networth',
        timestamp: '2026-10-26T10:02:15Z',
      },
      {
        id: 'tl-2',
        type: 'button_clicked',
        content: 'Tapped Quick-Reply Button: "🔥 I am Interested"',
        timestamp: '2026-10-26T10:06:00Z',
      },
      {
        id: 'tl-3',
        type: 'message_received',
        content: 'Can you please share the full pricing plan and validity?',
        timestamp: '2026-10-26T10:07:30Z',
      },
    ],
    createdAt: '2026-10-26T10:06:00Z',
    updatedAt: '2026-10-26T10:07:30Z',
  },
  {
    id: 'lead-2',
    name: 'Priya Sharma',
    phone: '+919871234567',
    campaignId: 'camp-101',
    campaignName: 'Diwali Festive Blast - High Networth',
    buttonClicked: '📞 Request Call Back',
    status: 'contacted',
    priority: 'hot',
    dealValue: 120000,
    assignedTo: 'Divya M',
    tags: ['Callback', 'Urgent', 'Enterprise'],
    notes: [
      {
        id: 'n-2',
        author: 'Divya M',
        text: 'Called Priya. She requested a follow-up call at 4:00 PM with the technical team.',
        createdAt: '2026-10-26T11:20:00Z',
      },
    ],
    timeline: [
      {
        id: 'tl-4',
        type: 'campaign_received',
        content: 'Received Campaign: Diwali Festive Blast - High Networth',
        timestamp: '2026-10-26T10:02:18Z',
      },
      {
        id: 'tl-5',
        type: 'button_clicked',
        content: 'Tapped Button: "📞 Request Call Back"',
        timestamp: '2026-10-26T10:16:00Z',
      },
      {
        id: 'tl-6',
        type: 'call',
        content: 'Call placed by Divya M (Duration: 3m 40s). Agreed for demo.',
        timestamp: '2026-10-26T11:18:00Z',
      },
    ],
    createdAt: '2026-10-26T10:16:00Z',
    updatedAt: '2026-10-26T11:20:00Z',
  },
  {
    id: 'lead-3',
    name: 'Dr. Suresh Reddy',
    phone: '+919841098765',
    campaignId: 'camp-102',
    campaignName: 'Luxury Villas Pre-Launch VIP Showcase',
    buttonClicked: '🔥 Interested in Masterplan',
    status: 'qualified',
    priority: 'hot',
    dealValue: 18500000,
    assignedTo: 'Vikram (Real Estate)',
    tags: ['Ultra HNWI', 'Villas', 'Investor'],
    notes: [
      {
        id: 'n-3',
        author: 'Vikram',
        text: 'Looking for corner plot villa facing the clubhouse. Financials pre-approved.',
        createdAt: '2026-10-27T14:10:00Z',
      },
    ],
    timeline: [
      {
        id: 'tl-7',
        type: 'campaign_received',
        content: 'Received Campaign: Luxury Villas Pre-Launch VIP Showcase',
        timestamp: '2026-10-27T11:32:00Z',
      },
      {
        id: 'tl-8',
        type: 'button_clicked',
        content: 'Tapped Button: "🔥 Interested in Masterplan"',
        timestamp: '2026-10-27T12:05:00Z',
      },
      {
        id: 'tl-9',
        type: 'status_change',
        content: 'Moved from New to Qualified by Vikram',
        timestamp: '2026-10-27T14:00:00Z',
      },
    ],
    createdAt: '2026-10-27T12:05:00Z',
    updatedAt: '2026-10-27T14:10:00Z',
  },
  {
    id: 'lead-4',
    name: 'Ananya Deshmukh',
    phone: '+919920334455',
    campaignId: 'camp-102',
    campaignName: 'Luxury Villas Pre-Launch VIP Showcase',
    buttonClicked: '💬 Chat on WhatsApp',
    replyMessage: 'Is there any early bird discount for NRI payments?',
    status: 'negotiation',
    priority: 'warm',
    dealValue: 19000000,
    assignedTo: 'Vikram (Real Estate)',
    tags: ['NRI', 'High Intent'],
    notes: [],
    timeline: [
      {
        id: 'tl-10',
        type: 'campaign_received',
        content: 'Received Campaign: Luxury Villas Pre-Launch VIP Showcase',
        timestamp: '2026-10-27T11:33:00Z',
      },
      {
        id: 'tl-11',
        type: 'message_received',
        content: 'Is there any early bird discount for NRI payments?',
        timestamp: '2026-10-27T12:45:00Z',
      },
    ],
    createdAt: '2026-10-27T12:45:00Z',
    updatedAt: '2026-10-27T12:45:00Z',
  },
];

// Helper functions for client-side storage
export function getStoredCredentials(): MetaCredentials {
  if (typeof window === 'undefined') return INITIAL_CREDENTIALS;
  const data = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
  return data ? JSON.parse(data) : INITIAL_CREDENTIALS;
}

export function saveStoredCredentials(creds: MetaCredentials): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(creds));
}

export function getStoredTemplates(): WhatsAppTemplate[] {
  if (typeof window === 'undefined') return INITIAL_TEMPLATES;
  const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(INITIAL_TEMPLATES));
    return INITIAL_TEMPLATES;
  }
  return JSON.parse(data);
}

export function saveStoredTemplates(templates: WhatsAppTemplate[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
}

export function getStoredCampaigns(): Campaign[] {
  if (typeof window === 'undefined') return INITIAL_CAMPAIGNS;
  const data = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(INITIAL_CAMPAIGNS));
    return INITIAL_CAMPAIGNS;
  }
  return JSON.parse(data);
}

export function saveStoredCampaigns(campaigns: Campaign[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
}

export function getStoredLeads(): Lead[] {
  if (typeof window === 'undefined') return INITIAL_LEADS;
  const data = localStorage.getItem(STORAGE_KEYS.LEADS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(INITIAL_LEADS));
    return INITIAL_LEADS;
  }
  return JSON.parse(data);
}

export function saveStoredLeads(leads: Lead[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
}
