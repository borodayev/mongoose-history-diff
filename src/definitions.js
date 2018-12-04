// @flow
/* eslint-disable no-await-in-loop */

import type { ObjectId, MongooseModel } from 'mongoose';

export type OptionsT = {|
  diffCollectionName: ?string,
|};

export type DiffModelT = MongooseModel & typeof DiffDoc;

export type KindT = 'N' | 'E' | 'A' | 'D';

export type RawChangeT = {|
  kind: KindT,
  path: Array<string>,
  lhs?: any,
  rhs?: any,
  index?: number,
  item?: $Shape<ItemDoc>,
|};

export class ItemDoc /* :: extends Mongoose$Document */ {
  kind: KindT;
  lhs: any;
  rhs: any;
}

export class ChangeDoc /* :: extends Mongoose$Document */ {
  kind: KindT;
  lhs: any;
  rhs: any;
  createdAt: Date;
  index: ?number;
  item: ?ItemDoc;
}

export class DiffDoc /* :: extends Mongoose$Document */ {
  // $FlowFixMe
  _id: ObjectId;
  docId: ObjectId;
  path: Array<mixed>;
  changes: Array<ChangeDoc>;

  static async createOrUpdateDiffs(docId: ObjectId, changes: Array<RawChangeT>): Promise<void> {
    for (const change of changes) {
      let doc: DiffDoc;
      const preparedChange: any = { createdAt: new Date(), ...change };
      const path = preparedChange.path;
      delete preparedChange.path;
      doc = (await this.findOne({ path }).exec(): any);
      if (doc) {
        doc.changes = [preparedChange, ...doc.changes];
      } else {
        doc = new this({
          docId,
          path,
          changes: [preparedChange],
        });
      }
      await doc.save();
    }
  }

  static async findAllByDocId(docId: ObjectId): Promise<Array<DiffDoc>> {
    return this.find({ docId }).exec();
  }
}
