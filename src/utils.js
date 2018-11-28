// @flow

import type { MongooseSchema } from 'mongoose';

export type ExcludeFieldT = {|
  key: string,
  lvl: number,
|};

export const excludeFields = (
  path: Array<mixed>,
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
    // eslint-disable-next-line camelcase
    if (options?.track_diff === false) {
      const splittedPath = path.split('.');
      const lvl = splittedPath.length - 1;
      const key = splittedPath[lvl];
      excludedFields.push({ key, lvl });
    }
  });
  return excludedFields;
};
