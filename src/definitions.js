// @flow
/* eslint-disable no-await-in-loop */

import type { ObjectId, MongooseModel, MongooseDocument } from 'mongoose';
import MHD, { revertChanges } from './diff';

export type OptionsT = {|
  diffCollectionName: ?string,
  orderIndependent: ?boolean,
|};

export type DiffModelT = MongooseModel & typeof DiffDoc;

export type KindT = 'E' | 'N' | 'D' | 'A';

export type RawChangeT = {|
  k: KindT,
  p: Array<string>,
  l?: any,
  r?: any,
  i?: number,
  it?: $Shape<ItemDoc>,
|};

export class ItemDoc /* :: extends Mongoose$Document */ {
  k: KindT;
  l: ?any;
  r: ?any;
}

export class ChangeDoc /* :: extends Mongoose$Document */ {
  k: KindT;
  p: Array<string>;
  l: ?any;
  r: ?any;
  i: ?number;
  it: ?ItemDoc;
}

export class DiffDoc /* :: extends Mongoose$Document */ {
  // $FlowFixMe
  _id: ObjectId;
  dId: ObjectId;
  c: Array<ChangeDoc>;
  v: number;

  static async createDiff(dId: ObjectId, v: number, changes: Array<RawChangeT>): Promise<DiffDoc> {
    const doc = new this({ dId, c: (changes: any), v });
    return doc.save();
  }

  static async findByDocId(dId: ObjectId): Promise<Array<DiffDoc>> {
    return this.find({ dId }).exec();
  }

  static async findAfterVersion(dId: ObjectId, v: number): Promise<Array<DiffDoc>> {
    return this.find({ dId, v: { $gte: v } })
      .sort({ v: -1 })
      .exec();
  }

  static async findBeforeVersion(dId: ObjectId, v: number): Promise<Array<DiffDoc>> {
    return this.find({ dId, v: { $lte: v } })
      .sort({ v: -1 })
      .exec();
  }

  static async revertToVersion(d: Object, v: number): Promise<any> {
    const doc = typeof d.toObject === 'function' ? d.toObject() : d;
    const changes: Array<RawChangeT> = [];
    const diffDocs = (await this.findAfterVersion(doc._id, v): any);

    if (diffDocs.length === 0) return null;
    diffDocs.forEach(diffDoc => changes.push(...diffDoc.c));
    return revertChanges(doc, changes);
  }

  static async mergeDiffs(doc: MongooseDocument): Promise<Array<RawChangeT>> {
    const currentDoc = { ...doc.toObject() };
    const initialDoc = await this.revertToVersion(currentDoc, 1);
    if (!initialDoc) return [];
    return MHD.findDiff(initialDoc, currentDoc);
  }
}
