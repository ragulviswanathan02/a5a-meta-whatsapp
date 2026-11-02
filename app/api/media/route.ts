import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/media?id=media_xxx
// Serves the raw image binary so Meta and browsers can fetch it publicly
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return new NextResponse('Missing media id parameter', { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('meta_credentials')
      .select('phone_details')
      .eq('id', id)
      .single();

    if (error || !data?.phone_details?.data) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const { data: base64Data, mimeType } = data.phone_details;
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (err: any) {
    return new NextResponse(err.message || 'Error fetching media', { status: 500 });
  }
}

// POST /api/media
// Uploads a local file (base64) from user's computer and returns a public URL
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data: base64Data, mimeType = 'image/jpeg', fileName = 'upload.jpg' } = body;

    if (!base64Data) {
      return NextResponse.json({ success: false, error: 'No image data provided' }, { status: 400 });
    }

    const mediaId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Store in Supabase
    const { error } = await supabase.from('meta_credentials').upsert({
      id: mediaId,
      phone_details: {
        data: base64Data,
        mimeType,
        fileName,
        createdAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const host = req.headers.get('host') || 'leads.a5automation.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const publicUrl = `${protocol}://${host}/api/media?id=${mediaId}`;

    return NextResponse.json({
      success: true,
      id: mediaId,
      url: publicUrl,
      fileName,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
