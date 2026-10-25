// ============================================================
// ARQUIVO: GeminiLogo.tsx
// Cole em src/components/GeminiLogo.tsx (mesma pasta do TaskWorkspace.tsx)
// ============================================================

import React from 'react';

/**
 * Logo "estrela" do Gemini em SVG inline (sem imagem externa).
 * Se quiser usar o arquivo oficial, siga as diretrizes de marca do Google.
 */
export const GeminiLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="gemini-logo-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#4285F4" />
        <stop offset="0.5" stopColor="#9B72CB" />
        <stop offset="1" stopColor="#D96570" />
      </linearGradient>
    </defs>
    <path
      fill="url(#gemini-logo-grad)"
      d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12Z"
    />
  </svg>
);
