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
  PromotionalLetter,
  PromotionalLetterRecord,
  MailListen,
  MailOutbox,
  MailInbox,
  TargetCustomerAnalysis,
} from "@/models";
import {
  PromotionalLetterInput,
  PromotionalLetterUpdateInput,
  PromotionalLetterResult,
  PromotionalLetterEmailsInput,
  PromotionalLetterRecordResult,
  PromotionalLetterEmailResult,
  MailInboxResult,
} from "./types";
import { Like, Not, IsNull, In } from "typeorm";
import { sendMailFromMailSender } from "@/service/mailListener";

@Resolver()
class PromotionalLetterResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => PromotionalLetter)
  async createPromotionalLetter(
    @Ctx() ctx: GQLContext,
    @Arg("data") dataInput: PromotionalLetterInput
  ): Promise<PromotionalLetter> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await PromotionalLetter.create({
      ...dataInput,
      organizationId: orgId,
      userId: ctx.req.currentUser.id,
    }).save();
    return model;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updatePromotionalLetter(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("data") dataInput: PromotionalLetterUpdateInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    await PromotionalLetter.update(
      { id: id, organizationId: orgId },
      dataInput
    );
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deletePromotionalLetter(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await PromotionalLetter.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    await model.remove();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => PromotionalLetterResult)
  async getPromotionalLetters(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number,
    @Arg("recentFlag", () => Int, { nullable: true })
    recentFlag: number,
    @Arg("name", () => String, { nullable: true })
    name: string,
    @Arg("sendTimeFlag", () => Int, { nullable: true })
    sendTimeFlag: number
  ): Promise<PromotionalLetterResult> {
    const user = ctx.req.currentUser;

    let order: Record<string, "ASC" | "DESC"> = {
      id: "DESC",
    };

    if (recentFlag && recentFlag === 1) {
      delete order.id; // 删除 id
      order.updatedAt = "DESC"; // 添加 updatedAt
    }
    const input: any = {
      organizationId: user.organizationId,
      userId: user.id,
    };
    if (name) {
      input.name = Like(`%${name}%`);
    }
    if (sendTimeFlag && sendTimeFlag === 1) {
      input.sendTime = Not(IsNull());
    }
    const [data, count] = await PromotionalLetter.findAndCount({
      where: input,
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 30,
      order: order,
    });
    const res = new PromotionalLetterResult();
    res.result = data;
    res.total = count;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => PromotionalLetter)
  async getPromotionalLetterInfo(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<PromotionalLetter> {
    const orgId = ctx.req.currentUser.organizationId;

    const model = await PromotionalLetter.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });

    return model;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => Boolean)
  async sendEmailsPromotionalLetter(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("mailListenerId", () => Int) mailListenerId: number,
    @Arg("data") dataInput: PromotionalLetterEmailsInput,
    @Arg("emailSubject", () => String) emailSubject: string,
    @Arg("emailContent", () => String) emailContent: string,
    @Arg("bcc", () => String, { nullable: true }) bcc: string
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    const model = await PromotionalLetter.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
    });

    model.sendTime = new Date();
    await model.save();
    const listener = await MailListen.findOneOrFail({
      where: {
        id: mailListenerId,
        organizationId: user.organizationId,
      },
    });
    const uuid = require("uuid");
    let failCount = 0;
    let failedEmailText = "";
    let successEmailText = "";
    dataInput.models.forEach(async (element) => {
      const uuidStr = uuid.v1();
      // const imgName = Buffer.from(
      //   JSON.stringify({
      //     targetCustomerAnalysisId:
      //       element.targetCustomerAnalysisId !== null
      //         ? element.targetCustomerAnalysisId
      //         : null,
      //     promotionalLetterId: model.id,
      //     uuid: uuidStr,
      //     category: "promotionalLetter",
      //   })
      // ).toString("base64");
    //   const url = `${process.env.API_URL.replace(
    //     "graphql",
    //     ""
    //   )}res/img/${imgName}.png`;
    //   console.log(url);
    //   emailContent =
    //     emailContent +
    //     `<img 
    // src="${url}">`;

    //   const time = new Date().getTime();
    //   emailContent =
    //     emailContent +
    //     `<p style="opacity: 0;overflow: hidden;height: 0;">Tracking Code: PL-${time}-${model.id}</p>`;

      const mailOutbox = await MailOutbox.create({
        subject: emailSubject,
        from: listener.email,
        fromName: `${listener.firstName} ${listener.lastName}`,
        to: element.toEmail,
        text: emailContent,
        html: emailContent,
        sendTime: new Date(),
        organizationId: user.organizationId,
        sendStatus: "done",
        targetCustomerAnalysisId:
          element.targetCustomerAnalysisId !== null
            ? element.targetCustomerAnalysisId
            : null,
        uuid: uuidStr,
        promotionalLetterId: model.id,
        userId: user.id
      }).save();

      const emailInput = {
        subject: emailSubject,
        contacts: element.toEmail,
        text: emailContent,
        html: emailContent,
        bcc: bcc,
      };
      const flag = await sendMailFromMailSender(listener, emailInput);
      if (!flag) {
        failCount++;
        failedEmailText = failedEmailText + element.toEmail + ",";
        mailOutbox.sendStatus = "failed";
        await mailOutbox.save();
      } else {
        successEmailText = successEmailText + element.toEmail + ",";
      }
    });

    const allCount = dataInput.models.length;
    const successCount = allCount - failCount;
    let status;
    if (failCount === 0) {
      status = 1;
    } else if (failCount === allCount) {
      status = 2;
    } else {
      status = 3;
    }
    await PromotionalLetterRecord.create({
      promotionalLetterId: model.id,
      allCount: allCount,
      successCount: successCount,
      failedCount: failCount,
      failedEmailText: failedEmailText,
      organizationId: user.organizationId,
      title: emailSubject,
      content: emailContent,
      status: status,
      successEmailText: successEmailText,
      userId: user.id,
    }).save();

    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => Boolean)
  async sendCustomerEmailsPromotionalLetter(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("mailListenerId", () => Int) mailListenerId: number,
    @Arg("targetCustomerAnalysisIds", () => [Int])
    targetCustomerAnalysisIds: number[],
    @Arg("emailContent", () => String, { nullable: true }) emailContent: string,
    @Arg("emailSubject", () => String, { nullable: true }) emailSubject: string,
    @Arg("attachments", () => String, { nullable: true }) attachments: string,
    @Arg("bcc", () => String, { nullable: true }) bcc: string
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    const model = await PromotionalLetter.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
    });

    model.sendTime = new Date();
    await model.save();
    const listener = await MailListen.findOneOrFail({
      where: {
        id: mailListenerId,
        organizationId: user.organizationId,
      },
    });

    const customers = await TargetCustomerAnalysis.find({
      where: {
        id: In(targetCustomerAnalysisIds),
        organizationId: user.organizationId,
      },
    });

    let text = model.previewEmail;
    let title = model.subjectEmail;
    if (emailContent && emailContent !== "") {
      text = emailContent;
    }
    if (emailSubject && emailSubject !== "") {
      title = emailSubject;
    }

    //创建PLRecord
    const plRecord = await PromotionalLetterRecord.create({
      promotionalLetterId: model.id,
      organizationId: user.organizationId,
      title: title,
      content: text,
      userId: user.id,
    }).save();

    const uuid = require("uuid");
    let failCount = 0;
    let failedEmailText = "";
    let successEmailText = "";
    const uuidStr = uuid.v1();
    for (const customer of customers) {
      let tempText = text;
      let customerEmail = "";
      try {
        const tempArr = JSON.parse(customer.contactInfo);
        if (tempArr.length > 0) {
          customerEmail = tempArr[0].email;
        }
      } catch (error) {
        console.log("contactInfo parse failed");
        console.log(customer.contactInfo);
      }
      if (customerEmail === "") {
        failCount++;
        continue;
      }

      // const imgName = Buffer.from(
      //   JSON.stringify({
      //     targetCustomerAnalysisId: customer.id,
      //     promotionalLetterId: model.id,
      //     promotionalLetterRecordId: plRecord.id,
      //     uuid: uuidStr,
      //     category: "promotionalLetter",
      //     toEmail: customerEmail,
      //   })
    //   ).toString("base64");
    //   const url = `${process.env.API_URL.replace(
    //     "graphql",
    //     ""
    //   )}res/img/${imgName}.png`;
    //   console.log(url);
    //   tempText =
    //     tempText +
    //     `<img 
    // src="${url}">`;

      // const time = new Date().getTime();
      // tempText =
      //   tempText +
      //   `<p style="opacity: 0;overflow: hidden;height: 0;">Tracking Code: TCA-${time}-${customer.id}</p>`;

      // tempText =
      //   tempText +
      //   `<p style="opacity: 0;overflow: hidden;height: 0;">PL Code: PL-${time}-${model.id}</p>`;

      const mailOutbox = await MailOutbox.create({
        subject: title,
        from: listener.email,
        fromName: `${listener.firstName} ${listener.lastName}`,
        to: customerEmail,
        text: tempText,
        html: tempText,
        sendTime: new Date(),
        organizationId: user.organizationId,
        sendStatus: "done",
        targetCustomerAnalysisId: customer.id,
        uuid: uuidStr,
        promotionalLetterId: model.id,
        attachments: attachments && attachments !== "" ? attachments : "",
        userId: user.id
      }).save();

      const emailInput = {
        subject: title,
        contacts: customerEmail,
        text: tempText,
        html: tempText,
        attachments: attachments && attachments !== "" ? attachments : "",
        bcc: bcc,
      };
      console.log("emailInput:");
      console.log(emailInput);
      const flag = await sendMailFromMailSender(listener, emailInput);
      if (!flag) {
        failCount++;
        failedEmailText = failedEmailText + customerEmail + ",";
        mailOutbox.sendStatus = "failed";
        await mailOutbox.save();
      } else {
        successEmailText = successEmailText + customerEmail + ",";
      }
    }
    // dataInput.models.forEach(async (element) => {

    // });

    const allCount = customers.length;
    const successCount = allCount - failCount;
    let status;
    if (failCount === 0) {
      status = 1;
    } else if (failCount === allCount) {
      status = 2;
    } else {
      status = 3;
    }

    plRecord.allCount = allCount;
    plRecord.successCount = successCount;
    plRecord.failedCount = failCount;
    plRecord.failedEmailText = failedEmailText;
    plRecord.status = status;
    plRecord.successEmailText = successEmailText;
    plRecord.attachmentEmail =
      attachments && attachments !== "" ? attachments : "";
    await plRecord.save();

    // await PromotionalLetterRecord.create({
    //   promotionalLetterId: model.id,
    //   allCount: allCount,
    //   successCount: successCount,
    //   failedCount: failCount,
    //   failedEmailText: failedEmailText,
    //   organizationId: orgId,
    //   title: title,
    //   content: text,
    //   status: status,
    //   successEmailText: successEmailText,
    //   attachmentEmail: attachments && attachments !== "" ? attachments : "",
    // }).save();

    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [MailOutbox])
  async getPromotionalLetterMailOutbox(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("readFlag", () => String, { nullable: true }) readFlag: string
  ): Promise<MailOutbox[]> {
    const orgId = ctx.req.currentUser.organizationId;
    const input: any = {
      organizationId: orgId,
      promotionalLetterId: id,
    };
    if (readFlag && readFlag !== "") {
      input.readFlag = readFlag;
    }
    const res = MailOutbox.find({
      where: input,
      relations: ["targetCustomerAnalysis"],
    });
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [MailInbox])
  async getPromotionalLetterMailInbox(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<MailInbox[]> {
    const orgId = ctx.req.currentUser.organizationId;

    let qb;
    if (id === 0) {
      // qb = MailInbox.createQueryBuilder("mail")
      //   .select("MAX(mail.id)", "id") // 每组中 id 最大的那条
      //   .where("mail.promotionalLetterId IS NOT NULL")
      //   .andWhere("mail.organizationId = :orgId", { orgId })
      //   .groupBy("mail.targetCustomerAnalysisId")
      //   .orderBy("MAX(mail.id)", "DESC");
      qb = MailInbox.createQueryBuilder("mail")
        .select("MAX(mail.id)", "id") // 每组中 id 最大的那条
        .addSelect("mail.promotionalLetterId", "promotionalLetterId")
        .addSelect("mail.targetCustomerAnalysisId", "targetCustomerAnalysisId")
        .where("mail.promotionalLetterId IS NOT NULL")
        .andWhere("mail.organizationId = :orgId", { orgId })
        .groupBy("mail.promotionalLetterId")
        .addGroupBy("mail.targetCustomerAnalysisId")
        .orderBy("id", "DESC");
    } else {
      qb = MailInbox.createQueryBuilder("mail")
        .select("MAX(mail.id)", "id") // 每组中 id 最大的那条
        .where("mail.promotionalLetterId = :id", { id })
        .andWhere("mail.organizationId = :orgId", { orgId })
        .groupBy("mail.targetCustomerAnalysisId")
        .orderBy("id", "DESC");
    }

    const idsResult = await qb.getRawMany();
    const ids = idsResult.map((row) => row.id);

    const res = MailInbox.find({
      where: {
        id: In(ids),
        organizationId: orgId,
      },
      relations: ["targetCustomerAnalysis"],
      order: { id: "DESC" },
    });
    return res;

    // const orgId = ctx.req.currentUser.organizationId;
    // if (id === 0) {
    //   const res = MailInbox.find({
    //     where: {
    //       organizationId: orgId,
    //       promotionalLetterId: Not(IsNull()),
    //     },
    //   });
    //   return res;
    // }
    // const input: any = {
    //   organizationId: orgId,
    //   promotionalLetterId: id,
    // };
    // const res = MailInbox.find({
    //   where: input,
    //   relations: ["targetCustomerAnalysis"],
    // });
    // return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => MailInboxResult)
  async getPromotionalLetterMailInboxs(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number,
    @Arg("search", () => String, { nullable: true })
    search: string
  ): Promise<MailInboxResult> {
    const orgId = ctx.req.currentUser.organizationId;

    let qb;
    if (id === 0) {
      qb = MailInbox.createQueryBuilder("mail")
        .select("MAX(mail.id)", "id") // 每组中 id 最大的那条
        .addSelect("mail.promotionalLetterId", "promotionalLetterId")
        .addSelect("mail.targetCustomerAnalysisId", "targetCustomerAnalysisId")
        .where("mail.promotionalLetterId IS NOT NULL")
        .andWhere("mail.organizationId = :orgId", { orgId })
        .groupBy("mail.promotionalLetterId")
        .addGroupBy("mail.targetCustomerAnalysisId")
        .orderBy("id", "DESC");
    } else {
      qb = MailInbox.createQueryBuilder("mail")
        .select("MAX(mail.id)", "id") // 每组中 id 最大的那条
        .where("mail.promotionalLetterId = :id", { id })
        .andWhere("mail.organizationId = :orgId", { orgId })
        .groupBy("mail.targetCustomerAnalysisId")
        .orderBy("id", "DESC");
    }

    const idsResult = await qb.getRawMany();
    const ids = idsResult.map((row) => row.id);

    if (ids.length < 1) {
      const res = new MailInboxResult();
      res.result = [];
      res.total = 0;
      res.totalUnread = 0;
      return res;
    }
    const queryBuilder = MailInbox.createQueryBuilder("mail")
      .leftJoinAndSelect("mail.targetCustomerAnalysis", "target")
      .where("mail.id IN (:...ids)", { ids })
      .andWhere("mail.organizationId = :orgId", { orgId });

    // 添加搜索条件（可选）
    if (search && search.trim() !== "") {
      queryBuilder.andWhere(
        `(mail.subject LIKE :search OR target.name LIKE :search)`,
        { search: `%${search}%` }
      );
    }

    // 分页和排序
    const [models, count] = await queryBuilder
      .orderBy("mail.readFlag", "ASC") // 未读（0）优先
      .addOrderBy("mail.id", "DESC")
      .skip(Number.isFinite(skip) ? skip : 0)
      .take(Number.isFinite(take) ? take : 30)
      .getManyAndCount();

    const tatalUnread = await MailInbox.count({
      where: {
        id: In(ids),
        organizationId: orgId,
        readFlag: 0,
      },
    });
    const res = new MailInboxResult();
    res.result = models;
    res.total = count;
    res.totalUnread = tatalUnread;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getPromotionalLetterMailDetails(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<string> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await PromotionalLetter.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    const allCount = await MailOutbox.count({
      where: {
        promotionalLetterId: id,
        organizationId: orgId,
      },
    });

    const failRes = await MailOutbox.find({
      where: {
        promotionalLetterId: id,
        organizationId: orgId,
        sendStatus: "failed",
      },
    });

    const failMails = failRes
      .filter((item) => item.to) // 过滤掉没有 `to` 的项
      .map((item) => item.to);

    const res = {
      subjectEmail: model.subjectEmail,
      sendTime: model.sendTime,
      allCount: allCount,
      successCount: allCount - failRes.length,
      failCount: failRes.length,
      failMails: failMails,
    };
    return JSON.stringify(res);
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => PromotionalLetterRecordResult)
  async getPromotionalLetterRecords(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<PromotionalLetterRecordResult> {
    const user = ctx.req.currentUser;
    const [data, count] = await PromotionalLetterRecord.findAndCount({
      where: {
        organizationId: user.organizationId,
        userId: user.id,
      },
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 30,
      order: {
        id: "DESC",
      },
    });
    const res = new PromotionalLetterRecordResult();
    res.result = data;
    res.total = count;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => PromotionalLetterRecord)
  async getPromotionalLetterRecordInfo(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<PromotionalLetterRecord> {
    const orgId = ctx.req.currentUser.organizationId;

    const model = await PromotionalLetterRecord.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });

    return model;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => PromotionalLetterEmailResult)
  async getPromotionalLetterTargetCustomerAllEmails(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("targetCustomerAnalysisId", () => Int) targetCustomerAnalysisId: number
  ): Promise<PromotionalLetterEmailResult> {
    const orgId = ctx.req.currentUser.organizationId;

    const mailOutBoxs = await MailOutbox.find({
      where: {
        promotionalLetterId: id,
        organizationId: orgId,
        targetCustomerAnalysisId: targetCustomerAnalysisId,
      },
    });

    const mailInBoxs = await MailInbox.find({
      where: {
        promotionalLetterId: id,
        organizationId: orgId,
        targetCustomerAnalysisId: targetCustomerAnalysisId,
      },
    });

    const res = new PromotionalLetterEmailResult();
    res.mailOutBox = mailOutBoxs;
    res.mailInBox = mailInBoxs;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async readPromotionalLetterMailInbox(
    @Ctx() ctx: GQLContext,
    @Arg("mailInboxId", () => Int) mailInboxId: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await MailInbox.findOne({
      where: {
        id: mailInboxId,
        organizationId: orgId,
      },
    });
    if (!model) {
      return false;
    }
    model.readFlag = 1;
    await model.save();
    return true;
  }
}

export default PromotionalLetterResolver;
