/* eslint-disable no-param-reassign */
/* @flow */

import MongoMemoryServer from 'mongodb-memory-server';

// $FlowFixMe
const DB = require.requireActual('../db').default;

const mongod = new MongoMemoryServer({
  // debug: true,
});

DB.autoIndexOnceInDev = opts => {
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
