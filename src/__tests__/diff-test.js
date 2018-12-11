// @flow

import mongoose from 'mongoose';
import DB from '../../__fixtures__/db';
import DiffModel from '../DiffModel';

jest.mock('../../__fixtures__/db.js');
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe('Diff', () => {
  DB.init();

  it('create diff model', () => {
    expect(() => {
      // $FlowFixMe
      DiffModel(null, {});
    }).toThrowErrorMatchingInlineSnapshot(`"'mongooseConection' is required"`);

    expect(() => {
      // $FlowFixMe
      DiffModel({}, null);
    }).toThrowErrorMatchingInlineSnapshot(`"'collectionName' is required"`);
  });

  it('static methods', async () => {
    const Diff = DiffModel(DB.data, 'diffs');
    // $FlowFixMe
    const docId = mongoose.Types.ObjectId();
    const changes: any = [
      { k: 'E', p: ['details', 'with', '2'], l: 'elements', r: 'more' },
      { k: 'A', p: ['details', 'with'], i: 3, it: { k: 'N', r: 'elements' } },
    ];

    const diff1 = await Diff.createDiff(docId, changes);
    const diff2 = await Diff.createDiff(docId, [changes[0]]);

    expect(diff1.v).toBe(1);
    expect(diff2.v).toBe(2);

    expect(diff1.c).toMatchInlineSnapshot(`
CoreMongooseArray [
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
CoreMongooseArray [
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

  describe('getMerged()', () => {
    const Diff = DiffModel(DB.data, 'diffs');

    it('with objects (added)', async () => {
      // $FlowFixMe
      const docId = mongoose.Types.ObjectId();
      const changes1: any = [
        { k: 'N', p: ['same'], r: 'new1' },
        { k: 'N', p: ['different'], r: 'new2' },
      ];

      const changes2: any = [
        { k: 'N', p: ['same'], r: 'new11' },
        { k: 'E', p: ['different'], l: 'abc', r: 'new22' },
      ];

      await Diff.createDiff(docId, changes1);
      await Diff.createDiff(docId, changes2);

      const merged = await Diff.getMerged(docId);
      expect(merged).toMatchInlineSnapshot(`
Map {
  "same" => Object {
    "k": "N",
    "r": "new11",
  },
  "different" => Object {
    "k": "N",
    "r": "new22",
  },
}
`);
    });

    it('with objects (deleted)', async () => {
      // $FlowFixMe
      const docId = mongoose.Types.ObjectId();
      const changes1: any = [
        { k: 'E', p: ['same'], l: 'new1', r: 'updatedNew1' },
        { k: 'D', p: ['different'], l: 'new2' },
      ];

      const changes2: any = [
        { k: 'D', p: ['same'], l: 'new11sd' },
        { k: 'D', p: ['different'], l: 'abc' },
      ];

      await Diff.createDiff(docId, changes1);
      await Diff.createDiff(docId, changes2);

      const merged = await Diff.getMerged(docId);
      expect(merged).toMatchInlineSnapshot(`
Map {
  "same" => Object {
    "k": "D",
    "l": "new1",
    "r": undefined,
  },
  "different" => Object {
    "k": "D",
    "l": "new2",
    "r": undefined,
  },
}
`);
    });

    it('with objects (edited)', async () => {
      // $FlowFixMe
      const docId = mongoose.Types.ObjectId();
      const changes1: any = [
        { k: 'E', p: ['ee'], l: 'new1', r: 'updatedNew1' },
        { k: 'E', p: ['en'], l: 'new2', r: 'updatedNew2' },
        { k: 'D', p: ['de'], l: 'new3' },
        { k: 'D', p: ['dn'], l: 'new4' },
      ];

      const changes2: any = [
        { k: 'E', p: ['ee'], l: 'new11', r: 'updatedNew11' },
        { k: 'N', p: ['en'], r: 'new22' },
        { k: 'E', p: ['de'], l: 'abc', r: 'updatedNew33' },
        { k: 'N', p: ['dn'], r: 'new44' },
      ];

      await Diff.createDiff(docId, changes1);
      await Diff.createDiff(docId, changes2);

      const merged = await Diff.getMerged(docId);
      expect(merged).toMatchInlineSnapshot(`
Map {
  "ee" => Object {
    "k": "E",
    "l": "new1",
    "r": "updatedNew11",
  },
  "en" => Object {
    "k": "E",
    "l": "new2",
    "r": "new22",
  },
  "de" => Object {
    "k": "E",
    "l": "new3",
    "r": "updatedNew33",
  },
  "dn" => Object {
    "k": "E",
    "l": "new4",
    "r": "new44",
  },
}
`);
    });

    it.skip('getMerged() with arrays', async () => {
      // $FlowFixMe
      const docId = mongoose.Types.ObjectId();
      const changes1: any = [
        { k: 'A', p: ['arrayField'], i: 1, it: { k: 'N', r: 'new element 1' } },
      ];

      const changes2: any = [
        { k: 'A', p: ['arrayField'], i: 1, it: { k: 'D', l: 'new element 1' } },
      ];
      const changes3: any = [
        { k: 'A', p: ['arrayField'], i: 1, it: { k: 'N', r: 'new element 2' } },
        { k: 'A', p: ['arrayField'], i: 2, it: { k: 'E', l: 'was', r: 'now' } },
      ];

      await Diff.createDiff(docId, changes1);
      await Diff.createDiff(docId, changes2);
      await Diff.createDiff(docId, changes3);

      const merged = await Diff.getMerged(docId);
      expect(merged).toMatchInlineSnapshot(`
Map {
  "same" => Object {
    "k": "E",
    "l": "elements",
    "r": "now",
    "v": 1,
  },
  "different" => Object {
    "k": "E",
    "l": "gdr",
    "r": "frg",
    "v": 2,
  },
}
`);
    });
  });
});
