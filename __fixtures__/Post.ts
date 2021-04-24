/* eslint-disable no-await-in-loop */
// @flow
/* eslint-disable no-param-reassign, func-names */

import mongoose, { Schema, Document, Model } from 'mongoose';
import DiffPlugin, { IDiffModel } from '../src/index';
import DB from './db';

DB.init();

export interface IPostDoc extends Document {
  title: string;
  subjects: Array<{ name: string }>;
}

interface IPostModel extends Model<IPostDoc> {
  diffModel(): IDiffModel;
  createDifferentSubjects(findObj: string, count: number): Promise<void>;
}

export const PostSchema: Schema<IPostDoc, IPostModel> = new mongoose.Schema(
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

// for test purposes
PostSchema.statics.createDifferentSubjects = async function (
  this: IPostModel,
  title: string,
  count: number
): Promise<void> {
  for (let i = 1; i <= count; i += 1) {
    const post = await this.findOne({ title }).exec();
    if (post) {
      post.subjects.push({ name: `name_${i}` });
      await post.save();
    }
  }
};

PostSchema.plugin(DiffPlugin<IPostDoc>());

export const Post = DB.data.model<IPostDoc, IPostModel>('Post', PostSchema);
