import { MetaCredentials, TemplateComponent } from './types';

const META_GRAPH_VERSION = 'v21.0';
const BASE_GRAPH_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

export interface MetaPhoneCheckResult {
  success: boolean;
  message: string;
  data?: {
    display_phone_number?: string;
    verified_name?: string;
    quality_rating?: string;
    code_verification_status?: string;
    id?: string;
  };
  error?: string;
}

/**
 * Validates Meta Credentials by fetching the Phone Number details from Graph API
 */
export async function testMetaConnection(creds: MetaCredentials): Promise<MetaPhoneCheckResult> {
  if (!creds.phoneNumberId || !creds.accessToken) {
    return {
      success: false,
      message: 'Missing Phone Number ID or System User Access Token.',
    };
  }

  try {
    const url = `${BASE_GRAPH_URL}/${creds.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,code_verification_status`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
      },
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      return {
        success: false,
        message: data.error?.message || 'Meta API returned an error.',
        error: data.error?.error_user_msg || data.error?.message,
      };
    }

    return {
      success: true,
      message: 'Connected successfully to Meta WhatsApp Cloud API!',
      data: {
        display_phone_number: data.display_phone_number,
        verified_name: data.verified_name,
        quality_rating: data.quality_rating,
        code_verification_status: data.code_verification_status,
        id: data.id,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to communicate with Meta Graph API. Please check your network or access token.',
      error: err.message,
    };
  }
}

/**
 * Submits a new message template to Meta for official review & approval
 */
export async function submitTemplateToMeta(
  creds: MetaCredentials,
  templateData: {
    name: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    language: string;
    components: TemplateComponent[];
  }
) {
  if (!creds.wabaId || !creds.accessToken) {
    throw new Error('WhatsApp Business Account ID (WABA ID) and Access Token are required to submit templates.');
  }

  // 1. Clean components: strip emojis from button text (Meta rejects emojis in button text)
  const cleanedComponents = templateData.components.map((c) => {
    if (c.type === 'BUTTONS' && c.buttons) {
      return {
        ...c,
        buttons: c.buttons.map((b) => ({
          ...b,
          text: b.text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]/g, '').trim(),
          phone_number: b.phone_number ? b.phone_number.replace(/[^0-9+]/g, '') : undefined,
        })),
      };
    }
    return c;
  });

  // 2. Prepare Image header handle if required
  const imageHeader = cleanedComponents.find((c) => c.type === 'HEADER' && c.format === 'IMAGE');
  if (imageHeader) {
    const rawUrl = imageHeader.example?.header_handle?.[0];
    if (rawUrl && !rawUrl.startsWith('4:')) {
      try {
        const imgRes = await fetch(rawUrl);
        if (imgRes.ok) {
          const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
          const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';

          // Get app ID from access token
          const appRes = await fetch(`${BASE_GRAPH_URL}/app?access_token=${creds.accessToken}`);
          const appData = await appRes.json();
          const appId = appData?.id || '1613970426886499';

          // Create Meta resumable upload session
          const uploadInitRes = await fetch(
            `${BASE_GRAPH_URL}/${appId}/uploads?file_length=${imgBuffer.length}&file_type=${mimeType}&access_token=${creds.accessToken}`,
            { method: 'POST' }
          );
          const uploadInit = await uploadInitRes.json();

          if (uploadInit.id) {
            const uploadRes = await fetch(`${BASE_GRAPH_URL}/${uploadInit.id}`, {
              method: 'POST',
              headers: {
                Authorization: `OAuth ${creds.accessToken}`,
                file_offset: '0',
              },
              body: imgBuffer,
            });
            const uploadResult = await uploadRes.json();
            if (uploadResult.h) {
              imageHeader.example = { header_handle: [uploadResult.h] };
            }
          }
        }
      } catch (err) {
        console.warn('Failed to upload image sample handle to Meta:', err);
      }
    }
  }

  const url = `${BASE_GRAPH_URL}/${creds.wabaId}/message_templates`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...templateData,
      components: cleanedComponents,
    }),
  });

  const resJson = await response.json();
  if (!response.ok || resJson.error) {
    const errorMsg = resJson.error?.error_user_msg || resJson.error?.message || 'Failed to submit template to Meta.';
    throw new Error(errorMsg);
  }

  return resJson;
}

/**
 * Fetches all templates from Meta for this WABA
 */
export async function fetchTemplatesFromMeta(creds: MetaCredentials) {
  if (!creds.wabaId || !creds.accessToken) {
    throw new Error('WABA ID and Access Token are required to fetch templates.');
  }

  const url = `${BASE_GRAPH_URL}/${creds.wabaId}/message_templates?limit=100`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
    },
  });

  const resJson = await response.json();
  if (!response.ok || resJson.error) {
    throw new Error(resJson.error?.message || 'Failed to fetch templates from Meta.');
  }

  return resJson.data || [];
}

/**
 * Sends a single WhatsApp Template message
 */
export async function sendWhatsAppTemplateMessage(
  creds: MetaCredentials,
  recipientPhone: string,
  templateName: string,
  languageCode: string = 'en_US',
  bodyParameters: string[] = [],
  headerImageUrl?: string
) {
  if (!creds.phoneNumberId || !creds.accessToken) {
    throw new Error('Phone Number ID and Access Token are required to send messages.');
  }

  // Format phone number: remove non-digits
  const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');

  const payload: any = {
    messaging_product: 'whatsapp',
    to: cleanPhone,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
    },
  };

  const components: any[] = [];

  if (headerImageUrl) {
    components.push({
      type: 'header',
      parameters: [
        {
          type: 'image',
          image: {
            link: headerImageUrl,
          },
        },
      ],
    });
  }

  if (bodyParameters.length > 0) {
    components.push({
      type: 'body',
      parameters: bodyParameters.map((val) => ({
        type: 'text',
        text: val,
      })),
    });
  }

  if (components.length > 0) {
    payload.template.components = components;
  }

  const url = `${BASE_GRAPH_URL}/${creds.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const resJson = await res.json();
  if (!res.ok || resJson.error) {
    return {
      success: false,
      error: resJson.error?.message || 'Failed to send WhatsApp message.',
      code: resJson.error?.code || 'UNKNOWN_ERROR',
    };
  }

  return {
    success: true,
    messageId: resJson.messages?.[0]?.id,
  };
}

/**
 * Sends a direct 1-on-1 text reply to an active customer (within 24h window)
 */
export async function sendWhatsAppDirectMessage(
  creds: MetaCredentials,
  recipientPhone: string,
  messageText: string
) {
  if (!creds.phoneNumberId || !creds.accessToken) {
    throw new Error('Phone Number ID and Access Token are required to send messages.');
  }

  const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone,
    type: 'text',
    text: {
      preview_url: true,
      body: messageText,
    },
  };

  const url = `${BASE_GRAPH_URL}/${creds.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const resJson = await res.json();
  if (!res.ok || resJson.error) {
    return {
      success: false,
      error: resJson.error?.message || 'Failed to send direct WhatsApp message.',
    };
  }

  return {
    success: true,
    messageId: resJson.messages?.[0]?.id,
  };
}
