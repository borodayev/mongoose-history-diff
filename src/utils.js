// @flow
/* eslint-disable camelcase */

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
  let isFilter = false;
  excludedFields.forEach(field => {
    if (path.length === field.lvl && key === field.key) isFilter = true;
    if (path.length === 0 && ['updatedAt', 'createdAt', '_id'].includes(key)) isFilter = true;
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
