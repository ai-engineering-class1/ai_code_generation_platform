import {
  Resolver,
  Mutation,
  Arg,
  UseMiddleware,
  Int,
  Query,
  Ctx,
} from "type-graphql";

import { GQLContext } from "@/types/context";
import { IsAdminAuth, IsAuth } from "@/middlewares/isAuth";
import { ErrorInterceptor, ResolveTime } from "@/middlewares";
import { UserRole } from "@/models";
import { UserRoleInput } from "./types";

@Resolver()
class UserRoleResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createUserRole(
    @Ctx() ctx: GQLContext,
    @Arg("userRole") userRoleInput: UserRoleInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    await UserRole.create({
      ...userRoleInput,
      organizationId: orgId,
    }).save();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateUserRole(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("userRole") userRoleInput: UserRoleInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    await UserRole.update({ id: id, organizationId: orgId }, userRoleInput);
    return true;
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteUserRole(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await UserRole.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    await model.remove();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [UserRole])
  async getUserRoles(@Ctx() ctx: GQLContext): Promise<UserRole[]> {
    const orgId = ctx.req.currentUser.organizationId;
    const data = await UserRole.find({
      organizationId: orgId,
    });
    return data;
  }
}

export default UserRoleResolver;
