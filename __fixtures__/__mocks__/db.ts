const DB = jest.requireActual('../db').default;

module.exports = DB;

beforeAll(async () => DB.open());
afterAll(async () => DB.close());
