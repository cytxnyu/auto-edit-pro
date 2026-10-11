import {PALETTES} from '../../../core/src/palettes';
import {CATALOG_STYLE_IDS, type CatalogStyleId} from '../../../core/src/catalog-styles';
import type {StyleMaterial} from './index';
type Treatment = 'soft'|'paper'|'foil'|'glass'|'glow'|'hairline'|'cut';
const recipes: Record<CatalogStyleId, readonly [number,Treatment]> = {
  "aurora": [
    28,
    "soft"
  ],
  "soft-aurora": [
    34,
    "paper"
  ],
  "silk": [
    24,
    "foil"
  ],
  "iridescence": [
    26,
    "foil"
  ],
  "orb": [
    38,
    "glass"
  ],
  "galaxy": [
    18,
    "glow"
  ],
  "particles": [
    14,
    "paper"
  ],
  "beams": [
    4,
    "glow"
  ],
  "light-rays": [
    8,
    "soft"
  ],
  "pixel-snow": [
    2,
    "hairline"
  ],
  "dither": [
    0,
    "cut"
  ],
  "ripple-grid": [
    10,
    "hairline"
  ],
  "dot-grid": [
    16,
    "paper"
  ],
  "threads": [
    0,
    "hairline"
  ],
  "liquid-chrome": [
    22,
    "foil"
  ],
  "prism": [
    3,
    "foil"
  ],
  "dark-veil": [
    28,
    "soft"
  ],
  "gradient-blinds": [
    0,
    "cut"
  ],
  "plasma": [
    32,
    "glow"
  ],
  "color-bends": [
    36,
    "paper"
  ],
  "magic-rings": [
    40,
    "glow"
  ],
  "laser-flow": [
    10,
    "glow"
  ],
  "magnet-lines": [
    2,
    "hairline"
  ],
  "antigravity": [
    20,
    "glass"
  ],
  "ribbons": [
    32,
    "paper"
  ],
  "meta-balls": [
    44,
    "glass"
  ],
  "star-border": [
    14,
    "glow"
  ],
  "pixel-trail": [
    0,
    "cut"
  ],
  "noise": [
    3,
    "paper"
  ],
  "shape-blur": [
    30,
    "soft"
  ],
  "crosshair": [
    0,
    "hairline"
  ],
  "click-spark": [
    12,
    "glow"
  ],
  "pixel-transition": [
    0,
    "cut"
  ],
  "glare-hover": [
    16,
    "foil"
  ],
  "sticker-peel": [
    6,
    "paper"
  ],
  "animated-list": [
    12,
    "paper"
  ],
  "magic-bento": [
    24,
    "glow"
  ],
  "tilted-card": [
    20,
    "cut"
  ],
  "spotlight-card": [
    28,
    "glow"
  ],
  "pixel-card": [
    0,
    "cut"
  ],
  "glass-surface": [
    32,
    "glass"
  ],
  "fluid-glass": [
    44,
    "glass"
  ],
  "stack": [
    10,
    "cut"
  ],
  "card-swap": [
    18,
    "foil"
  ],
  "bounce-cards": [
    22,
    "paper"
  ],
  "dock": [
    34,
    "glass"
  ],
  "gooey-nav": [
    48,
    "soft"
  ],
  "stepper": [
    14,
    "hairline"
  ],
  "folder": [
    12,
    "paper"
  ],
  "elastic-slider": [
    38,
    "soft"
  ]
};
export const catalogMaterial = (id: CatalogStyleId): StyleMaterial => {
  const p=PALETTES[id], [radius,treatment]=recipes[id];
  const mono=['pixel-snow','dither','pixel-trail','crosshair','pixel-card','pixel-transition'].includes(id);
  const shadows: Record<Treatment,string> = {
    soft:`0 16px 48px ${p.canvas}66, inset 0 1px 0 ${p.line}33`,
    paper:`0 8px 24px ${p.accent}18, 2px 3px 0 ${p.line}22`,
    foil:`inset 1px 1px 0 ${p.line}aa, inset -1px -1px 0 ${p.accent}55, 0 12px 30px ${p.canvas}88`,
    glass:`inset 0 1px 0 ${p.line}88, inset 0 0 28px ${p.accent}11, 0 12px 36px ${p.canvas}66`,
    glow:`0 0 28px ${p.accent}33, inset 0 0 12px ${p.line}22`,
    hairline:`inset 0 1px 0 ${p.line}66, 0 12px 28px ${p.canvas}33`,
    cut:`6px 7px 0 ${p.canvas}, 7px 8px 0 ${p.line}55`,
  };
  return {radius,borderWidth:treatment==='cut'?2:1,fontFamily:mono?'"Cascadia Code", Consolas, "Microsoft YaHei", monospace':'"Microsoft YaHei", Inter, sans-serif',surface:p.surface,line:p.line,accent:p.accent,shadow:shadows[treatment],letterSpacing:mono?'.02em':'-.015em'};
};
export const catalogMaterials=Object.fromEntries(CATALOG_STYLE_IDS.map(id=>[id,catalogMaterial(id)])) as Record<CatalogStyleId,StyleMaterial>;
export const catalogDefaults=Object.fromEntries(CATALOG_STYLE_IDS.map(id=>[id,[PALETTES[id].accent,PALETTES[id].line,PALETTES[id].canvas]])) as Record<CatalogStyleId,[string,string,string]>;
