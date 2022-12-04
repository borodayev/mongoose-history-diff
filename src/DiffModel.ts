/* eslint-disable func-names */
import mongoose from 'mongoose';
import {
  IDiffModel,
  ObjectId,
  RawChangeT,
  IDiffDoc,
  MergedDiffsOptsT,
  DiffModelOptions,
  Diff,
} from './types';
import MHD, { revertChanges } from './diff';

export default function <T>(options: DiffModelOptions<T>): IDiffModel {
  const { connection, collectionName, customFieldsOptions } = options;
  if (!connection) throw new Error(`'connection' is required`);
  if (!collectionName) throw new Error(`'collectionName' is required`);

  const ItemSchema = new mongoose.Schema(
    {
      k: {
        type: String,
        enum: ['E', 'N', 'D', 'A'],
      },
      l: mongoose.Schema.Types.Mixed,
      r: mongoose.Schema.Types.Mixed,
    },
    {
      _id: false,
      versionKey: false,
    }
  );

  const ChangeSchema = new mongoose.Schema(
    {
      k: {
        type: String,
        enum: ['E', 'N', 'D', 'A'],
      },
      p: [String],
      l: mongoose.Schema.Types.Mixed,
      r: mongoose.Schema.Types.Mixed,
      i: Number,
      it: ItemSchema,
    },
    {
      _id: false,
      versionKey: false,
    }
  );

  const DiffSchema = new mongoose.Schema<IDiffDoc, IDiffModel>(
    {
      dId: mongoose.Schema.Types.ObjectId,
      c: [ChangeSchema],
      v: Number,
      ...(customFieldsOptions ? customFieldsOptions.schemaDefinition : {}),
    },
    {
      versionKey: false,
      timestamps: { createdAt: true, updatedAt: false },
      collection: collectionName,
    }
  );
  DiffSchema.index({ docId: 1, path: 1 });

  DiffSchema.statics.createDiff = async function <CustomFields>(
    this: IDiffModel,
    diffOptions: Diff & CustomFields
  ): Promise<IDiffDoc> {
    const doc = new this({
      ...diffOptions,
    });
    return doc.save();
  };

  DiffSchema.statics.findByDocId = async function (
    this: IDiffModel,
    dId: ObjectId
  ): Promise<Array<IDiffDoc>> {
    return this.find({ dId }).exec();
  };

  DiffSchema.statics.findAfterVersion = async function (
    this: IDiffModel,
    dId: ObjectId,
    v: number
  ): Promise<Array<IDiffDoc>> {
    return this.find({ dId, v: { $gte: v } })
      .sort({ v: -1 })
      .exec();
  };

  DiffSchema.statics.findBeforeVersion = async function (
    this: IDiffModel,
    dId: ObjectId,
    v: number
  ): Promise<Array<IDiffDoc>> {
    return this.find({ dId, v: { $lte: v } })
      .sort({ v: -1 })
      .exec();
  };

  DiffSchema.statics.revertToVersion = async function (
    this: IDiffModel,
    d: { toObject: Function },
    v: number
  ): Promise<any> {
    const doc = typeof d.toObject === 'function' ? d.toObject() : d;
    const changes: Array<RawChangeT> = [];
    const diffDocs = await this.findAfterVersion(doc._id, v);

    if (diffDocs.length === 0) return null;
    diffDocs.forEach((diffDoc: IDiffDoc) => changes.push(...diffDoc.c));
    return revertChanges(doc, changes);
  };

  DiffSchema.statics.mergeDiffs = async function (
    this: IDiffModel,
    doc: {
      toObject: Function;
    },
    opts?: MergedDiffsOptsT
  ): Promise<Array<RawChangeT>> {
    const { startVersion, endVersion } = opts || {};

    if (typeof startVersion === 'number' && startVersion < 1)
      throw new Error(
        `"startVersion" argument should be >= 1, but got: ${startVersion}`
      );

    if (typeof endVersion === 'number' && endVersion < 1)
      throw new Error(
        `"endVersion" argument should be >= 1, but got: ${endVersion}`
      );

    let initialDoc = null;
    let currentDoc = { ...doc.toObject() };

    if (startVersion && endVersion) {
      initialDoc = await this.revertToVersion(currentDoc, startVersion);
      currentDoc = await this.revertToVersion(currentDoc, endVersion);
    } else if (startVersion) {
      initialDoc = await this.revertToVersion(currentDoc, startVersion);
    } else if (endVersion) {
      initialDoc = await this.revertToVersion(currentDoc, 1);
      currentDoc = await this.revertToVersion(currentDoc, endVersion);
    } else {
      initialDoc = await this.revertToVersion(currentDoc, 1);
    }

    if (!initialDoc || !currentDoc) return [];
    return MHD.findDiff(initialDoc, currentDoc);
  };

  const modelName: string = `${collectionName}_Model`;
  let Model: IDiffModel;

  if (connection.modelNames().includes(modelName)) {
    Model = <IDiffModel>connection.models[modelName];
  } else {
    Model = connection.model<IDiffDoc, IDiffModel>(modelName, DiffSchema);
  }

  return Model;
}
