import { isAuth } from './isAuthMiddleware';
import { createAccessToken, createRefreshToken } from './helpers';
import { User } from './entity/User';
import {
  Resolver,
  Query,
  Mutation,
  Arg,
  ObjectType,
  Field,
  Ctx,
  UseMiddleware,
} from 'type-graphql';
import { hash, compare } from 'bcryptjs';
import { MyContext } from './contextType';

@ObjectType()
class LoginResponse {
  @Field()
  accessToken: string;
}

@Resolver()
export class UserResolver {
  @Query(() => [User])
  users() {
    return User.find();
  }

  @Query(() => String)
  @UseMiddleware(isAuth)
  bye(@Ctx() { payload }: MyContext) {
    return `User id ${payload?.userId}`;
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg('email', () => String) email: string,
    @Arg('password', () => String) password: string,
    @Ctx() { res }: MyContext
  ): Promise<LoginResponse> {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Could not find user');
    }

    const valid = await compare(password, user.password);
    if (!valid) {
      throw new Error('Incorrect password');
    }

    res.cookie('jid', createRefreshToken(user), { httpOnly: true });

    return {
      accessToken: createAccessToken(user),
    };
  }

  @Mutation(() => Boolean)
  async register(
    @Arg('email', () => String) email: string,
    @Arg('password', () => String) password: string
  ) {
    const hashedPassword = await hash(password, 12);

    try {
      await User.insert({
        email,
        password: hashedPassword,
      });

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}

export default UserResolver;
