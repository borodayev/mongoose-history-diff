// @flow
/* eslint-disable no-param-reassign, func-names */

import mongoose, { type MongooseSchema } from 'mongoose';
import DiffPlugin from '../index';
import DB from './db';

DB.init('mongodb://localhost:27017/testdb');

export const PostSchema: MongooseSchema<PostDoc> = new mongoose.Schema(
  {
    title: {
      type: String,
      description: 'Provider who send Post',
    },
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'post',
  }
);

export class PostDoc /* :: extends Mongoose$Document */ {
  title: string;

  /* :: static diffModel(): any {} */
}

PostSchema.loadClass(PostDoc);
PostSchema.plugin(DiffPlugin);

export const Post = DB.data.model('Post', PostSchema);
