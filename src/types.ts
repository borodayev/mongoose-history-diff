/* eslint-disable no-await-in-loop, max-classes-per-file, import/no-cycle */

import { Model, Document, Types } from 'mongoose';

export type ObjectId = Types.ObjectId;

export type OptionsT = {
  diffCollectionName?: string;
  orderIndependent?: boolean;
};

export type KindT = 'E' | 'N' | 'D' | 'A';

interface ItemDoc {
  k: KindT;
  l?: any;
  r?: any;
}

export type RawChangeT = {
  k: KindT;
  p: string[];
  l?: any;
  r?: any;
  i?: number;
  it?: Partial<ItemDoc>;
};

export interface ChangeDoc {
  k: KindT;
  p: string[];
  l?: any;
  r?: any;
  i?: number;
  it?: ItemDoc;
}

export interface IDiffDoc extends Document {
  _id: ObjectId;
  dId: ObjectId;
  c: ChangeDoc[];
  v: number;
}

export interface IDiffModel extends Model<IDiffDoc> {
  createDiff(dId: ObjectId, v: number, changes: ChangeDoc[]): Promise<IDiffDoc>;

  findByDocId(dId: ObjectId): Promise<Array<IDiffDoc>>;

  findAfterVersion(dId: ObjectId, v: number): Promise<Array<IDiffDoc>>;

  findBeforeVersion(dId: ObjectId, v: number): Promise<Array<IDiffDoc>>;

  revertToVersion(d: Object, v: number): Promise<any>;

  mergeDiffs(doc: Document): Promise<Array<RawChangeT>>;
}
