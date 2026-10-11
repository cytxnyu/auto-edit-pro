// React Bits catalog expansion: original frame-addressable video interpretations.
export const CATALOG_BACKGROUNDS_IDS = ["aurora", "soft-aurora", "silk", "iridescence", "orb", "galaxy", "particles", "beams", "light-rays", "pixel-snow", "dither", "ripple-grid", "dot-grid", "threads", "liquid-chrome", "prism", "dark-veil", "gradient-blinds", "plasma", "color-bends"] as const;
export const CATALOG_ANIMATIONS_IDS = ["magic-rings", "laser-flow", "magnet-lines", "antigravity", "ribbons", "meta-balls", "star-border", "pixel-trail", "noise", "shape-blur", "crosshair", "click-spark", "pixel-transition", "glare-hover", "sticker-peel"] as const;
export const CATALOG_COMPONENTS_IDS = ["animated-list", "magic-bento", "tilted-card", "spotlight-card", "pixel-card", "glass-surface", "fluid-glass", "stack", "card-swap", "bounce-cards", "dock", "gooey-nav", "stepper", "folder", "elastic-slider"] as const;
export const CATALOG_STYLE_IDS = [...CATALOG_BACKGROUNDS_IDS, ...CATALOG_ANIMATIONS_IDS, ...CATALOG_COMPONENTS_IDS] as const;
export type CatalogStyleId = typeof CATALOG_STYLE_IDS[number];
