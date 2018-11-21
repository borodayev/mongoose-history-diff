// @flow
/* eslint-disable no-param-reassign, func-names */

import deepDiff from 'deep-diff';
import type { MongooseSchema } from 'mongoose';
import DiffModel from './Diff';

export type OptionsT = {|
  // mongooseConnection: ?MongooseConnection,
  diffCollectionName: ?string,
|};

export default function plugin(schema: MongooseSchema<any>, options: ?OptionsT) {
  // $FlowFixMe
  schema.static('diffModel', function() {
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

      const Diff = this.constructor.diffModel();
      const diffs = deepDiff.diff(
        lhs,
        rhs,
        (path, key) => path.length === 0 && ['updatedAt', 'createdAt'].includes(key)
      );
      if (diffs?.length > 0) await Diff.createDiff(lhs._id, diffs);
      this._original = null;
    }
  });

  schema.post('findOneAndUpdate', function(doc, next) {
    const rhs = this._update.$set;
    const isReturnNew = this.options?.new;
    console.log(isReturnNew);

    console.log(rhs);
    console.log(doc);
    next();
  });

  // schema.pre('update', function(next) {
  //   const d = this._update.$set || this._update;
  //   next();
  // });

  // schema.pre('updateOne', function(next) {
  //   const d = this._update.$set || this._update;
  //   next();
  // });
}
