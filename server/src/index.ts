import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { UserResolver } from './UserResolver';
import { createConnection } from 'typeorm';
import { MyContext } from './contextType.d';

(async () => {
  const app = express();

  await createConnection();

  app.get('/', (_, res) => {
    res.send('Hello world');
  });

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver],
    }),
    context: ({ req, res }): MyContext => ({ req, res }),
  });

  apolloServer.applyMiddleware({ app });

  app.listen(4000, () =>
    console.log('Server is started on http://localhost:4000')
  );
})();
