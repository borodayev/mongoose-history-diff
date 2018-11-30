// @flow
/* eslint-disable no-bitwise, no-param-reassign */

export type KindT = 'N' | 'E' | 'A' | 'D';

class DiffEdit {
  kind: KindT;
  path: any;
  lhs: any;
  rhs: any;

  constructor(path: any, lhs: any, rhs: any) {
    this.path = path;
    this.rhs = rhs;
    this.rhs = rhs;
    this.kind = 'E';
  }
}

class DiffNew {
  kind: KindT;
  path: any;
  rhs: any;

  constructor(path: any, rhs: any) {
    this.path = path;
    this.rhs = rhs;
    this.kind = 'N';
    if (!this.path) delete this.path;
  }
}

class DiffDeleted {
  kind: KindT;
  path: any;
  lhs: any;

  constructor(path: any, lhs: any) {
    this.path = path;
    this.lhs = lhs;
    this.kind = 'D';
    if (!this.path) delete this.path;
  }
}

class DiffArray {
  kind: KindT;
  path: any;
  index: any;
  item: any;

  constructor(path: any, index: any, item: any) {
    this.path = path;
    this.index = index;
    this.item = item;
    this.kind = 'A';
  }
}

export const realTypeOf = (obj: any): string => {
  const type = typeof obj;
  if (type !== 'object') {
    return type;
  }
  if (obj === Math) {
    return 'math';
  }
  if (obj === null) {
    return 'null';
  }
  if (Array.isArray(obj)) {
    return 'array';
  }
  if (Object.prototype.toString.call(obj) === '[object Date]') {
    return 'date';
  }
  if (typeof obj.toString === 'function' && /^\/.*\//.test(obj.toString())) {
    return 'regexp';
  }
  return 'object';
};

// http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
export const hashThisString = (str: string): number => {
  let hash = 0;
  if (str.length === 0) {
    return hash;
  }
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32bit integer
  }
  return hash;
};

// Gets a hash of the given object in an array order-independent fashion
// also object key order independent (easier since they can be alphabetized)
export const getOrderIndependentHash = (obj: Object) => {
  let accum = 0;
  const type = realTypeOf(obj);
  if (type === 'array') {
    obj.forEach(item => {
      // Addition is commutative so this is order indep
      accum += getOrderIndependentHash(item);
    });
    const arrayString = `[type: array, hash: ${accum}]`;
    return accum + hashThisString(arrayString);
  }

  if (type === 'object') {
    Object.keys(obj).forEach(key => {
      const keyValueString = `[ type: object, key: ${key}, value hash: ${getOrderIndependentHash(
        obj[key]
      )}]`;
      accum += hashThisString(keyValueString);
    });
    return accum;
  }
  const stringToHash = `[ type: ${type} ; value: ${obj.toString()}]`;
  return accum + hashThisString(stringToHash);
};

export type PrefilterT = (path: Array<string>, key: string) => boolean;

export type StackT = {|
  lhs: mixed,
  rhs: mixed,
|};

export type DeepDiffOptsT = {|
  prefilter: PrefilterT,
  orderIndependent: boolean,
  key?: string,
  path?: Array<string>,
  stack?: Array<StackT>,
|};

