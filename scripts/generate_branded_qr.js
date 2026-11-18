const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const sharp = require('sharp');
const jsQR = require('jsqr');

async function generateBrandedQR() {
  const targetUrl = 'https://a5automation.com/seminar/';
  console.log('Generating production branded QR for:', targetUrl);

  const canvasSize = 1000;
  const cardMargin = 40;
  const cardSize = canvasSize - cardMargin * 2; // 920x920
  const cardRadius = 70;

  // 1. Generate QR Code with Error Correction 'H'
  const qrSize = 720;
  const qrBuffer = await QRCode.toBuffer(targetUrl, {
    errorCorrectionLevel: 'H',
    width: qrSize,
    margin: 1,
    color: {
      dark: '#0c1524',
      light: '#ffffff'
    }
  });

  // 2. Prepare Center Circular Logo Badge
  const badgeRadius = 78; // diameter 156px (approx 21% of QR size)
  const logoInnerRadius = 66; // diameter 132px

  const logoPath = path.resolve('public/logo.jpg');
  const circularLogo = await sharp(logoPath)
    .resize(logoInnerRadius * 2, logoInnerRadius * 2, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .composite([{
      input: Buffer.from(
        `<svg width="${logoInnerRadius * 2}" height="${logoInnerRadius * 2}">
          <circle cx="${logoInnerRadius}" cy="${logoInnerRadius}" r="${logoInnerRadius}" fill="#ffffff"/>
        </svg>`
      ),
      blend: 'dest-in'
    }])
    .png()
    .toBuffer();

  // Create Badge SVG (white circle + blue ring + inner shadow)
  const badgeSvg = Buffer.from(
    `<svg width="${badgeRadius * 2}" height="${badgeRadius * 2}">
      <circle cx="${badgeRadius}" cy="${badgeRadius}" r="${badgeRadius - 2}" fill="#ffffff" stroke="#3b82f6" stroke-width="4.5"/>
    </svg>`
  );

  const fullBadge = await sharp(badgeSvg)
    .composite([{
      input: circularLogo,
      top: badgeRadius - logoInnerRadius,
      left: badgeRadius - logoInnerRadius
    }])
    .png()
    .toBuffer();

  // 3. Create the Card Frame with 4 Corner Viewfinder Brackets
  // Corner brackets positions relative to canvas
  const bOffset = 48; // distance inside card
  const bLen = 64;    // length of bracket arms
  const bRadius = 24; // curve radius
  const bStroke = 9;  // thickness
  const bColor = '#4338ca'; // deep vibrant royal indigo

  // Coordinates
  const cLeft = cardMargin + bOffset;
  const cRight = cardMargin + cardSize - bOffset;
  const cTop = cardMargin + bOffset;
  const cBottom = cardMargin + cardSize - bOffset;

  const pathTL = `M ${cLeft} ${cTop + bLen} V ${cTop + bRadius} Q ${cLeft} ${cTop} ${cLeft + bRadius} ${cTop} H ${cLeft + bLen}`;
  const pathTR = `M ${cRight - bLen} ${cTop} H ${cRight - bRadius} Q ${cRight} ${cTop} ${cRight} ${cTop + bRadius} V ${cTop + bLen}`;
  const pathBL = `M ${cLeft} ${cBottom - bLen} V ${cBottom - bRadius} Q ${cLeft} ${cBottom} ${cLeft + bRadius} ${cBottom} H ${cLeft + bLen}`;
  const pathBR = `M ${cRight - bLen} ${cBottom} H ${cRight - bRadius} Q ${cRight} ${cBottom} ${cRight} ${cBottom - bRadius} V ${cBottom - bLen}`;

  const frameSvg = Buffer.from(
    `<svg width="${canvasSize}" height="${canvasSize}">
      <!-- Outer Card with rounded corners -->
      <rect x="${cardMargin}" y="${cardMargin}" width="${cardSize}" height="${cardSize}" rx="${cardRadius}" ry="${cardRadius}" fill="#ffffff" stroke="#e2e8f0" stroke-width="2.5" />
      
      <!-- 4 Corner Viewfinder Brackets -->
      <path d="${pathTL}" fill="none" stroke="${bColor}" stroke-width="${bStroke}" stroke-linecap="round" stroke-linejoin="round" />
      <path d="${pathTR}" fill="none" stroke="${bColor}" stroke-width="${bStroke}" stroke-linecap="round" stroke-linejoin="round" />
      <path d="${pathBL}" fill="none" stroke="${bColor}" stroke-width="${bStroke}" stroke-linecap="round" stroke-linejoin="round" />
      <path d="${pathBR}" fill="none" stroke="${bColor}" stroke-width="${bStroke}" stroke-linecap="round" stroke-linejoin="round" />
    </svg>`
  );

  // 4. Composite All Layers Together
  const qrTop = (canvasSize - qrSize) / 2;
  const qrLeft = (canvasSize - qrSize) / 2;
  const badgeTop = (canvasSize - badgeRadius * 2) / 2;
  const badgeLeft = (canvasSize - badgeRadius * 2) / 2;

  const finalImage = await sharp(frameSvg)
    .composite([
      { input: qrBuffer, top: qrTop, left: qrLeft },
      { input: fullBadge, top: badgeTop, left: badgeLeft }
    ])
    .png({ quality: 100 })
    .toBuffer();

  // Save Outputs
  const outDir = path.resolve('public/seminar');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const finalPngPath = path.join(outDir, 'seminar-qr-code.png');
  fs.writeFileSync(finalPngPath, finalImage);
  console.log('Saved high-res PNG to:', finalPngPath);

  // Also save to Brain Artifact directory for easy user access & viewing
  const artifactDir = 'C:\\Users\\RAGUL\\.gemini\\antigravity\\brain\\255ac185-627f-46c9-a9ca-e6ab9aeb5eb7';
  if (fs.existsSync(artifactDir)) {
    const artifactPng = path.join(artifactDir, 'seminar-qr-code.png');
    fs.writeFileSync(artifactPng, finalImage);
    console.log('Saved copy to artifact directory:', artifactPng);
  }

  // 5. Verify Scanning
  const raw = await sharp(finalImage).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const scanned = jsQR(new Uint8ClampedArray(raw.data), raw.info.width, raw.info.height);

  if (scanned) {
    console.log('🎉 SCAN VERIFIED 100% SUCCESS!');
    console.log('   Decoded Content:', scanned.data);
  } else {
    console.warn('⚠️ Verification failed with jsQR');
  }
}

generateBrandedQR().catch(console.error);
