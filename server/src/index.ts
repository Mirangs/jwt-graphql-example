import { sendRefreshToken } from "./sendRefreshToken";
import { createAccessToken, createRefreshToken } from "./helpers";
import { verify } from "jsonwebtoken";
import "reflect-metadata";
import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./UserResolver";
import { createConnection } from "typeorm";
import { MyContext } from "./contextType.d";
import { User } from "./entity/User";

(async () => {
  const app = express();

  app.use(cookieParser());

  await createConnection();

  app.get("/", (_, res) => {
    res.send("Hello world");
  });

  app.post("/refresh_token", async (req, res) => {
    const token = req.cookies.jid;
    if (!token) {
      return res.json({ ok: false, accessToken: "" });
    }

    let payload: any;
    try {
      payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
    } catch (err) {
      console.error(err);
      return res.json({ ok: false, accessToken: "" });
    }

    const user = await User.findOne({ id: payload.userId });
    if (!user) {
      return res.json({ ok: false, accessToken: "" });
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      return res.json({ ok: false, accessToken: "" });
    }

    sendRefreshToken(res, createRefreshToken(user));

    return res.json({ ok: true, accessToken: createAccessToken(user) });
  });

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver],
    }),
    context: ({ req, res }): MyContext => ({ req, res }),
  });

  apolloServer.applyMiddleware({ app });

  app.listen(4000, () =>
    console.log("Server is started on http://localhost:4000")
  );
})();
