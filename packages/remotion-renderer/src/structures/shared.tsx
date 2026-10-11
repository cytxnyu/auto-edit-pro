import type {CSSProperties, ReactElement, ReactNode} from 'react';
import type {Palette} from '../../../core/src/palettes';
import {sideLaneStyle} from '../theme';
import {useStageSurface} from '../stage/context';
import {styleMaterial} from '../styles';

export const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export const phase = (progress: number, start: number, end: number): number =>
  clamp01((progress - start) / Math.max(0.001, end - start));

export const rise = (progress: number, distance = 28): CSSProperties => ({
  opacity: 0.08 + clamp01(progress) * 0.92,
  transform: `translateY(${Math.round((1 - clamp01(progress)) * distance)}px)`,
});

export const typography: CSSProperties = {
  fontFamily: 'Inter, "Noto Sans SC", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif',
  boxSizing: 'border-box',
};

export const Kicker = ({children, color}: {children: ReactNode; color: string}): ReactElement => {
  const stage = useStageSurface();
  if (stage?.visualStyle) {
    const material = styleMaterial(stage.visualStyle);
    return <div data-style-kicker={stage.visualStyle} style={{
      display: 'flex', alignItems: 'center', gap: 12, fontSize: 18, lineHeight: 1.2, fontWeight: 800,
      fontFamily: material.fontFamily, letterSpacing: stage.visualStyle === 'crt-warp' ? '.19em' : '.1em', color, textTransform: 'uppercase',
    }}><span aria-hidden style={{display: 'inline-block', width: stage.visualStyle === 'hyperspeed' ? 40 : 10, height: stage.visualStyle === 'hyperspeed' ? 2 : 10, background: material.accent, transform: stage.visualStyle === 'balatro' ? 'rotate(45deg)' : undefined}}/>{children}</div>;
  }
  return (
  <div style={{fontSize: 18, lineHeight: 1, fontWeight: 900, letterSpacing: '0.15em', color, textTransform: 'uppercase'}}>
    {children}
  </div>
  );
};

export const EditorialRule = ({progress, color}: {progress: number; color: string}): ReactElement => {
  const stage = useStageSurface();
  if (stage?.visualStyle) return <div data-editorial-rule style={{height: stage.visualStyle === 'cubes' ? 8 : 2, width: `${Math.round(phase(progress, .1, .7) * 100)}%`, background: color}}/>;
  return (
  <div
    data-editorial-rule
    style={{height: 6, width: `${Math.round(phase(progress, 0.1, 0.7) * 100)}%`, background: color, borderRadius: 999}}
  />
  );
};

export const NumberedItem = ({
  index,
  label,
  detail,
  progress,
  palette,
}: {
  index: number;
  label: string;
  detail: string;
  progress: number;
  palette: Palette;
}): ReactElement => (
  <div style={{display: 'grid', gridTemplateColumns: '38px 1fr', gap: 12, alignItems: 'start', ...rise(progress, 18)}}>
    <div style={{width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: palette.accent, color: palette.canvas, fontSize: 16, fontWeight: 950}}>
      {String(index).padStart(2, '0')}
    </div>
    <div>
      <div style={{fontSize: 25, lineHeight: 1.05, fontWeight: 900, color: palette.foreground}}>{label}</div>
      <div style={{marginTop: 7, fontSize: 18, lineHeight: 1.35, fontWeight: 620, color: palette.muted}}>{detail}</div>
    </div>
  </div>
);

export const SourceStamp = ({label, palette}: {label: string; palette: Palette}): ReactElement => {
  const stage = useStageSurface();
  if (stage?.visualStyle) {
    const material = styleMaterial(stage.visualStyle);
    return <div data-style-source={stage.visualStyle} style={{display: 'inline-flex', alignItems: 'center', gap: 9, padding: '8px 12px', borderRadius: material.radius / 3, background: `${palette.canvas}cc`, border: `1px solid ${palette.line}77`, color: palette.foreground, fontSize: 15, fontWeight: 700, fontFamily: material.fontFamily}}>
      <span aria-hidden style={{width: 5, height: 12, background: palette.accent}}/>{label}
    </div>;
  }
  return (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 11px', borderRadius: 999, background: palette.card, border: `1px solid ${palette.line}88`, color: palette.foreground, fontSize: 15, fontWeight: 850}}>
    <span style={{width: 8, height: 8, borderRadius: 99, background: palette.line}}/>
    {label}
  </div>
  );
};

