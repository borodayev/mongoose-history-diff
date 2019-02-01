// @flow

import { Post, type PostDoc } from '../../__fixtures__/Post';

jest.mock('../../__fixtures__/db.js');
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe('mongoose-dp', () => {
  it('return diff model', async () => {
    const Diff = Post.diffModel();
    const diff = new Diff({ p: ['title'], c: [{ p: ['way'] }] });

    expect(typeof Diff).toBe('function');
    expect(typeof Diff.findByDocId).toBe('function');
    expect(typeof Diff.createDiff).toBe('function');
    expect(typeof Diff.findAfterVersion).toBe('function');
    expect(typeof Diff.findBeforeVersion).toBe('function');
    expect(typeof Diff.revertToVersion).toBe('function');
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
    const diffs = await Diff.findByDocId(post._id);

    expect(Array.isArray(diffs)).toBeTruthy();
    expect(diffs[0].c).toMatchSnapshot();
    expect(diffs[0].v).toBe(1);
  });

  // it('save array diffs properly', async () => {
  //   await Post.create({ title: 'arrayCheck', subjects: [{ name: 'was' }] });
  //   const post: PostDoc = (await Post.findOne({ title: 'arrayCheck' }).exec(): any);
  //   post.subjects = [{ name: 'was' }, { name: 'first' }];
  //   await post.save();

  //   const post1: PostDoc = (await Post.findOne({ title: 'arrayCheck' }).exec(): any);
  //   post1.subjects = [{ name: 'was' }, { name: 'first' }, { name: 'second' }];
  //   await post1.save();

  //   const post2: PostDoc = (await Post.findOne({ title: 'arrayCheck' }).exec(): any);
  //   post2.subjects = [{ name: 'first' }, { name: 'second' }];
  //   await post2.save();

  //   const Diff = Post.diffModel();
  //   const diffs = await Diff.findByDocId(post2._id);
  //   expect(diffs).toMatchInli
  //   const merged = await Diff.mergeDiffs(post2);
  //   expect(merged).toBe();
  // });
});
