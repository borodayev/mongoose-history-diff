// @flow

import { Post, type PostDoc } from '../Post';

jest.mock('../db');
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe('plugin', () => {
  it('diff model', async () => {
    await Post.create({ title: 'new' });
    const post: PostDoc = (await Post.findOne({ title: 'new' }).exec(): any);
    post.title = 'updated';
    await post.save();

    const Diff = Post.diffModel();
    const diffs = await Diff.find({}).exec();
    expect(post.title).toBe('updated');
    expect(Array.isArray(diffs)).toBeTruthy();
    expect(Array.isArray(diffs[0].changes)).toBeTruthy();
    expect(diffs[0].changes.length).toBe(1);
    expect(diffs[0].docId.toString() === post._id.toString()).toBeTruthy();
    expect(diffs[0].changes[0].kind).toBe('E');
    expect(diffs[0].changes[0].lhs).toBe('new');
    expect(diffs[0].changes[0].rhs).toBe('updated');
  });

  it('process array diffs', async () => {
    await Post.create({ title: 'newest', subjects: [{ name: 'first' }] });
    const post: PostDoc = (await Post.findOne({ title: 'newest' }).exec(): any);
    post.subjects.push({ name: 'second' });
    await post.save();

    const Diff = Post.diffModel();
    const diffs = await Diff.find({}).exec();
    expect(diffs[1].changes[0].index).toBe(1);
    expect(diffs[1].changes[0].item.rhs.name).toBe('second');
  });
});
