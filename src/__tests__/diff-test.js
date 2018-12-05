// @flow

import mongoose from 'mongoose';
import DB from '../../__fixtures__/db';
import DiffModel from '../Diff';

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
});
