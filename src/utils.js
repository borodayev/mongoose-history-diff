// @flow
/* eslint-disable camelcase, no-bitwise, no-param-reassign */

import type { MongooseSchema } from 'mongoose';

export type ExcludeFieldT = {|
  key: string,
  lvl: number,
|};

export const excludeFields = (
  path: Array<string>,
  key: string,
  excludedFields: Array<ExcludeFieldT>
): boolean => {
  if (path.length === 0 && key === '_id') return true;
  let isFilter = false;
  excludedFields.forEach(field => {
    if (path.length === field.lvl && key === field.key) isFilter = true;
  });
  return isFilter;
};

export const getExcludedFields = (schema: MongooseSchema<any>): Array<ExcludeFieldT> => {
  const excludedFields: Array<ExcludeFieldT> = [];

  Object.values(schema.paths).forEach((value: any) => {
    const { options, path } = value || {};
    if (options?.track_diff === false) {
      const splittedPath = path.split('.');
      const lvl = splittedPath.length - 1;
      const key = splittedPath[lvl];
      excludedFields.push({ key, lvl });
    } else if (value.instance === 'Array') {
      value.options.type.forEach(obj => {
        const aKey = Object.keys(obj)[0];
        const aPath = [path, aKey].join('.');
        const aOptions = obj[aKey];
        if (aOptions?.track_diff === false) {
          const splittedPath = aPath.split('.');
          const lvl = splittedPath.length;
          const key = splittedPath[lvl - 1];
          excludedFields.push({ key, lvl });
        }
      });
    }
  });
  return excludedFields;
};

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
  if (typeof obj?.toString === 'function' && /^\/.*\//.test(obj.toString())) {
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

// Object | Array<any> | string
export const getOrderIndependentHash = (obj: any): number => {
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

  const stringToHash = `[ type: ${type} ; value: ${obj ? obj.toString() : 'hash'}]`;
  return accum + hashThisString(stringToHash);
};

export const arrayRemove = (arr: Array<any>, from: number, to: ?number): Array<any> => {
  const rest = arr.slice((to || from) + 1 || arr.length);
  arr.length = from < 0 ? arr.length + from : from;
  arr.push(...rest);
  return arr;
};

export const revertArrayChange = (arr: Array<any>, index: number, change: any): Array<any> => {
  if (change?.p?.length) {
    // the structure of the object at the index has changed...
    let element = arr[index];
    let j;
    for (j = 0; j < change.p.length - 1; j++) {
      element = element[change.p[j]];
    }
    switch (change.kind) {
      case 'A':
        revertArrayChange(element[change.p[j]], change.i, change.it);
        break;
      case 'D':
        element[change.p[j]] = change.l;
        break;
      case 'E':
        element[change.p[j]] = change.l;
        break;
      case 'N':
        delete element[change.p[j]];
        break;
      default:
        return [];
    }
  } else {
    // the array item is different...
    switch (change.k) {
      case 'A':
        revertArrayChange(arr[index], change.i, change.it);
        break;
      case 'D':
        arr[index] = change.l;
        break;
      case 'E':
        arr[index] = change.l;
        break;
      case 'N':
        arr = arrayRemove(arr, index);
        break;
      default:
        arr = [];
    }
  }
  return arr;
};

export const deepClone = (obj: any): any => {
  if (realTypeOf(obj) === 'object') {
    const clone = { ...obj };
    // eslint-disable-next-line no-restricted-syntax, no-unused-vars
    for (const k in clone) {
      if (clone.hasOwnProperty(k)) {
        clone[k] = deepClone(clone[k]);
      }
    }
    return clone;
  }
  if (realTypeOf(obj) === 'array') {
    const clone = [...obj];
    clone.forEach((v, i) => {
      clone[i] = deepClone(v);
    });
    return clone;
  }
  if (realTypeOf(obj) === 'date') {
    return new Date(obj);
  }

  return obj;
};
