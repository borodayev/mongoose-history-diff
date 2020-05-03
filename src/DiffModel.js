// @flow

import { Schema, type MongooseConnection } from 'mongoose';
import { ItemDoc, ChangeDoc, DiffDoc, type DiffModelT } from './definitions';

export default function (
  mongooseConnection: MongooseConnection,
  collectionName: string
): DiffModelT {
  if (!mongooseConnection) throw new Error(`'mongooseConection' is required`);
  if (!collectionName) throw new Error(`'collectionName' is required`);

  const ItemSchema = new Schema(
    {
      k: {
        type: String,
        enum: ['E', 'N', 'D', 'A'],
      },
      l: Schema.Types.Mixed,
      r: Schema.Types.Mixed,
    },
    {
      _id: false,
      versionKey: false,
    }
  );
  ItemSchema.loadClass(ItemDoc);

  const ChangeSchema = new Schema(
    {
      k: {
        type: String,
        enum: ['E', 'N', 'D', 'A'],
      },
      p: [String],
      l: Schema.Types.Mixed,
      r: Schema.Types.Mixed,
      i: Number,
      it: ItemSchema,
    },
    {
      _id: false,
      versionKey: false,
    }
  );
  ChangeSchema.loadClass(ChangeDoc);

  const DiffSchema = new Schema(
    {
      dId: Schema.Types.ObjectId,
      c: [ChangeSchema],
      v: Number,
    },
    { versionKey: false, timestamps: true, collection: collectionName }
  );
  DiffSchema.loadClass(DiffDoc);
  DiffSchema.index({ docId: 1, path: 1 });

  const modelName: string = `${collectionName}_Model`;
  let Model: DiffModelT;

  if (Object.keys(mongooseConnection.models).includes(modelName)) {
    Model = (mongooseConnection.models[modelName]: any);
  } else {
    Model = mongooseConnection.model(modelName, DiffSchema);
  }

  return Model;
}
