/* eslint-disable jest/no-truthy-falsy */
/* eslint-disable jest/prefer-expect-assertions */
import mongoose from 'mongoose';
import DB from '../../__fixtures__/db';
import DiffModel from '../DiffModel';
import { Post, IPostDoc } from '../../__fixtures__/Post';

jest.mock('../../__fixtures__/db.ts');
jest.setTimeout(30000);

describe('diff', () => {
  DB.init();

  it('create diff model', () => {
    expect(() => {
      DiffModel(null as any, 'dsc');
    }).toThrowErrorMatchingInlineSnapshot(`"'mongooseConnection' is required"`);

    expect(() => {
      DiffModel({} as any, '');
    }).toThrowErrorMatchingInlineSnapshot(`"'collectionName' is required"`);
  });

  it('createDiff()', async () => {
    const Diff = DiffModel(DB.data, 'diffs');

    const docId = mongoose.Types.ObjectId();
    const changes: any = [
      { k: 'E', p: ['details', 'with', '2'], l: 'elements', r: 'more' },
      { k: 'A', p: ['details', 'with'], i: 3, it: { k: 'N', r: 'elements' } },
    ];

    const diff1 = await Diff.createDiff(docId, 1, changes);
    const diff2 = await Diff.createDiff(docId, 2, [changes[0]]);

    expect(diff1.v).toBe(1);
    expect(diff2.v).toBe(2);

    expect((diff1 as any).updatedAt).toBeUndefined();
    expect((diff2 as any).updatedAt).toBeUndefined();

    expect(diff1.c).toMatchInlineSnapshot(`
      CoreDocumentArray [
        Object {
          "k": "E",
          "l": "elements",
          "p": Array [
            "details",
            "with",
            "2",
          ],
          "r": "more",
        },
        Object {
          "i": 3,
          "it": Object {
            "k": "N",
            "r": "elements",
          },
          "k": "A",
          "p": Array [
            "details",
            "with",
          ],
        },
      ]
    `);

    expect(diff2.c).toMatchInlineSnapshot(`
      CoreDocumentArray [
        Object {
          "k": "E",
          "l": "elements",
          "p": Array [
            "details",
            "with",
            "2",
          ],
          "r": "more",
        },
      ]
    `);
  });

  it('findAfterVersion()', async () => {
    const Diff = DiffModel(DB.data, 'diffs');

    const docId = mongoose.Types.ObjectId();
    const changes: any = [
      { k: 'E', p: ['details', 'with', '2'], l: 'elements', r: 'more' },
      { k: 'A', p: ['details', 'with'], i: 3, it: { k: 'N', r: 'elements' } },
    ];

    await Diff.createDiff(docId, 1, changes);
    await Diff.createDiff(docId, 2, [changes[0]]);

    const tillV1 = await Diff.findAfterVersion(docId, 1);
    const tillV2 = await Diff.findAfterVersion(docId, 2);
    expect(tillV1[0].c).toMatchInlineSnapshot(`
      CoreDocumentArray [
        Object {
          "k": "E",
          "l": "elements",
          "p": Array [
            "details",
            "with",
            "2",
          ],
          "r": "more",
        },
      ]
    `);
    expect(tillV1[1].c).toMatchInlineSnapshot(`
      CoreDocumentArray [
        Object {
          "k": "E",
          "l": "elements",
          "p": Array [
            "details",
            "with",
            "2",
          ],
          "r": "more",
        },
        Object {
          "i": 3,
          "it": Object {
            "k": "N",
            "r": "elements",
          },
          "k": "A",
          "p": Array [
            "details",
            "with",
          ],
        },
      ]
    `);

    expect(tillV2[0].c).toMatchInlineSnapshot(`
      CoreDocumentArray [
        Object {
          "k": "E",
          "l": "elements",
          "p": Array [
            "details",
            "with",
            "2",
          ],
          "r": "more",
        },
      ]
    `);
  });

  it('revertToVersion()', async () => {
    await Post.create({ title: 'test', subjects: [{ name: 'test' }] });
    const post: IPostDoc = (await Post.findOne({
      title: 'test',
    }).exec()) as any;
    post.title = 'updated';
    post.subjects = [{ name: 'math' }, { name: 'air' }];
    await post.save();

    const post2: IPostDoc = (await Post.findOne({
      title: 'updated',
    }).exec()) as any;
    post2.title = 'updated2';
    post2.subjects = [{ name: 'math2' }, { name: 'air2' }];
    await post2.save();

    const Diff = Post.diffModel();
    const revertedDoc = await Diff.revertToVersion(post2.toObject(), 1);

    expect(post2.title).toBe('updated2');
    expect(post2.subjects).toMatchInlineSnapshot(`
      CoreDocumentArray [
        Object {
          "name": "math2",
        },
        Object {
          "name": "air2",
        },
      ]
    `);
    expect(revertedDoc.title).toBe('test');
    expect(revertedDoc.subjects).toMatchInlineSnapshot(`
      Array [
        Object {
          "name": "test",
        },
      ]
    `);
  });

  describe('mergeDiffs()', () => {
    const getMerdgedDiffs = async (
      doc: IPostDoc,
      versionOpt: string
    ): Promise<any> => {
      const Diff = Post.diffModel();
      const diff1 = await Diff.mergeDiffs(doc, {
        [versionOpt]: 1,
      });
      const diff2 = await Diff.mergeDiffs(doc, {
        [versionOpt]: 2,
      });
      const diff3 = await Diff.mergeDiffs(doc, {
        [versionOpt]: 3,
      });
      const diff4 = await Diff.mergeDiffs(doc, {
        [versionOpt]: 4,
      });
      const diff5 = await Diff.mergeDiffs(doc, {
        [versionOpt]: 5,
      });
      const diff6 = await Diff.mergeDiffs(doc, {
        [versionOpt]: 6,
      });

      return { diff1, diff2, diff3, diff4, diff5, diff6 };
    };

    it('without options', async () => {
      await Post.create({ title: 'test1', subjects: [] });
      await Post.createDifferentSubjects('test1', 5);
      const post = (await Post.findOne({ title: 'test1' }).exec()) as IPostDoc;
      const Diff = Post.diffModel();
      const allDiffs = await Diff.mergeDiffs(post);

      expect(allDiffs).toStrictEqual([
        {
          i: 4,
          it: { k: 'N', r: { name: 'name_5' } },
          k: 'A',
          p: ['subjects'],
        },
        {
          i: 3,
          it: { k: 'N', r: { name: 'name_4' } },
          k: 'A',
          p: ['subjects'],
        },
        {
          i: 2,
          it: { k: 'N', r: { name: 'name_3' } },
          k: 'A',
          p: ['subjects'],
        },
        {
          i: 1,
          it: { k: 'N', r: { name: 'name_2' } },
          k: 'A',
          p: ['subjects'],
        },
        {
          i: 0,
          it: { k: 'N', r: { name: 'name_1' } },
          k: 'A',
          p: ['subjects'],
        },
      ]);
    });

    it('with startVersion', async () => {
      await Post.create({ title: 'test2', subjects: [] });
      await Post.createDifferentSubjects('test2', 5);
      const post = (await Post.findOne({ title: 'test2' }).exec()) as IPostDoc;

      const {
        diff1,
        diff2,
        diff3,
        diff4,
        diff5,
        diff6,
      } = await getMerdgedDiffs(post, 'startVersion');

      expect(diff1).toStrictEqual([
        {
          i: 4,
          it: { k: 'N', r: { name: 'name_5' } },
          k: 'A',
          p: ['subjects'],
        },
        {
          i: 3,
          it: { k: 'N', r: { name: 'name_4' } },
          k: 'A',
          p: ['subjects'],
        },
        {
          i: 2,
          it: { k: 'N', r: { name: 'name_3' } },
          k: 'A',
          p: ['subjects'],
        },
        {
          i: 1,
          it: { k: 'N', r: { name: 'name_2' } },
          k: 'A',
          p: ['subjects'],
        },
        {
          i: 0,
          it: { k: 'N', r: { name: 'name_1' } },
          k: 'A',
          p: ['subjects'],
        },
      ]);
      expect(diff2).toStrictEqual([
        {
          i: 4,
          it: { k: 'N', r: { name: 'name_5' } },
          k: 'A',
          p: ['subjects'],
        },
        {
          i: 3,
          it: { k: 'N', r: { name: 'name_4' } },
          k: 'A',
          p: ['subjects'],
        },
        {
          i: 2,
          it: { k: 'N', r: { name: 'name_3' } },
          k: 'A',
          p: ['subjects'],
        },
        {
          i: 1,
          it: { k: 'N', r: { name: 'name_2' } },
          k: 'A',
          p: ['subjects'],
        },
      ]);
      expect(diff3).toStrictEqual([
        {
          i: 4,
          it: { k: 'N', r: { name: 'name_5' } },
          k: 'A',
          p: ['subjects'],
        },
        {
          i: 3,
          it: { k: 'N', r: { name: 'name_4' } },
          k: 'A',
          p: ['subjects'],
        },
        {
          i: 2,
          it: { k: 'N', r: { name: 'name_3' } },
          k: 'A',
          p: ['subjects'],
        },
      ]);
      expect(diff4).toStrictEqual([
        {
          k: 'A',
          p: ['subjects'],
          i: 4,
          it: { k: 'N', r: { name: 'name_5' } },
        },
        {
          k: 'A',
          p: ['subjects'],
          i: 3,
          it: { k: 'N', r: { name: 'name_4' } },
        },
      ]);
      expect(diff5).toStrictEqual([
        {
          k: 'A',
          p: ['subjects'],
          i: 4,
          it: { k: 'N', r: { name: 'name_5' } },
        },
      ]);
      expect(diff6).toStrictEqual([]);
    });

    it('with endVersion', async () => {
      await Post.create({ title: 'test3', subjects: [] });
      await Post.createDifferentSubjects('test3', 5);
      const post = (await Post.findOne({ title: 'test3' }).exec()) as IPostDoc;
      const {
        diff1,
        diff2,
        diff3,
        diff4,
        diff5,
        diff6,
      } = await getMerdgedDiffs(post, 'endVersion');
      expect(diff1).toStrictEqual([]);
      expect(diff2).toStrictEqual([
        {
          k: 'A',
          p: ['subjects'],
          i: 0,
          it: { k: 'N', r: { name: 'name_1' } },
        },
      ]);
      expect(diff3).toStrictEqual([
        {
          k: 'A',
          p: ['subjects'],
          i: 1,
          it: { k: 'N', r: { name: 'name_2' } },
        },
        {
          k: 'A',
          p: ['subjects'],
          i: 0,
          it: { k: 'N', r: { name: 'name_1' } },
        },
      ]);
      expect(diff4).toStrictEqual([
        {
          k: 'A',
          p: ['subjects'],
          i: 2,
          it: { k: 'N', r: { name: 'name_3' } },
        },
        {
          k: 'A',
          p: ['subjects'],
          i: 1,
          it: { k: 'N', r: { name: 'name_2' } },
        },
        {
          k: 'A',
          p: ['subjects'],
          i: 0,
          it: { k: 'N', r: { name: 'name_1' } },
        },
      ]);
      expect(diff5).toStrictEqual([
        {
          k: 'A',
          p: ['subjects'],
          i: 3,
          it: { k: 'N', r: { name: 'name_4' } },
        },
        {
          k: 'A',
          p: ['subjects'],
          i: 2,
          it: { k: 'N', r: { name: 'name_3' } },
        },
        {
          k: 'A',
          p: ['subjects'],
          i: 1,
          it: { k: 'N', r: { name: 'name_2' } },
        },
        {
          k: 'A',
          p: ['subjects'],
          i: 0,
          it: { k: 'N', r: { name: 'name_1' } },
        },
      ]);
      expect(diff6).toStrictEqual([]);
    });

    it('startVersion = 0 || endVersion = 0', async () => {
      await Post.create({ title: 'test4', subjects: [] });
      await Post.createDifferentSubjects('test4', 2);
      const post = (await Post.findOne({ title: 'test2' }).exec()) as IPostDoc;
      const Diff = Post.diffModel();

      await expect(
        Diff.mergeDiffs(post, { startVersion: 0 })
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"\\"startVersion\\" argument should be >= 1, but got: 0"`
      );

      await expect(
        Diff.mergeDiffs(post, { endVersion: 0 })
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"\\"endVersion\\" argument should be >= 1, but got: 0"`
      );
    });
  });
});
