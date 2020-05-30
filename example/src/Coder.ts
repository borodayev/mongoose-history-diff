/* eslint-disable no-await-in-loop */
// @flow
/* eslint-disable no-param-reassign, func-names */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { composeWithMongoose } from 'graphql-compose-mongoose';
import DiffPlugin from 'mongoose-history-diff';
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
