import {describe, expect, it} from 'vitest';
import {StageRegionSchema, StageSchema, type Stage} from '../src/schema';
const base: Stage = {x: .1, y: .1, width: .8, height: .6, depth: 'front', surface: 'opaque'};
const full = {x: 0, y: 0, width: 1, height: 1};
const valid = {x: .1, y: .2, width: .7, height: .5};
const fields = ['contentRegion', 'styleRegion'] as const;
const invalid = [
  {x: -.01}, {y: -.01}, {width: 0}, {height: 0}, {width: -.1}, {height: -.1},
  {x: 1.01}, {y: 1.01}, {width: 1.01}, {height: 1.01},
  {x: .31, width: .7}, {y: .51, height: .5},
  {x: NaN}, {y: Infinity}, {width: Infinity}, {height: -Infinity},
  {width: '0.5'}, {height: null}, {x: undefined}, {width: undefined},
  {scale: .8}, {keyframes: [{frame: 0, x: 0}]},
];

describe('static stage subviewport schema', () => {
  it('keeps old stage objects identical without inserting new defaults', () => {
    expect(StageSchema.parse(base)).toEqual(base);
    expect(StageSchema.parse(base)).not.toHaveProperty('contentRegion');
    expect(StageSchema.parse(base)).not.toHaveProperty('styleRegion');
  });
  it('allows independent or overlapping regions instead of a forced side-by-side template', () => {
    const stage = {...base, contentRegion: valid, styleRegion: valid};
    expect(StageSchema.parse(stage)).toEqual(stage);
  });
  it('accepts edge-touching/full rectangles and very small positive rectangles', () => {
    for (const region of [full, {x: .75, y: .5, width: .25, height: .5}, {x: 0, y: 0, width: .001, height: .001}]) {
      expect(StageRegionSchema.parse(region)).toEqual(region);
    }
  });
  for (const field of fields) {
    it.each(invalid.map((patch, index) => [index, patch] as const))(`rejects invalid ${field} case %i`, (_, patch) => {
      expect(StageSchema.safeParse({...base, [field]: {...valid, ...patch}}).success).toBe(false);
    });
    it.each([null, [], 'full', true])(`rejects non-object ${field} %s`, (region) => {
      expect(StageSchema.safeParse({...base, [field]: region}).success).toBe(false);
    });
    it(`rejects ${field} on keyframes even alongside a valid animated property`, () => {
      expect(StageSchema.safeParse({...base, keyframes: [{frame: 10, x: .3, [field]: valid}]}).success).toBe(false);
      expect(StageSchema.safeParse({...base, keyframes: [{frame: 10, [field]: valid}]}).success).toBe(false);
    });
    it(`retains ${field} while outer stage position/scale animate`, () => {
      const stage = {...base, [field]: valid, keyframes: [{frame: 10, x: .3, scale: 1.1}]};
      expect(StageSchema.parse(stage)).toEqual(stage);
    });
  }
});
