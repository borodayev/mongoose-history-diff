import { schemaComposer } from 'graphql-compose';
import { CoderTC } from './Coder';

schemaComposer.Query.addFields({
  coderById: CoderTC.getResolver('findById'),
  coderOne: CoderTC.getResolver('findOne'),
  coderMany: CoderTC.getResolver('findMany'),
  coderCount: CoderTC.getResolver('count'),
  coderConnection: CoderTC.getResolver('connection'),
});

schemaComposer.Mutation.addFields({
  coderCreateOne: CoderTC.getResolver('createOne'),
  coderUpdateById: CoderTC.getResolver('updateById'),
  coderUpdateOne: CoderTC.getResolver('updateOne'),
});

const schema = schemaComposer.buildSchema();
export default schema;