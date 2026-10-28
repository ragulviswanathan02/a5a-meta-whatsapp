import { NextRequest, NextResponse } from 'next/server';

// Meta Webhook Verification Handshake (GET)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const EXPECTED_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'a5a_meta_webhook_secret_2026';

  if (mode === 'subscribe' && token === EXPECTED_TOKEN) {
    console.log('[Meta Webhook] Verification successful!');
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.warn('[Meta Webhook] Verification failed token mismatch or invalid mode.');
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// Meta Webhook Event Notification Receiver (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.object || body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value) {
      return NextResponse.json({ status: 'no_value' }, { status: 200 });
    }

    // Handle Incoming Customer Messages or Button Clicks
    if (value.messages && value.messages.length > 0) {
      const message = value.messages[0];
      const contact = value.contacts?.[0];

      const fromPhone = message.from;
      const contactName = contact?.profile?.name || `WhatsApp User ${fromPhone.slice(-4)}`;
      const messageId = message.id;
      const timestamp = new Date(parseInt(message.timestamp, 10) * 1000).toISOString();

      let buttonClicked = '';
      let textReply = '';

      if (message.type === 'button') {
        buttonClicked = message.button?.text || '';
      } else if (message.type === 'interactive' && message.interactive?.button_reply) {
        buttonClicked = message.interactive.button_reply.title || '';
      } else if (message.type === 'text') {
        textReply = message.text?.body || '';
      }

      console.log(`[Meta Lead Ingested] From: ${contactName} (${fromPhone}) | Button: ${buttonClicked} | Text: ${textReply}`);

      return NextResponse.json({
        status: 'lead_captured',
        lead: {
          phone: fromPhone,
          name: contactName,
          buttonClicked,
          textReply,
          timestamp,
          messageId,
        },
      });
    }

    // Handle Delivery & Read Status Updates
    if (value.statuses && value.statuses.length > 0) {
      const statusUpdate = value.statuses[0];
      const recipientId = statusUpdate.recipient_id;
      const status = statusUpdate.status; // 'sent' | 'delivered' | 'read' | 'failed'
      const error = statusUpdate.errors?.[0];

      console.log(`[Meta Status Update] ${recipientId}: ${status} ${error ? `(Error: ${error.message})` : ''}`);

      return NextResponse.json({
        status: 'status_updated',
        recipientId,
        messageStatus: status,
        error: error ? { code: error.code, message: error.message } : undefined,
      });
    }

    return NextResponse.json({ status: 'received' }, { status: 200 });
  } catch (error: any) {
    console.error('[Meta Webhook Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
