/* eslint-disable no-param-reassign, jest/require-top-level-describe, jest/no-hooks */
/* eslint-disable no-param-reassign */

import * as m from 'mongodb-memory-server';

const DB = require.requireActual('../db').default;

const mongod = new m.MongoMemoryServer({});

DB.autoIndexOnceInDev = (opts: any) => {
  opts.config.autoIndex = false;
};
DB.consoleErr = () => {};
DB.consoleLog = () => {};

const actualInit = DB.init;
DB.init = async () => {
  process.env.MONGO_CONNECTION_STRING = await mongod.getConnectionString();
  return actualInit();
};

const actualClose = DB.close;
DB.close = async () => {
  await actualClose();
  mongod.stop();
};

module.exports = DB;

beforeAll(async () => DB.init());
afterAll(async () => DB.close());
