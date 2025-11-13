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
import {
  MailListen,
  CustomerDiscover,
  User,
  MailOutbox,
  MailInbox,
} from "@/models";
import {
  MailListenUpdateInput,
  MailListenInput,
  TestMailListenInput,
  MailInboxResult,
  MailOutboxResult,
  MailListenResult,
} from "./types";
// import { AsyncLockManager } from "@/utils/staticClass";
// import { mailListenerStart } from "@/service/mailListener";
import { In, Not, Like } from "typeorm";
import { CommonError } from "@/errors";
import {
  testImapFlowConnection,
  imapFlowStartListenActive,
  imapFlowImportSentMessagesBoxHistory,
} from "@/service/mailImapFlow";

@Resolver()
class MailResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createMailListen(
    @Ctx() ctx: GQLContext,
    @Arg("data")
    dataInput: MailListenInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const exist = await MailListen.findOne({
      where: {
        email: dataInput.email,
      },
    });
    if (exist) {
      throw new CommonError("Email is already exist");
    }
    await MailListen.create({
      ...dataInput,
      organizationId: orgId,
      userId: ctx.req.currentUser.id,
      ownerUserId: ctx.req.currentUser.id,
    }).save();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateMailListen(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("data")
    dataInput: MailListenUpdateInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    if (dataInput.email && dataInput.email !== "") {
      const exist = await MailListen.findOne({
        where: {
          id: Not(id),
          email: dataInput.email,
        },
      });
      if (exist) {
        throw new CommonError("Email is already exist");
      }
    }
    await MailListen.update({ id: id, organizationId: orgId }, dataInput);
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteMailListen(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await MailListen.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    await model.remove();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async batchDeleteMailListen(
    @Ctx() ctx: GQLContext,
    @Arg("ids", () => [Int]) ids: number[]
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    await MailListen.delete({
      id: In(ids),
      organizationId: orgId,
    });
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [MailListen])
  async getMailListens(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<MailListen[]> {
    const orgId = ctx.req.currentUser.organizationId;
    const data = await MailListen.find({
      where: {
        organizationId: orgId,
        userId: ctx.req.currentUser.id,
      },
      relations: ["ownerUser", "ownerUser.department"],
      order: { id: "DESC" },
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 30,
    });
    return data;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async startMailListen(
    // @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    // const user = ctx.req.currentUser;
    const model = await MailListen.findOneOrFail(id);
    const result = await testImapFlowConnection(model);
    if (result !== "success") {
      model.state = "stop";
      model.errInfo = result;
      await model.save();
      return false;
    }
    model.state = "start";
    model.errInfo = "";
    await model.save();
    await imapFlowImportSentMessagesBoxHistory(model);
    // const lock = AsyncLockManager.getInstance();
    // await lock.acquire<boolean>(
    //   `MailListen_${model.organizationId}`,
    //   async (done) => {
    //     try {
    //       if (model.state === "stop") {
    //         model.state = "start";
    //         model.errInfo = "";
    //         await model.save();
    //         mailListenerStart(model);
    //       }
    //       return done(null, true);
    //     } catch (error) {
    //       return done(error as Error);
    //     }
    //   }
    // );
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => MailListen)
  async stopMailListen(
    // @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<MailListen> {
    // const user = ctx.req.currentUser;
    const model = await MailListen.findOneOrFail(id);
    if (model.customerDiscoverId) {
      const exist = await CustomerDiscover.findOne({
        where: { id: model.customerDiscoverId },
      });
      if (exist) {
        exist.enableListen = 0;
        await exist.save();
      }
    }
    model.customerDiscoverId = null;
    model.state = "stop";
    model.errInfo = "";
    //do something;
    await model.save();
    // const lock = AsyncLockManager.getInstance();
    // await lock.acquire<boolean>(
    //   `MailListen_${model.organizationId}`,
    //   async (done) => {
    //     try {
    //       if (model.state === "start") {
    //         model.state = "stop";
    //         model.errInfo = "";
    //         //do something;
    //         await model.save();
    //       }
    //       return done(null, true);
    //     } catch (error) {
    //       return done(error as Error);
    //     }
    //   }
    // );

    return model;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => String)
  async testConnectionMailListen(
    @Arg("data")
    dataInput: TestMailListenInput
  ): Promise<string> {
    const result = await testImapFlowConnection(dataInput);
    return result;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => String)
  async refreshConnectionMailListen(
    // @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<string> {
    // const orgId = ctx.req.currentUser.organizationId;
    const model = await MailListen.findOneOrFail({
      where: {
        id: id,
        // organizationId: orgId,
      },
    });
    const result = await imapFlowStartListenActive(model);
    return result;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async bindingMailOwner(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("userId", () => String, { nullable: true }) userId: string
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;

    const model = await MailListen.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    if (userId && userId.trim() !== "") {
      const user = await User.findOneOrFail({
        where: {
          id: userId,
          organizationId: orgId,
        },
      });
      model.ownerUserId = user.id;
    } else {
      model.ownerUserId = null;
    }
    await model.save();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async batchBindingMailOwner(
    @Ctx() ctx: GQLContext,
    @Arg("ids", () => [Int]) ids: number[],
    @Arg("userId", () => String, { nullable: true }) userId: string
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;

    const models = await MailListen.find({
      where: {
        id: In(ids),
        organizationId: orgId,
      },
    });

    if (userId && userId.trim() !== "") {
      const user = await User.findOneOrFail({
        where: {
          id: userId,
          organizationId: orgId,
        },
      });
      for (const model of models) {
        model.ownerUserId = user.id;
        await model.save();
      }
    } else {
      for (const model of models) {
        model.ownerUserId = null;
        await model.save();
      }
    }
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [MailListen])
  async getOwnerMailListens(@Ctx() ctx: GQLContext): Promise<MailListen[]> {
    const user = ctx.req.currentUser;
    if (user.role === 1) {
      const mailListens = await MailListen.find({
        where: {
          organizationId: user.organizationId,
        },
        relations: ["ownerUser", "ownerUser.department"],
      });
      return mailListens;
    }
    const mailListens = await MailListen.find({
      where: {
        ownerUserId: user.id,
      },
      relations: ["ownerUser", "ownerUser.department"],
    });
    return mailListens;
  }
  
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => MailOutboxResult)
  async getOwnerMailOutboxs(
    @Ctx() ctx: GQLContext,
    @Arg("mailListenId", () => Int) mailListenId: number,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number,
    @Arg("search", () => String, { nullable: true }) search: string
  ): Promise<MailOutboxResult> {
    const user = ctx.req.currentUser;
    let mailListen;
    if (user.role === 1) {
      mailListen = await MailListen.findOneOrFail({
        where: {
          id: mailListenId,
          organizationId: user.organizationId,
        },
      });
    } else {
      mailListen = await MailListen.findOneOrFail({
        where: {
          id: mailListenId,
          ownerUserId: user.id,
        },
      });
    }

    let input: any = {
      from: mailListen.email,
      organizationId: user.organizationId,
    };

    if (search && search.trim() !== "") {
      input = [
        {
          from: mailListen.email,
          organizationId: user.organizationId,
          subject: Like(`%${search}%`),
        },
        {
          from: mailListen.email,
          organizationId: user.organizationId,
          text: Like(`%${search}%`),
        },
      ];
    }
    const [mailOutBoxs, total] = await MailOutbox.findAndCount({
      where: input,
      order: { id: "DESC" },
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 30,
    });

    const res = new MailOutboxResult();
    res.result = mailOutBoxs;
    res.total = total;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => MailInboxResult)
  async getOwnerMailInboxs(
    @Ctx() ctx: GQLContext,
    @Arg("mailListenId", () => Int) mailListenId: number,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number,
    @Arg("search", () => String, { nullable: true }) search: string
  ): Promise<MailInboxResult> {
    const user = ctx.req.currentUser;
    let mailListen;
    if (user.role === 1) {
      mailListen = await MailListen.findOneOrFail({
        where: {
          id: mailListenId,
          organizationId: user.organizationId,
        },
      });
    } else {
      mailListen = await MailListen.findOneOrFail({
        where: {
          id: mailListenId,
          ownerUserId: user.id,
        },
      });
    }

    let input: any = {
      to: mailListen.email,
      organizationId: user.organizationId,
    };

    if (search && search.trim() !== "") {
      input = [
        {
          to: mailListen.email,
          organizationId: user.organizationId,
          subject: Like(`%${search}%`),
        },
        {
          to: mailListen.email,
          organizationId: user.organizationId,
          text: Like(`%${search}%`),
        },
      ];
    }
    const [mailOutBoxs, total] = await MailInbox.findAndCount({
      where: input,
      order: { id: "DESC" },
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 30,
    });

    const res = new MailInboxResult();
    res.result = mailOutBoxs;
    res.total = total;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => MailListenResult)
  async getManageMailListens(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true }) skip: number,
    @Arg("take", () => Int, { nullable: true }) take: number,
    @Arg("departmentId", () => Int, { nullable: true }) departmentId: number,
    @Arg("userName", () => String, { nullable: true }) userName: string
  ): Promise<MailListenResult> {
    const orgId = ctx.req.currentUser.organizationId;

    const query = MailListen.createQueryBuilder("mailListen")
      .leftJoinAndSelect("mailListen.ownerUser", "user")
      .leftJoinAndSelect("user.department", "department")
      .where("mailListen.organizationId = :orgId", { orgId });

    if (userName) {
      query.andWhere("user.name LIKE :userName", { userName: `%${userName}%` });
    }

    if (departmentId) {
      query.andWhere("department.id = :departmentId", { departmentId });
    }

    query
      .orderBy("mailListen.id", "DESC")
      .skip(Number.isFinite(skip) ? skip : 0)
      .take(Number.isFinite(take) ? take : 30);

    const [mailListens, total] = await query.getManyAndCount();

    const res = new MailListenResult();
    res.result = mailListens;
    res.total = total;
    return res;
  }
}

export default MailResolver;
