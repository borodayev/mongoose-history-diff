// @flow

import { getExcludedFields, excludeFields } from '../utils';

describe('utils', () => {
  it('getExcludedFields()', () => {
    const schema: any = {
      paths: {
        title: {
          path: 'title',
          options: { track_diff: false },
        },
        'embedded.pathLvl1': {
          path: 'embedded.path',
          options: { track_diff: false },
        },
        'embedded.a.b.c.pathLvl4': {
          path: 'embedded.a.b.c.pathLvl4',
          options: { track_diff: false },
        },
        true: {
          path: 'true',
          options: { track_diff: true },
        },
        undefined: {
          path: 'undefined',
          options: { track_diff: true },
        },
      },
    };

    const exlFields = getExcludedFields(schema);
    expect(exlFields).toEqual([
      { key: 'title', lvl: 0 },
      { key: 'path', lvl: 1 },
      { key: 'pathLvl4', lvl: 4 },
    ]);
  });

  it('excludeFields()', () => {
    const exlFields = [
      { key: 'title', lvl: 0 },
      { key: 'path', lvl: 1 },
      { key: 'pathLvl4', lvl: 4 },
    ];

    const isTitle = excludeFields([], 'title', exlFields);
    const isPath = excludeFields(['embedded'], 'path', exlFields);
    const isLvl4 = excludeFields(['embedded', 'a', 'b', 'c'], 'pathLvl4', exlFields);

    expect(isTitle).toBeTruthy();
    expect(isPath).toBeTruthy();
    expect(isLvl4).toBeTruthy();
  });
});
