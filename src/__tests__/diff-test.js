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
    const changes = [
      { kind: 'E', path: ['details', 'with', '2'], lhs: 'elements', rhs: 'more' },
      { kind: 'A', path: ['details', 'with'], index: 3, item: { kind: 'N', rhs: 'elements' } },
    ];

    await Diff.createOrUpdateDiffs(docId, changes);
    const diffs = await Diff.findAllByDocId(docId);

    expect(Array.isArray(diffs)).toBeTruthy();
    expect(diffs[0].path.join('.')).toBe('details.with.2');
    expect(diffs[1].path.join('.')).toBe('details.with');

    expect(diffs[0].changes[0].kind).toBe('E');
    expect(diffs[0].changes[0].lhs).toBe('elements');
    expect(diffs[0].changes[0].rhs).toBe('more');
  });
});
