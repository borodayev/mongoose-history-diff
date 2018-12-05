// @flow
/* eslint-disable no-await-in-loop */

import type { ObjectId, MongooseModel } from 'mongoose';

export type OptionsT = {|
  diffCollectionName: ?string,
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

  static async createDiff(docId: ObjectId, changes: Array<RawChangeT>): Promise<DiffDoc> {
    const v = await this.getNextVersion(docId);
    const doc = new this({ dId: docId, c: (changes: any), v });
    return doc.save();
  }

  static async getNextVersion(docId: ObjectId): Promise<number> {
    const doc = await this.find({ dId: docId }, { v: 1, _id: 0 })
      .sort({ v: -1 })
      .limit(1);

    if (doc?.length > 0) return doc[0].v + 1;
    return 1;
  }

  static async findAllByDocId(docId: ObjectId): Promise<Array<DiffDoc>> {
    return this.find({ dId: docId }).exec();
  }
}
