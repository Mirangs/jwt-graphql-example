import { MyContext } from './contextType.d';
import { MiddlewareFn } from 'type-graphql/dist/interfaces/Middleware';
import { verify } from 'jsonwebtoken';

export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
  const authorization = context.req.header('Authorization');

  if (!authorization) {
    throw new Error('Not authenticated');
  }

  try {
    const token = authorization.split(' ')[1];
    const payload = verify(token, process.env.ACCESS_TOKEN_SECRET!);
    context.payload = payload as any;
  } catch (err) {
    console.error(err);
    throw new Error('Not authenticated');
  }

  return next();
};
