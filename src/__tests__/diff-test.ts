/* eslint-disable jest/prefer-expect-assertions */
import MHD, { revertChanges } from '../diff';
import { RawChangeT } from '../types';

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

    const newDiffs = MHD.findDiff({}, rhs);
    const modifiedDiffs = MHD.findDiff(lhs, rhs);
    const itself = MHD.findDiff(lhs, lhs);
    const edited = MHD.findDiff({ a: 1 }, { a: 2 });

    expect(newDiffs).toStrictEqual([
      { k: 'N', p: ['obj'], r: { a: 'ab' } },
      { k: 'N', p: ['array'], r: ['ab'] },
      { k: 'N', p: ['string'], r: 'str1' },
      { k: 'N', p: ['newString'], r: 'str2' },
      { k: 'N', p: ['number'], r: 1 },
      { k: 'N', p: ['date'], r: new Date('2018/11/30') },
    ]);

    expect(modifiedDiffs).toStrictEqual([
      {
        k: 'E',
        l: 'a',
        p: ['obj', 'a'],
        r: 'ab',
      },
      { k: 'D', l: 'b', p: ['obj', 'b'] },
      {
        i: 1,
        it: { k: 'D', l: 'b' },
        k: 'A',
        p: ['array'],
      },
      {
        k: 'E',
        l: 'a',
        p: ['array', '0'],
        r: 'ab',
      },
      {
        k: 'E',
        l: 'str',
        p: ['string'],
        r: 'str1',
      },
      {
        k: 'E',
        l: 0,
        p: ['number'],
        r: 1,
      },
      {
        k: 'E',
        l: new Date('2018/12/30'),
        p: ['date'],
        r: new Date('2018/11/30'),
      },
      { k: 'N', p: ['newString'], r: 'str2' },
    ]);
    expect(edited).toStrictEqual([
      {
        k: 'E',
        l: 1,
        p: ['a'],
        r: 2,
      },
    ]);
    expect(itself).toStrictEqual([]);
  });

  it('array', () => {
    const lhs = ['a', { b: 1 }];
    const rhs = ['ab', { b: 12, d: ['sd', 'sq'] }];

    MHD.orderIndependent = false;
    const newDiffs = MHD.findDiff([], lhs);
    expect(newDiffs).toStrictEqual([
      {
        i: 1,
        it: { k: 'N', r: { b: 1 } },
        k: 'A',
        p: [],
      },
      {
        i: 0,
        it: { k: 'N', r: 'a' },
        k: 'A',
        p: [],
      },
    ]);

    const modifiedDiffs = MHD.findDiff(lhs, rhs);
    expect(modifiedDiffs).toStrictEqual([
      {
        k: 'E',
        l: 1,
        p: ['1', 'b'],
        r: 12,
      },
      { k: 'N', p: ['1', 'd'], r: ['sd', 'sq'] },
      {
        k: 'E',
        l: 'a',
        p: ['0'],
        r: 'ab',
      },
    ]);

    const deletedDiffs = MHD.findDiff([1, 2, 3, 4], [1, 2, 4]);
    expect(deletedDiffs).toStrictEqual([
      {
        i: 3,
        it: { k: 'D', l: 4 },
        k: 'A',
        p: [],
      },
      {
        k: 'E',
        l: 3,
        p: ['2'],
        r: 4,
      },
    ]);

    const itself = MHD.findDiff(lhs, lhs);
    expect(itself).toStrictEqual([]);

    const orderDepended = MHD.findDiff([1, 2, 3], [1, 3, 2]);
    expect(orderDepended).toStrictEqual([
      {
        k: 'E',
        l: 3,
        p: ['2'],
        r: 2,
      },
      {
        k: 'E',
        l: 2,
        p: ['1'],
        r: 3,
      },
    ]);

    MHD.orderIndependent = true;
    const orderIndependent = MHD.findDiff([1, 2, 3], [1, 3, 2]);
    expect(orderIndependent).toStrictEqual([]);
    const orderIndependentObj = MHD.findDiff(
      [{ a: 1 }, { a: 2, b: 3 }],
      [{ a: 2, b: 3 }, { a: 1 }]
    );
    expect(orderIndependentObj).toStrictEqual([]);
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

    MHD.excludedFields = [
      { key: 'obj', lvl: 0 },
      { key: 'array', lvl: 0 },
      { key: 'date', lvl: 0 },
    ];

    const diffs = MHD.findDiff(lhs, rhs);
    expect(diffs).toStrictEqual([
      {
        k: 'E',
        l: 'str',
        p: ['string'],
        r: 'str1',
      },
      {
        k: 'E',
        l: 0,
        p: ['number'],
        r: 1,
      },
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

      const changes: RawChangeT[] = [
        {
          k: 'E',
          p: ['obj', 'a'],
          l: 'was',
          r: 'become',
        },
        {
          k: 'E',
          p: ['array', '0'],
          l: 'was',
          r: 'become',
        },
        {
          k: 'E',
          p: ['string'],
          l: 'was',
          r: 'become',
        },
        {
          k: 'E',
          p: ['number'],
          l: 1,
          r: 0,
        },
        {
          k: 'E',
          p: ['date'],
          l: new Date('2018/11/30'),
          r: new Date('2018/12/30'),
        },
      ];

      const revertedTarget = revertChanges(target, changes);

      // must be immutable
      expect(target === revertedTarget).toBeFalsy();
      expect(revertedTarget).toStrictEqual({
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

      const changes: RawChangeT[] = [
        { k: 'N', p: ['obj', 'a'], r: 'become' },
        {
          k: 'A',
          p: ['array'],
          i: 0,
          it: { k: 'N', r: 'become' },
        },
        { k: 'N', p: ['string'], r: 'become' },
        { k: 'N', p: ['number'], r: 0 },
        { k: 'N', p: ['date'], r: new Date('2018/12/30') },
      ];

      const revertedTarget = revertChanges(target, changes);

      // must be immutable
      expect(target === revertedTarget).toBeFalsy();
      expect(revertedTarget).toStrictEqual({ array: ['b'], obj: { b: 'b' } });
    });

    it('deleting', () => {
      const target = {
        obj: { b: 'b' },
        array: [1, 2, 4], // [1, 2, 3, 4]
      };

      const changes: RawChangeT[] = [
        { k: 'D', p: ['obj', 'a'], l: 'was' },
        {
          k: 'A',
          p: ['array'],
          i: 3,
          it: { k: 'D', l: 4 },
        },
        {
          k: 'E',
          p: ['array', '2'],
          l: 3,
          r: 4,
        },
        { k: 'D', p: ['string'], l: 'was' },
        { k: 'D', p: ['number'], l: 0 },
        { k: 'D', p: ['date'], l: new Date('2018/12/30') },
      ];

      const revertedTarget = revertChanges(target, changes);

      // must be immutable
      expect(target === revertedTarget).toBeFalsy();
      expect(revertedTarget).toStrictEqual({
        array: [1, 2, 3, 4],
        date: new Date('2018/12/30'),
        number: 0,
        obj: { a: 'was', b: 'b' },
        string: 'was',
      });
    });

    it('array orderIndepended', () => {
      MHD.orderIndependent = true;
      const target = [1, 2, 3, 4];

      const deletedDiffsEnd = MHD.findDiff(target, [1, 2, 3]);
      const deletedDiffsStart = MHD.findDiff(target, [2, 3, 4]);
      const deletedDiffsMiddle = MHD.findDiff(target, [1, 3, 4]);
      const revDeletedEnd = revertChanges([1, 2, 3], deletedDiffsEnd);
      const revDeletedStart = revertChanges([2, 3, 4], deletedDiffsStart);
      const revDeletedMiddle = revertChanges([1, 3, 4], deletedDiffsMiddle);

      const addedDiffsEnd = MHD.findDiff(target, [1, 2, 3, 4, 5]);
      const addedDiffsStart = MHD.findDiff(target, [5, 1, 2, 3, 4]);
      const addedDiffsMiddle = MHD.findDiff(target, [1, 2, 5, 3, 4]);
      const revAddedEnd = revertChanges([1, 2, 3, 4, 5], addedDiffsEnd);
      const revAddedStart = revertChanges([5, 1, 2, 3, 4], addedDiffsStart);
      const revAddedMiddle = revertChanges([1, 2, 5, 3, 4], addedDiffsMiddle);

      const editedDiffsEnd = MHD.findDiff(target, [1, 2, 3, 5]);
      const editedDiffsStart = MHD.findDiff(target, [5, 2, 3, 4]);
      const editedDiffsMiddle = MHD.findDiff(target, [1, 2, 5, 4]);
      const revEditedEnd = revertChanges([1, 2, 3, 5], editedDiffsEnd);
      const revEditedStart = revertChanges([5, 2, 3, 4], editedDiffsStart);
      const revEditedMiddle = revertChanges([1, 2, 5, 4], editedDiffsMiddle);

      expect(revDeletedEnd).toStrictEqual(target);
      expect(revDeletedStart).toStrictEqual(target);
      expect(revDeletedMiddle).toStrictEqual(target);

      expect(revAddedEnd).toStrictEqual(target);
      expect(revAddedStart).toStrictEqual([5, 1, 2, 3]);
      expect(revAddedMiddle).toStrictEqual([1, 2, 5, 3]);

      expect(revEditedEnd).toStrictEqual(target);
      expect(revEditedStart).toStrictEqual(target);
      expect(revEditedMiddle).toStrictEqual(target);
    });

    it('array !orderIndepended', () => {
      MHD.orderIndependent = false;
      const target = [1, 2, 3, 4];

      const deletedDiffsEnd = MHD.findDiff(target, [1, 2, 3]);
      const deletedDiffsStart = MHD.findDiff(target, [2, 3, 4]);
      const deletedDiffsMiddle = MHD.findDiff(target, [1, 3, 4]);
      const revDeletedEnd = revertChanges([1, 2, 3], deletedDiffsEnd);
      const revDeletedStart = revertChanges([2, 3, 4], deletedDiffsStart);
      const revDeletedMiddle = revertChanges([1, 3, 4], deletedDiffsMiddle);

      const addedDiffsEnd = MHD.findDiff(target, [1, 2, 3, 4, 5]);
      const addedDiffsStart = MHD.findDiff(target, [5, 1, 2, 3, 4]);
      const addedDiffsMiddle = MHD.findDiff(target, [1, 2, 5, 3, 4]);
      const revAddedEnd = revertChanges([1, 2, 3, 4, 5], addedDiffsEnd);
      const revAddedStart = revertChanges([5, 1, 2, 3, 4], addedDiffsStart);
      const revAddedMiddle = revertChanges([1, 2, 5, 3, 4], addedDiffsMiddle);

      const editedDiffsEnd = MHD.findDiff(target, [1, 2, 3, 5]);
      const editedDiffsStart = MHD.findDiff(target, [5, 2, 3, 4]);
      const editedDiffsMiddle = MHD.findDiff(target, [1, 2, 5, 4]);
      const revEditedEnd = revertChanges([1, 2, 3, 5], editedDiffsEnd);
      const revEditedStart = revertChanges([5, 2, 3, 4], editedDiffsStart);
      const revEditedMiddle = revertChanges([1, 2, 5, 4], editedDiffsMiddle);

      expect(revDeletedEnd).toStrictEqual(target);
      expect(revDeletedStart).toStrictEqual(target);
      expect(revDeletedMiddle).toStrictEqual(target);

      expect(revAddedEnd).toStrictEqual(target);
      expect(revAddedStart).toStrictEqual(target);
      expect(revAddedMiddle).toStrictEqual(target);

      expect(revEditedEnd).toStrictEqual(target);
      expect(revEditedStart).toStrictEqual(target);
      expect(revEditedMiddle).toStrictEqual(target);
    });
  });
});
