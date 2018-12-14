// @flow
/* eslint-disable no-param-reassign, func-names */

import type { MongooseSchema } from 'mongoose';
import { findDiff } from './diff';
import type { DiffModelT, OptionsT, RawChangeT } from './definitions';
import DiffModel from './DiffModel';
import { getExcludedFields, excludeFields, type ExcludeFieldT } from './utils';

export default function plugin(schema: MongooseSchema<any>, options?: OptionsT) {
  if (!schema.options.versionKey)
    throw new Error(`You must provide 'versionKey' option to your schema or remain it as default`);

  const versionKey = schema.options.versionKey;
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
      const version = this[versionKey] + 1; // cause we're inside preSave hook
      const Diff: DiffModelT = this.constructor.diffModel();
      const orderIndep = options?.orderIndepended || false;
      const diffs: Array<RawChangeT> = (findDiff(lhs, rhs, orderIndep, (path, key) =>
        excludeFields(path, key, excludedFields)
      ): any);

      if (diffs?.length > 0) await Diff.createDiff(lhs._id, version, diffs);
      this._original = null;
    }
  });
}

export type { DiffModelT };
