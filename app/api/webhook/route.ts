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

  console.warn('[Meta Webhook] Verification failed: token mismatch or invalid mode.');
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

    const { supabase, dbUpsertLead } = await import('@/lib/supabase');

    // ========================================================
    // 1. Handle Incoming Customer Messages or Button Clicks
    // ========================================================
    if (value.messages && value.messages.length > 0) {
      const message = value.messages[0];
      const contact = value.contacts?.[0];

      const fromPhone = message.from; // e.g. "919566671183"
      const contactName = contact?.profile?.name || `WhatsApp User ${fromPhone.slice(-4)}`;
      const messageId = message.id;

      let buttonClicked = '';
      let textReply = '';

      if (message.type === 'button') {
        buttonClicked = message.button?.text || message.button?.payload || '';
      } else if (message.type === 'interactive' && message.interactive?.button_reply) {
        buttonClicked = message.interactive.button_reply.title || message.interactive.button_reply.id || '';
      } else if (message.type === 'text') {
        textReply = message.text?.body || '';
      }

      // Default campaign details if no broadcast match
      let campaignId = 'meta-webhook';
      let campaignName = 'WhatsApp Inbound Response';

      // Smart Campaign Matcher: Find the active campaign targeted to this phone
      try {
        const cleanFrom = fromPhone.replace(/[^0-9]/g, '');
        const last10 = cleanFrom.slice(-10);

        const { data: recentCamps } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (recentCamps && recentCamps.length > 0) {
          for (const camp of recentCamps) {
            const recipients = Array.isArray(camp.recipients) ? camp.recipients : [];
            const matchedRec = recipients.find((r: any) => {
              const rDigits = (r.phone || '').replace(/[^0-9]/g, '');
              return rDigits.endsWith(last10) || last10.endsWith(rDigits);
            });

            if (matchedRec) {
              campaignId = camp.id;
              campaignName = camp.name;

              // Mark recipient as replied & recorded
              matchedRec.status = 'replied';
              matchedRec.buttonClicked = buttonClicked || undefined;
              matchedRec.replyMessage = textReply || undefined;
              matchedRec.repliedAt = new Date().toISOString();

              const currentLeadsCount = Number(camp.leads_count || 0);

              await supabase
                .from('campaigns')
                .update({
                  leads_count: currentLeadsCount + 1,
                  recipients,
                })
                .eq('id', camp.id);

              console.log(`[Webhook Matched Campaign] "${camp.name}" (${camp.id}) - Leads now: ${currentLeadsCount + 1}`);
              break;
            }
          }
        }
      } catch (matchErr) {
        console.warn('[Webhook Match Campaign Error]', matchErr);
      }

      const formattedPhone = fromPhone.startsWith('+') ? fromPhone : `+${fromPhone}`;
      const newLeadId = `lead-${Date.now()}`;
      const newLeadData = {
        id: newLeadId,
        phone: formattedPhone,
        name: contactName,
        campaignId,
        campaignName,
        buttonClicked: buttonClicked || undefined,
        replyMessage: textReply || undefined,
        status: 'new' as const,
        priority: 'hot' as const,
        dealValue: 0,
        tags: ['Inbound Webhook', buttonClicked ? `Button: ${buttonClicked}` : 'Direct Message'],
        notes: [
          {
            id: `n-${Date.now()}`,
            author: 'Meta WhatsApp Cloud API',
            text: buttonClicked
              ? `Customer clicked interactive button: "${buttonClicked}" in campaign "${campaignName}"`
              : `Customer sent WhatsApp text: "${textReply}" in campaign "${campaignName}"`,
            createdAt: new Date().toISOString(),
          },
        ],
        timeline: [
          {
            id: `tl-${Date.now()}`,
            type: buttonClicked ? ('button_clicked' as const) : ('message_received' as const),
            content: buttonClicked ? `Tapped Button: "${buttonClicked}"` : `Received: "${textReply}"`,
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Persist to Supabase Leads Table
      try {
        await dbUpsertLead(newLeadData);
      } catch (dbErr) {
        console.warn('[Webhook DB write error]', dbErr);
      }

      // Record diagnostic activity in meta_credentials
      try {
        await supabase
          .from('meta_credentials')
          .update({
            updated_at: new Date().toISOString(),
            phone_details: {
              last_webhook_event: {
                type: 'lead_captured',
                phone: formattedPhone,
                name: contactName,
                button: buttonClicked || null,
                message: textReply || null,
                campaign: campaignName,
                timestamp: new Date().toISOString(),
              },
            },
          })
          .eq('id', 'default');
      } catch {}

      console.log(`[Meta Lead Ingested & Saved to DB] From: ${contactName} (${fromPhone}) Campaign: ${campaignName}`);

      return NextResponse.json({
        status: 'lead_captured',
        lead: newLeadData,
      });
    }

    // ========================================================
    // 2. Handle Delivery & Read Status Updates
    // ========================================================
    if (value.statuses && value.statuses.length > 0) {
      const statusUpdate = value.statuses[0];
      const recipientId = statusUpdate.recipient_id; // e.g. "919566671183"
      const status = statusUpdate.status; // 'sent' | 'delivered' | 'read' | 'failed'
      const error = statusUpdate.errors?.[0];

      console.log(`[Meta Status Update] ${recipientId}: ${status} ${error ? `(Error: ${error.message} - Code: ${error.code})` : ''}`);

      // Record diagnostic update
      try {
        await supabase
          .from('meta_credentials')
          .update({
            updated_at: new Date().toISOString(),
            phone_details: {
              last_webhook_event: {
                type: 'status_update',
                recipient: recipientId,
                status,
                error: error ? { code: error.code, message: error.message, title: error.title } : null,
                timestamp: new Date().toISOString(),
              },
            },
          })
          .eq('id', 'default');
      } catch {}

      // Match and update campaign delivery statistics
      try {
        const cleanRec = recipientId.replace(/[^0-9]/g, '');
        const last10 = cleanRec.slice(-10);

        const { data: recentCamps } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (recentCamps && recentCamps.length > 0) {
          for (const camp of recentCamps) {
            const recipients = Array.isArray(camp.recipients) ? camp.recipients : [];
            const rMatch = recipients.find((r: any) => {
              const rDigits = (r.phone || '').replace(/[^0-9]/g, '');
              return rDigits.endsWith(last10) || last10.endsWith(rDigits);
            });

            if (rMatch) {
              if (status === 'delivered') {
                rMatch.status = 'delivered';
                rMatch.deliveredAt = new Date().toISOString();
                const newDelivered = recipients.filter((r: any) => r.status === 'delivered').length;
                await supabase
                  .from('campaigns')
                  .update({ delivered_count: newDelivered, recipients })
                  .eq('id', camp.id);
              } else if (status === 'failed') {
                rMatch.status = 'failed';
                rMatch.error = error ? `Meta Error ${error.code}: ${error.message}` : 'Meta delivery failed';
                const newFailed = recipients.filter((r: any) => r.status === 'failed').length;
                await supabase
                  .from('campaigns')
                  .update({ failed_count: newFailed, recipients })
                  .eq('id', camp.id);
              } else if (status === 'read') {
                rMatch.status = 'read';
                rMatch.readAt = new Date().toISOString();
                const newRead = recipients.filter((r: any) => r.status === 'read').length;
                await supabase
                  .from('campaigns')
                  .update({ read_count: newRead, recipients })
                  .eq('id', camp.id);
              }
              break;
            }
          }
        }
      } catch (stCampErr) {
        console.warn('[Webhook Campaign Status Update Error]', stCampErr);
      }

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
