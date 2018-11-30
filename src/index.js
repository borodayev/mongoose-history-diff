// @flow
/* eslint-disable no-param-reassign, func-names */

import type { MongooseSchema } from 'mongoose';
import findDiff from './findDiff';
import type { DiffModelT, OptionsT } from './definitions';
import DiffModel from './Diff';
import { getExcludedFields, excludeFields, type ExcludeFieldT } from './utils';

export default function plugin(schema: MongooseSchema<any>, options?: OptionsT) {
  const excludedFields: Array<ExcludeFieldT> = getExcludedFields(schema);

  // $FlowFixMe
  schema.static('diffModel', function(): DiffModelT {
    const collectionName = options?.diffCollectionName || `${this.collection.name}_diff`;
    return DiffModel(this.collection.conn, collectionName);
  });

  schema.post('init', function() {
    this._original = this.toObject();
  });

  schema.pre('save', async function() {
    // && this._original
    if (!this.isNew) {
      const lhs = this._original;
      const rhs = this.toObject();

      const Diff: DiffModelT = this.constructor.diffModel();

      const diffs = findDiff(lhs, rhs, (path, key) => excludeFields(path, key, excludedFields));
      if (diffs?.length > 0) await Diff.createOrUpdateDiffs(lhs._id, diffs);
      this._original = null;
    }
  });
}

export type { DiffModelT };
