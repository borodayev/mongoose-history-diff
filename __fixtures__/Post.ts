// @flow
/* eslint-disable no-param-reassign, func-names */

import mongoose, { Schema, Document, Model } from 'mongoose';
import DiffPlugin, { IDiffModel } from '../src/index';
import DB from './db';

DB.init();

export const PostSchema: Schema<IPostDoc> = new mongoose.Schema(
  {
    title: {
      type: String,
      description: 'Provider who send Post',
    },
    subjects: [
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
    collection: 'post',
  }
);

export interface IPostDoc extends Document {
  title: string;
  subjects: Array<{ name: string }>;
}

interface IPostModel extends Model<IPostDoc> {
  diffModel(): IDiffModel;
}

PostSchema.plugin(DiffPlugin);

export const Post = DB.data.model<IPostDoc, IPostModel>('Post', PostSchema);
