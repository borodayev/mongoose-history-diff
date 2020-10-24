# mongoose-history-diff

[![travis build](https://img.shields.io/travis/borodayev/mongoose-history-diff.svg)](https://travis-ci.com/borodayev/mongoose-history-diff)
[![codecov coverage](https://img.shields.io/codecov/c/github/borodayev/mongoose-history-diff.svg)](https://codecov.io/github/borodayev/mongoose-history-diff)
[![](https://img.shields.io/npm/v/mongoose-history-diff.svg)](https://www.npmjs.com/package/mongoose-history-diff)
[![npm](https://img.shields.io/npm/dt/mongoose-history-diff.svg)](http://www.npmtrends.com/mongoose-history-diff)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Greenkeeper badge](https://badges.greenkeeper.io/borodayev/mongoose-history-diff.svg)](https://greenkeeper.io/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)


This is a [mongoose](https://mongoosejs.com/) plugin for tracking the history and differences of your MongoDB documents. The differences related to one particular model will be stored in a separate MongoDB collection.

## Installation

```bash
yarn add mongoose-history-diff
```

```bash
npm i mongoose-history-diff
```

## Usage

Add plugin to your Mongoose schema:

 ```js
import DiffPlugin from 'mongoose-history-diff';
 ```
 ```js
 CoderSchema.plugin(DiffPlugin, {
     orderIndependent: true,
     diffCollectionName: 'my_diffs', 
 });
 ```
 `orderIndependent` option defines whether the order of elements in an array is important or not. If `true` then it won't create a new diff in case new changes occurred. By default **false**.

 `diffCollectionName` option sets the name of a collection with diffs. If not provided `${parent_collection_name}_diffs` will be used.

 ---

Here is an example of how would look a diff doc after changing a string field:

```js
// initial state
{
  _id: "5f8c17fabb207f0017164033",
  name: "John Doe",
}
```

```js
// after changes
{
  _id: "5f8c17fabb207f0017164033",
  name: "John Smith",
}
```

```js
// diff doc
{
  dId: "5f8c17fabb207f0017164033",
  v: 1,
  createdAt: "2020-10-18T10:25:27.279Z",
  c: [
    {
      p: ["name"],
      k: "E",
      l: "John Doe",
      r: "John Smith",
      i: null
    }
  ]
}
```

Diffs are represented as one or more change records (`c` field in the doc above). Change record has the following structure:

* `k` - indicates the kind of change; will be one of the following:
  * `N` - indicates that a new field/element was added.
  * `D` - indicates that a field/element was deleted.
  * `E` - indicates that a field/element was edited.
  * `A` - indicates a change within an array.
* `p` - the field's path in the original document.
* `l` - the value before changing (undefined if `k === 'N'`).
* `r` - the value after changing (undefined if `k === 'D'`).
* `i` - when `k === 'A'`, indicates the index in an array where the change has occurred.
* `it` - when `k === 'A'`, contains a nested change record of an array element with index `i`.

-----

 You could exclude specific fields from tracking by adding `track_diff: false` configuration to your field definition inside the Mongoose schema:

 ```js
 export const CoderSchema: MongooseSchema<CoderDoc> = new mongoose.Schema(
  {
    name: {
      type: String,
      track_diff: false,
    },
    skills: [
      {
        name: { type: String }
      },
    ],
  {
    timestamps: true,
  }
);
 ```

 The **_id** field is excluded from the tracking by default.

-------

Also, the plugin will add a static `diffModel` method to the original model that returns the model of diff collection.

```js
import { type IDiffModel } from 'mongoose-history-diff';
const CoderDiffModel: IDiffModel  = Coder.diffModel();
```

This model contains several static methods (types could be found [here](https://github.com/borodayev/mongoose-history-diff/blob/master/src/types.ts)):

* `createDiff` method is using internally for creating new diffs, but also exposed in case there will be a necessity to manually save diffs.

  ```js
  createDiff(dId: ObjectId, v: number, changes: ChangeDoc[]): Promise<IDiffDoc>;
  ```

* `findByDocId` method is using for finding all diffs related to a particular document.

  ```js
  findByDocId(dId: ObjectId): Promise<Array<IDiffDoc>>;
  ```

* `findAfterVersion` method is using for finding all diffs related to a particular document after specific version.
  ```js
  findAfterVersion(dId: ObjectId, v: number): Promise<Array<IDiffDoc>>;
  ```

* `findBeforeVersion` method is using for finding all diffs related to a particular document before a specific version.

  ```js
  findBeforeVersion(dId: ObjectId, v: number): Promise<Array<IDiffDoc>>;
  ```

* `revertToVersion` method is using for reverting a particular document to a specific version.

  ```js
  revertToVersion(d: Object, v: number): Promise<any>;
  ```

* `mergeDiffs` method is using for getting merged diffs of a particular document among several versions.

  ```js
  mergeDiffs(doc: Document, opts?: MergedDiffsOptsT): Promise<Array<RawChangeT>>;
  ```

## License

[MIT](https://github.com/borodayev/mongoose-history-diff/blob/master/LICENSE.md)