export const SideSurface = ({
  side,
  palette,
  children,
  progress = 1,
}: {
  side: 'left' | 'right';
  palette: Palette;
  children: ReactNode;
  progress?: number;
}): ReactElement => {
  const stage = useStageSurface();
  const material = stage?.visualStyle ? styleMaterial(stage.visualStyle) : undefined;
  if (stage) return (
    <section data-stage-surface={side} data-density-mode="stage-content" style={{
      ...typography, position: 'absolute', top: 0, isolation: 'isolate',
      left: stage.dualRail && side === 'right' ? '52%' : 0,
      width: stage.dualRail ? '48%' : '100%', padding: '38px 36px',
      borderRadius: material?.radius ?? 26, overflow: 'hidden', color: palette.foreground,
      ...(material ? {fontFamily: material.fontFamily, letterSpacing: material.letterSpacing} : {}),
      opacity: .08 + clamp01(progress) * .92,
    }}>
      {stage.surface !== 'transparent' ? <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: -1, borderRadius: material?.radius ?? 26,
        background: stage.surface === 'opaque' ? palette.canvas : palette.surface,
        opacity: stage.surfaceOpacity * (material ? .16 : 1), border: `${material?.borderWidth ?? 1}px solid ${palette.line}77`,
        boxShadow: material?.shadow ?? `0 26px 70px ${palette.canvas}88`,
      }}/> : null}
      {children}
    </section>
  );
  return (
  <section
    data-side-surface={side}
    data-overlay-zone={side}
    data-density-mode="content-fit"
    style={{
      ...typography,
      ...sideLaneStyle(side),
      padding: '28px 25px',
      borderRadius: 26,
      overflow: 'hidden',
      background: `${palette.surface}e8`,
      border: `1px solid ${palette.line}77`,
      boxShadow: `0 26px 70px ${palette.canvas}88`,
      backdropFilter: 'blur(14px)',
      opacity: 0.08 + clamp01(progress) * 0.92,
    }}
  >
    {children}
  </section>
);
};

export const FullScreenSurface = ({
  mode,
  palette,
  children,
}: {
  mode: 'presenter-window' | 'opaque';
  palette: Palette;
  children: ReactNode;
}): ReactElement => {
  const stage = useStageSurface();
  const material = stage?.visualStyle ? styleMaterial(stage.visualStyle) : undefined;
  if (stage) return (
    <section data-full-screen-mode="whole-screen-stage" data-stage-surface={stage.surface} style={{
      ...typography, position: 'absolute', inset: 0, overflow: 'hidden', color: palette.foreground,
      ...(material ? {fontFamily: material.fontFamily, letterSpacing: material.letterSpacing} : {}),
    }}>
      {stage.surface !== 'transparent' && (mode === 'opaque' || stage.surface === 'opaque') ? <div aria-hidden style={{
        position: 'absolute', inset: 0, opacity: stage.surfaceOpacity * (material ? .12 : 1),
        background: `linear-gradient(145deg, ${palette.canvas} 0%, ${palette.surface} 100%)`,
      }}/> : null}
      <div style={{position: 'absolute', inset: 0}}>{children}</div>
    </section>
  );
  return (
  <section
    data-presenter-window={mode === 'presenter-window' ? '35-65' : undefined}
    data-full-screen-opaque={mode === 'opaque' ? 'true' : undefined}
    data-full-screen-mode={mode}
    data-subtitle-reserve="18"
    style={{...typography, position: 'absolute', inset: 0, overflow: 'hidden', color: palette.foreground}}
  >
    {mode === 'opaque' ? (
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(145deg, ${palette.canvas} 0%, ${palette.surface} 100%)`}}/>
    ) : null}
    <div style={{position: 'absolute', inset: '0 0 18% 0'}}>{children}</div>
  </section>
);
};
