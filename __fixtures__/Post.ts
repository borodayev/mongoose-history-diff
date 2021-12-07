/* eslint-disable no-await-in-loop */
import mongoose, { Document as MongooseDocument, Model } from 'mongoose';
import DiffPlugin, { IDiffModel } from '../src/index';
import DB from './db';

DB.open();

export interface IPostDoc extends MongooseDocument {
  title: string;
  subjects: Array<{ name: string }>;
  createdAt: Date;
  updatedAt: Date;
}

interface IPostModel extends Model<IPostDoc> {
  diffModel(): IDiffModel;
  createDifferentSubjects(findObj: string, count: number): Promise<void>;
}

export const PostSchema = new mongoose.Schema<IPostDoc, IPostModel>(
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

// eslint-disable-next-line jest/require-hook
PostSchema.plugin(DiffPlugin<IPostDoc>());

export const Post = DB.connection.model<IPostDoc, IPostModel>(
  'Post',
  PostSchema
);
