-- ========================================================
-- A5A Meta WhatsApp Database Schema for Supabase
-- Paste this entire SQL into Supabase > SQL Editor > Click RUN
-- ========================================================

-- 1. Meta Credentials Table
CREATE TABLE IF NOT EXISTS meta_credentials (
  id TEXT PRIMARY KEY DEFAULT 'default',
  phone_number_id TEXT,
  waba_id TEXT,
  access_token TEXT,
  verify_token TEXT DEFAULT 'a5a_meta_webhook_secret_2026',
  status TEXT DEFAULT 'disconnected',
  phone_details JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WhatsApp Templates Table
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'MARKETING',
  language TEXT DEFAULT 'en_US',
  status TEXT DEFAULT 'APPROVED',
  components JSONB DEFAULT '[]'::jsonb,
  sample_variables JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Contact Groups Table
CREATE TABLE IF NOT EXISTS contact_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  contact_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  group_id TEXT,
  group_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  template_id TEXT,
  template_name TEXT,
  status TEXT DEFAULT 'completed',
  total_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  leads_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  recipients JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  campaign_id TEXT,
  campaign_name TEXT,
  button_clicked TEXT,
  reply_message TEXT,
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'hot',
  deal_value NUMERIC DEFAULT 0,
  assigned_to TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  notes JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- Enable Row Level Security (RLS) with Public Anon Access
-- ========================================================
ALTER TABLE meta_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access meta_credentials" ON meta_credentials;
CREATE POLICY "Public access meta_credentials" ON meta_credentials FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access whatsapp_templates" ON whatsapp_templates;
CREATE POLICY "Public access whatsapp_templates" ON whatsapp_templates FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access contact_groups" ON contact_groups;
CREATE POLICY "Public access contact_groups" ON contact_groups FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access contacts" ON contacts;
CREATE POLICY "Public access contacts" ON contacts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access campaigns" ON campaigns;
CREATE POLICY "Public access campaigns" ON campaigns FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access leads" ON leads;
CREATE POLICY "Public access leads" ON leads FOR ALL USING (true) WITH CHECK (true);
