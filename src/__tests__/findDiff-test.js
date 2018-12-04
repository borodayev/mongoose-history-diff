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

    expect(newDiffs).toMatchSnapshot();
    expect(modifiedDiffs).toMatchSnapshot();
    expect(itself).toEqual([]);
    expect(edited).toMatchSnapshot();
  });

  it('array', () => {
    const lhs = ['a', { b: 1 }];
    const rhs = ['ab', { b: 12, d: ['sd', 'sq'] }];

    const newDiffs = findDiff([], lhs);
    const modifiedDiffs = findDiff(lhs, rhs);
    const itself = findDiff(lhs, lhs);
    const orderIndependent = findDiff([1, 2, 3], [1, 3, 2], true);
    const orderDepended = findDiff([1, 2, 3], [1, 3, 2], false);

    expect(newDiffs).toMatchSnapshot();
    expect(modifiedDiffs).toMatchSnapshot();
    expect(itself).toEqual([]);
    expect(orderIndependent).toEqual([]);
    expect(orderDepended).toMatchSnapshot();
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
    expect(diffs).toMatchSnapshot();
  });
});
