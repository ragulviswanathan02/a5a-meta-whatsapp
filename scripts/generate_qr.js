const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const sharp = require('sharp');
const jsQR = require('jsqr');

async function main() {
  const targetUrl = 'https://a5automation.com/seminar/';
  console.log('Generating QR code for:', targetUrl);

  // Generate QR code data with High Error Correction
  const qr = QRCode.create(targetUrl, {
    errorCorrectionLevel: 'H',
  });

  const moduleCount = qr.modules.size; // e.g. 33
  console.log(`QR Matrix Size: ${moduleCount}x${moduleCount} modules`);

  // Canvas Dimensions
  const totalSize = 1200;
  const cardPadding = 90;
  const cardSize = totalSize - cardPadding * 2; // 1020
  const cardX = cardPadding;
  const cardY = cardPadding;
  const cardRadius = 75;

  // Corner brackets settings
  const bracketOffset = 65; // from card edges
  const bracketLength = 70;
  const bracketRadius = 24;
  const bracketColor = '#4338ca'; // deep royal indigo
  const bracketStrokeWidth = 10;

  // QR Code positioning within card
  const qrPadding = 135;
  const qrSize = totalSize - qrPadding * 2; // 930
  const qrX = qrPadding;
  const qrY = qrPadding;
  const moduleSize = qrSize / moduleCount;

  // Center Logo Badge settings
  const centerX = totalSize / 2;
  const centerY = totalSize / 2;
  const centerRadius = moduleSize * 4.6; // covers ~9 modules in diameter
  const logoRadius = centerRadius * 0.82;

  // Load and prepare logo image
  let logoBase64 = '';
  const logoPath = path.resolve('public/logo.jpg');
  if (fs.existsSync(logoPath)) {
    // Make circular logo with sharp
    const logoBuffer = await sharp(logoPath)
      .resize(Math.round(logoRadius * 2), Math.round(logoRadius * 2), {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .composite([{
        input: Buffer.from(
          `<svg><circle cx="${Math.round(logoRadius)}" cy="${Math.round(logoRadius)}" r="${Math.round(logoRadius)}" fill="#ffffff"/></svg>`
        ),
        blend: 'dest-in'
      }])
      .png()
      .toBuffer();
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  }

  // Generate QR Modules SVG
  let qrModulesSvg = '';
  const data = qr.modules.data;
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (data[r * moduleCount + c]) {
        const x = qrX + c * moduleSize;
        const y = qrY + r * moduleSize;

        // Check if module is within center circle to omit it cleanly
        const modCenterX = x + moduleSize / 2;
        const modCenterY = y + moduleSize / 2;
        const distFromCenter = Math.hypot(modCenterX - centerX, modCenterY - centerY);
        if (distFromCenter < centerRadius + 4) {
          continue; // skip rendering module covered by center badge
        }

        qrModulesSvg += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${moduleSize.toFixed(2)}" height="${moduleSize.toFixed(2)}" fill="#0c1524" />\n`;
      }
    }
  }

  // Corner Bracket Paths
  // Top-Left
  const tlX = cardX + bracketOffset;
  const tlY = cardY + bracketOffset;
  const pathTL = `M ${tlX} ${tlY + bracketLength} V ${tlY + bracketRadius} Q ${tlX} ${tlY} ${tlX + bracketRadius} ${tlY} H ${tlX + bracketLength}`;

  // Top-Right
  const trX = cardX + cardSize - bracketOffset;
  const trY = cardY + bracketOffset;
  const pathTR = `M ${trX - bracketLength} ${trY} H ${trX - bracketRadius} Q ${trX} ${trY} ${trX} ${trY + bracketRadius} V ${trY + bracketLength}`;

  // Bottom-Left
  const blX = cardX + bracketOffset;
  const blY = cardY + cardSize - bracketOffset;
  const pathBL = `M ${blX} ${blY - bracketLength} V ${blY - bracketRadius} Q ${blX} ${blY} ${blX + bracketRadius} ${blY} H ${blX + bracketLength}`;

  // Bottom-Right
  const brX = cardX + cardSize - bracketOffset;
  const brY = cardY + cardSize - bracketOffset;
  const pathBR = `M ${brX - bracketLength} ${brY} H ${brX - bracketRadius} Q ${brX} ${brY} ${brX} ${brY - bracketRadius} V ${brY - bracketLength}`;

  // Assemble Complete SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">
  <defs>
    <filter id="cardShadow" x="-5%" y="-5%" width="112%" height="112%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="16" stdDeviation="28" flood-color="#0f172a" flood-opacity="0.08" />
      <feDropShadow dx="0" dy="4" stdDeviation="10" flood-color="#0f172a" flood-opacity="0.04" />
    </filter>
  </defs>

  <!-- Canvas Background -->
  <rect width="${totalSize}" height="${totalSize}" fill="#f8fafc" />

  <!-- Main Rounded Card -->
  <rect x="${cardX}" y="${cardY}" width="${cardSize}" height="${cardSize}" rx="${cardRadius}" ry="${cardRadius}" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" filter="url(#cardShadow)" />

  <!-- 4 Corner Viewfinder Brackets -->
  <path d="${pathTL}" fill="none" stroke="${bracketColor}" stroke-width="${bracketStrokeWidth}" stroke-linecap="round" stroke-linejoin="round" />
  <path d="${pathTR}" fill="none" stroke="${bracketColor}" stroke-width="${bracketStrokeWidth}" stroke-linecap="round" stroke-linejoin="round" />
  <path d="${pathBL}" fill="none" stroke="${bracketColor}" stroke-width="${bracketStrokeWidth}" stroke-linecap="round" stroke-linejoin="round" />
  <path d="${pathBR}" fill="none" stroke="${bracketColor}" stroke-width="${bracketStrokeWidth}" stroke-linecap="round" stroke-linejoin="round" />

  <!-- QR Code Modules -->
  <g>
    ${qrModulesSvg}
  </g>

  <!-- Center Logo Badge -->
  <g transform="translate(${centerX}, ${centerY})">
    <!-- Circular White Cutout -->
    <circle r="${centerRadius.toFixed(2)}" fill="#ffffff" stroke="#3b82f6" stroke-width="4.5" />
    <circle r="${(centerRadius - 3).toFixed(2)}" fill="#ffffff" />
    <!-- Embedded Logo Image -->
    ${logoBase64 ? `<image href="${logoBase64}" x="-${logoRadius.toFixed(2)}" y="-${logoRadius.toFixed(2)}" width="${(logoRadius * 2).toFixed(2)}" height="${(logoRadius * 2).toFixed(2)}" />` : ''}
  </g>
</svg>`;

  // Output paths
  const outDir = path.resolve('public/seminar');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const svgPath = path.join(outDir, 'seminar-qr-code.svg');
  const pngPath = path.join(outDir, 'seminar-qr-code.png');

  fs.writeFileSync(svgPath, svg, 'utf8');
  console.log('Saved SVG to:', svgPath);

  // Render to 1200x1200 high-res PNG using sharp
  await sharp(Buffer.from(svg))
    .png({ quality: 100 })
    .toFile(pngPath);
  console.log('Saved High-Res PNG to:', pngPath);

  // Verify scan with jsQR
  const rawImage = await sharp(pngPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const code = jsQR(
    new Uint8ClampedArray(rawImage.data),
    rawImage.info.width,
    rawImage.info.height
  );

  if (code) {
    console.log('✅ QR Code Scan VERIFIED Successfully!');
    console.log('   Decoded URL:', code.data);
  } else {
    console.warn('⚠️ jsQR could not scan - checking parameters...');
  }
}

main().catch(err => {
  console.error('Error generating QR code:', err);
  process.exit(1);
});
