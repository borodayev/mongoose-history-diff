// @flow

import { Schema, type ObjectId } from 'mongoose';
import type { OptionsT } from './index';

export default function(options: OptionsT): any {
  const { mongooseConnection, diffCollectionName } = options || {};
  if (!mongooseConnection)
    throw new Error(`You should provide a mongoose connection instance to plugin options!`);

  if (!diffCollectionName) throw new Error(`You should provide a name for diff collection!`);

  const ChangeSchema = new Schema(
    {
      kind: {
        type: String,
        enum: ['E', 'N', 'D', 'A'],
      },
      path: [String],
      lhs: Schema.Types.Mixed,
      rhs: Schema.Types.Mixed,
    },
    {
      _id: false,
      versionKey: false,
    }
  );

  class ChangeDoc /* :: extends Mongoose$Document */ {
    kind: 'E' | 'N' | 'D' | 'A';
    path: Array<string>;
    lhs: any;
    rhs: any;
  }

  ChangeSchema.loadClass(ChangeDoc);

  const DiffSchema = new Schema(
    {
      docId: Schema.Types.ObjectId,
      changes: [ChangeSchema],
    },
    { versionKey: false, timestamps: true }
  );

  class DiffDoc /* :: extends Mongoose$Document */ {
    _id: ObjectId;
    docId: ObjectId;
    changes: Array<ChangeDoc>;

    static async createDiff(docId: ObjectId, changes: Array<ChangeDoc>): Promise<DiffDoc> {
      const doc = new this({ docId, changes });
      return doc.save();
    }
  }

  DiffSchema.index({ docId: 1 });
  DiffSchema.loadClass(DiffDoc);

  return mongooseConnection.model(diffCollectionName, DiffSchema);
}
