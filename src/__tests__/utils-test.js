// @flow

import {
  getExcludedFields,
  excludeFields,
  realTypeOf,
  hashThisString,
  getOrderIndependentHash,
  arrayRemove,
  revertArrayChange,
  deepClone,
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
    const hashNull = hashThisString('[ type: null ; value: ""]');
    const empty = hashThisString('');
    const hash2 = hashThisString('abc');
    const hash3 = hashThisString('abcsydghcsdagcyasjdcsdvcgsavdgcvsagdcbjhsdbbc');

    expect(hash1).toBe(97);
    expect(empty).toBe(0);
    expect(hashNull).toBe(1593002687);
    expect(hash2).toBe(96354);
    expect(hash3).toBe(25191889);
  });

  it('getOrderIndependentHash()', () => {
    const array = getOrderIndependentHash(['a', 'b']);
    const ifNull = getOrderIndependentHash(null);
    const obj = getOrderIndependentHash({ a: 'a', b: 'b' });
    const string = getOrderIndependentHash('ab');

    expect(ifNull).toBe(1933772593);
    expect(array).toBe(976844698);
    expect(obj).toBe(-2385456289);
    expect(string).toBe(35072500);
  });

  it('arrayRemove()', () => {
    const slicedFrom = arrayRemove(
      [
        { k: 'A', p: ['details', 'with'], i: 1, it: { k: 'N', r: 'elements1' } },
        { k: 'A', p: ['details', 'with'], i: 2, it: { k: 'N', r: 'elements2' } },
        { k: 'A', p: ['details', 'with'], i: 3, it: { k: 'N', r: 'elements3' } },
        { k: 'A', p: ['details', 'with'], i: 4, it: { k: 'N', r: 'elements4' } },
      ],
      1
    );

    const slicedFromTo = arrayRemove(
      [
        { k: 'A', p: ['details', 'with'], i: 1, it: { k: 'N', r: 'elements1' } },
        { k: 'A', p: ['details', 'with'], i: 2, it: { k: 'N', r: 'elements2' } },
        { k: 'A', p: ['details', 'with'], i: 3, it: { k: 'N', r: 'elements3' } },
        { k: 'A', p: ['details', 'with'], i: 4, it: { k: 'N', r: 'elements4' } },
      ],
      1,
      2
    );

    expect(slicedFrom).toEqual([
      { i: 1, it: { k: 'N', r: 'elements1' }, k: 'A', p: ['details', 'with'] },
      { i: 3, it: { k: 'N', r: 'elements3' }, k: 'A', p: ['details', 'with'] },
      { i: 4, it: { k: 'N', r: 'elements4' }, k: 'A', p: ['details', 'with'] },
    ]);

    expect(slicedFromTo).toEqual([
      { i: 1, it: { k: 'N', r: 'elements1' }, k: 'A', p: ['details', 'with'] },
      { i: 4, it: { k: 'N', r: 'elements4' }, k: 'A', p: ['details', 'with'] },
    ]);
  });

  it('revertArrayChange()', () => {
    const revertedNew = revertArrayChange([1, 2, 3, 4], 3, { k: 'N', r: 4 });
    const revertedDeleted = revertArrayChange([1, 2, 3], 3, { k: 'D', l: 4 });
    const revertedEdited = revertArrayChange([1, 2, 3, 6], 3, { k: 'E', l: 5, r: 6 });
    const revertedArray = revertArrayChange(
      [
        [1, 2],
        [1, 3],
      ],
      1,
      {
        k: 'A',
        i: 1,
        it: { k: 'E', l: 2, r: 3 },
      }
    );

    expect(revertedNew).toEqual([1, 2, 3]);
    expect(revertedDeleted).toEqual([1, 2, 3, 4]);
    expect(revertedEdited).toEqual([1, 2, 3, 5]);
    expect(revertedArray).toEqual([
      [1, 2],
      [1, 2],
    ]);
  });

  it('deepClone()', () => {
    const obj = {
      str: '123',
      num: 123,
      reg: /123/,
      arr: [1, 2, 3],
      date: new Date('2019-01-05'),
      obj: {
        a: {
          b: 1,
        },
      },
    };

    const clone = deepClone(obj);
    expect(obj).toEqual({
      arr: [1, 2, 3],
      date: new Date('2019-01-05T00:00:00.000Z'),
      num: 123,
      obj: { a: { b: 1 } },
      reg: /123/,
      str: '123',
    });
    expect(clone === obj).toBeFalsy();
    expect(clone).toEqual({
      arr: [1, 2, 3],
      date: new Date('2019-01-05T00:00:00.000Z'),
      num: 123,
      obj: { a: { b: 1 } },
      reg: /123/,
      str: '123',
    });
    clone.date = new Date('2019-01-06');
    clone.obj.a.b = 2;
    expect(obj.date).toEqual(new Date('2019-01-05T00:00:00.000Z'));
    expect(obj.obj.a.b).toBe(1);
  });
});
