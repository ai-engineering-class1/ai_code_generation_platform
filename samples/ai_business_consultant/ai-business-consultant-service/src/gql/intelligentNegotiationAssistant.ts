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
import { IntelligentNegotiationAssistant } from "@/models";
import {
  IntelligentNegotiationAssistantUpdateInput,
  IntelligentNegotiationAssistantInput,
  IntelligentNegotiationAssistantResult
} from "./types";

@Resolver()
class IntelligentNegotiationAssistantResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createIntelligentNegotiationAssistant(
    @Ctx() ctx: GQLContext,
    @Arg("data") dataInput: IntelligentNegotiationAssistantInput
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    await IntelligentNegotiationAssistant.create({
      ...dataInput,
      organizationId: user.organizationId,
      userId: user.id,
    }).save();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateIntelligentNegotiationAssistant(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("data") dataInput: IntelligentNegotiationAssistantUpdateInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    await IntelligentNegotiationAssistant.update(
      { id: id, organizationId: orgId },
      dataInput
    );
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteIntelligentNegotiationAssistant(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await IntelligentNegotiationAssistant.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    await model.remove();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => IntelligentNegotiationAssistantResult)
  async getIntelligentNegotiationAssistants(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<IntelligentNegotiationAssistantResult> {
    const orgId = ctx.req.currentUser.organizationId;
    const [data,count] = await IntelligentNegotiationAssistant.findAndCount({
      where: {
        organizationId: orgId,
      },
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 30,
    });
    const res = new IntelligentNegotiationAssistantResult();
    res.result = data;
    res.total = count;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => IntelligentNegotiationAssistant)
  async getIntelligentNegotiationAssistantsDetail(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<IntelligentNegotiationAssistant> {
    const orgId = ctx.req.currentUser.organizationId;
    const data = await IntelligentNegotiationAssistant.findOneOrFail({
      where: {
        organizationId: orgId,
        id: id,
      },
    });
    return data;
  }
}

export default IntelligentNegotiationAssistantResolver;
