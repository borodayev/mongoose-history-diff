// @flow
/* eslint-disable no-await-in-loop */

import type { ObjectId, MongooseModel } from 'mongoose';

export type OptionsT = {|
  // mongooseConnection: ?MongooseConnection,
  diffCollectionName: ?string,
|};

export type DiffModelT = MongooseModel & typeof DiffDoc;

export type RawChangeT = {|
  kind: 'E' | 'N' | 'D' | 'A',
  path: Array<mixed>,
  lhs?: any,
  rhs?: any,
  index?: number,
  item?: $Shape<ItemDoc>,
|};

export class ItemDoc /* :: extends Mongoose$Document */ {
  kind: 'E' | 'N' | 'D' | 'A';
  lhs: any;
  rhs: any;
}

export class ChangeDoc /* :: extends Mongoose$Document */ {
  kind: 'E' | 'N' | 'D' | 'A';
  lhs: any;
  rhs: any;
  index: ?number;
  item: ?ItemDoc;
  createdAt: ?Date;
  updatedAt: ?Date;
}

export class DiffDoc /* :: extends Mongoose$Document */ {
  // $FlowFixMe
  _id: ObjectId;
  docId: ObjectId;
  path: Array<mixed>;
  changes: Array<ChangeDoc>;

  // static async createDiff(docId: ObjectId, changes: Array<ChangeDoc>): Promise<DiffDoc> {
  //   const doc = new this({ docId, changes });
  //   return doc.save();
  // }

  static async createOrUpdateDiffs(docId: ObjectId, changes: Array<RawChangeT>): Promise<void> {
    for (const change of changes) {
      let doc: DiffDoc;
      const preparedChange: any = { ...change };
      const path = preparedChange.path;
      delete preparedChange.path;
      doc = (await this.findOne({ path }).exec(): any);
      if (doc) {
        doc.changes.push(preparedChange);
      } else {
        doc = new this({ docId, path, changes: [preparedChange] });
      }
      await doc.save();
    }
  }

  static async findAllByDocId(docId: ObjectId): Promise<Array<DiffDoc>> {
    return this.find({ docId }).exec();
  }
}
