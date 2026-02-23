// Stickers storage - only for reward system
// COPPA compliant: no personal data, only localStorage
// Safety: Kids cannot input free text, only button selections

export interface Sticker {
  id: string;
  name: string;
  emoji: string;
  description: string;
  earnedAt: string;
}

const STORAGE_KEY = 'tooth_fairy_stickers_v1';

export const STICKER_DEFINITIONS: Record<string, { name: string; emoji: string; description: string }> = {
  brave: { name: 'Curajosul', emoji: '🦁', description: 'Ai fost curajos la dentist!' },
  captain: { name: 'Capitanul Fluor', emoji: '⚔️', description: 'Protector al dintilor!' },
  explorer: { name: 'Exploratorul', emoji: '🔍', description: 'Prima vizita la dentist!' },
  star: { name: 'Steluta', emoji: '⭐', description: 'Dintele tau a cazut!' },
  guardian: { name: 'Gardianul Noptii', emoji: '🌙', description: 'Te periezi seara!' },
  champion: { name: 'Campionul', emoji: '🏆', description: 'Maestru al periajului!' },
  detective: { name: 'Detectivul', emoji: '🕵️', description: 'Ai descoperit bacteriile!' },
  shield: { name: 'Scutul', emoji: '🛡️', description: 'Protejat cu fluor!' },
  smile: { name: 'Zambetul', emoji: '😁', description: 'Aparatul tau e cool!' },
  warrior: { name: 'Razboinicul', emoji: '💪', description: 'Controale regulate!' },
};

export function getEarnedStickers(): Sticker[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function earnSticker(stickerId: string): boolean {
  const stickers = getEarnedStickers();
  
  // Check if already earned
  if (stickers.some(s => s.id === stickerId)) {
    return false; // Already earned
  }
  
  const definition = STICKER_DEFINITIONS[stickerId];
  if (!definition) {
    console.error(`Unknown sticker: ${stickerId}`);
    return false;
  }
  
  const newSticker: Sticker = {
    id: stickerId,
    name: definition.name,
    emoji: definition.emoji,
    description: definition.description,
    earnedAt: new Date().toISOString(),
  };
  
  stickers.push(newSticker);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stickers));
    return true;
  } catch {
    return false;
  }
}

export function hasSticker(stickerId: string): boolean {
  return getEarnedStickers().some(s => s.id === stickerId);
}

export function getTotalStickers(): number {
  return Object.keys(STICKER_DEFINITIONS).length;
}

export function getEarnedCount(): number {
  return getEarnedStickers().length;
}

// For parental controls - clear all data
export function clearAllStickers(): void {
  localStorage.removeItem(STORAGE_KEY);
}
