import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server folder
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const SERVER_IP = process.env.BRIDGE_SERVER_IP || 'YOUR_SERVER_IP_HERE';
const PORT = process.env.BRIDGE_PORT || '3000';
const BASE_URL = `http://${SERVER_IP}:${PORT}`;

const qrIndoorDir = path.join(__dirname, 'qrcodes/indoor');
const qrOutdoorDir = path.join(__dirname, 'qrcodes/outdoor');

if (!fs.existsSync(qrIndoorDir)) {
  fs.mkdirSync(qrIndoorDir, { recursive: true });
}
if (!fs.existsSync(qrOutdoorDir)) {
  fs.mkdirSync(qrOutdoorDir, { recursive: true });
}

async function runGenerator() {
  const isPlaceholder = SERVER_IP === 'YOUR_SERVER_IP_HERE';

  let indoorCardsHtml = '';
  let outdoorCardsHtml = '';

  // Table 1 to 32
  for (let n = 1; n <= 32; n++) {
    const isIndoor = n <= 20;
    const padNum = String(n).padStart(2, '0');
    const folder = isIndoor ? 'indoor' : 'outdoor';
    const filename = `table-${padNum}.png`;
    const targetPath = path.join(__dirname, `qrcodes/${folder}/${filename}`);
    
    const orderUrl = `${BASE_URL}/order?table=${n}`;

    // Generate PNG
    await QRCode.toFile(targetPath, orderUrl, {
      color: {
        dark: '#2D5016', 
        light: '#F5EFE6'
      },
      width: 250,
      margin: 1
    });

    const secNameTh = isIndoor ? 'อินดอร์' : 'เอาท์ดอร์';
    const secNameEn = isIndoor ? 'Indoor' : 'Outdoor';

    // HTML template card
    const cardHtml = `
      <div class="qr-card">
        <div class="header-banner">ADA'S CAFE' · CHIANG RAI</div>
        <div class="divider-line"></div>
        <div class="qr-box">
          <img class="qr-img" src="./qrcodes/${folder}/${filename}" alt="Table ${n}">
        </div>
        <div class="table-info-box">
          <div class="table-num">โต๊ะ / Table ${n}</div>
          <div class="table-sec">${secNameTh} / ${secNameEn}</div>
        </div>
        <div class="scan-prompt">สแกนเพื่อสั่งอาหาร · Scan to Order</div>
        <div class="tagline">Homemade with love ☽ ฮาลาล</div>
      </div>
    `;

    if (isIndoor) {
      indoorCardsHtml += cardHtml;
    } else {
      outdoorCardsHtml += cardHtml;
    }
  }

  // A4 Printable template builder
  const buildPrintSheet = (title, cardsHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --color-bg: #F5EFE6;
      --color-surface: #EDE0D0;
      --color-primary: #2D5016;
      --color-accent: #8B4513;
      --color-text: #3B2A1A;
    }
    body {
      margin: 0;
      padding: 10px;
      background: #e0e0e0;
      font-family: 'Inter', sans-serif;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .print-control-bar {
        display: none;
      }
      .page-break {
        page-break-after: always;
      }
    }
    .print-control-bar {
      display: flex;
      justify-content: center;
      padding: 10px;
      background-color: #333;
      margin-bottom: 20px;
    }
    .print-btn {
      background-color: var(--color-primary);
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 30px;
      cursor: pointer;
    }
    .grid-container {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      max-width: 1200px;
      margin: 0 auto;
      padding: 10px;
      background-color: white;
      border-radius: 8px;
    }
    .qr-card {
      background-color: var(--color-bg);
      border: 1.5px solid var(--color-surface);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 4px 8px rgba(0,0,0,0.05);
      box-sizing: border-box;
      height: 380px;
    }
    .header-banner {
      font-family: 'Playfair Display', serif;
      font-size: 11px;
      font-weight: 700;
      color: var(--color-accent);
      letter-spacing: 0.5px;
    }
    .divider-line {
      width: 80px;
      border-bottom: 1.5px dotted var(--color-primary);
      margin: 6px 0;
    }
    .qr-box {
      background: white;
      padding: 8px;
      border-radius: 6px;
      margin: 8px 0;
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
    }
    .qr-img {
      width: 150px;
      height: 150px;
      display: block;
    }
    .table-info-box {
      background-color: var(--color-primary);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      margin: 6px 0;
      min-width: 140px;
    }
    .table-num {
      font-size: 13px;
      font-weight: 700;
    }
    .table-sec {
      font-size: 9px;
      font-weight: 600;
      opacity: 0.85;
      margin-top: 1px;
    }
    .scan-prompt {
      font-size: 9px;
      font-weight: 700;
      color: var(--color-text);
      margin: 6px 0;
    }
    .tagline {
      font-family: 'Playfair Display', serif;
      font-style: italic;
      font-size: 10px;
      color: var(--color-accent);
      margin-top: auto;
    }
  </style>
</head>
<body>
  <div class="print-control-bar">
    <button class="print-btn" onclick="window.print()">Print Cards (A4)</button>
  </div>
  <div class="grid-container">
    ${cardsHtml}
  </div>
</body>
</html>
  `;

  // Write files
  fs.writeFileSync(path.join(__dirname, 'print-indoor.html'), buildPrintSheet("Ada's Cafe' - Indoor QRs", indoorCardsHtml), 'utf-8');
  fs.writeFileSync(path.join(__dirname, 'print-outdoor.html'), buildPrintSheet("Ada's Cafe' - Outdoor QRs", outdoorCardsHtml), 'utf-8');

  // Logs
  console.log(`✓ Generated indoor QR codes  : table-01 to table-20 (20 files)`);
  console.log(`✓ Generated outdoor QR codes : table-21 to table-32 (12 files)`);
  console.log(`✓ Print sheet saved          : scripts/print-indoor.html`);
  console.log(`✓ Print sheet saved          : scripts/print-outdoor.html`);

  if (isPlaceholder) {
    console.log("⚠️  QR codes generated with placeholder IP.");
    console.log("   Update BRIDGE_SERVER_IP in .env then regenerate.");
  }
  
  console.log("══════════════════════════════════════════");
  console.log("To print: open HTML files in browser → Ctrl+P → Save as PDF");
  console.log("══════════════════════════════════════════");
}

runGenerator().catch(console.error);
