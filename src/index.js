// @flow
/* eslint-disable no-param-reassign, func-names */

import deepDiff from 'deep-diff';
import type { MongooseConnection } from 'mongoose';
import DiffModel from './Diff';

export type OptionsT = {|
  mongooseConnection: MongooseConnection,
  diffCollectionName: string,
|};

export default function plugin(schema: any, options: OptionsT) {
  const Diff = DiffModel(options);

  schema.statics.diffModel = () => Diff;

  schema.post('init', function() {
    this._original = this.toObject();
  });

  schema.pre('save', async function() {
    if (!this.isNew) {
      const lhs = this._original;
      const rhs = this.toObject();
      const diffs = deepDiff.diff(lhs, rhs);
      if (diffs?.length > 0) await Diff.createDiff(lhs._id, diffs);
      this._original = null;
    }
  });
}
