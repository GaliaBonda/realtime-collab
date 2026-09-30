const PALETTE = [
  "#0f766e",
  "#b45309",
  "#7c3aed",
  "#be123c",
  "#1d4ed8",
  "#047857",
  "#c2410c",
  "#4338ca",
];

export function colorFromId(id: string) {
  let hash = 0;
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
