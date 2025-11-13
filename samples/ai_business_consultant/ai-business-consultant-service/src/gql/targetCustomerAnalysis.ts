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
  TargetCustomerAnalysis,
  MailOutbox,
  MailInbox,
  NegotiationAssistant,
} from "@/models";
import {
  TargetCustomerAnalysisInput,
  TargetCustomerAnalysisResult,
  ImportTargetCustomerAnalysisInput,
} from "./types";
// import axios from "axios";
import { CommonError } from "@/errors";
import { sendMailFromMailSender } from "@/service/mailListener";
import {
  getCustomerProfileCompanyFromChatGPT,
  getCustomerProfilePersonFromChatGPT,
  requestQuestionFromChatGPTMini,
  requestQuestionFromPerplexity,
} from "@/utils/chatAi";
import { Not } from "typeorm";
import axios from "axios";
import {
  //今日，本周，本月，三个月，今年, 最近7天, 最近30天, 最近90天，全部
  getThisMonthStart,
  getThisWeekStart,
  getTodayStart,
  getThreeMonthStart,
  getThisYearStart,
  getLast90DaysStart,
  getLast30DaysStart,
  getLast7DaysStart,
} from "@/utils/dateTime";

const getGenerateAiAdvice = async (model: any) => {
  try {
    const res = await axios.post(
      "https://abc.easiio.com/chatapi/execute/service3/perplexity_query/generate_aiadvice",
      {
        args: {
          json_data: {
            name: model.name,
            industryType: model.industryType,
            desc: model.desc,
            business: model.business,
            companyType: model.companyType,
            service: model.service,
          },
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      }
    );
    console.log(res.data);
    if (res.data.result) {
      if (res.data.result.data !== "") {
        try {
          const model = JSON.parse(
            res.data.result.data.replaceAll("```json", "").replaceAll("```", "")
          );
          console.log(model);
          return model["AI洞察与推荐"];
          // return res.data.result.data
          //   .replaceAll("```json", "")
          //   .replaceAll("```", "");
        } catch (error) {
          return "";
        }
      }
    }
    return "";
  } catch (error) {
    console.log("出错了");
    return "";
  }
};

@Resolver()
class TargetCustomerAnalysisResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => Boolean)
  async addAllTargetCustomerAnalysisDetail(): Promise<Boolean> {
    const res = await TargetCustomerAnalysis.find();
    for (const model of res) {
      try {
        if (model.name && model.name.trim() !== "") {
          const resCompany = await getCustomerProfileCompanyFromChatGPT(
            model.name
          );
          if (resCompany) {
            model.createDate = resCompany.basic_info.founded;
            model.business =
              resCompany.products_and_services.products.join("，"); // + "，" + res.products_and_services.products.join("，");
            model.service =
              resCompany.products_and_services.solutions.join("，");
            model.desc = resCompany.basic_info.description;
            model.enterpriseScale = resCompany.organization_data.company_size
              ? resCompany.organization_data.company_size
              : "";
            model.industryType = resCompany.basic_info.industry;
            model.companyType = resCompany.organization_data.company_size;
            model.website = resCompany.online_presence.website;
          }
          if (
            model.contactInfo &&
            model.contactInfo.trim() !== "" &&
            model.contactInfo.trim() !== "[]"
          ) {
            const contactArr = JSON.parse(model.contactInfo);
            console.log(contactArr);
            const contact = contactArr[0] ? contactArr[0] : null;
            if (contact && contact.email) {
              const resPerson = await getCustomerProfilePersonFromChatGPT(
                contact.email
              );
              const workExperienceArr = [];
              if (resPerson.employment_history.length > 0) {
                for (const item of resPerson.employment_history) {
                  workExperienceArr.push({
                    companyName: item.organization_name,
                    position: item.title,
                    workingHours: item.start_date,
                  });
                }
              }
              const info = {
                id: resPerson.id,
                name: resPerson.name,
                position: resPerson.title,
                phone:
                  contact.phone && contact.phone.trim() !== ""
                    ? contact.phone
                    : resPerson.organization.phone,
                email: resPerson.email,
                decisionInfluence: "高",
                communicationPreference: "邮箱",
                address: resPerson.country
                  ? resPerson.country +
                    " " +
                    resPerson.city +
                    " " +
                    resPerson.state
                  : "",
                workExperience: workExperienceArr,
              };
              contactArr.length = 0;
              contactArr.push(info);
              model.contactInfo = JSON.stringify(contactArr);
              await model.save();
            }
          }
        }
      } catch (error) {
        console.log(error);
      }
    }
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createTargetCustomerAnalysis(
    @Ctx() ctx: GQLContext,
    @Arg("targetCustomerAnalysis")
    targetCustomerAnalysisInput: TargetCustomerAnalysisInput
  ): Promise<Boolean> {
    const exist = await TargetCustomerAnalysis.findOne({
      where: {
        name: targetCustomerAnalysisInput.name,
        organizationId: ctx.req.currentUser.organizationId,
      },
    });
    if (exist) {
      throw new CommonError("该客户已存在");
    }
    const orgId = ctx.req.currentUser.organizationId;
    const model = await TargetCustomerAnalysis.create({
      ...targetCustomerAnalysisInput,
      organizationId: orgId,
      customerState: 1,
      customerStateChangeTime: new Date(),
      userId: ctx.req.currentUser.id,
    }).save();

    const res = await getCustomerProfileCompanyFromChatGPT(model.name);
    if (res) {
      model.createDate = res.basic_info.founded;
      model.business = res.products_and_services.products.join("，"); // + "，" + res.products_and_services.products.join("，");
      model.service = res.products_and_services.solutions.join("，");
    }
    if (
      model.contactInfo &&
      model.contactInfo.trim() !== "" &&
      model.contactInfo.trim() !== "[]"
    ) {
      const contactArr = JSON.parse(model.contactInfo);
      const contact = contactArr[0];
      if (contact && contact.email) {
        const res = await getCustomerProfilePersonFromChatGPT(contact.email);
        const info = {
          id: res.id,
          name: res.name,
          position: res.title,
          phone: "",
          email: res.email,
          decisionInfluence: "高",
          communicationPreference: "邮箱",
          address: res.country
            ? res.country + " " + res.city + " " + res.state
            : "",
          workExperience: [
            {
              companyName: res.employment_history.organization_name,
              position: res.employment_history.title,
              workingHours: res.employment_history.start_date,
            },
          ],
        };
        contactArr.length = 0;
        contactArr.push(info);
        model.contactInfo = JSON.stringify(contactArr);
        await model.save();
      }
    }
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async importTargetCustomerAnalysis(
    @Ctx() ctx: GQLContext,
    @Arg("data")
    importTargetCustomerAnalysisInput: ImportTargetCustomerAnalysisInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    // 组装数据
    const records = importTargetCustomerAnalysisInput.data.map((element) => ({
      ...element,
      organizationId: orgId,
      userId: ctx.req.currentUser.id,
      customerState: 1,
      customerStateChangeTime: new Date(),
    }));

    // 批量插入
    // await TargetCustomerAnalysis.insert(records);
    const result = await TargetCustomerAnalysis.insert(records);
    const insertedIds = result.identifiers.map((item) => item.id);
    for (const id of insertedIds) {
      const model = await TargetCustomerAnalysis.findOneOrFail({
        where: { id: id },
      });
      const res = await getCustomerProfileCompanyFromChatGPT(model.name);
      if (res) {
        model.createDate = res.basic_info.founded;
        model.business = res.products_and_services.products.join("，"); // + "，" + res.products_and_services.products.join("，");
        model.service = res.products_and_services.solutions.join("，");
        model.desc = res.basic_info.description;
        model.enterpriseScale = res.organization_data.company_size
          ? res.organization_data.company_size
          : "";
        model.industryType = res.basic_info.industry;
        model.companyType = res.organization_data.company_size;
        model.website = res.online_presence.website;
      }
      if (
        model.contactInfo &&
        model.contactInfo.trim() !== "" &&
        model.contactInfo.trim() !== "[]"
      ) {
        const contactArr = JSON.parse(model.contactInfo);
        const contact = contactArr[0];
        if (contact && contact.email) {
          const res = await getCustomerProfilePersonFromChatGPT(contact.email);
          const workExperienceArr = [];
          if (res.employment_history.length > 0) {
            for (const item of res.employment_history) {
              workExperienceArr.push({
                companyName: item.organization_name,
                position: item.title,
                workingHours: item.start_date,
              });
            }
          }
          const info = {
            id: res.id,
            name: res.name,
            position: res.title,
            phone:
              contact.phone && contact.phone.trim() !== ""
                ? contact.phone
                : res.organization.phone,
            email: res.email,
            decisionInfluence: "高",
            communicationPreference: "邮箱",
            address: res.country
              ? res.country + " " + res.city + " " + res.state
              : "",
            workExperience: workExperienceArr,
          };
          contactArr.length = 0;
          contactArr.push(info);
          model.contactInfo = JSON.stringify(contactArr);
          await model.save();
        }
      }
    }
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateTargetCustomerAnalysis(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("targetCustomerAnalysis")
    targetCustomerAnalysisInput: TargetCustomerAnalysisInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    if (targetCustomerAnalysisInput.name) {
      const exist = await TargetCustomerAnalysis.findOne({
        where: {
          name: targetCustomerAnalysisInput.name,
          organizationId: ctx.req.currentUser.organizationId,
          id: Not(id),
        },
      });
      if (exist) {
        throw new CommonError("该客户已存在");
      }
    }

    await TargetCustomerAnalysis.update(
      { id: id, organizationId: orgId },
      targetCustomerAnalysisInput
    );
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteTargetCustomerAnalysis(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await TargetCustomerAnalysis.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    await model.remove();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => TargetCustomerAnalysisResult)
  async getTargetCustomerAnalysiss(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true }) skip: number,
    @Arg("take", () => Int, { nullable: true }) take: number,
    @Arg("name", () => String, { nullable: true }) name: string,
    // @Arg("industryType", () => String, { nullable: true }) industryType: string,
    @Arg("score", () => Int, { nullable: true }) score: number,
    @Arg("customerType", () => String, { nullable: true }) customerType: string,
    @Arg("replyStatus", () => String, { nullable: true }) replyStatus: string,
    @Arg("customerState", () => Int, { nullable: true }) customerState: number,
    @Arg("traceStatus", () => String, { nullable: true }) traceStatus: string,
    @Arg("lastDate", () => Int, { nullable: true }) lastDate: number
  ): Promise<TargetCustomerAnalysisResult> {
    const orgId = ctx.req.currentUser.organizationId;
    let time;
    if (lastDate && lastDate !== 9) {
      if (lastDate === 1) {
        time = await getTodayStart();
      } else if (lastDate === 2) {
        time = await getThisWeekStart();
      } else if (lastDate === 3) {
        time = await getThisMonthStart();
      } else if (lastDate === 4) {
        time = await getThreeMonthStart();
      } else if (lastDate === 5) {
        time = await getThisYearStart();
      } else if (lastDate === 6) {
        time = await getLast7DaysStart();
      } else if (lastDate === 7) {
        time = await getLast30DaysStart();
      } else if (lastDate === 8) {
        time = await getLast90DaysStart();
      }
      // createdAt = Between(time.start, time.end);
    }

    const queryBuilder = TargetCustomerAnalysis.createQueryBuilder(
      "target"
    ).where("target.organizationId = :orgId", { orgId });

    queryBuilder.andWhere("target.userId = :userId", {
      userId: ctx.req.currentUser.id,
    });

    if (name && name.trim() !== "") {
      queryBuilder.andWhere("target.name LIKE :name", { name: `%${name}%` });
    }

    if (name && name.trim() !== "") {
      queryBuilder.orWhere("target.industryType LIKE :industryType", {
        industryType: `%${name}%`,
      });
    }

    if (Number.isFinite(score)) {
      queryBuilder.andWhere("target.score >= :score", { score: score });
    }

    if (Number.isFinite(customerState)) {
      queryBuilder.andWhere("target.customerState = :customerState", {
        customerState: customerState,
      });
    }

    if (customerType && customerType.trim() !== "") {
      queryBuilder.andWhere("target.customerType = :customerType", {
        customerType: customerType,
      });
    }

    if (replyStatus && replyStatus.trim() !== "") {
      queryBuilder.andWhere("target.replyStatus = :replyStatus", {
        replyStatus: replyStatus,
      });
    }

    if (traceStatus && traceStatus.trim() !== "") {
      queryBuilder.andWhere("target.traceStatus = :traceStatus", {
        traceStatus: traceStatus,
      });
    }

    if (time) {
      queryBuilder.andWhere("target.createdAt BETWEEN :start AND :end", {
        start: time.start,
        end: time.end,
      });
    }

    // const [data, count] = await queryBuilder
    //   .skip(Number.isFinite(skip) ? skip : 0)
    //   .take(Number.isFinite(take) ? take : 30)
    //   .orderBy("target.id", "DESC")
    //   .getManyAndCount();

    const [data, count] = await queryBuilder
      .skip(Number.isFinite(skip) ? skip : 0)
      .take(Number.isFinite(take) ? take : 30)
      .orderBy(`CASE WHEN target.countdown IS NULL THEN 1 ELSE 0 END`, "ASC")
      .addOrderBy("target.countdown", "ASC")
      .addOrderBy(
        `CASE WHEN target.countdown IS NULL THEN target.id ELSE NULL END`,
        "DESC"
      )
      .getManyAndCount();

    for (let index = 0; index < data.length; index++) {
      const model = await MailInbox.findOne({
        where: {
          organizationId: orgId,
          targetCustomerAnalysisId: data[index].id,
        },
        order: { id: "DESC" },
      });
      if (model) {
        data[index].lastMailInbox = model;
      }
    }
    const res = new TargetCustomerAnalysisResult();
    res.result = data;
    res.total = count;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => TargetCustomerAnalysis)
  async getTargetCustomerAnalysisDetail(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<TargetCustomerAnalysis> {
    const orgId = ctx.req.currentUser.organizationId;
    const data = await TargetCustomerAnalysis.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
      relations: ["lastMailListen"],
    });
    if (!data.aiAdvice || data.aiAdvice.trim() === "") {
      let resJson = "";
      let count = 0;
      while (resJson.trim() === "" && count < 3) {
        resJson = await getGenerateAiAdvice(data);
        count++;
      }

      if (resJson !== "") {
        data.aiAdvice = resJson;
        await data.save();
      }
    }
    const lastNA = await NegotiationAssistant.findOne({
      where: {
        targetCustomerAnalysisId: id,
        organizationId: orgId,
      },
      order: {
        createdAt: "DESC",
      },
    });
    if (lastNA) {
      data.negotiationContent = lastNA.negotiationContent;
      await data.save();
    }
    return data;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => Boolean)
  async traceTargetCustomerAnalysisDetail(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("trace", () => Int) trace: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const data = await TargetCustomerAnalysis.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    data.trace = trace;
    data.save();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async chatAIModel(
    @Arg("prompt", () => String) prompt: string,
    @Arg("type", () => String) type: string
  ): Promise<String> {
    try {
      if (type === "chatgpt") {
        const res = await requestQuestionFromChatGPTMini(prompt);
        return res;
      } else if (type === "perplexity") {
        const res = await requestQuestionFromPerplexity(prompt);
        return res;
      }
      return "no found type";
    } catch (error: any) {
      if (error.response) {
        throw new CommonError(JSON.stringify(error.response.data));
      } else if (error.request) {
        throw new CommonError(JSON.stringify(error.request));
      } else {
        throw new CommonError(error.message);
      }
    }
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => Boolean)
  async sendEmailTargetCustomerAnalysis(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("mailListenerId", () => Int) mailListenerId: number,
    @Arg("toEmail", () => String) toEmail: string,
    @Arg("emailSubject", () => String) emailSubject: string,
    @Arg("emailContent", () => String) emailContent: string,
    @Arg("bcc", () => String, { nullable: true }) bcc: string,
    @Arg("attachments", () => String, { nullable: true }) attachments: string
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    const model = await TargetCustomerAnalysis.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
    });

    const listener = await MailListen.findOneOrFail({
      where: {
        id: mailListenerId,
        organizationId: user.organizationId,
      },
    });

    const uuid = require("uuid");
    const uuidStr = uuid.v1();

    // const imgName = Buffer.from(
    //   JSON.stringify({
    //     targetCustomerAnalysisId: model.id,
    //     uuid: uuidStr,
    //     category: "targetCustomerAnalysis",
    //   })
    // ).toString("base64");
    // const url = `${process.env.API_URL.replace(
    //   "graphql",
    //   ""
    // )}res/img/${imgName}.png`;
    // console.log(url);
    // emailContent =
    //   emailContent +
    //   `<img
    // src="${url}">`;

    // const time = new Date().getTime();
    // emailContent =
    //   emailContent +
    //   `<p style="opacity: 0;overflow: hidden;height: 0;">Tracking Code: TCA-${time}-${model.id}</p>`;

    await MailOutbox.create({
      subject: emailSubject,
      from: listener.email,
      fromName: `${listener.firstName} ${listener.lastName}`,
      to: toEmail,
      text: emailContent,
      html: emailContent,
      sendTime: new Date(),
      organizationId: user.organizationId,
      sendStatus: "done",
      targetCustomerAnalysisId: model.id,
      uuid: uuidStr,
      attachments: attachments,
      userId: user.id,
    }).save();

    const emailInput = {
      subject: emailSubject,
      contacts: toEmail,
      text: emailContent,
      html: emailContent,
      bcc: bcc,
      attachments: attachments,
    };
    await sendMailFromMailSender(listener, emailInput);
    model.replyStatus = "已发送";
    model.lastMailListenId = mailListenerId;
    model.traceStatus = "待跟进";
    model.countdown = 7;
    await model.save();

    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [MailOutbox])
  async getTargetCustomerAnalysissMailOutbox(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("readFlag", () => String, { nullable: true }) readFlag: string
  ): Promise<MailOutbox[]> {
    const orgId = ctx.req.currentUser.organizationId;
    const input: any = {
      organizationId: orgId,
      targetCustomerAnalysisId: id,
    };
    if (readFlag && readFlag !== "") {
      input.readFlag = readFlag;
    }
    const res = MailOutbox.find({
      where: input,
    });
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [MailInbox])
  async getTargetCustomerAnalysissMailInbox(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<MailInbox[]> {
    const orgId = ctx.req.currentUser.organizationId;
    const input: any = {
      organizationId: orgId,
      targetCustomerAnalysisId: id,
    };
    const res = MailInbox.find({
      where: input,
    });
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async setTargetCustomerAnalysisTraceStatus(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("countdown", () => Int) countdown: number
  ): Promise<Boolean> {
    if (countdown < 1) {
      // throw new CommonError("倒计时天数不能小于1");
      await TargetCustomerAnalysis.update(
        { id: id, organizationId: ctx.req.currentUser.organizationId },
        {
          traceStatus: "",
          countdown: null,
        }
      );
    } else {
      await TargetCustomerAnalysis.update(
        { id: id, organizationId: ctx.req.currentUser.organizationId },
        {
          traceStatus: "待跟进",
          countdown: countdown,
        }
      );
    }

    return true;
  }

  // 推荐客户分析
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => TargetCustomerAnalysisResult)
  async getRecommendTargetCustomerAnalysiss(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true }) skip: number,
    @Arg("take", () => Int, { nullable: true }) take: number,
    @Arg("customerState", () => [Int], { nullable: true })
    customerState: number[]
  ): Promise<TargetCustomerAnalysisResult> {
    const orgId = ctx.req.currentUser.organizationId;

    const queryBuilder = TargetCustomerAnalysis.createQueryBuilder(
      "target"
    ).where("target.organizationId = :orgId", { orgId });

    queryBuilder.andWhere("target.userId = :userId", {
      userId: ctx.req.currentUser.id,
    });

    if (customerState && customerState.length > 0) {
      queryBuilder.andWhere("target.customerState IN (:...customerState)", {
        customerState: customerState,
      });
    }

    const [data, count] = await queryBuilder
      .skip(Number.isFinite(skip) ? skip : 0)
      .take(Number.isFinite(take) ? take : 30)
      .orderBy(`CASE WHEN target.countdown IS NULL THEN 1 ELSE 0 END`, "ASC")
      .addOrderBy("target.countdown", "ASC")
      .addOrderBy(
        `CASE WHEN target.countdown IS NULL THEN target.id ELSE NULL END`,
        "DESC"
      )
      .getManyAndCount();
    const res = new TargetCustomerAnalysisResult();
    res.result = data;
    res.total = count;
    return res;
  }
}

export default TargetCustomerAnalysisResolver;
