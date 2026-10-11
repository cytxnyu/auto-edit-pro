import {PALETTES} from '../../../core/src/palettes';
import type {VisualStyleId} from '../../../core/src/visual-styles';
import type {CatalogStyleId} from '../../../core/src/catalog-styles';
import type {StyleMaterial} from './index';

type AddedStyle = Exclude<VisualStyleId, CatalogStyleId | 'balatro' | 'crt-warp' | 'cubes' | 'hyperspeed'>;
type MaterialRecipe = {radius: number; borderWidth: number; treatment: 'soft' | 'cut' | 'glass' | 'glow' | 'foil' | 'hairline'; mono?: boolean; tracking?: string};
const recipes: Record<AddedStyle, MaterialRecipe> = {
  'shape-waves': {radius: 26, borderWidth: 1, treatment: 'soft'},
  'ripple-distortion': {radius: 20, borderWidth: 1, treatment: 'glass'},
  'evil-eye': {radius: 40, borderWidth: 2, treatment: 'soft'},
  'electric-border': {radius: 14, borderWidth: 1, treatment: 'glow'},
  lightning: {radius: 2, borderWidth: 1, treatment: 'glow', tracking: '.02em'},
  'grid-motion': {radius: 6, borderWidth: 2, treatment: 'cut'},
  waves: {radius: 0, borderWidth: 1, treatment: 'hairline'},
  'metallic-paint': {radius: 24, borderWidth: 2, treatment: 'foil'},
  'circular-carousel': {radius: 22, borderWidth: 1, treatment: 'glass'},
  'micro-slats': {radius: 0, borderWidth: 1, treatment: 'hairline', mono: true, tracking: '.035em'},
  'ghost-fibers': {radius: 32, borderWidth: 1, treatment: 'soft'},
  'acid-squares': {radius: 0, borderWidth: 3, treatment: 'cut', tracking: '-.035em'},
  'light-tunnel': {radius: 8, borderWidth: 1, treatment: 'glow'},
  'light-pillar': {radius: 12, borderWidth: 1, treatment: 'glow'},
  'floating-lines': {radius: 28, borderWidth: 1, treatment: 'hairline'},
  'grid-scan': {radius: 0, borderWidth: 1, treatment: 'hairline', mono: true, tracking: '.025em'},
  'prismatic-burst': {radius: 4, borderWidth: 2, treatment: 'foil'},
};

export const EXTENDED_MATERIAL_IDS = Object.keys(recipes) as AddedStyle[];
export const extendedMaterial = (id: AddedStyle): StyleMaterial => {
  const p = PALETTES[id];
  const recipe = recipes[id];
  const shadows = {
    soft: `0 20px 54px ${p.canvas}88, inset 0 1px 0 ${p.line}44`,
    cut: `8px 8px 0 ${p.canvas}, 9px 9px 0 ${p.line}55`,
    glass: `0 18px 44px ${p.canvas}aa, inset 0 0 24px ${p.line}18`,
    glow: `0 0 30px ${p.accent}33, inset 0 0 18px ${p.line}15`,
    foil: `inset 1px 1px 0 ${p.line}bb, inset -2px -2px 0 ${p.canvas}, 0 12px 38px ${p.canvas}88`,
    hairline: `inset 0 1px 0 ${p.line}44, 0 16px 34px ${p.canvas}66`,
  };
  return {radius: recipe.radius, borderWidth: recipe.borderWidth,
    fontFamily: recipe.mono ? '"Cascadia Code", Consolas, "Microsoft YaHei", monospace' : '"Microsoft YaHei", Inter, sans-serif',
    surface: p.surface, line: p.line, accent: p.accent, shadow: shadows[recipe.treatment], letterSpacing: recipe.tracking ?? '-.015em'};
};

export const extendedDefaults = Object.fromEntries(EXTENDED_MATERIAL_IDS.map(id => [id, [PALETTES[id].accent, PALETTES[id].line, PALETTES[id].canvas]])) as Record<AddedStyle, [string,string,string]>;
export const extendedMaterials = Object.fromEntries(EXTENDED_MATERIAL_IDS.map(id => [id, extendedMaterial(id)])) as Record<AddedStyle, StyleMaterial>;
