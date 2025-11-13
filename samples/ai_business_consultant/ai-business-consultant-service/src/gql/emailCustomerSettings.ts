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
  CustomerRecord,
  CustomerDiscover,
  MailListen,
  MailInbox,
} from "@/models";
import {
  CustomerRecordResult,
  CustomerDiscoverFromActiveInput,
  CustomerDiscoverFromHistoryInput,
  CustomerRecordUpdateInput,
  MailInboxResult,
} from "./types";
import { CommonError } from "@/errors";
// import { AsyncLockManager } from "@/utils/staticClass";
// import { mailListenerStart, getEmailHistory } from "@/service/mailListener";
import {
  imapFlowStartListenHistory,
  testImapFlowConnection,
  // imapFlowStartListenActive,
} from "@/service/mailImapFlow";
import { In } from "typeorm";
import { createCustomerRecord } from "@/service/mailImapFlow";

@Resolver()
class EmailCustomerSettingsResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createCustomerDiscoverFromActive(
    @Ctx() ctx: GQLContext,
    @Arg("data") dataInput: CustomerDiscoverFromActiveInput
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    const model = await MailListen.findOne({
      where: {
        id: dataInput.mailListenId,
        organizationId: user.organizationId,
        userId: user.id,
      },
    });
    if (!model) {
      throw new CommonError("Invalid mailListenId");
    }
    // if (dataInput.enableListen === 1) {
    //   const exist = await CustomerDiscover.findOne({
    //     where: {
    //       mailListenId: dataInput.mailListenId,
    //       type: 1,
    //       enableListen: 1,
    //     },
    //   });
    //   if (exist) {
    //     throw new CommonError("The email has already been used");
    //   }
    // }

    const res = await CustomerDiscover.create({
      ...dataInput,
      organizationId: user.organizationId,
      type: 1,
      userId: ctx.req.currentUser.id,
    }).save();
    // const lock = AsyncLockManager.getInstance();
    if (dataInput.enableListen === 1) {
      model.customerDiscoverId = res.id;
      model.state = "start";
      model.errInfo = "";
      await model.save();
    } else {
      model.customerDiscoverId = null;
      await model.save();
    }
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createCustomerDiscoverFromHistory(
    @Ctx() ctx: GQLContext,
    @Arg("data") dataInput: CustomerDiscoverFromHistoryInput
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    const model = await MailListen.findOne({
      where: {
        id: dataInput.mailListenId,
        organizationId: user.organizationId,
        userId: user.id,
      },
    });
    if (!model) {
      throw new CommonError("Invalid mailListenId");
    }
    await CustomerDiscover.create({
      ...dataInput,
      organizationId: user.organizationId,
      type: 2,
      userId: user.id,
    }).save();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateCustomerDiscoverFromActive(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("data") dataInput: CustomerDiscoverFromActiveInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    // if (dataInput.enableListen === 1) {
    //   const exist = await CustomerDiscover.findOne({
    //     where: {
    //       id: Not(id),
    //       mailListenId: dataInput.mailListenId,
    //       type: 1,
    //       enableListen: 1,
    //     },
    //   });
    //   if (exist) {
    //     throw new CommonError("The email has already been used");
    //   }
    // }

    const model = await MailListen.findOne({
      where: {
        id: dataInput.mailListenId,
        organizationId: orgId,
      },
    });
    if (!model) {
      throw new CommonError("Invalid mailListenId");
    }
    await CustomerDiscover.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
        type: 1,
      },
    });
    await CustomerDiscover.update(id, dataInput);

    // const lock = AsyncLockManager.getInstance();
    if (dataInput.enableListen === 1) {
      model.customerDiscoverId = id;
      model.state = "start";
      model.errInfo = "";
      await model.save();
    } else {
      model.customerDiscoverId = null;
      // model.state = "stop";
      // model.errInfo = "";
      await model.save();
    }
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateCustomerDiscoverFromHistory(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("data") dataInput: CustomerDiscoverFromHistoryInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const mailListen = await MailListen.findOneOrFail({
      where: {
        id: dataInput.mailListenId,
        organizationId: orgId,
      },
    });
    await CustomerDiscover.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
        type: 2,
      },
    });
    await CustomerDiscover.update(id, dataInput);
    // const model = await CustomerDiscover.findOneOrFail(id);

    // getEmailHistory(mailListen, model);
    const res = await testImapFlowConnection(mailListen);
    if (res !== "success") {
      throw new CommonError(res);
    }

    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteCustomerDiscover(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await CustomerDiscover.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    await model.remove();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [CustomerDiscover])
  async getCustomerDiscovers(
    @Ctx() ctx: GQLContext,
    @Arg("type", () => Int) type: number
  ): Promise<CustomerDiscover[]> {
    const user = ctx.req.currentUser;
    const res = await CustomerDiscover.find({
      where: {
        organizationId: user.organizationId,
        type: type,
        userId: user.id,
      },
    });
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async scanCustomerDiscoverFromHistory(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await CustomerDiscover.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
        type: 2,
      },
    });
    const mailListen = await MailListen.findOneOrFail({
      where: {
        id: model.mailListenId,
        organizationId: orgId,
      },
    });

    const res = await testImapFlowConnection(mailListen);
    if (res !== "success") {
      throw new CommonError(res);
    }
    // getEmailHistory(mailListen, model);
    setImmediate(async () => {
      try {
        await imapFlowStartListenHistory(mailListen, model);
        console.log("任务完成");
      } catch (err) {
        console.error("任务失败", err);
      }
    });

    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async switchCustomerDiscoverFromActive(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const exist = await CustomerDiscover.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
        type: 1,
      },
    });
    const model = await MailListen.findOneOrFail({
      where: {
        id: exist.mailListenId,
        organizationId: orgId,
      },
    });
    exist.enableListen = exist.enableListen === 1 ? 0 : 1;
    // if (exist.enableListen === 1) {
    //   const startExist = await CustomerDiscover.findOne({
    //     where: {
    //       mailListenId: exist.mailListenId,
    //       enableListen: 1,
    //       type: 1,
    //     },
    //   });
    //   if (startExist) {
    //     throw new CommonError("The email has already been used");
    //   }
    // }
    await exist.save();
    // const lock = AsyncLockManager.getInstance();
    if (exist.enableListen === 1) {
      model.customerDiscoverId = id;
      model.state = "start";
      model.errInfo = "";
      await model.save();
    } else {
      model.customerDiscoverId = null;
      // model.state = "stop";
      // model.errInfo = "";
      await model.save();
    }

    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => CustomerRecordResult)
  async getCustomerRecords(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true }) skip: number,
    @Arg("take", () => Int, { nullable: true }) take: number,
    @Arg("name", () => String, { nullable: true }) name: string,
    @Arg("source", () => String, { nullable: true }) source: string,
    @Arg("customerDiscoverId", () => Int, { nullable: true })
    customerDiscoverId: number
  ): Promise<CustomerRecordResult> {
    const user = ctx.req.currentUser;

    const queryBuilder = CustomerRecord.createQueryBuilder("target").where(
      "target.organizationId = :orgId",
      { orgId: user.organizationId }
    );

    queryBuilder.andWhere("target.userId = :userId", { userId: user.id });

    if (name && name.trim() !== "") {
      queryBuilder.andWhere("target.name LIKE :name", { name: `%${name}%` });
    }

    if (name && name.trim() !== "") {
      queryBuilder.orWhere("target.company LIKE :company", {
        company: `%${name}%`,
      });
    }

    if (source && source.trim() !== "") {
      queryBuilder.andWhere("target.source = :source", {
        source: source,
      });
    }

    if (customerDiscoverId && customerDiscoverId > 0) {
      queryBuilder.andWhere("target.customerDiscoverId = :customerDiscoverId", {
        customerDiscoverId: customerDiscoverId,
      });
    }

    const [data, count] = await queryBuilder
      .skip(Number.isFinite(skip) ? skip : 0)
      .take(Number.isFinite(take) ? take : 30)
      .orderBy("id", "DESC")
      .getManyAndCount();

    const res = new CustomerRecordResult();
    res.result = data;
    res.total = count;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateCustomerRecord(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("data")
    dataInput: CustomerRecordUpdateInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    await CustomerRecord.update({ id: id, organizationId: orgId }, dataInput);
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteCustomerRecord(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await CustomerRecord.findOneOrFail({
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
  async batchDeleteCustomerRecords(
    @Ctx() ctx: GQLContext,
    @Arg("ids", () => [Int]) ids: number[]
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const models = await CustomerRecord.findOneOrFail({
      where: {
        id: In(ids),
        organizationId: orgId,
      },
    });
    await CustomerRecord.remove(models);
    // await model.remove();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => CustomerRecord)
  async getCustomerRecordDetail(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<CustomerRecord> {
    const orgId = ctx.req.currentUser.organizationId;
    const data = await CustomerRecord.findOneOrFail({
      where: {
        organizationId: orgId,
        id: id,
      },
    });

    return data;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => CustomerDiscover)
  async getCustomerDiscoverDetail(
    @Ctx() ctx: GQLContext,
    @Arg("type", () => Int) type: number
  ): Promise<CustomerDiscover> {
    const user = ctx.req.currentUser;
    if (type !== 1 && type !== 2) {
      throw new CommonError("Invalid type");
    }
    const exist = await CustomerDiscover.findOne({
      where: {
        organizationId: user.organizationId,
        type: type,
        userId: user.id,
      },
    });
    if (!exist) {
      if (type === 1) {
        const model = CustomerDiscover.create({
          organizationId: user.organizationId,
          type: type,
          enableListen: 1,
          titleFilter: "",
          aiPrompt: "",
          exceptEmails: "",
          userId: user.id,
        }).save();
        return model;
      } else {
        const model = CustomerDiscover.create({
          organizationId: user.organizationId,
          type: type,
          titleFilter: "",
          aiPrompt: "",
          userId: user.id,
        }).save();
        return model;
      }
    }

    return exist;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => MailInboxResult)
  async getCustomerDiscoverEmails(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true }) skip: number,
    @Arg("take", () => Int, { nullable: true }) take: number,
    @Arg("id", () => Int) id: number
  ): Promise<MailInboxResult> {
    const orgId = ctx.req.currentUser.organizationId;
    const [data, count] = await MailInbox.findAndCount({
      where: {
        organizationId: orgId,
        customerDiscoverId: id,
      },
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 30,
    });
    const res = new MailInboxResult();
    res.result = data;
    res.total = count;
    return res;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async fillDataToCustomerFromMailInbox(
    // @Ctx() ctx: GQLContext,
    @Arg("source", () => String) source: string,
    @Arg("mailInBoxId", () => Int) mailInBoxId: number,
    @Arg("customerDiscoverId", () => Int) customerDiscoverId: number
  ): Promise<Boolean> {
    const mail = await MailInbox.findOneOrFail(mailInBoxId);
    const customer = await CustomerDiscover.findOneOrFail(customerDiscoverId);
    const mailInput = {
      text: mail.text,
      subject: mail.subject,
      date: mail.receiveTime,
    };

    const res = await createCustomerRecord(source, mailInput, customer);
    console.log(res);
    if (res && res > 0) {
      mail.targetCustomerAnalysisId = res;
      mail.customerDiscoverId = customerDiscoverId;
      await mail.save();
    }
    return true;
  }
}

export default EmailCustomerSettingsResolver;
