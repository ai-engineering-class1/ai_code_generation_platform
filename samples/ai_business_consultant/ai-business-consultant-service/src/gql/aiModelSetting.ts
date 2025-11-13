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
  import { AiModelSetting } from "@/models";
  import { AiModelSettingUpdateInput, AiModelSettingInput } from "./types";
  
  @Resolver()
  class AiModelSettingResolver {
    @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
    @Mutation(() => Boolean)
    async createAiModelSetting(
      @Ctx() ctx: GQLContext,
      @Arg("aiModelSetting")
      aiModelSettingInput: AiModelSettingInput
    ): Promise<Boolean> {
      const orgId = ctx.req.currentUser.organizationId;
      await AiModelSetting.create({
        ...aiModelSettingInput,
        organizationId: orgId,
      }).save();
      return true;
    }
  
    @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
    @Mutation(() => Boolean)
    async updateAiModelSetting(
      @Ctx() ctx: GQLContext,
      @Arg("id", () => Int) id: number,
      @Arg("aiModelSetting")
      aiModelSettingInput: AiModelSettingUpdateInput
    ): Promise<Boolean> {
      const orgId = ctx.req.currentUser.organizationId;
      await AiModelSetting.update({ id: id, organizationId: orgId }, aiModelSettingInput);
      return true;
    }
  
    @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
    @Mutation(() => Boolean)
    async deleteAiModelSetting(
      @Ctx() ctx: GQLContext,
      @Arg("id", () => Int) id: number
    ): Promise<Boolean> {
      const orgId = ctx.req.currentUser.organizationId;
      const model = await AiModelSetting.findOneOrFail({
        where: {
          id: id,
          organizationId: orgId,
        },
      });
      await model.remove();
      return true;
    }
  
    @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
    @Query(() => [AiModelSetting])
    async getAiModelSettings(
      @Ctx() ctx: GQLContext,
      @Arg("skip", () => Int, { nullable: true })
      skip: number,
      @Arg("take", () => Int, { nullable: true })
      take: number
    ): Promise<AiModelSetting[]> {
      const orgId = ctx.req.currentUser.organizationId;
      const data = await AiModelSetting.find({
        where: {
          organizationId: orgId,
        },
        skip: Number.isFinite(skip) ? skip : 0,
        take: Number.isFinite(take) ? take : 30,
      });
      return data;
    }
  }
  
  export default AiModelSettingResolver;
  