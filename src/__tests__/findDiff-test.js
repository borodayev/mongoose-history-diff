// /* eslint-disable */

import findDiff from '../findDiff';

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
      { kind: 'N', path: ['obj'], rhs: { a: 'ab' } },
      { kind: 'N', path: ['array'], rhs: ['ab'] },
      { kind: 'N', path: ['string'], rhs: 'str1' },
      { kind: 'N', path: ['newString'], rhs: 'str2' },
      { kind: 'N', path: ['number'], rhs: 1 },
      { kind: 'N', path: ['date'], rhs: new Date('2018-11-29T18:00:00.000Z') },
    ]);

    expect(modifiedDiffs).toEqual([
      { kind: 'E', lhs: 'a', path: ['obj', 'a'], rhs: 'ab' },
      { kind: 'D', lhs: 'b', path: ['obj', 'b'] },
      { index: 1, item: { kind: 'D', lhs: 'b' }, kind: 'A', path: ['array'] },
      { kind: 'E', lhs: 'a', path: ['array', '0'], rhs: 'ab' },
      { kind: 'E', lhs: 'str', path: ['string'], rhs: 'str1' },
      { kind: 'E', lhs: 0, path: ['number'], rhs: 1 },
      {
        kind: 'E',
        lhs: new Date('2018-12-29T18:00:00.000Z'),
        path: ['date'],
        rhs: new Date('2018-11-29T18:00:00.000Z'),
      },
      { kind: 'N', path: ['newString'], rhs: 'str2' },
    ]);
    expect(edited).toEqual([{ kind: 'E', lhs: 1, path: ['a'], rhs: 2 }]);
    expect(itself).toEqual([]);
  });

  it('array', () => {
    const lhs = ['a', { b: 1 }];
    const rhs = ['ab', { b: 12, d: ['sd', 'sq'] }];

    const newDiffs = findDiff([], lhs);
    const modifiedDiffs = findDiff(lhs, rhs);
    const itself = findDiff(lhs, lhs);
    const orderIndependent = findDiff([1, 2, 3], [1, 3, 2], true);
    const orderDepended = findDiff([1, 2, 3], [1, 3, 2], false);

    expect(newDiffs).toEqual([
      { index: 1, item: { kind: 'N', rhs: { b: 1 } }, kind: 'A', path: [] },
      { index: 0, item: { kind: 'N', rhs: 'a' }, kind: 'A', path: [] },
    ]);
    expect(modifiedDiffs).toEqual([
      { kind: 'E', lhs: 1, path: ['1', 'b'], rhs: 12 },
      { kind: 'N', path: ['1', 'd'], rhs: ['sd', 'sq'] },
      { kind: 'E', lhs: 'a', path: ['0'], rhs: 'ab' },
    ]);
    expect(orderDepended).toEqual([
      { kind: 'E', lhs: 3, path: ['2'], rhs: 2 },
      { kind: 'E', lhs: 2, path: ['1'], rhs: 3 },
    ]);
    expect(orderIndependent).toEqual([]);
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
      { kind: 'E', lhs: 'str', path: ['string'], rhs: 'str1' },
      { kind: 'E', lhs: 0, path: ['number'], rhs: 1 },
      { kind: 'N', path: ['newString'], rhs: 'str2' },
    ]);
  });
});
