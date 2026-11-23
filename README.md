# A5A Meta • WhatsApp Campaign Broadcaster & Lead Intelligence Platform

An enterprise platform for managing Meta WhatsApp Cloud API campaigns, building Meta-approved interactive templates with dynamic variables & review samples, and capturing leads in real-time.

---

## 🚀 Live Portals & Default Passkeys

| Portal | URL Path | Purpose | Default Passkey |
| :--- | :--- | :--- | :--- |
| **Leads Command Center** | `/` | Inbound Hot Leads, Kanban Pipeline, Chat History, Direct WhatsApp Reply, CSV Export | `a5aleads123` |
| **Developer & Campaign HQ** | `/developera5a` | Meta API Credentials, Template Studio with Phone Mockup, Broadcast Dispatcher, Failed Resend Hub | `a5adeveloper123` |

> 🔒 *Both portals have a **Change Password** feature in the top navigation bar to set your custom passkey at any time.*

---

## ⚡ Features Overview

### 1. Leads Command Center (`/`)
* **Live Ingestion**: Ingests incoming leads whenever a customer taps an interactive button (e.g. `🔥 I am Interested`) or types a WhatsApp message.
* **Kanban Pipeline & Table View**: Drag-and-drop or status switch across `New Interest` ➔ `Contacted` ➔ `Qualified` ➔ `Negotiation` ➔ `Won / Converted`.
* **Lead Detail Drawer**:
  * Complete timeline showing the exact broadcast received and button clicked.
  * Direct 1-on-1 WhatsApp reply box powered by Cloud API.
  * Internal sales notes, priority levels (`HOT`, `WARM`, `COLD`), and deal values.
* **Campaign Filter**: Filter leads by specific campaign names.
* **Webhook Simulator**: Test and simulate incoming customer button clicks and direct replies in 1 click without spending Meta credits.
* **Export to CSV**: Download leads report with campaign tags and phone numbers.

### 2. Campaign & Developer HQ (`/developera5a`)
* **Meta Cloud API Credentials Manager**:
  * Input `Phone Number ID`, `WABA ID`, `Permanent Access Token`, and `Verify Token`.
  * **Ping Meta API Connection**: Tests live connectivity to Graph API v21.0 and checks verified business name, phone number, and quality score.
* **Meta Template Studio**:
  * Supports Text Headers, dynamic Body variables (`{{1}}`, `{{2}}`), and Footers.
  * **Mandatory Meta Review Samples**: Auto-detects variables and creates input fields for review sample values required by Meta for approval.
  * **Live WhatsApp Smartphone Mockup**: Real-time iPhone chat preview displaying resolved variables and interactive buttons.
  * Direct submission to Meta Cloud API or local library.
* **Broadcast Dispatcher & Campaign-Wide Analytics**:
  * Launch broadcasts by pasting audience numbers or CSV data.
  * Tracks: **Targeted**, **Delivered**, **Read**, **Total Leads Generated**, and **Lead Conversion Rate %**.
* **Smart Failed Resend Hub**:
  * Isolates undelivered contacts with Meta error code diagnostics (e.g., 131026).
  * **1-Click Resend to Failed**: Automatically retries failed recipients.

---

## 🛠️ Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the local server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) for the Leads Portal, and [http://localhost:3000/developera5a](http://localhost:3000/developera5a) for Campaign HQ.

3. Build for production:
   ```bash
   npm run build
   ```

---

## 🌐 Deploying to GitHub & Vercel

1. **Initialize Git & Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit for A5A Meta WhatsApp platform"
   git branch -M main
   git remote add origin https://github.com/ragulviswanathan02/<your-new-repo>.git
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   * Go to [vercel.com](https://vercel.com) and click **"Add New" ➔ "Project"**.
   * Import your new repository.
   * Framework Preset: **Next.js** (detected automatically).
   * Click **Deploy**.

3. **Meta Webhook Setup**:
   * In your Meta App Dashboard > WhatsApp > Configuration > Webhook:
     * **Callback URL**: `https://<your-vercel-domain>.vercel.app/api/webhook`
     * **Verify Token**: `a5a_meta_webhook_secret_2026` (or whatever you configured in Campaign HQ).
     * Subscribe to `messages` field.
