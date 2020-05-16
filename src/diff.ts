/* eslint-disable no-param-reassign, no-plusplus */

import {
  realTypeOf,
  getOrderIndependentHash,
  revertArrayChange,
  excludeFields,
  deepClone,
  ExcludeFieldT,
} from './utils';
import { RawChangeT } from './types';

export type PrefilterT = (path: Array<string>, key: string) => boolean;

export type StackT = {
  lhs: any;
  rhs: any;
};

export type DeepDiffOptsT = {
  prefilter: PrefilterT;
  orderIndependent: boolean;
  key?: string;
  path?: Array<string>;
  stack?: Array<StackT>;
};

export const deepDiff = (
  lhs: any,
  rhs: any,
  changes: Array<RawChangeT> = [],
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

  if (realTypeOf(lhs) === 'regexp' && realTypeOf(rhs) === 'regexp') {
    lhs = lhs.toString();
    rhs = rhs.toString();
  }

  let i;
  let j;
  let other;

  const ldefined =
    (!!lhs || stack) &&
    stack.length > 0 &&
    stack[stack.length - 1].lhs &&
    key &&
    !!Object.getOwnPropertyDescriptor(stack[stack.length - 1].lhs, key);

  const rdefined =
    (!!rhs || stack) &&
    stack.length > 0 &&
    stack[stack.length - 1].rhs &&
    key &&
    !!Object.getOwnPropertyDescriptor(stack[stack.length - 1].rhs, key);

  if (!ldefined && rdefined) {
    changes.push({ k: 'N', p: currentPath, r: rhs });
  } else if (!rdefined && ldefined) {
    changes.push({ k: 'D', p: currentPath, l: lhs });
  } else if (realTypeOf(lhs) !== realTypeOf(rhs)) {
    changes.push({
      k: 'E',
      p: currentPath,
      l: lhs,
      r: rhs,
    });
  } else if (realTypeOf(lhs) === 'date' && lhs - rhs !== 0) {
    changes.push({
      k: 'E',
      p: currentPath,
      l: lhs,
      r: rhs,
    });
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
          lhs.sort(
            (a, b) => getOrderIndependentHash(a) - getOrderIndependentHash(b)
          );

          rhs.sort(
            (a: any, b: any) =>
              getOrderIndependentHash(a) - getOrderIndependentHash(b)
          );
        }
        i = rhs.length - 1;
        j = lhs.length - 1;

        while (i > j) {
          changes.push({
            k: 'A',
            p: currentPath,
            i,
            it: { k: 'N', r: rhs[i--] },
          });
        }

        while (j > i) {
          changes.push({
            k: 'A',
            p: currentPath,
            i: j,
            it: { k: 'D', l: lhs[j--] },
          });
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

        lhsKeys.forEach((lhsKey) => {
          other = rhsKeys.indexOf(lhsKey);
          if (other >= 0) {
            deepDiff(lhs[lhsKey], rhs[lhsKey], changes, {
              prefilter,
              path: currentPath,
              key: lhsKey,
              stack,
              orderIndependent,
            });
            rhsKeys[other] = '';
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

        rhsKeys.forEach((rhsKey) => {
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
      changes.push({
        k: 'E',
        p: currentPath,
        l: lhs,
        r: rhs,
      });
    }
  } else if (lhs !== rhs) {
    if (!(typeof lhs === 'number' && Number.isNaN(lhs) && Number.isNaN(rhs))) {
      changes.push({
        k: 'E',
        p: currentPath,
        l: lhs,
        r: rhs,
      });
    }
  }
};

export const revertChanges = (target: any, changes: Array<RawChangeT>): any => {
  const copyTarget = deepClone(target);

  changes.forEach((change) => {
    let it = copyTarget;
    let i;

    for (i = 0; i < change.p.length - 1; i++) {
      if (typeof it[change.p[i]] === 'undefined') {
        it[change.p[i]] = {};
      }
      it = it[change.p[i]];
    }
    switch (change.k) {
      case 'A':
        if (Array.isArray(it)) {
          revertArrayChange(it, parseInt(change.i as any, 10), change.it);
          break;
        }
        revertArrayChange(
          it[change.p[i]],
          parseInt(change.i as any, 10),
          change.it
        );
        break;
      case 'D':
        it[change.p[i]] = change.l;
        break;
      case 'E':
        it[change.p[i]] = change.l;
        break;
      case 'N':
        delete it[change.p[i]];
        break;
      default:
        it[change.p[i]] = {};
    }
  });
  return copyTarget;
};

export default class MHD {
  static orderIndependent: boolean;
  static excludedFields: Array<ExcludeFieldT> = [];

  static findDiff(lhs: any, rhs: any): Array<RawChangeT> {
    const changes: RawChangeT[] = [];
    deepDiff(lhs, rhs, changes, {
      prefilter: (path, key) => excludeFields(path, key, this.excludedFields),
      orderIndependent: this.orderIndependent,
    });
    return changes;
  }
}
