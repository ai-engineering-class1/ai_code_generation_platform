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
import { AiReports } from "@/models";
import { AiReportsResult, AiReportsInput } from "./types";
//   import { In, Like } from "typeorm";

@Resolver()
class AiReportsResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createAiReports(
    @Ctx() ctx: GQLContext,
    @Arg("data") dataInput: AiReportsInput
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;

    const existModel = await AiReports.findOne({
      where: {
        session_id: dataInput.session_id,
        organizationId: user.organizationId,
      },
    });
    if (existModel) {
      return true;
    }
    await AiReports.create({
      ...dataInput,
      organizationId: user.organizationId,
      user_id: user.id,
    }).save();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateAiReports(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("data") dataInput: AiReportsInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    await AiReports.update({ id: id, organizationId: orgId }, dataInput);
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteAiReports(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await AiReports.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    await model.remove();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => AiReportsResult)
  async getAiReports(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<AiReportsResult> {
    const orgId = ctx.req.currentUser.organizationId;
    let input: any = {
      organizationId: orgId,
    };
    const [data, count] = await AiReports.findAndCount({
      where: input,
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 30,
    });
    const res = new AiReportsResult();
    res.result = data;
    res.total = count;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => AiReportsResult)
  async getAiReportsByUser(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<AiReportsResult> {
    const user = ctx.req.currentUser;
    let input: any = {
      organizationId: user.organizationId,
      user_id: user.id,
    };
    const [data, count] = await AiReports.findAndCount({
      where: input,
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 30,
    });
    const res = new AiReportsResult();
    res.result = data;
    res.total = count;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => AiReports)
  async getAiReportsDetail(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<AiReports> {
    const orgId = ctx.req.currentUser.organizationId;
    const data = await AiReports.findOneOrFail({
      where: {
        organizationId: orgId,
        id: id,
      },
    });
    return data;
  }
}

export default AiReportsResolver;
