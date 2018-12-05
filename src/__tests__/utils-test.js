// @flow

import {
  getExcludedFields,
  excludeFields,
  realTypeOf,
  hashThisString,
  getOrderIndependentHash,
} from '../utils';

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
        array: {
          path: 'array',
          instance: 'Array',
          options: {
            type: [{ name: 'String' }],
            track_diff: false,
          },
        },
        arrayExcludeEmbedded: {
          path: 'arrayExcludeEmbedded',
          instance: 'Array',
          options: {
            type: [{ name: { track_diff: false } }],
          },
        },
      },
    };

    const exlFields = getExcludedFields(schema);
    expect(exlFields).toEqual([
      { key: 'title', lvl: 0 },
      { key: 'path', lvl: 1 },
      { key: 'pathLvl4', lvl: 4 },
      { key: 'array', lvl: 0 },
      { key: 'name', lvl: 2 },
    ]);
  });

  it('excludeFields()', () => {
    const exlFields = [
      { key: 'title', lvl: 0 },
      { key: 'path', lvl: 1 },
      { key: 'pathLvl4', lvl: 4 },
      { key: 'name', lvl: 2 },
    ];

    const isTitle = excludeFields([], 'title', exlFields);
    const isPath = excludeFields(['embedded'], 'path', exlFields);
    const isLvl4 = excludeFields(['embedded', 'a', 'b', 'c'], 'pathLvl4', exlFields);
    const arrayExlEmbd = excludeFields(['arrayExcludeEmbedded', '0'], 'name', exlFields);

    expect(isTitle).toBeTruthy();
    expect(isPath).toBeTruthy();
    expect(isLvl4).toBeTruthy();
    expect(arrayExlEmbd).toBeTruthy();
  });

  it('realTypeOf()', () => {
    const date = realTypeOf(new Date());
    const string = realTypeOf('str');
    const number = realTypeOf(0);
    const nullT = realTypeOf(null);
    const undefinedT = realTypeOf(undefined);
    const array = realTypeOf([]);
    const obj = realTypeOf({});
    const regx = realTypeOf(/i/);
    const math = realTypeOf(Math);

    expect(date).toBe('date');
    expect(string).toBe('string');
    expect(number).toBe('number');
    expect(nullT).toBe('null');
    expect(undefinedT).toBe('undefined');
    expect(array).toBe('array');
    expect(obj).toBe('object');
    expect(regx).toBe('regexp');
    expect(math).toBe('math');
  });

  it('hashThisString()', () => {
    const hash1 = hashThisString('a');
    const hash2 = hashThisString('abc');
    const hash3 = hashThisString('abcsydghcsdagcyasjdcsdvcgsavdgcvsagdcbjhsdbbc');

    expect(hash1).toBe(97);
    expect(hash2).toBe(96354);
    expect(hash3).toBe(25191889);
  });

  it('getOrderIndependentHash()', () => {
    const array = getOrderIndependentHash(['a', 'b']);
    const obj = getOrderIndependentHash({ a: 'a', b: 'b' });
    const string = getOrderIndependentHash('ab');

    expect(array).toBe(976844698);
    expect(obj).toBe(-2385456289);
    expect(string).toBe(35072500);
  });
});
