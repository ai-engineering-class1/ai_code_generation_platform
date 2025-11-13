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
import { EmailApproval, User } from "@/models";
import {
  EmailApprovalInput,
  EmailApprovalResult,
  EmailApprovalStateInput,
} from "./types";
//   import { In, Like } from "typeorm";

@Resolver()
class EmailApprovalResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createEmailApproval(
    @Ctx() ctx: GQLContext,
    @Arg("data") dataInput: EmailApprovalInput
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    await EmailApproval.create({
      ...dataInput,
      organizationId: user.organizationId,
      currentUserId: user.id,
    }).save();
    return true;
  }

  //   @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  //   @Mutation(() => Boolean)
  //   async updateAiReports(
  //     @Ctx() ctx: GQLContext,
  //     @Arg("id", () => Int) id: number,
  //     @Arg("data") dataInput: AiReportsInput
  //   ): Promise<Boolean> {
  //     const orgId = ctx.req.currentUser.organizationId;
  //     await AiReports.update({ id: id, organizationId: orgId }, dataInput);
  //     return true;
  //   }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async setEmailApprovalState(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("data") dataInput: EmailApprovalStateInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await EmailApproval.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    console.log(dataInput);
    model.state = dataInput.state;
    model.opinion = dataInput.opinion;
    await model.save();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => EmailApprovalResult)
  async getEmailApprovals(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<EmailApprovalResult> {
    const orgId = ctx.req.currentUser.organizationId;
    let input: any = {
      organizationId: orgId,
    };
    const [data, count] = await EmailApproval.findAndCount({
      where: input,
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 30,
    });
    const res = new EmailApprovalResult();
    res.result = data;
    res.total = count;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => EmailApprovalResult)
  async getEmailApprovalsByApprovalUser(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<EmailApprovalResult> {
    const user = ctx.req.currentUser;
    let input: any = {
      organizationId: user.organizationId,
      approvalUserId: user.id,
    };
    const [data, count] = await EmailApproval.findAndCount({
      where: input,
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 30,
    });
    const res = new EmailApprovalResult();
    res.result = data;
    res.total = count;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => EmailApprovalResult)
  async getEmailApprovalsBySubmitUser(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<EmailApprovalResult> {
    const user = ctx.req.currentUser;
    let input: any = {
      organizationId: user.organizationId,
      currentUserId: user.id,
    };
    const [data, count] = await EmailApproval.findAndCount({
      where: input,
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 30,
    });
    const res = new EmailApprovalResult();
    res.result = data;
    res.total = count;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => Int)
  async getEmailApprovalsBytargetCustomerAnalysisId(
    @Ctx() ctx: GQLContext,
    @Arg("targetCustomerAnalysisId", () => Int)
    targetCustomerAnalysisId: number
  ): Promise<number> {
    const user = ctx.req.currentUser;
    let input: any = {
      organizationId: user.organizationId,
      targetCustomerAnalysisId: targetCustomerAnalysisId,
      state: "waiting",
    };
    const res = await EmailApproval.findOne({
      where: input,
    });
    if (!res) {
      return 0;
    }
    return res.id;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => User)
  async getEmailApprovalLeaderUser(@Ctx() ctx: GQLContext): Promise<User> {
    const user = await User.findOneOrFail({
      where: {
        id: ctx.req.currentUser.id,
      },
      relations: ["department", "department.leaderUser"],
    });
    if (user.departmentId) {
      return user.department.leaderUser;
    }
    const admin = await User.findOneOrFail({
      where: {
        organizationId: user.organizationId,
        role: 1,
      },
    });
    return admin;
  }
}

export default EmailApprovalResolver;
