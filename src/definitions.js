// @flow
/* eslint-disable no-await-in-loop */

import type { ObjectId, MongooseModel } from 'mongoose';
// import { mergeDiffs } from './utils';

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

  static async createDiff(dId: ObjectId, v: number, changes: Array<RawChangeT>): Promise<DiffDoc> {
    const doc = new this({ dId, c: (changes: any), v });
    return doc.save();
  }

  static async findAllByDocId(dId: ObjectId): Promise<Array<DiffDoc>> {
    return this.find({ dId }).exec();
  }
}
