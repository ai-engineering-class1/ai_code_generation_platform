import { Resolver, Query, UseMiddleware } from "type-graphql";
import { ErrorInterceptor } from "@/middlewares/errorInterceptor";
// import { signToken } from "@/utils/authToken";

@Resolver()
class AuthResolver {
  @UseMiddleware([ErrorInterceptor])
  @Query(() => String)
  async createGuestAccount(): Promise<string> {
    return "guest";//signToken({ sub: user.id });
  }
}

export default AuthResolver;
