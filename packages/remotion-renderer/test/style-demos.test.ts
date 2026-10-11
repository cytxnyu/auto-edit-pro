import {describe, expect, it} from 'vitest';
import {STYLE_DEMOS, styleDemoStoryboard, type StyleDemoIndex} from '../src/StyleDemos';
describe('synthetic style component demos', () => {
  it('covers every requested style with three valid six-second storyboards', () => {
    const styles = new Set<string>();
    STYLE_DEMOS.forEach((_, i) => {
      const board=styleDemoStoryboard(i as StyleDemoIndex);
      expect(board.duration).toBe(6);
      expect(board.width).toBe(1280);
      expect(board.captionsMode).toBe('none');
      for(const beat of board.beats){expect(beat.stage).toBeDefined();styles.add(beat.visualStyle!.id);}
    });
    expect([...styles].sort()).toEqual(['balatro','crt-warp','cubes','hyperspeed']);
  });
  it('uses the same semantic component across a within-video style switch', () => {
    const board=styleDemoStoryboard(1);
    expect(board.beats[0].content).toEqual(board.beats[1].content);
    expect(board.beats[0].visualStyle!.id).not.toEqual(board.beats[1].visualStyle!.id);
    expect(board.beats[0].end).toBe(board.beats[1].start);
  });
});
