/* eslint-disable no-console */
import mongoose, { Connection } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

class DB {
  mongod: MongoMemoryServer;

  connection: Connection = mongoose.createConnection();

  constructor(mongod: MongoMemoryServer) {
    this.mongod = mongod;
  }

  async open(): Promise<Connection> {
    return new Promise((resolve, reject) => {
      const uri = this.mongod.getUri();

      this.connection.once('open', () => {
        console.log(`Successfully connected to ${uri}`);
        resolve(this.connection);
      });

      this.connection.on('error', (e: any) => {
        if (e.message.code === 'ETIMEDOUT') {
          this.connection.openUri(uri, {});
        }
        console.error(Date.now(), e);
      });

      this.connection.once('disconnected', () => {
        console.log(`Disconnected from ${uri}`);
        reject();
      });

      this.connection.openUri(uri, {});
    });
  }

  close(): Promise<any> {
    return this.connection.close();
  }

  static async build() {
    const mongod = await MongoMemoryServer.create();
    return new DB(mongod);
  }
}

const db = await DB.build();
export default db;
