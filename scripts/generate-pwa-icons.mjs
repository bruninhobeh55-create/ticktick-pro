import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#4f46e5" />
    </linearGradient>
    <linearGradient id="checkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#eff6ff" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#1e1b4b" flood-opacity="0.35" />
    </filter>
    <filter id="innerGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#ffffff" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Base background (for maskable full bleed) -->
  <rect width="512" height="512" fill="url(#bgGrad)" />

  <!-- Subtle ambient highlight ring -->
  <circle cx="256" cy="256" r="220" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" />

  <!-- Core Content Group -->
  <g filter="url(#shadow)">
    <!-- White Circle Container -->
    <circle cx="256" cy="256" r="148" fill="#ffffff" />
    <circle cx="256" cy="256" r="146" fill="none" stroke="rgba(59,130,246,0.15)" stroke-width="4" />

    <!-- Blue Checkmark Path -->
    <path 
      d="M196 258 L236 298 L316 218" 
      fill="none" 
      stroke="url(#bgGrad)" 
      stroke-width="32" 
      stroke-linecap="round" 
      stroke-linejoin="round" 
    />

    <!-- Small Accent Dot (Pomodoro / Focus spark) -->
    <circle cx="328" cy="184" r="10" fill="#f59e0b" />
  </g>
</svg>
`;

async function main() {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage();

  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Generate full-bleed SVG file
  fs.writeFileSync(path.join(publicDir, 'app-icon.svg'), iconSvg.trim());

  // Helper to render HTML and screenshot
  const renderAndSave = async (outputPath, size, isSquircle = false, isApple = false) => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              width: ${size}px;
              height: ${size}px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: ${isSquircle ? 'transparent' : '#2563eb'};
              overflow: hidden;
            }
            .icon-box {
              width: ${size}px;
              height: ${size}px;
              border-radius: ${isSquircle ? Math.round(size * 0.22) + 'px' : isApple ? '0px' : '0px'};
              overflow: hidden;
              display: flex;
            }
            svg {
              width: 100%;
              height: 100%;
            }
          </style>
        </head>
        <body>
          <div class="icon-box">
            ${iconSvg}
          </div>
        </body>
      </html>
    `;
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(html);
    await page.screenshot({ path: outputPath, omitBackground: isSquircle });
    console.log(`Generated: ${outputPath} (${size}x${size})`);
  };

  // Maskable 512x512 (full bleed square)
  await renderAndSave(path.join(publicDir, 'icon-maskable-512.png'), 512, false, false);

  // Standard 512x512 (squircle transparent for platforms that don't auto-mask)
  await renderAndSave(path.join(publicDir, 'icon-512.png'), 512, true, false);

  // Standard 192x192
  await renderAndSave(path.join(publicDir, 'icon-192.png'), 192, true, false);

  // Apple Touch Icon 180x180 (iOS expects square without transparency; iOS clips it to its standard squircle)
  await renderAndSave(path.join(publicDir, 'apple-touch-icon.png'), 180, false, true);

  await browser.close();
  console.log('All PWA icons generated successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
