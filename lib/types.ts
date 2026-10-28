export interface MetaCredentials {
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  verifyToken: string;
  status: 'connected' | 'disconnected' | 'testing' | 'error';
  lastChecked?: string;
  phoneDetails?: {
    display_phone_number: string;
    verified_name: string;
    quality_rating: string;
    code_verification_status?: string;
  };
}

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  example?: {
    header_text?: string[];
    header_handle?: string[];
    body_text?: string[][];
  };
  buttons?: {
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phone_number?: string;
  }[];
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED';
  rejectionReason?: string;
  components: TemplateComponent[];
  sampleVariables: Record<string, string>; // e.g. { '1': 'John Doe', '2': 'Festive Offer' }
  createdAt: string;
}

export interface CampaignRecipient {
  id: string;
  phone: string;
  name: string;
  variables: Record<string, string>;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  error?: string;
  errorCode?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  respondedAt?: string;
  responseContent?: string;
}

export interface Campaign {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  createdAt: string;
  status: 'draft' | 'sending' | 'completed' | 'paused';
  totalCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  leadsCount: number;
  failedCount: number;
  recipients: CampaignRecipient[];
}

export interface LeadTimelineEvent {
  id: string;
  type: 'campaign_received' | 'button_clicked' | 'message_received' | 'message_sent' | 'status_change' | 'call';
  content: string;
  timestamp: string;
  author?: string;
}

export interface LeadNote {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  phone: string;
  name: string;
  campaignId: string;
  campaignName: string;
  buttonClicked?: string; // e.g. "🔥 I'm Interested", "📞 Request Callback"
  replyMessage?: string;
  status: 'new' | 'contacted' | 'qualified' | 'negotiation' | 'converted' | 'lost';
  priority: 'hot' | 'warm' | 'cold';
  dealValue?: number;
  assignedTo?: string;
  tags: string[];
  notes: LeadNote[];
  timeline: LeadTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  description?: string;
  contactCount: number;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  groupId: string;
  groupName: string;
  tags: string[];
  city?: string;
  customField?: string;
  createdAt: string;
}

export interface AuthState {
  leadsAuthed: boolean;
  developerAuthed: boolean;
}

