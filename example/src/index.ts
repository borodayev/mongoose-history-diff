import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import graphqlHTTP from 'express-graphql'; 
import schema from './schema';

const PORT = process.env.PORT || 8090;
const server = express();

server.use('/', graphqlHTTP({
  schema: schema,
  graphiql: true,
}));

server.listen(PORT, () => console.log(`Server is running on ${PORT} port`));