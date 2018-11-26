// @flow
/* eslint-disable no-await-in-loop */

import { Schema, type ObjectId, type MongooseModel, type MongooseConnection } from 'mongoose';

export default function(
  mongooseConnection: MongooseConnection,
  collectionName: string
): MongooseModel {
  const ItemSchema = new Schema(
    {
      kind: {
        type: String,
        enum: ['E', 'N', 'D', 'A'],
      },
      lhs: Schema.Types.Mixed,
      rhs: Schema.Types.Mixed,
    },
    {
      _id: false,
      versionKey: false,
    }
  );

  class ItemDoc /* :: extends Mongoose$Document */ {
    kind: 'E' | 'N' | 'D' | 'A';
    lhs: any;
    rhs: any;
  }

  ItemSchema.loadClass(ItemDoc);

  const ChangeSchema = new Schema(
    {
      kind: {
        type: String,
        enum: ['E', 'N', 'D', 'A'],
      },
      lhs: Schema.Types.Mixed,
      rhs: Schema.Types.Mixed,
      index: Number,
      item: ItemSchema,
    },
    {
      _id: false,
      versionKey: false,
      timestamps: true,
    }
  );

  class ChangeDoc /* :: extends Mongoose$Document */ {
    kind: 'E' | 'N' | 'D' | 'A';
    lhs: any;
    rhs: any;
    index: ?number;
    item: ?ItemDoc;
    createdAt: Date;
    updatedAt: Date;
  }

  ChangeSchema.loadClass(ChangeDoc);

  const DiffSchema = new Schema(
    {
      docId: Schema.Types.ObjectId,
      path: [String],
      changes: [ChangeSchema],
    },
    { versionKey: false, timestamps: true, collection: collectionName }
  );

  class DiffDoc /* :: extends Mongoose$Document */ {
    // $FlowFixMe
    _id: ObjectId;
    docId: ObjectId;
    path: Array<string>;
    changes: Array<ChangeDoc>;

    static async createOrUpdateDiffs(docId: ObjectId, changes: Array<Object>): Promise<void> {
      for (const change of changes) {
        let doc;
        const path = change.path;
        delete change.path;
        doc = await this.findOne({ path }).exec();
        if (doc) {
          doc.changes.push(change);
        } else {
          doc = new this({ docId, path, changes: [change] });
        }
        await doc.save();
      }
    }

    static async findAllByDocId(docId: ObjectId): Promise<Array<DiffDoc>> {
      return this.find({ docId }).exec();
    }
  }

  DiffSchema.index({ docId: 1 });
  DiffSchema.loadClass(DiffDoc);
  const modelName: string = `${collectionName}_Model`;

  if (Object.keys(mongooseConnection.models).includes(modelName)) {
    return (mongooseConnection.models[modelName]: any);
  }

  return mongooseConnection.model(modelName, DiffSchema);
}
