// @flow
/* eslint-disable no-await-in-loop */

import type { ObjectId, MongooseModel } from 'mongoose';
import { mergeDiffs } from './utils';

export type OptionsT = {|
  diffCollectionName: ?string,
  orderIndepended: ?boolean,
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

  static async createDiff(dId: ObjectId, changes: Array<RawChangeT>): Promise<DiffDoc> {
    const v = await this.getNextVersion(dId);
    const doc = new this({ dId, c: (changes: any), v });
    return doc.save();
  }

  static async getNextVersion(dId: ObjectId): Promise<number> {
    const doc = await this.find({ dId }, { v: 1, _id: 0 })
      .sort({ v: -1 })
      .limit(1);

    if (doc?.length > 0) return doc[0].v + 1;
    return 1;
  }

  static async findAll(dId: ObjectId): Promise<Array<DiffDoc>> {
    return this.find({ dId }).exec();
  }

  static async getMerged(dId: ObjectId): Promise<Map<string, Object>> {
    const diffs = await this.aggregate([
      { $match: { dId } },
      { $sort: { v: 1 } },
      { $unwind: { path: '$c' } },
      { $project: { _id: 0, p: '$c.p', k: '$c.k', l: '$c.l', r: '$c.r' } },
    ]).exec();

    if (diffs?.length > 0) {
      return mergeDiffs(diffs);
    }
    return new Map();
  }
}
