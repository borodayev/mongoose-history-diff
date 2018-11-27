// @flow
/* eslint-disable no-param-reassign, func-names */

import mongoose, { type MongooseSchema } from 'mongoose';
import DiffPlugin, { type DiffModelT } from '../src/index';
import DB from './db';

DB.init();

export const PostSchema: MongooseSchema<PostDoc> = new mongoose.Schema(
  {
    title: {
      type: String,
      description: 'Provider who send Post',
    },
    subjects: [{ name: String }],
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'post',
  }
);

export class PostDoc /* :: extends Mongoose$Document */ {
  title: string;
  subjects: Array<{ name: string }>;

  // TODO: find out solution for flow to use `DiffModelT` instead of `any`
  /* :: static diffModel(): any {}  */
}

PostSchema.plugin(DiffPlugin);
PostSchema.loadClass(PostDoc);

export const Post = DB.data.model('Post', PostSchema);
