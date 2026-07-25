// Self-contained placeholder "photos" for the demo — no network calls, no
// external image host. Renders a small labeled color swatch as a data URI.
const PALETTE: Record<string, string> = {
  CARPET_TILE: "#8b6f47",
  BROADLOOM_CARPET: "#6b7280",
  LVT_LVP: "#a67c52",
  HARDWOOD: "#8b5a2b",
  LAMINATE: "#b08d57",
  CERAMIC_PORCELAIN_TILE: "#9ca3af",
  RESILIENT_SHEET: "#64748b",
  RUBBER_FLOORING: "#374151",
  TRIM_TRANSITION_PROFILE: "#71717a",
  ADHESIVE_LEVELING_COMPOUND: "#a8a29e",
  UNDERLAYMENT: "#78716c",
  OTHER: "#737373",
};

export function placeholderPhoto(materialType: string, label: string): string {
  const color = PALETTE[materialType] ?? "#737373";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <rect width="600" height="600" fill="${color}"/>
    <rect width="600" height="600" fill="black" fill-opacity="0.12"/>
    <text x="300" y="310" font-family="system-ui, sans-serif" font-size="30" fill="white" text-anchor="middle" opacity="0.85">${escapeXml(
      label
    )}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function placeholderDyeLotPhoto(label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#e5e7eb"/>
    <rect x="20" y="20" width="560" height="360" fill="white" stroke="#9ca3af" stroke-width="2"/>
    <text x="300" y="190" font-family="monospace" font-size="22" fill="#374151" text-anchor="middle">BOX LABEL</text>
    <text x="300" y="230" font-family="monospace" font-size="18" fill="#374151" text-anchor="middle">${escapeXml(
      label
    )}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
