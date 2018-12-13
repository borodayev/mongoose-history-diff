// /* eslint-disable */

import { findDiff, revertChanges } from '../diff';

describe('findDiff', () => {
  it('object', () => {
    const lhs = {
      obj: { a: 'a', b: 'b' },
      array: ['a', 'b'],
      string: 'str',
      number: 0,
      date: new Date('2018/12/30'),
    };
    const rhs = {
      obj: { a: 'ab' },
      array: ['ab'],
      string: 'str1',
      newString: 'str2',
      number: 1,
      date: new Date('2018/11/30'),
    };

    const newDiffs = findDiff({}, rhs);
    const modifiedDiffs = findDiff(lhs, rhs);
    const itself = findDiff(lhs, lhs);
    const edited = findDiff({ a: 1 }, { a: 2 });

    expect(newDiffs).toEqual([
      { k: 'N', p: ['obj'], r: { a: 'ab' } },
      { k: 'N', p: ['array'], r: ['ab'] },
      { k: 'N', p: ['string'], r: 'str1' },
      { k: 'N', p: ['newString'], r: 'str2' },
      { k: 'N', p: ['number'], r: 1 },
      { k: 'N', p: ['date'], r: new Date('2018-11-29T18:00:00.000Z') },
    ]);

    expect(modifiedDiffs).toEqual([
      { k: 'E', l: 'a', p: ['obj', 'a'], r: 'ab' },
      { k: 'D', l: 'b', p: ['obj', 'b'] },
      { i: 1, it: { k: 'D', l: 'b' }, k: 'A', p: ['array'] },
      { k: 'E', l: 'a', p: ['array', '0'], r: 'ab' },
      { k: 'E', l: 'str', p: ['string'], r: 'str1' },
      { k: 'E', l: 0, p: ['number'], r: 1 },
      {
        k: 'E',
        l: new Date('2018-12-29T18:00:00.000Z'),
        p: ['date'],
        r: new Date('2018-11-29T18:00:00.000Z'),
      },
      { k: 'N', p: ['newString'], r: 'str2' },
    ]);
    expect(edited).toEqual([{ k: 'E', l: 1, p: ['a'], r: 2 }]);
    expect(itself).toEqual([]);
  });

  it('array', () => {
    const lhs = ['a', { b: 1 }];
    const rhs = ['ab', { b: 12, d: ['sd', 'sq'] }];

    const newDiffs = findDiff([], lhs);
    const modifiedDiffs = findDiff(lhs, rhs);
    const deletedDiffs = findDiff([1, 2, 3, 4], [1, 2, 4]);
    const itself = findDiff(lhs, lhs);
    const orderIndependent = findDiff([1, 2, 3], [1, 3, 2], true);
    const orderIndependentObj = findDiff(
      [{ a: 1 }, { a: 2, b: 3 }],
      [{ a: 2, b: 3 }, { a: 1 }],
      true
    );
    const orderDepended = findDiff([1, 2, 3], [1, 3, 2], false);

    expect(newDiffs).toEqual([
      { i: 1, it: { k: 'N', r: { b: 1 } }, k: 'A', p: [] },
      { i: 0, it: { k: 'N', r: 'a' }, k: 'A', p: [] },
    ]);
    expect(modifiedDiffs).toEqual([
      { k: 'E', l: 1, p: ['1', 'b'], r: 12 },
      { k: 'N', p: ['1', 'd'], r: ['sd', 'sq'] },
      { k: 'E', l: 'a', p: ['0'], r: 'ab' },
    ]);
    expect(deletedDiffs).toEqual([
      { i: 3, it: { k: 'D', l: 4 }, k: 'A', p: [] },
      { k: 'E', l: 3, p: ['2'], r: 4 },
    ]);
    expect(orderDepended).toEqual([
      { k: 'E', l: 3, p: ['2'], r: 2 },
      { k: 'E', l: 2, p: ['1'], r: 3 },
    ]);
    expect(orderIndependent).toEqual([]);
    expect(orderIndependentObj).toEqual([]);
    expect(itself).toEqual([]);
  });

  it('prefilter', () => {
    const lhs = {
      obj: { a: 'a', b: 'b' },
      array: ['a', 'b'],
      string: 'str',
      number: 0,
      date: new Date('2018/12/30'),
    };
    const rhs = {
      obj: { a: 'ab' },
      array: ['ab'],
      string: 'str1',
      newString: 'str2',
      number: 1,
      date: new Date('2018/11/30'),
    };

    const diffs = findDiff(lhs, rhs, false, (path, key) => ['obj', 'array', 'date'].includes(key));
    expect(diffs).toEqual([
      { k: 'E', l: 'str', p: ['string'], r: 'str1' },
      { k: 'E', l: 0, p: ['number'], r: 1 },
      { k: 'N', p: ['newString'], r: 'str2' },
    ]);
  });
  it('prefilter', () => {
    const lhs = {
      obj: { a: 'a', b: 'b' },
      array: ['a', 'b'],
      string: 'str',
      number: 0,
      date: new Date('2018/12/30'),
    };
    const rhs = {
      obj: { a: 'ab' },
      array: ['ab'],
      string: 'str1',
      newString: 'str2',
      number: 1,
      date: new Date('2018/11/30'),
    };

    const diffs = findDiff(lhs, rhs, false, (path, key) => ['obj', 'array', 'date'].includes(key));
    expect(diffs).toEqual([
      { k: 'E', l: 'str', p: ['string'], r: 'str1' },
      { k: 'E', l: 0, p: ['number'], r: 1 },
      { k: 'N', p: ['newString'], r: 'str2' },
    ]);
  });

  describe('revertChanges', () => {
    it('editing', () => {
      const target = {
        obj: { a: 'become', b: 'b' },
        array: ['become', 'b'],
        string: 'become',
        number: 0,
        date: new Date('2018/12/30'),
      };

      const changes = [
        { k: 'E', p: ['obj', 'a'], l: 'was', r: 'become' },
        { k: 'E', p: ['array', '0'], l: 'was', r: 'become' },
        { k: 'E', p: ['string'], l: 'was', r: 'become' },
        { k: 'E', p: ['number'], l: 1, r: 0 },
        { k: 'E', p: ['date'], l: new Date('2018/11/30'), r: new Date('2018/12/30') },
      ];

      const revertedTarget = revertChanges(target, changes);

      // must be immutable
      expect(target === revertedTarget).toBeFalsy();
      expect(revertedTarget).toEqual({
        array: ['was', 'b'],
        date: new Date('2018/11/30'),
        number: 1,
        obj: { a: 'was', b: 'b' },
        string: 'was',
      });
    });

    it('adding', () => {
      const target = {
        obj: { a: 'become', b: 'b' },
        array: ['become', 'b'],
        string: 'become',
        number: 0,
        date: new Date('2018/12/30'),
      };

      const changes = [
        { k: 'N', p: ['obj', 'a'], r: 'become' },
        { k: 'A', p: ['array'], i: 0, it: { k: 'N', r: 'become' } },
        { k: 'N', p: ['string'], r: 'become' },
        { k: 'N', p: ['number'], r: 0 },
        { k: 'N', p: ['date'], r: new Date('2018/12/30') },
      ];

      const revertedTarget = revertChanges(target, changes);

      // must be immutable
      expect(target === revertedTarget).toBeFalsy();
      expect(revertedTarget).toEqual({ array: ['b'], obj: { b: 'b' } });
    });

    it('deleting', () => {
      const target = {
        obj: { b: 'b' },
        array: [1, 2, 4], // [1, 2, 3, 4]
      };

      const changes = [
        { k: 'D', p: ['obj', 'a'], l: 'was' },
        { k: 'A', p: ['array'], i: 3, it: { k: 'D', l: 4 } },
        { k: 'E', p: ['array', '2'], l: 3, r: 4 },
        { k: 'D', p: ['string'], l: 'was' },
        { k: 'D', p: ['number'], l: 0 },
        { k: 'D', p: ['date'], l: new Date('2018/12/30') },
      ];

      const revertedTarget = revertChanges(target, changes);

      // must be immutable
      expect(target === revertedTarget).toBeFalsy();
      expect(revertedTarget).toEqual({
        array: [1, 2, 3, 4],
        date: new Date('2018/12/30'),
        number: 0,
        obj: { a: 'was', b: 'b' },
        string: 'was',
      });
    });
  });
});
