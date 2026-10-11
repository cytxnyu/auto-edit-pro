import {CATALOG_STYLE_IDS} from './catalog-styles';
import {CATALOG_PALETTES} from './catalog-palettes';
import type {DirectorRole} from './schema';

export const PALETTE_IDS = [
  'deep-ocean',
  'violet-sunset',
  'teal-signal',
  'editorial-cream',
  'acid-action',
  'paper-sketch',
  'balatro',
  'crt-warp',
  'cubes',
  'hyperspeed',
  'shape-waves',
  'ripple-distortion',
  'evil-eye',
  'electric-border',
  'lightning',
  'grid-motion',
  'waves',
  'metallic-paint',
  'circular-carousel',
  'micro-slats',
  'ghost-fibers',
  'acid-squares',
  'light-tunnel',
  'light-pillar',
  'floating-lines',
  'grid-scan',
  'prismatic-burst',
  ...CATALOG_STYLE_IDS,
] as const;

export type PaletteId = (typeof PALETTE_IDS)[number];

export type Palette = {
  id: PaletteId;
  canvas: string;
  surface: string;
  card: string;
  foreground: string;
  muted: string;
  accent: string;
  line: string;
};

export const PALETTES: Record<PaletteId, Palette> = {
  ...CATALOG_PALETTES,
  'shape-waves': {
    id: 'shape-waves', canvas: '#f6ede0', surface: '#fff8ed', card: '#eaddc9',
    foreground: '#282019', muted: '#655346', accent: '#bf4e30', line: '#477e69',
  },
  'ripple-distortion': {
    id: 'ripple-distortion', canvas: '#081c26', surface: '#102d38', card: '#173b46',
    foreground: '#efffff', muted: '#b3d8dd', accent: '#60e0d4', line: '#699cfa',
  },
  'evil-eye': {
    id: 'evil-eye', canvas: '#160f22', surface: '#251c36', card: '#322645',
    foreground: '#fff3ff', muted: '#d5bddf', accent: '#d5f568', line: '#b092ff',
  },
  'electric-border': {
    id: 'electric-border', canvas: '#18130a', surface: '#292114', card: '#3a2e1a',
    foreground: '#fff9e9', muted: '#dacba6', accent: '#ffce54', line: '#f78e46',
  },
  'lightning': {
    id: 'lightning', canvas: '#0d142b', surface: '#19233b', card: '#24314b',
    foreground: '#f3f7ff', muted: '#bfceeb', accent: '#a6c8ff', line: '#8482fb',
  },
  'grid-motion': {
    id: 'grid-motion', canvas: '#101e28', surface: '#1a303c', card: '#24424e',
    foreground: '#f3fcff', muted: '#bad1dc', accent: '#ffab72', line: '#5fb5df',
  },
  'waves': {
    id: 'waves', canvas: '#ecefe4', surface: '#f9fbf0', card: '#d9e0cf',
    foreground: '#1f332d', muted: '#496052', accent: '#337466', line: '#bd603d',
  },
  'metallic-paint': {
    id: 'metallic-paint', canvas: '#141b24', surface: '#222d39', card: '#303d4c',
    foreground: '#f7f9fc', muted: '#c1ccd9', accent: '#dae3ed', line: '#93afc5',
  },
  'circular-carousel': {
    id: 'circular-carousel', canvas: '#24141d', surface: '#35232c', card: '#48313c',
    foreground: '#fff4ef', muted: '#dfc2c6', accent: '#edba78', line: '#d28bb3',
  },
  'micro-slats': {
    id: 'micro-slats', canvas: '#ede8f1', surface: '#fbf7ff', card: '#dcd3e4',
    foreground: '#30263a', muted: '#60506e', accent: '#80549b', line: '#aa614a',
  },
  'ghost-fibers': {
    id: 'ghost-fibers', canvas: '#101f1e', surface: '#1c302e', card: '#29413c',
    foreground: '#f2fff8', muted: '#bdd8c9', accent: '#d3efe0', line: '#8cbd9e',
  },
  'acid-squares': {
    id: 'acid-squares', canvas: '#19190e', surface: '#2a2b18', card: '#3b3e24',
    foreground: '#fcffeb', muted: '#d5dcad', accent: '#d2f04d', line: '#fd77bd',
  },
  'light-tunnel': {
    id: 'light-tunnel', canvas: '#25130f', surface: '#3a211b', card: '#4b2c25',
    foreground: '#fff5e9', muted: '#e5c6ae', accent: '#ffa568', line: '#efd390',
  },
  'light-pillar': {
    id: 'light-pillar', canvas: '#1c1025', surface: '#2d1c38', card: '#402749',
    foreground: '#fff3ff', muted: '#d6c0e0', accent: '#e596fb', line: '#74dac8',
  },
  'floating-lines': {
    id: 'floating-lines', canvas: '#151d25', surface: '#23303c', card: '#304252',
    foreground: '#f6fbff', muted: '#c0d4e0', accent: '#e8b794', line: '#89c5de',
  },
  'grid-scan': {
    id: 'grid-scan', canvas: '#0d1a10', surface: '#1a2b1e', card: '#283d2a',
    foreground: '#f2ffef', muted: '#c0d6b8', accent: '#b7ed82', line: '#61c7a2',
  },
  'prismatic-burst': {
    id: 'prismatic-burst', canvas: '#18142e', surface: '#2a2442', card: '#3b3155',
    foreground: '#fff8ff', muted: '#d2c8e7', accent: '#ffb177', line: '#b398f5',
  },
  'balatro': {
    id: 'balatro', canvas: '#15171e', surface: '#1d2029', card: '#292a34',
    foreground: '#fff8ef', muted: '#d2c9c4', accent: '#ed6857', line: '#73b6d5',
  },
  'crt-warp': {
    id: 'crt-warp', canvas: '#050d0a', surface: '#0c1914', card: '#14271e',
    foreground: '#ecfff3', muted: '#b2c8b8', accent: '#9effbb', line: '#5eddaa',
  },
  'cubes': {
    id: 'cubes', canvas: '#191b1f', surface: '#27292c', card: '#353536',
    foreground: '#fff8e9', muted: '#d0c7b7', accent: '#ff9a45', line: '#f5e6c8',
  },
  'hyperspeed': {
    id: 'hyperspeed', canvas: '#0b0715', surface: '#191024', card: '#26182e',
    foreground: '#fff4ff', muted: '#d4bdd7', accent: '#f34dbd', line: '#66eaf6',
  },
  'deep-ocean': {
    id: 'deep-ocean', canvas: '#0b1325', surface: '#141d32', card: '#183153',
    foreground: '#f6f2e8', muted: '#b8c2d3', accent: '#ff6846', line: '#55d7ff',
  },
  'violet-sunset': {
    id: 'violet-sunset', canvas: '#100f23', surface: '#191634', card: '#292451',
    foreground: '#fff7ed', muted: '#d8cfea', accent: '#f43f8d', line: '#8b6cff',
  },
  'teal-signal': {
    id: 'teal-signal', canvas: '#071b22', surface: '#0f2b33', card: '#17404a',
    foreground: '#effffb', muted: '#b7d8d4', accent: '#54f2d2', line: '#55d7ff',
  },
  'editorial-cream': {
    id: 'editorial-cream', canvas: '#f4f0e8', surface: '#fffaf0', card: '#eee4d3',
    foreground: '#18181b', muted: '#5f5b55', accent: '#d92d20', line: '#2563eb',
  },
  'acid-action': {
    id: 'acid-action', canvas: '#111827', surface: '#1b2436', card: '#273248',
    foreground: '#f8fafc', muted: '#bdc7d8', accent: '#c7f000', line: '#facc15',
  },
  'paper-sketch': {
    id: 'paper-sketch', canvas: '#e8dfcb', surface: '#f4efe4', card: '#fffaf0',
    foreground: '#252933', muted: '#6b675e', accent: '#e97a5f', line: '#4a8fa3',
  },
};

export const paletteForRole = (role: DirectorRole, index: number, hasIllustration = false): PaletteId => {
  if (hasIllustration) return 'paper-sketch';
  if (role === 'hook') return 'deep-ocean';
  if (role === 'contrast' || role === 'problem') return 'editorial-cream';
  if (role === 'mechanism' || role === 'steps') return 'teal-signal';
  if (role === 'payoff' || role === 'cta') return 'acid-action';
  if (role === 'data' || role === 'evidence') return (['violet-sunset', 'deep-ocean', 'teal-signal', 'acid-action'] as const)[index % 4];
  return (['deep-ocean', 'violet-sunset', 'teal-signal', 'editorial-cream'] as const)[index % 4];
};
