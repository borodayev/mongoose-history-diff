// @flow

import { Post, type PostDoc } from '../../__fixtures__/Post';

jest.mock('../../__fixtures__/db.js');
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe('mongoose-dp', () => {
  it('return diff model', async () => {
    const Diff = Post.diffModel();
    const diff = new Diff({ path: ['title'] });

    expect(typeof Diff).toBe('function');
    expect(typeof Diff.findAllByDocId).toBe('function');
    expect(typeof Diff.createOrUpdateDiffs).toBe('function');
    expect(diff.path[0]).toEqual('title');
  });

  it('save diffs', async () => {
    // need to return doc from db for invoking `init` hook,
    // because there is no sense to save initial doc in diffs
    await Post.create({ title: 'test', subjects: [{ name: 'matsdcsdch' }] });
    const post: PostDoc = (await Post.findOne({ title: 'test' }).exec(): any);
    post.title = 'updated';
    post.subjects = [{ name: 'math' }, { name: 'air' }];
    await post.save();

    const Diff = Post.diffModel();
    const diffs = await Diff.findAllByDocId(post._id);

    expect(Array.isArray(diffs)).toBeTruthy();
    expect(diffs[0].path.join('.')).toBe('subjects.0.name');
    expect(diffs[1].path.join('.')).toBe('subjects');
    expect(diffs[2].path.join('.')).toBe('title');

    expect(Array.isArray(diffs[0].changes)).toBeTruthy();
    expect(diffs[1].changes.length).toBe(1);
    expect(diffs[0].changes[0].kind).toBe('E');
  });

  it.skip('findOneAndUpdate', async () => {
    await Post.create({ title: 'test' });
    const post: PostDoc = (await Post.findOneAndUpdate(
      { title: 'test' },
      { $set: { title: 'testUpdated' } },
      { new: false }
    ).exec(): any);

    expect(post.title).toBe('testUpdated');

    // const Diff = Post.diffModel();
    // const diffs = await Diff.find({}).exec();
  });
});
