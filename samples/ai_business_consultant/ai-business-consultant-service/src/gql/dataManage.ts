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
import { IsAuth } from "@/middlewares/isAuth";
import { ErrorInterceptor, ResolveTime } from "@/middlewares";
import { DataManage, DataAPIManage } from "@/models";
import {
  DataManageUpdateInput,
  DataManageInput,
  DataAPIManageUpdateInput,
  DataAPIManageInput,
} from "./types";

@Resolver()
class DataManageResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createDataManage(
    @Ctx() ctx: GQLContext,
    @Arg("dataManage")
    dataManageInput: DataManageInput
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    await DataManage.create({
      ...dataManageInput,
      organizationId: user.organizationId,
      userId: user.id,
    }).save();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateDataManage(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("dataManage")
    dataManageInput: DataManageUpdateInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    await DataManage.update({ id: id, organizationId: orgId }, dataManageInput);
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteDataManage(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await DataManage.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    await model.remove();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [DataManage])
  async getDataManages(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<DataManage[]> {
    const orgId = ctx.req.currentUser.organizationId;
    const data = await DataManage.find({
      where: {
        organizationId: orgId,
      },
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 30,
    });
    return data;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createDataAPIManage(
    @Ctx() ctx: GQLContext,
    @Arg("data")
    dataInput: DataAPIManageInput
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    await DataAPIManage.create({
      ...dataInput,
      organizationId: user.organizationId,
      userId: user.id,
    }).save();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateDataAPIManage(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("data")
    dataInput: DataAPIManageUpdateInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    await DataAPIManage.update({ id: id, organizationId: orgId }, dataInput);
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteDataAPIManage(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await DataAPIManage.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    await model.remove();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [DataAPIManage])
  async getDataAPIManages(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<DataAPIManage[]> {
    const orgId = ctx.req.currentUser.organizationId;
    const data = await DataAPIManage.find({
      where: {
        organizationId: orgId,
      },
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 30,
    });
    return data;
  }
}

export default DataManageResolver;
