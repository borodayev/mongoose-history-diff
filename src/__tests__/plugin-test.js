// @flow

import { Post, type PostDoc } from '../../__fixtures__/Post';

jest.mock('../../__fixtures__/db.js');
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe('mongoose-dp', () => {
  it('return diff model', async () => {
    const Diff = Post.diffModel();
    const diff = new Diff({ p: ['title'], c: [{ p: ['way'] }] });

    expect(typeof Diff).toBe('function');
    expect(typeof Diff.findAllByDocId).toBe('function');
    expect(typeof Diff.createDiff).toBe('function');
    // expect(typeof Diff.getNextVersion).toBe('function');
    expect(diff.c[0].p[0]).toBe('way');
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
    expect(diffs[0].c).toMatchSnapshot();
    expect(diffs[0].v).toBe(0);
  });
});