export const deepDiff = (
  lhs: any,
  rhs: any,
  changes: Array<any> = [],
  opts: DeepDiffOptsT
): void => {
  const { path, prefilter, key, orderIndependent } = opts || {};
  let { stack } = opts || {};
  stack = stack || [];
  const currentPath = path ? [...path] : [];

  if (key) {
    if (prefilter && prefilter(currentPath, key)) return;
    currentPath.push(key);
  }

  // Use string comparison for regexes
  if (realTypeOf(lhs) === 'regexp' && realTypeOf(rhs) === 'regexp') {
    lhs = lhs.toString();
    rhs = rhs.toString();
  }

  let i;
  let j;
  let other;

  const ldefined =
    !!lhs ||
    (stack &&
      stack.length > 0 &&
      stack[stack.length - 1].lhs &&
      Object.getOwnPropertyDescriptor(stack[stack.length - 1].lhs, key));

  const rdefined =
    !!rhs ||
    (stack &&
      stack.length > 0 &&
      stack[stack.length - 1].rhs &&
      Object.getOwnPropertyDescriptor(stack[stack.length - 1].rhs, key));

  if (!ldefined && rdefined) {
    changes.push(new DiffNew(currentPath, rhs));
  } else if (!rdefined && ldefined) {
    changes.push(new DiffDeleted(currentPath, lhs));
  } else if (realTypeOf(lhs) !== realTypeOf(rhs)) {
    changes.push(new DiffEdit(currentPath, lhs, rhs));
  } else if (realTypeOf(lhs) === 'date' && lhs - rhs !== 0) {
    changes.push(new DiffEdit(currentPath, lhs, rhs));
  } else if (lhs && rhs && typeof lhs === 'object') {
    for (i = stack.length - 1; i > -1; --i) {
      if (stack[i].lhs === lhs) {
        other = true;
        break;
      }
    }
    if (!other) {
      stack.push({ lhs, rhs });
      if (Array.isArray(lhs)) {
        // If order doesn't matter, we need to sort our arrays
        if (orderIndependent) {
          lhs.sort((a, b) => {
            return getOrderIndependentHash(a) - getOrderIndependentHash(b);
          });

          rhs.sort((a, b) => {
            return getOrderIndependentHash(a) - getOrderIndependentHash(b);
          });
        }
        i = rhs.length - 1;
        j = lhs.length - 1;

        while (i > j) {
          changes.push(new DiffArray(currentPath, i, new DiffNew(undefined, rhs[i--])));
        }

        while (j > i) {
          changes.push(new DiffArray(currentPath, j, new DiffDeleted(undefined, lhs[j--])));
        }

        while (i >= 0) {
          deepDiff(lhs[i], rhs[i], changes, {
            prefilter,
            path: currentPath,
            key: i.toString(),
            stack,
            orderIndependent,
          });
          --i;
        }
      } else {
        const lhsKeys = Object.keys(lhs);
        const rhsKeys = Object.keys(rhs);

        lhsKeys.forEach(lhsKey => {
          other = rhsKeys.indexOf(lhsKey);
          if (other >= 0) {
            deepDiff(lhs[lhsKey], rhs[lhsKey], changes, {
              prefilter,
              path: currentPath,
              key: lhsKey,
              stack,
              orderIndependent,
            });
            rhsKeys[other] = null;
          } else {
            deepDiff(lhs[lhsKey], null, changes, {
              prefilter,
              path: currentPath,
              key: lhsKey,
              stack,
              orderIndependent,
            });
          }
        });

        rhsKeys.forEach(rhsKey => {
          if (rhsKey) {
            deepDiff(null, rhs[rhsKey], changes, {
              prefilter,
              path: currentPath,
              key: rhsKey,
              stack,
              orderIndependent,
            });
          }
        });
      }
      stack.length -= 1;
    } else if (lhs !== rhs) {
      // lhs is contains a cycle at this element and it differs from rhs
      changes.push(new DiffEdit(currentPath, lhs, rhs));
    }
  } else if (lhs !== rhs) {
    if (!(typeof lhs === 'number' && Number.isNaN(lhs) && Number.isNaN(rhs))) {
      changes.push(new DiffEdit(currentPath, lhs, rhs));
    }
  }
};

export const observableDiff = (
  lhs: mixed,
  rhs: mixed,
  // TODO: ChangeT
  observer: ((diff: any) => void) | null,
  prefilter: PrefilterT,
  orderIndependent: boolean
): Array<any> => {
  const changes = [];
  deepDiff(lhs, rhs, changes, { prefilter, orderIndependent });
  if (observer) {
    changes.forEach(change => {
      // $FlowFixMe
      observer(change);
    });
  }
  return changes;
};

const findDiff = (lhs: mixed, rhs: mixed, prefilter: PrefilterT, accum: any): Array<any> => {
  const observer = accum
    ? difference => {
        if (difference) {
          if (!accum.push) throw new Error(`accum should have a 'push()' function`);
          accum.push(difference);
        }
      }
    : null;
  const changes = observableDiff(lhs, rhs, observer, prefilter, false);
  return accum || changes;
};

export default findDiff;
