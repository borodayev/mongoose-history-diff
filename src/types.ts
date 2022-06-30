/* eslint-disable no-await-in-loop, max-classes-per-file, import/no-cycle */

import {
  Model,
  Document,
  Types,
  SchemaDefinition,
  SchemaDefinitionType,
  Connection,
  AnyKeys,
} from 'mongoose';

export type ObjectId = Types.ObjectId;

export type OptionsT = {
  diffCollectionName?: string;
  orderIndependent?: boolean;
};

export type KindT = 'E' | 'N' | 'D' | 'A';

export type MergedDiffsOptsT = {
  startVersion?: number;
  endVersion?: number;
};

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
  createDiff<R>(diffOptions: AnyKeys<IDiffDoc & R>): Promise<IDiffDoc>;

  findByDocId(dId: ObjectId): Promise<Array<IDiffDoc>>;

  findAfterVersion(dId: ObjectId, v: number): Promise<Array<IDiffDoc>>;

  findBeforeVersion(dId: ObjectId, v: number): Promise<Array<IDiffDoc>>;

  revertToVersion(d: Object, v: number): Promise<any>;

  mergeDiffs(
    doc: Document,
    opts?: MergedDiffsOptsT
  ): Promise<Array<RawChangeT>>;
}

export type CustomFieldsOptions<T, R> = {
  schemaDefinition: SchemaDefinition<SchemaDefinitionType<unknown>>;
  values: Record<string, (doc: T) => any | R>;
};

export type DiffModelOptions<T = unknown, R = unknown> = {
  connection: Connection | null;
  collectionName: string;
  customFieldsOptions?: CustomFieldsOptions<T, R>;
};

export type Diff = {
  dId: ObjectId;
  c: ChangeDoc[];
  v: number;
};
