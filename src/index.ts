/* eslint-disable no-param-reassign, func-names */

import mongoose, { Model, Document as MongooseDocument } from 'mongoose';
import MHD from './diff';
import { IDiffModel, OptionsT, RawChangeT, ChangeDoc } from './types';
import DiffModel from './DiffModel';
import { getExcludedFields } from './utils';

export default function plugin<T extends MongooseDocument>() {
  return function (
    schema: mongoose.Schema<T, Model<T>>,
    options?: OptionsT
  ): void {
    const versionKey = schema.get('versionKey');
    if (!versionKey || typeof versionKey !== 'string')
      throw new Error(
        `You must provide 'versionKey' option to your schema or remain it as default`
      );

    MHD.orderIndependent = options?.orderIndependent || false;
    MHD.excludedFields = getExcludedFields(schema);

    schema.static('diffModel', function (this: any): IDiffModel {
      const collectionName =
        options?.diffCollectionName || `${this.collection.name}_diff`;
      return DiffModel(this.collection.conn, collectionName);
    });

    schema.post('init', function (this: any) {
      this._original = this.toObject();
    });

    schema.pre('save', async function (this: any) {
      if (!this.isNew && this._original) {
        await this.increment();
        const lhs = this._original;
        const rhs = this.toObject();
        const version = this[versionKey] + 1; // cause we're inside preSave hook
        const Diff: IDiffModel = this.constructor.diffModel();
        const diffs: RawChangeT[] = MHD.findDiff(lhs, rhs);
        if (diffs?.length > 0)
          await Diff.createDiff(lhs._id, version, <ChangeDoc[]>diffs);
        this._original = null;
      }
    });
  };
}

export { IDiffModel };
