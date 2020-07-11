/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign, func-names */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { composeWithMongoose } from 'graphql-compose-mongoose';
// import DiffPlugin from 'mongoose-history-diff';
import DiffPlugin from '../../lib';
import DB from './db';

DB.init();

interface ICoderDoc extends Document {
  name: string;
  skills: Array<{ name: string }>;
}

interface ICoderModel extends Model<ICoderDoc> {
  diffModel(): any;
}

export const CoderSchema: Schema<ICoderDoc> = new mongoose.Schema(
  {
    name: {
      type: String,
      description: 'Provider who send Post',
    },
    skills: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, track_diff: false },
        name: { type: String },
      },
    ],
    createdAt: {
      type: Date,
      track_diff: false,
    },
    updatedAt: {
      type: Date,
      track_diff: false,
    },
  },
  {
    timestamps: true,
    collection: 'coder',
  }
);


CoderSchema.plugin(DiffPlugin);

export const Coder = DB.data.model<ICoderDoc, ICoderModel>('Coder', CoderSchema);
export const CoderTC = composeWithMongoose(Coder);

const CoderDiff = Coder.diffModel();
const CoderDiffTC = composeWithMongoose(CoderDiff);

CoderDiffTC.addResolver({
  name: 'findByDocId',
  kind: 'query',
  type: [CoderDiffTC],
  args: { docId: 'MongoID!' },
  resolve: async ({ args }: any) => {
    const { docId } = args;
    return CoderDiff.findByDocId(docId);
  },
});

CoderTC.addResolver({
  name: 'findDiffsAfterVersion',
  kind: 'query',
  type: [CoderDiffTC],
  args: { docId: 'MongoID!', version: 'Int!' },
  resolve: async ({ args }: any) => {
    const { docId, version } = args;
    return CoderDiff.findAfterVersion(docId, version);
  },
});

CoderTC.addResolver({
  name: 'findDiffsBeforeVersion',
  kind: 'query',
  type: [CoderDiffTC],
  args: { docId: 'MongoID!', version: 'Int!' },
  resolve: async ({ args }: any) => {
    const { docId, version } = args;
    return CoderDiff.findBeforeVersion(docId, version);
  },
});

CoderTC.addResolver({
  name: 'revertToVersion',
  kind: 'query',
  type: CoderTC,
  args: { docId: 'MongoID!', version: 'Int!' },
  resolve: async ({ args }: any) => {
    const { docId, version } = args;
    const doc = await Coder.findById(docId);
    return CoderDiff.revertToVersion(doc, version);
  },
});

CoderTC.addResolver({
  name: 'mergeDiffs',
  kind: 'query',
  type: CoderDiffTC.getFieldType('c'),
  args: { docId: 'MongoID!', startVersion: 'Int', endVersion: 'Int' },
  resolve: async ({ args }: any) => {
    const { docId, startVersion = null, endVersion = null } = args;
    const doc = await Coder.findById(docId);
    const diffs = await CoderDiff.mergeDiffs(doc, { startVersion, endVersion });
    return diffs;
  },
});

CoderTC.addRelation('diffs', {
  resolver: () => CoderDiffTC.getResolver('findByDocId'),
  prepareArgs: {
    docId: (source: any) => source._id,
  },
  projection: { _id: true },
});