
import { Post, PostDoc } from '../../__fixtures__/Post';

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
    const post: PostDoc = await Post.findOne({ title: 'test' }).exec() as any;
    post.title = 'updated';
    post.subjects = [{ name: 'math' }, { name: 'air' }];
    await post.save();

    const Diff = Post.diffModel();
    const diffs = await Diff.findByDocId(post._id);

    expect(Array.isArray(diffs)).toBeTruthy();
    expect(diffs[0].c).toMatchSnapshot();
    expect(diffs[0].v).toBe(1);
  });

  describe('save array diffs properly', () => {
    it('add new element', async () => {
      await Post.create({ title: 'newElement', subjects: [{ name: 'test' }] });
      const post: PostDoc = await Post.findOne({
        title: 'newElement',
      }).exec() as any;
      post.subjects = [{ name: 'test' }, { name: 'new test' }];
      await post.save();

      const Diff = Post.diffModel();
      const diffs = await Diff.findByDocId(post._id);
      expect(diffs[0].c).toMatchInlineSnapshot(`
        CoreDocumentArray [
          Object {
            "i": 1,
            "it": Object {
              "k": "N",
              "r": Object {
                "name": "new test",
              },
            },
            "k": "A",
            "p": Array [
              "subjects",
            ],
          },
        ]
      `);
    });

    it('edit existed element', async () => {
      await Post.create({
        title: 'existedElement',
        subjects: [{ name: 'was' }],
      });
      const post: PostDoc = await Post.findOne({
        title: 'existedElement',
      }).exec() as any;
      post.subjects = [{ name: 'become' }];
      await post.save();

      const Diff = Post.diffModel();
      const diffs = await Diff.findByDocId(post._id);
      expect(diffs[0].c).toMatchInlineSnapshot(`
        CoreDocumentArray [
          Object {
            "k": "E",
            "l": "was",
            "p": Array [
              "subjects",
              "0",
              "name",
            ],
            "r": "become",
          },
        ]
      `);
    });

    it('delete element', async () => {
      await Post.create({
        title: 'deleteElement',
        subjects: [{ name: 'one' }, { name: 'two' }, { name: 'three' }],
      });
      const post: PostDoc = await Post.findOne({
        title: 'deleteElement',
      }).exec() as any;
      post.subjects = [{ name: 'one' }, { name: 'three' }];
      await post.save();

      const Diff = Post.diffModel();
      const diffs = await Diff.findByDocId(post._id);
      expect(diffs[0].c).toMatchInlineSnapshot(`
        CoreDocumentArray [
          Object {
            "i": 2,
            "it": Object {
              "k": "D",
              "l": Object {
                "name": "three",
              },
            },
            "k": "A",
            "p": Array [
              "subjects",
            ],
          },
          Object {
            "k": "E",
            "l": "two",
            "p": Array [
              "subjects",
              "1",
              "name",
            ],
            "r": "three",
          },
        ]
      `);
    });
  });
});