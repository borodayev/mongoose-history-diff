import { schemaComposer } from 'graphql-compose';
import { CoderTC } from './Coder';

schemaComposer.Query.addNestedFields({
  'coder.findById': CoderTC.getResolver('findById'),
  'coder.findMany': CoderTC.getResolver('findMany'),
  'coder.findDiffsAfterVersion': CoderTC.getResolver('findDiffsAfterVersion'),
  'coder.findDiffsBeforeVersion': CoderTC.getResolver('findDiffsBeforeVersion'),
  'coder.revertToVersion': CoderTC.getResolver('revertToVersion'),
  'coder.mergeDiffs': CoderTC.getResolver('mergeDiffs'),
});

schemaComposer.Mutation.addNestedFields({
  'coder.createOne': CoderTC.getResolver('createOne'),
  'coder.updateById': CoderTC.getResolver('updateById'),
});

const schema = schemaComposer.buildSchema();
export default schema;