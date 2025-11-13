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
import { NegotiationAssistant } from "@/models";
import {
  NegotiationAssistantInput,
  NegotiationAssistantResult,
  NegotiationPreparationInput,
  TradeStatisticsInput,
} from "./types";

@Resolver()
class NegotiationAssistantResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createNegotiationAssistant(
    @Ctx() ctx: GQLContext,
    @Arg("data") dataInput: NegotiationAssistantInput
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    await NegotiationAssistant.create({
      ...dataInput,
      organizationId: user.organizationId,
      userId: user.id,
    }).save();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateNegotiationAssistant(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("data") dataInput: NegotiationAssistantInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    await NegotiationAssistant.update(
      { id: id, organizationId: orgId },
      dataInput
    );
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteNegotiationAssistant(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await NegotiationAssistant.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    await model.remove();
    return true;
  }

  // @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  // @Query(() => NegotiationAssistantResult)
  // async getNegotiationAssistants(
  //   @Ctx() ctx: GQLContext,
  //   @Arg("skip", () => Int, { nullable: true })
  //   skip: number,
  //   @Arg("take", () => Int, { nullable: true })
  //   take: number,
  //   @Arg("search", () => String, { nullable: true })
  //   search: string
  // ): Promise<NegotiationAssistantResult> {
  //   const orgId = ctx.req.currentUser.organizationId;

  //   const queryBuilder = NegotiationAssistant.createQueryBuilder(
  //     "assistant"
  //   ).where("assistant.organizationId = :orgId", { orgId });

  //   if (search && search.trim() !== "") {
  //     queryBuilder.andWhere("assistant.name LIKE :name", { name: `%${search}%` });
  //   }

  //   if (search && search.trim() !== "") {
  //     queryBuilder.orWhere("assistant.product LIKE :product", {
  //       product: `%${search}%`,
  //     });
  //   }

  //   const [data, count] = await queryBuilder
  //     .skip(Number.isFinite(skip) ? skip : 0)
  //     .take(Number.isFinite(take) ? take : 30)
  //     .orderBy("assistant.id", "DESC")
  //     .getManyAndCount();
  //   const res = new NegotiationAssistantResult();
  //   res.result = data;
  //   res.total = count;
  //   return res;
  // }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => NegotiationAssistantResult)
  async getNegotiationAssistants(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true }) skip: number,
    @Arg("take", () => Int, { nullable: true }) take: number,
    @Arg("search", () => String, { nullable: true }) search: string
  ): Promise<NegotiationAssistantResult> {
    const user = ctx.req.currentUser;

    // 子查询：找出每个 targetCustomerAnalysisId 下 id 最大的记录
    const subQuery = NegotiationAssistant.createQueryBuilder("sub")
      .select("MAX(sub.id)", "maxId")
      .where("sub.organizationId = :orgId", { orgId: user.organizationId })
      .andWhere("sub.userId = :userId", { userId: user.id })
      .andWhere("sub.targetCustomerAnalysisId IS NOT NULL")
      .groupBy("sub.targetCustomerAnalysisId");

    // 主查询：用子查询结果筛选出目标数据
    const queryBuilder = NegotiationAssistant.createQueryBuilder("assistant")
      .where(`assistant.id IN (${subQuery.getQuery()})`)
      .setParameters(subQuery.getParameters());

    if (search?.trim()) {
      queryBuilder.andWhere(
        "(assistant.name LIKE :search OR assistant.product LIKE :search)",
        { search: `%${search}%` }
      );
    }

    const [data, count] = await queryBuilder
      .orderBy("assistant.id", "DESC")
      .skip(Number.isFinite(skip) ? skip : 0)
      .take(Number.isFinite(take) ? take : 30)
      .getManyAndCount();

    const res = new NegotiationAssistantResult();
    res.result = data;
    res.total = count;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => NegotiationAssistant)
  async getNegotiationAssistantInfo(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<NegotiationAssistant> {
    const orgId = ctx.req.currentUser.organizationId;

    const model = await NegotiationAssistant.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });

    return model;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Int)
  async analysisNegotiationPreparation(
    @Ctx() ctx: GQLContext,
    @Arg("data") dataInput: NegotiationPreparationInput
  ): Promise<number> {
    const orgId = ctx.req.currentUser.organizationId;
    console.log(orgId);
    console.log(dataInput);
    return 1;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Int)
  async analysisNegotiationStrategy(
    @Ctx() ctx: GQLContext,
    @Arg("strategy", () => String) strategy: string
  ): Promise<number> {
    const orgId = ctx.req.currentUser.organizationId;
    console.log(orgId);
    console.log(strategy);
    return 1;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Int)
  async analysisTradeStatistics(
    @Ctx() ctx: GQLContext,
    @Arg("data") dataInput: TradeStatisticsInput
  ): Promise<number> {
    const orgId = ctx.req.currentUser.organizationId;
    console.log(orgId);
    console.log(dataInput);
    return 1;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Int)
  async analysisNegotiationAssistant(
    @Ctx() ctx: GQLContext,
    @Arg("text", () => String) text: string
  ): Promise<number> {
    const orgId = ctx.req.currentUser.organizationId;
    console.log(orgId);
    console.log(text);
    return 1;
  }
}

export default NegotiationAssistantResolver;
