// @flow

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
      path: [String],
      lhs: Schema.Types.Mixed,
      rhs: Schema.Types.Mixed,
      index: Number,
      item: ItemSchema,
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
    index: ?number;
    item: ?ItemDoc;
  }

  ChangeSchema.loadClass(ChangeDoc);

  const DiffSchema = new Schema(
    {
      docId: Schema.Types.ObjectId,
      changes: [ChangeSchema],
    },
    { versionKey: false, timestamps: true, collection: collectionName }
  );

  class DiffDoc /* :: extends Mongoose$Document */ {
    // $FlowFixMe
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
  const modelName: string = `${collectionName}_Model`;

  if (Object.keys(mongooseConnection.models).includes(modelName)) {
    return (mongooseConnection.models[modelName]: any);
  }

  return mongooseConnection.model(modelName, DiffSchema);
}
