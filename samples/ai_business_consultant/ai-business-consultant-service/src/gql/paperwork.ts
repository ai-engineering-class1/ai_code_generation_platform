import {
  Resolver,
  UseMiddleware,
  Mutation,
  Query,
  Arg,
  Int,
  Ctx,
} from "type-graphql";
import { ErrorInterceptor, ResolveTime } from "@/middlewares";
import { Paperwork, WxPaidOrders, WxUser, User } from "@/models";
import {
  IsTestAuth,
  IsAdminAndLawyerAuth,
  IsAdminAndLawyerAndOperatorAuth,
  IsAdminAuth,
} from "@/middlewares/isAuth";
import {
  // PaperworkInput,
  PaperworkUpdateInput,
  PaperworkSaveInput,
  PaperworkResult,
} from "./types";
import { GQLContext } from "@/types/context";
import axios from "axios";
// import redis from "ioredis";
import { CommonError } from "@/errors";
import { isNonEmptyString } from "@/utils/validations";
import { format } from "date-fns";
import path from "path";
import fs from "fs";
import { OSSmanager } from "@/utils/staticClass";
import {
  createRandomString,
  getAccessToken,
  getJsapiTicket,
} from "@/utils/common";
import { getRepository } from "typeorm";
import { sendSmsPaperWork } from "@/utils/aliyunSMS";

// const getAccessToken = async () => {
//   const client = new redis(process.env.REDIS_URL);
//   client.select(0);
//   let access_token = await client.get(`paperwork_notice_key`);
//   console.log(`redis access_token:${access_token}`);
//   if (access_token === null || access_token === "") {
//     const res = await axios.get(
//       `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx6fb0aeefefdfce5e&secret=8be5842795f7b7d02e78699bb23a1e19`
//     );
//     console.log(res.data);
//     access_token = res.data.access_token;
//     client.set(`paperwork_notice_key`, access_token!, "EX", 7200);
//   }
//   return access_token;
// };

// const getJsapiTicket = async () => {
//   const client = new redis(process.env.REDIS_URL);
//   client.select(0);
//   let jsapi_ticket = await client.get(`jsapi_ticket`);
//   console.log(`redis jsapi_ticket:${jsapi_ticket}`);
//   if (jsapi_ticket === null || jsapi_ticket === "") {
//     const res = await axios.get(
//       `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${await getAccessToken()}&type=jsapi`
//     );
//     console.log(res.data);
//     jsapi_ticket = res.data.ticket;
//     client.set(`jsapi_ticket`, jsapi_ticket!, "EX", 7200);
//   }
//   return jsapi_ticket;
// };

@Resolver()
class PaperworkResolver {
  // @UseMiddleware([IsNormalAuth, ErrorInterceptor, ResolveTime])
  // @Mutation(() => Paperwork)
  // async createPaperwork(
  //   @Ctx() ctx: GQLContext,
  //   @Arg("paperwork")
  //   paperworkInput: PaperworkInput
  // ): Promise<Paperwork> {
  //   const user = ctx.req.currentUser;

  //   const model = await Paperwork.create({
  //     ...paperworkInput,
  //     organizationId: user.organizationId,
  //   }).save();

  //   return model;
  // }

  @UseMiddleware([IsAdminAndLawyerAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Paperwork)
  async updatePaperwork(
    @Arg("id", () => Int) id: number,
    @Ctx() ctx: GQLContext,
    @Arg("paperwork")
    paperworkInput: PaperworkUpdateInput
  ): Promise<Paperwork> {
    const user = ctx.req.currentUser;
    await Paperwork.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
    });
    await Paperwork.update(id, { ...paperworkInput, userId: user.id });
    return await Paperwork.findOneOrFail(id);
  }

  @UseMiddleware([
    IsAdminAndLawyerAndOperatorAuth,
    ErrorInterceptor,
    ResolveTime,
  ])
  @Query(() => [Paperwork])
  async getPaperworks(
    @Ctx() ctx: GQLContext,
    @Arg("out_trade_no", () => String, { nullable: true })
    out_trade_no: string
  ): Promise<Paperwork[]> {
    const user = ctx.req.currentUser;

    if (user.role === 1 || user.role === 3) {
      const models = await Paperwork.createQueryBuilder("paperwork")
        .leftJoinAndSelect(
          "paperwork.legalDocumentProject",
          "legalDocumentProject"
        )
        .leftJoinAndSelect("paperwork.wxUser", "wxUser")
        .leftJoinAndSelect("paperwork.wxPaidOrders", "wxPaidOrders")
        .leftJoinAndSelect("wxPaidOrders.commodity", "commodity")
        .leftJoinAndSelect(
          "legalDocumentProject.legalDocumentElements",
          "legalDocumentElements"
        )
        .leftJoinAndSelect(
          "legalDocumentProject.legalDocumentTemplates",
          "legalDocumentTemplates"
        )
        .where(
          "paperwork.organizationId = :organizationId and wxPaidOrders.status >= 3 and wxPaidOrders.out_trade_no LIKE :out_trade_no",
          {
            organizationId: user.organizationId,
            out_trade_no: isNonEmptyString(out_trade_no)
              ? `%${out_trade_no}%`
              : "%%",
          }
        )
        .orderBy("paperwork.id", "DESC")
        .getMany();
      return models;
    } else {
      const models = await Paperwork.createQueryBuilder("paperwork")
        .leftJoinAndSelect(
          "paperwork.legalDocumentProject",
          "legalDocumentProject"
        )
        .leftJoinAndSelect("paperwork.wxUser", "wxUser")
        .leftJoinAndSelect("paperwork.wxPaidOrders", "wxPaidOrders")
        .leftJoinAndSelect(
          "legalDocumentProject.legalDocumentElements",
          "legalDocumentElements"
        )
        .leftJoinAndSelect(
          "legalDocumentProject.legalDocumentTemplates",
          "legalDocumentTemplates"
        )
        .leftJoinAndSelect("paperwork.lawyer", "lawyer")
        .leftJoinAndSelect("wxPaidOrders.commodity", "commodity")
        // .leftJoinAndSelect("commodity.lawyers", "lawyers")
        .where(
          "paperwork.organizationId = :organizationId and wxPaidOrders.status >= 3 and lawyer.id = :lawyerId and wxPaidOrders.out_trade_no LIKE :out_trade_no",
          {
            organizationId: user.organizationId,
            lawyerId: user.id,
            out_trade_no: isNonEmptyString(out_trade_no)
              ? `%${out_trade_no}%`
              : "%%",
          }
        )
        .orderBy("paperwork.id", "DESC")
        .getMany();
      return models;
    }
  }

  @UseMiddleware([
    IsAdminAndLawyerAndOperatorAuth,
    ErrorInterceptor,
    ResolveTime,
  ])
  @Query(() => PaperworkResult)
  async getPaperworksAndCount(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number,
    @Arg("state", () => String)
    state: string,
    @Arg("out_trade_no", () => String, { nullable: true })
    out_trade_no: string
  ): Promise<PaperworkResult> {
    const user = ctx.req.currentUser;
    if (state !== "unapproved" && state !== "approved" && state !== "error") {
      throw new CommonError("Error paperwork state.");
    }
    if (user.role === 1 || user.role === 3) {
      const [models, count] = await Paperwork.createQueryBuilder("paperwork")
        .leftJoinAndSelect(
          "paperwork.legalDocumentProject",
          "legalDocumentProject"
        )
        .leftJoinAndSelect("paperwork.wxUser", "wxUser")
        .leftJoinAndSelect("paperwork.wxPaidOrders", "wxPaidOrders")
        .leftJoinAndSelect(
          "legalDocumentProject.legalDocumentElements",
          "legalDocumentElements"
        )
        .leftJoinAndSelect(
          "legalDocumentProject.legalDocumentTemplates",
          "legalDocumentTemplates"
        )
        .leftJoinAndSelect("wxPaidOrders.commodity", "commodity")
        .withDeleted()
        .where(
          "paperwork.organizationId = :organizationId and wxPaidOrders.status >= 3 and paperwork.state = :state and wxPaidOrders.out_trade_no LIKE :out_trade_no",
          {
            organizationId: user.organizationId,
            state: state,
            out_trade_no: isNonEmptyString(out_trade_no)
              ? `%${out_trade_no}%`
              : "%%",
          }
        )
        .skip(Number.isFinite(skip) ? skip : 0)
        .take(Number.isFinite(take) ? take : 300)
        .orderBy("paperwork.id", "DESC")
        .getManyAndCount();
      const res = new PaperworkResult();
      res.data = models;
      res.totalCount = count;
      return res;
    } else {
      const [models, count] = await Paperwork.createQueryBuilder("paperwork")
        .leftJoinAndSelect(
          "paperwork.legalDocumentProject",
          "legalDocumentProject"
        )
        .leftJoinAndSelect("paperwork.wxUser", "wxUser")
        .leftJoinAndSelect("paperwork.wxPaidOrders", "wxPaidOrders")
        .leftJoinAndSelect(
          "legalDocumentProject.legalDocumentElements",
          "legalDocumentElements"
        )
        .leftJoinAndSelect(
          "legalDocumentProject.legalDocumentTemplates",
          "legalDocumentTemplates"
        )
        .leftJoinAndSelect("paperwork.lawyer", "lawyer")
        .leftJoinAndSelect("wxPaidOrders.commodity", "commodity")
        // .leftJoinAndSelect("commodity.lawyers", "lawyers")
        .withDeleted()
        .where(
          "paperwork.organizationId = :organizationId and wxPaidOrders.status >= 3 and lawyer.id = :lawyerId and paperwork.state = :state and wxPaidOrders.out_trade_no LIKE :out_trade_no",
          {
            organizationId: user.organizationId,
            lawyerId: user.id,
            state: state,
            out_trade_no: isNonEmptyString(out_trade_no)
              ? `%${out_trade_no}%`
              : "%%",
          }
        )
        .skip(Number.isFinite(skip) ? skip : 0)
        .take(Number.isFinite(take) ? take : 300)
        .orderBy("paperwork.id", "DESC")
        .getManyAndCount();

      // const result = models.map(paperwork => {
      //   if (!paperwork.legalDocumentProject) {
      //     paperwork.legalDocumentProject = null; // 或者设置为其他默认值
      //   }
      //   return paperwork;
      // });
      const res = new PaperworkResult();
      res.data = models;
      res.totalCount = count;
      return res;
    }
  }

  @UseMiddleware([
    IsAdminAndLawyerAndOperatorAuth,
    ErrorInterceptor,
    ResolveTime,
  ])
  @Query(() => Paperwork)
  async getPaperworkById(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Paperwork> {
    const user = ctx.req.currentUser;
    if (user.role === 1 || user.role === 3) {
      const model = await Paperwork.createQueryBuilder("paperwork")
        .leftJoinAndSelect(
          "paperwork.legalDocumentProject",
          "legalDocumentProject"
        )
        .leftJoinAndSelect("paperwork.wxUser", "wxUser")
        .leftJoinAndSelect("paperwork.wxPaidOrders", "wxPaidOrders")
        .leftJoinAndSelect(
          "legalDocumentProject.legalDocumentElements",
          "legalDocumentElements"
        )
        .leftJoinAndSelect(
          "legalDocumentProject.legalDocumentTemplates",
          "legalDocumentTemplates"
        )
        .leftJoinAndSelect("wxPaidOrders.commodity", "commodity")
        .where(
          "paperwork.id = :id and paperwork.organizationId = :organizationId and wxPaidOrders.status >= 3",
          {
            id: id,
            organizationId: user.organizationId,
          }
        )
        .getOneOrFail();

      return model;
    } else {
      const model = await Paperwork.createQueryBuilder("paperwork")
        .leftJoinAndSelect(
          "paperwork.legalDocumentProject",
          "legalDocumentProject"
        )
        .leftJoinAndSelect("paperwork.wxUser", "wxUser")
        .leftJoinAndSelect("paperwork.wxPaidOrders", "wxPaidOrders")
        .leftJoinAndSelect(
          "legalDocumentProject.legalDocumentElements",
          "legalDocumentElements"
        )
        .leftJoinAndSelect(
          "legalDocumentProject.legalDocumentTemplates",
          "legalDocumentTemplates"
        )
        .leftJoinAndSelect("paperwork.lawyer", "lawyer")
        .leftJoinAndSelect("wxPaidOrders.commodity", "commodity")
        // .leftJoinAndSelect("commodity.lawyers", "lawyers")
        .where(
          "paperwork.id = :id and paperwork.organizationId = :organizationId and wxPaidOrders.status >= 3 and lawyer.id = :lawyerId",
          {
            id: id,
            lawyerId: user.id,
            organizationId: user.organizationId,
          }
        )

        .getOneOrFail();
      return model;
    }
  }

  @UseMiddleware([IsAdminAndLawyerAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async notiPaperworkToWxUser(
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const Docxtemplater = require("docxtemplater");
    const JSZip = require("jszip");
    const paperwork = await Paperwork.findOneOrFail(id, {
      relations: [
        "wxUser",
        "wxPaidOrders",
        "wxPaidOrders.commodity",
        "legalDocumentProject",
        "legalDocumentProject.legalDocumentTemplates",
      ],
    });
    if (!paperwork.wxPaidOrdersId) {
      throw new CommonError("Order is empty");
    }
    if (!isNonEmptyString(paperwork.reviewDocJson)) {
      throw new CommonError("Doc is empty");
    }
    if (paperwork.legalDocumentProject.legalDocumentTemplates.length < 1) {
      throw new CommonError("Template is empty");
    }
    if (
      path.extname(
        paperwork.legalDocumentProject.legalDocumentTemplates[0].fileUrl
      ) !== ".docx"
    ) {
      throw new CommonError("Error file type");
    }
    const fileUrl =
      paperwork.legalDocumentProject.legalDocumentTemplates[0].fileUrl;
    try {
      const reviewDocModel = JSON.parse(
        paperwork.reviewDocJson.replace(/\n/g, "\\n").replace(/\r/g, "\\r")
      );
      const data = await new Promise<String>((resolve, reject) => {
        axios
          .get(fileUrl, {
            responseType: "arraybuffer", // 指示axios返回ArrayBuffer
          })
          .then((response: { data: string }) => {
            const uuid = require("uuid");
            const uuidStr = uuid.v1().replace(/-/g, "");
            const filePathDocx = path.join(
              process.cwd(),
              `file/${uuidStr}.docx`
            );
            console.log(filePathDocx);
            if (!fs.existsSync(path.join(process.cwd(), "file"))) {
              fs.mkdirSync(path.join(process.cwd(), "file"));
            }
            // 你可以在这里处理文件内容，例如将其保存到本地或进行其他处理
            const fileContent = Buffer.from(response.data, "binary");
            // fileContent现在包含了文件的内容，你可以将其写入本地文件，或进行其他处理
            fs.writeFile(filePathDocx, fileContent, async (err: any) => {
              if (err) {
                console.error("Error writing file:", err);
                reject("Error writing file");
                return;
              } else {
                console.log(`File has been saved to ${filePathDocx}`);

                // 读取 .docx 文件
                const content = fs.readFileSync(filePathDocx);
                // 解压缩 .docx 文件
                const zip = new JSZip(content);

                // 创建 docxtemplater 实例
                // const doc = new Docxtemplater();
                // doc.loadZip(zip);
                const doc = new Docxtemplater(zip, {
                  paragraphLoop: true,
                  linebreaks: true,
                });

                // 准备要插入的字符串
                // const data = reviewDocModel;
                //==
                let data: any = {};
                for (const key in reviewDocModel) {
                  if (
                    typeof reviewDocModel[key] === "object" &&
                    reviewDocModel[key] !== null &&
                    !Array.isArray(reviewDocModel[key])
                  ) {
                    const subObject = reviewDocModel[key];
                    for (const subKey in subObject) {
                      data[`${subKey}`] = subObject[subKey];
                    }
                  } else {
                    data[key] = reviewDocModel[key];
                  }
                }
                //==
                // 将数据填充到 .docx 模板中
                doc.setData(data);
                doc.render();

                // 将文档生成为一个 Buffer
                const buffer = doc.getZip().generate({ type: "nodebuffer" });
                const outputFilePathDocx = path.join(
                  process.cwd(),
                  `file/output${uuidStr}.docx`
                );
                // 写入到新的 .docx 文件
                fs.writeFileSync(outputFilePathDocx, buffer);
                console.log("写入成功");

                const name =
                  uuidStr.slice(0, 1) +
                  "/" +
                  uuidStr.slice(1, 2) +
                  "/" +
                  paperwork.wxPaidOrders.out_trade_no +
                  path.extname(outputFilePathDocx);
                const oss = OSSmanager.getInstance();
                await oss.put(name, fs.createReadStream(outputFilePathDocx));
                if (fs.existsSync(filePathDocx)) {
                  console.log("delete filePathDocx:" + filePathDocx);
                  fs.unlinkSync(filePathDocx);
                }
                if (fs.existsSync(outputFilePathDocx)) {
                  console.log(
                    "delete outputFilePathDocx:" + outputFilePathDocx
                  );
                  fs.unlinkSync(outputFilePathDocx);
                }
                console.log(name);
                resolve(`${process.env.OSS_FILE}/${name}`);
              }
            });
          })
          .catch((error: any) => {
            console.error("Error fetching the file:", error);
            reject("Error fetching the file");
          });
      });
      if (data.includes("Error")) {
        throw new CommonError(data.toString());
      }
      paperwork.state = "approved";
      paperwork.fileUrl = data.toString();
      await paperwork.save();
      await WxPaidOrders.update(paperwork.wxPaidOrdersId, {
        status: 4,
      });

      //发送短信通知
      if (
        paperwork.wxUser.phoneNumber !== null &&
        paperwork.wxUser.phoneNumber !== ""
      ) {
        const result = await sendSmsPaperWork(
          paperwork.wxUser.phoneNumber,
          paperwork.wxPaidOrders.commodity.name,
          paperwork.wxPaidOrders.out_trade_no
        );
        console.log(result);
      }

      const access_token = await getAccessToken();
      console.log(access_token);
      const res = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${access_token}`,
        {
          touser: paperwork.wxUser.openId,
          template_id: process.env.WX_TEMPLATE_ID8,
          url: `https://${process.env.WECHAT_H5}/#/writDetail/${paperwork.wxPaidOrders.out_trade_no}`,
          data: {
            character_string8: {
              value: paperwork.wxPaidOrders.out_trade_no,
            },
            thing25: {
              value:
                paperwork.wxPaidOrders.commodity.name.length > 20
                  ? paperwork.wxPaidOrders.commodity.name.substring(0, 19) + "…"
                  : paperwork.wxPaidOrders.commodity.name,
            },
            time35: {
              value: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
            },
          },
        }
      );
      console.log(res.data);
      if (res.data.errcode != 0) {
        throw new CommonError(res.data.errmsg);
      }
    } catch (error: any) {
      if (error.response) {
        throw new CommonError(JSON.stringify(error.response.data));
      } else if (error.request) {
        throw new CommonError(JSON.stringify(error.request));
      } else {
        throw new CommonError(error.message);
      }
    }

    return true;
  }

  @UseMiddleware([IsAdminAndLawyerAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async sendPaperworkToWxUser(
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const paperwork = await Paperwork.findOneOrFail(id, {
      relations: [
        "wxUser",
        "wxPaidOrders",
        "wxPaidOrders.commodity",
        "legalDocumentProject",
        "legalDocumentProject.legalDocumentTemplates",
      ],
    });
    if (!paperwork.wxPaidOrdersId) {
      throw new CommonError("Order is empty");
    }
    if (!isNonEmptyString(paperwork.reviewDocJson)) {
      throw new CommonError("Doc is empty");
    }
    if (paperwork.legalDocumentProject.legalDocumentTemplates.length < 1) {
      throw new CommonError("Template is empty");
    }
    if (
      path.extname(
        paperwork.legalDocumentProject.legalDocumentTemplates[0].fileUrl
      ) !== ".docx"
    ) {
      throw new CommonError("Error file type");
    }
    if (!isNonEmptyString(paperwork.fileUrl)) {
      throw new CommonError("File is empty");
    }
    try {
      paperwork.state = "approved";
      // paperwork.fileUrl = data.toString();
      await paperwork.save();
      await WxPaidOrders.update(paperwork.wxPaidOrdersId, {
        status: 4,
      });

      //发送短信通知
      if (
        paperwork.wxUser.phoneNumber !== null &&
        paperwork.wxUser.phoneNumber !== ""
      ) {
        const result = await sendSmsPaperWork(
          paperwork.wxUser.phoneNumber,
          paperwork.wxPaidOrders.commodity.name,
          paperwork.wxPaidOrders.out_trade_no
        );
        console.log(result);
      }

      const access_token = await getAccessToken();
      console.log(access_token);
      const res = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${access_token}`,
        {
          touser: paperwork.wxUser.openId,
          template_id: process.env.WX_TEMPLATE_ID8,
          url: `https://${process.env.WECHAT_H5}/#/writDetail/${paperwork.wxPaidOrders.out_trade_no}`,
          data: {
            character_string8: {
              value: paperwork.wxPaidOrders.out_trade_no,
            },
            thing25: {
              value:
                paperwork.wxPaidOrders.commodity.name.length > 20
                  ? paperwork.wxPaidOrders.commodity.name.substring(0, 19) + "…"
                  : paperwork.wxPaidOrders.commodity.name,
            },
            time35: {
              value: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
            },
          },
        }
      );
      console.log(res.data);
      if (res.data.errcode != 0) {
        throw new CommonError(res.data.errmsg);
      }
    } catch (error: any) {
      if (error.response) {
        throw new CommonError(JSON.stringify(error.response.data));
      } else if (error.request) {
        throw new CommonError(JSON.stringify(error.request));
      } else {
        throw new CommonError(error.message);
      }
    }

    return true;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => Paperwork)
  async saveWxUserPaperwork(
    @Arg("paperwork")
    paperworkInput: PaperworkSaveInput
  ): Promise<Paperwork> {
    const model = await Paperwork.findOneOrFail({
      uuid: paperworkInput.uuid,
    });
    await Paperwork.update(model.id, paperworkInput);
    return await Paperwork.findOneOrFail(model.id);
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => [Paperwork])
  async getSelfPaperworks(
    @Arg("openid", () => String) openid: string,
    @Arg("state", () => String, { nullable: true }) state: string,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<Paperwork[]> {
    const wxUser = await WxUser.findOneOrFail({
      openId: openid,
    });
    // let input: any = {
    //   wxUserId: wxUser.id,
    // };

    // if (isNonEmptyString(state)) {
    //   input.state = state;
    // }
    // const res = await Paperwork.find({
    //   where: input,
    //   relations: [
    //     "legalDocumentProject",
    //     "wxPaidOrders",
    //     "wxPaidOrders.commodity",
    //   ],
    //   skip: Number.isFinite(skip) ? skip : 0,
    //   take: Number.isFinite(take) ? take : 300,
    // });
    let sql = `paperwork.wxUserId = '${wxUser.id}'`;
    if (isNonEmptyString(state)) {
      sql += ` and paperwork.state = '${state}'`;
    }
    // console.log(input);
    console.log(`sql:` + sql);
    const repository = getRepository(Paperwork);
    const res = await repository
      .createQueryBuilder("paperwork")
      .withDeleted()
      .leftJoinAndSelect(
        "paperwork.legalDocumentProject",
        "legalDocumentProject"
      )
      .leftJoinAndSelect("paperwork.wxPaidOrders", "wxPaidOrders")
      .leftJoinAndSelect("wxPaidOrders.commodity", "commodity")
      .where(sql)
      .skip(Number.isFinite(skip) ? skip : 0)
      .take(Number.isFinite(take) ? take : 300)
      .getMany();
    return res;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => PaperworkResult)
  async getSelfPaperworksAndCount(
    @Arg("openid", () => String) openid: string,
    @Arg("state", () => String, { nullable: true }) state: string,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<PaperworkResult> {
    const wxUser = await WxUser.findOneOrFail({
      openId: openid,
    });
    // let input: any = {
    //   wxUserId: wxUser.id,
    // };

    // if (isNonEmptyString(state)) {
    //   input.state = state;
    // }
    // const [models, count] = await Paperwork.findAndCount({
    //   where: input,
    //   relations: [
    //     "legalDocumentProject",
    //     "wxPaidOrders",
    //     "wxPaidOrders.commodity",
    //   ],
    //   skip: Number.isFinite(skip) ? skip : 0,
    //   take: Number.isFinite(take) ? take : 300,
    // });
    let sql = `paperwork.wxUserId = '${wxUser.id}'`;
    if (isNonEmptyString(state)) {
      sql += ` and paperwork.state = '${state}'`;
    }
    // console.log(input);
    console.log(`sql:` + sql);
    const repository = getRepository(Paperwork);
    const [models, count] = await repository
      .createQueryBuilder("paperwork")
      .withDeleted()
      .leftJoinAndSelect(
        "paperwork.legalDocumentProject",
        "legalDocumentProject"
      )
      .leftJoinAndSelect("paperwork.wxPaidOrders", "wxPaidOrders")
      .leftJoinAndSelect("wxPaidOrders.commodity", "commodity")
      .where(sql)
      .skip(Number.isFinite(skip) ? skip : 0)
      .take(Number.isFinite(take) ? take : 300)
      .getManyAndCount();
    const res = new PaperworkResult();
    res.data = models;
    res.totalCount = count;
    return res;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => Paperwork)
  async getPaperworkByWxPaidOrdersId(
    @Arg("openid", () => String) openid: string,
    @Arg("out_trade_no", () => String) out_trade_no: string
  ): Promise<Paperwork> {
    const wxUser = await WxUser.findOneOrFail({
      openId: openid,
    });
    const order = await WxPaidOrders.findOneOrFail({
      where: {
        out_trade_no: out_trade_no,
        wxUserId: wxUser.id,
      },
    });
    let input: any = {
      wxUserId: wxUser.id,
      wxPaidOrdersId: order.id,
    };
    const res = await Paperwork.findOneOrFail({
      where: input,
      relations: [
        "legalDocumentProject",
        "wxPaidOrders",
        "wxPaidOrders.commodity",
      ],
    });
    return res;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => Paperwork)
  async getPaperworkByWxPaidOrdersIdNoAuth(
    @Arg("out_trade_no", () => String) out_trade_no: string
  ): Promise<Paperwork> {
    // const wxUser = await WxUser.findOneOrFail({
    //   openId: openid,
    // });
    const order = await WxPaidOrders.findOneOrFail({
      where: {
        out_trade_no: out_trade_no,
        // wxUserId: wxUser.id,
      },
    });
    let input: any = {
      // wxUserId: wxUser.id,
      wxPaidOrdersId: order.id,
    };
    const res = await Paperwork.findOneOrFail({
      where: input,
      relations: [
        "legalDocumentProject",
        "wxPaidOrders",
        "wxPaidOrders.commodity",
      ],
    });
    return res;
  }

  @UseMiddleware([IsTestAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async adminNotiPaperworkToWxUser(
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const Docxtemplater = require("docxtemplater");
    const JSZip = require("jszip");
    const paperwork = await Paperwork.findOneOrFail(id, {
      relations: [
        "wxUser",
        "wxPaidOrders",
        "wxPaidOrders.commodity",
        "legalDocumentProject",
        "legalDocumentProject.legalDocumentTemplates",
        "wxPaidOrders.commodity.lawyers",
        "wxPaidOrders.commodity.lawyers.wxUser",
      ],
    });
    if (!paperwork.wxPaidOrdersId) {
      throw new CommonError("Order is empty");
    }
    if (!isNonEmptyString(paperwork.reviewDocJson)) {
      throw new CommonError("Doc is empty");
    }
    if (paperwork.legalDocumentProject.legalDocumentTemplates.length < 1) {
      throw new CommonError("Template is empty");
    }
    if (
      path.extname(
        paperwork.legalDocumentProject.legalDocumentTemplates[0].fileUrl
      ) !== ".docx"
    ) {
      throw new CommonError("Error file type");
    }
    const fileUrl =
      paperwork.legalDocumentProject.legalDocumentTemplates[0].fileUrl;
    try {
      console.log("ready reviewDocModel");
      const reviewDocModel = JSON.parse(
        paperwork.reviewDocJson.replace(/\n/g, "\\n").replace(/\r/g, "\\r")
      );
      console.log("get reviewDocModel");
      const data = await new Promise<String>((resolve, reject) => {
        axios
          .get(fileUrl, {
            responseType: "arraybuffer", // 指示axios返回ArrayBuffer
          })
          .then((response: { data: string }) => {
            const uuid = require("uuid");
            const uuidStr = uuid.v1().replace(/-/g, "");
            const filePathDocx = path.join(
              process.cwd(),
              `file/${uuidStr}.docx`
            );
            console.log(filePathDocx);
            if (!fs.existsSync(path.join(process.cwd(), "file"))) {
              fs.mkdirSync(path.join(process.cwd(), "file"));
            }
            // 你可以在这里处理文件内容，例如将其保存到本地或进行其他处理
            const fileContent = Buffer.from(response.data, "binary");
            // fileContent现在包含了文件的内容，你可以将其写入本地文件，或进行其他处理
            fs.writeFile(filePathDocx, fileContent, async (err: any) => {
              if (err) {
                console.error("Error writing file:", err);
                reject("Error writing file");
                return;
              } else {
                console.log(`File has been saved to ${filePathDocx}`);

                // 读取 .docx 文件
                const content = fs.readFileSync(filePathDocx);
                // 解压缩 .docx 文件
                const zip = new JSZip(content);

                // 创建 docxtemplater 实例
                // const doc = new Docxtemplater();
                // doc.loadZip(zip);
                const doc = new Docxtemplater(zip, {
                  paragraphLoop: true,
                  linebreaks: true,
                });

                // 准备要插入的字符串
                // const data = reviewDocModel;
                let data: any = {};
                for (const key in reviewDocModel) {
                  if (
                    typeof reviewDocModel[key] === "object" &&
                    reviewDocModel[key] !== null &&
                    !Array.isArray(reviewDocModel[key])
                  ) {
                    const subObject = reviewDocModel[key];
                    for (const subKey in subObject) {
                      data[`${subKey}`] = subObject[subKey];
                    }
                  } else {
                    data[key] = reviewDocModel[key];
                  }
                }
                // 将数据填充到 .docx 模板中
                doc.setData(data);
                doc.render();

                // 将文档生成为一个 Buffer
                const buffer = doc.getZip().generate({ type: "nodebuffer" });
                const outputFilePathDocx = path.join(
                  process.cwd(),
                  `file/output${uuidStr}.docx`
                );
                // 写入到新的 .docx 文件
                fs.writeFileSync(outputFilePathDocx, buffer);
                console.log("写入成功");

                const name =
                  uuidStr.slice(0, 1) +
                  "/" +
                  uuidStr.slice(1, 2) +
                  "/" +
                  paperwork.wxPaidOrders.out_trade_no +
                  path.extname(outputFilePathDocx);
                const oss = OSSmanager.getInstance();
                await oss.put(name, fs.createReadStream(outputFilePathDocx));
                const nameAI =
                  uuidStr.slice(0, 1) +
                  "/" +
                  uuidStr.slice(1, 2) +
                  "/" +
                  paperwork.wxPaidOrders.out_trade_no +
                  "_ai" +
                  path.extname(outputFilePathDocx);
                const ossAi = OSSmanager.getInstance();
                await ossAi.put(
                  nameAI,
                  fs.createReadStream(outputFilePathDocx)
                );
                if (fs.existsSync(filePathDocx)) {
                  console.log("delete filePathDocx:" + filePathDocx);
                  fs.unlinkSync(filePathDocx);
                }
                if (fs.existsSync(outputFilePathDocx)) {
                  console.log(
                    "delete outputFilePathDocx:" + outputFilePathDocx
                  );
                  fs.unlinkSync(outputFilePathDocx);
                }

                console.log(name);
                resolve(
                  `${process.env.OSS_FILE}/${name},${process.env.OSS_FILE}/${nameAI}`
                );
              }
            });
          })
          .catch((error: any) => {
            console.error("Error fetching the file:", error);
            reject("Error fetching the file");
          });
      });
      console.log("create file");
      if (data.includes("Error")) {
        throw new CommonError(data.toString());
      }
      console.log(data.toString());
      if (
        paperwork.wxPaidOrders.commodity.lawyers &&
        paperwork.wxPaidOrders.commodity.lawyers.length > 0
      ) {
        const randomNum = Math.floor(
          Math.random() * paperwork.wxPaidOrders.commodity.lawyers.length
        );
        const lawyerId = paperwork.wxPaidOrders.commodity.lawyers[randomNum].id;
        const lawyer = await User.findOneOrFail(lawyerId, {
          relations: ["wxUser"],
        });
        console.log("lawyer:" + lawyer.name);
        const fileUrlArr = data.split(",");
        paperwork.fileUrl = fileUrlArr[0];
        paperwork.aiFileUrl = fileUrlArr[1];
        paperwork.lawyerId = lawyerId;
        await paperwork.save();
        await WxPaidOrders.update(paperwork.wxPaidOrdersId, {
          status: 3,
        });
        if (lawyer.wxUser) {
          const pendingCount = await Paperwork.count({
            where: {
              lawyerId: lawyerId,
              state: "unapproved",
            },
          });
          const access_token = await getAccessToken();
          console.log(access_token);
          let thing4 = "";
          if (
            paperwork.wxPaidOrders.commodity.name.length +
              `（${pendingCount + 1}条待办）`.length >
            20
          ) {
            let sub = 20 - `（${pendingCount + 1}条待办）`.length - 1;
            thing4 = `${paperwork.wxPaidOrders.commodity.name.substring(
              0,
              sub
            )}…（${pendingCount + 1}条待办）`;
          } else {
            thing4 = `${paperwork.wxPaidOrders.commodity.name}（${
              pendingCount + 1
            }条待办）`;
          }
          // const thing4 = `${
          //   paperwork.wxPaidOrders.commodity.name.length > 13
          //     ? paperwork.wxPaidOrders.commodity.name.substring(0, 10) + "..."
          //     : paperwork.wxPaidOrders.commodity.name
          // }（剩${pendingCount + 1}条待办）`;
          console.log(thing4);
          const res = await axios.post(
            `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${access_token}`,
            {
              touser: lawyer.wxUser.openId,
              template_id: process.env.WX_TEMPLATE_ID2,
              // url: `https://orth5.saasflow.cn/#/writDetail/${paperwork.wxPaidOrders.out_trade_no}`,
              data: {
                character_string2: {
                  value: paperwork.wxPaidOrders.out_trade_no,
                },
                thing4: {
                  value: thing4,
                },
                time13: {
                  value: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
                },
              },
            }
          );
          console.log(res.data);
          if (res.data.errcode != 0) {
            throw new CommonError(res.data.errmsg);
          }
        }

        // paperwork.state = "approved";
      } else {
        paperwork.state = "approved";
        const fileUrlArr = data.split(",");
        paperwork.fileUrl = fileUrlArr[0];
        paperwork.aiFileUrl = fileUrlArr[1];
        await paperwork.save();
        await WxPaidOrders.update(paperwork.wxPaidOrdersId, {
          status: 4,
        });
        console.log("no assign lawyer");
        //发送短信通知
        if (
          paperwork.wxUser.phoneNumber !== null &&
          paperwork.wxUser.phoneNumber !== ""
        ) {
          const result = await sendSmsPaperWork(
            paperwork.wxUser.phoneNumber,
            paperwork.wxPaidOrders.commodity.name,
            paperwork.wxPaidOrders.out_trade_no
          );
          console.log(result);
        }
        const access_token = await getAccessToken();
        console.log(access_token);
        const res = await axios.post(
          `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${access_token}`,
          {
            touser: paperwork.wxUser.openId,
            template_id: process.env.WX_TEMPLATE_ID8,
            url: `https://${process.env.WECHAT_H5}/#/writDetail/${paperwork.wxPaidOrders.out_trade_no}`,
            data: {
              character_string8: {
                value: paperwork.wxPaidOrders.out_trade_no,
              },
              thing25: {
                value:
                  paperwork.wxPaidOrders.commodity.name.length > 20
                    ? paperwork.wxPaidOrders.commodity.name.substring(0, 19) +
                      "…"
                    : paperwork.wxPaidOrders.commodity.name,
              },
              time35: {
                value: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
              },
            },
          }
        );
        console.log(res.data);
        if (res.data.errcode != 0) {
          throw new CommonError(res.data.errmsg);
        }
      }
    } catch (error: any) {
      if (error.response) {
        throw new CommonError(JSON.stringify(error.response.data));
      } else if (error.request) {
        throw new CommonError(JSON.stringify(error.request));
      } else {
        throw new CommonError(error.message);
      }
    }

    return true;
  }

  @UseMiddleware([
    IsAdminAndLawyerAndOperatorAuth,
    ErrorInterceptor,
    ResolveTime,
  ])
  @Query(() => String)
  async getPaperworkGenerateWebofficeToken(
    @Arg("id", () => Int) id: number,
    @Ctx() ctx: GQLContext
  ): Promise<String> {
    const user = ctx.req.currentUser;
    const paperwork = await Paperwork.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
    });
    if (!isNonEmptyString(paperwork.fileUrl)) {
      throw new CommonError("No found file");
    }
    const config = JSON.parse(process.env.OSS_CONFIG);
    const Core = require("@alicloud/pop-core");
    // 创建客户端
    let client = new Core({
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      endpoint: process.env.OSS_ENDPOINT,
      apiVersion: process.env.OSS_APIVERSION,
    });

    let params = {
      // RegionId: "	us-west-1",
      Action: "GenerateWebofficeToken",
      // FileId: paperwork.fileUrl,
      ProjectName: "ort",
      // SourceURI: `oss://${config.bucket}/${path.parse(paperwork.fileUrl).name}`,
      SourceURI: `oss://${config.bucket}/${paperwork.fileUrl.replace(
        `${process.env.OSS_FILE}/`,
        ""
      )}`,
      // UserId: "your-user-id",
      // 其他必要的参数
    };
    console.log(params);
    let requestOption = {
      method: "POST",
    };

    const res = await client.request(
      "GenerateWebofficeToken",
      params,
      requestOption
    );
    return JSON.stringify(res);
  }

  @UseMiddleware([
    IsAdminAndLawyerAndOperatorAuth,
    ErrorInterceptor,
    ResolveTime,
  ])
  @Query(() => String)
  async refreshWebofficeToken(
    @Arg("refreshToken", () => String) refreshToken: string,
    @Arg("accessToken", () => String) accessToken: string
  ): Promise<String> {
    const config = JSON.parse(process.env.OSS_CONFIG);
    const Core = require("@alicloud/pop-core");
    // 创建客户端
    let client = new Core({
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      endpoint: process.env.OSS_ENDPOINT,
      apiVersion: process.env.OSS_APIVERSION,
    });

    let params = {
      // RegionId: "	us-west-1",
      Action: "RefreshWebofficeToken",
      // FileId: paperwork.fileUrl,
      ProjectName: "ort",
      RefreshToken: refreshToken,
      AccessToken: accessToken,
    };

    let requestOption = {
      method: "POST",
    };

    const res = await client.request(
      "RefreshWebofficeToken",
      params,
      requestOption
    );
    return JSON.stringify(res);
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getWxUserJsapiTicket(
    @Arg("openid", () => String) openid: string,
    @Arg("url", () => String) url: string
  ): Promise<String> {
    await WxUser.findOneOrFail({
      where: {
        openId: openid,
      },
    });
    let timestamp = Math.floor(new Date().getTime() / 1000);
    let nonce_str = await createRandomString(16);
    const ticket = await getJsapiTicket();

    const signStr = `jsapi_ticket=${ticket}&noncestr=${nonce_str}&timestamp=${timestamp}&url=${url}`;
    console.log(signStr);
    const crypto = require("crypto");
    const hash = crypto.createHash("sha1").update(signStr).digest("hex");
    return JSON.stringify({
      noncestr: nonce_str,
      timestamp: timestamp,
      hash: hash,
    });
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => String)
  async testCreatePaperworkFile(
    @Arg("id", () => Int) id: number
  ): Promise<String> {
    const Docxtemplater = require("docxtemplater");
    const JSZip = require("jszip");
    const paperwork = await Paperwork.findOneOrFail(id, {
      relations: [
        "wxUser",
        "wxPaidOrders",
        "wxPaidOrders.commodity",
        "legalDocumentProject",
        "legalDocumentProject.legalDocumentTemplates",
      ],
    });
    if (!paperwork.wxPaidOrdersId) {
      throw new CommonError("Order is empty");
    }
    if (!isNonEmptyString(paperwork.reviewDocJson)) {
      throw new CommonError("Doc is empty");
    }
    if (paperwork.legalDocumentProject.legalDocumentTemplates.length < 1) {
      throw new CommonError("Template is empty");
    }
    if (
      path.extname(
        paperwork.legalDocumentProject.legalDocumentTemplates[0].fileUrl
      ) !== ".docx"
    ) {
      throw new CommonError("Error file type");
    }
    const fileUrl =
      paperwork.legalDocumentProject.legalDocumentTemplates[0].fileUrl;
    try {
      const reviewDocModel = JSON.parse(
        paperwork.reviewDocJson.replace(/\n/g, "\\n").replace(/\r/g, "\\r")
      );
      const data = await new Promise<String>((resolve, reject) => {
        axios
          .get(fileUrl, {
            responseType: "arraybuffer", // 指示axios返回ArrayBuffer
          })
          .then((response: { data: string }) => {
            const uuid = require("uuid");
            const uuidStr = uuid.v1().replace(/-/g, "");
            const filePathDocx = path.join(
              process.cwd(),
              `file/${uuidStr}.docx`
            );
            console.log(filePathDocx);
            if (!fs.existsSync(path.join(process.cwd(), "file"))) {
              fs.mkdirSync(path.join(process.cwd(), "file"));
            }
            // 你可以在这里处理文件内容，例如将其保存到本地或进行其他处理
            const fileContent = Buffer.from(response.data, "binary");
            // fileContent现在包含了文件的内容，你可以将其写入本地文件，或进行其他处理
            fs.writeFile(filePathDocx, fileContent, async (err: any) => {
              if (err) {
                console.error("Error writing file:", err);
                reject("Error writing file");
                return;
              } else {
                console.log(`File has been saved to ${filePathDocx}`);

                // 读取 .docx 文件
                const content = fs.readFileSync(filePathDocx);
                // 解压缩 .docx 文件
                const zip = new JSZip(content);

                // 创建 docxtemplater 实例
                // const doc = new Docxtemplater();
                // doc.loadZip(zip);、
                const doc = new Docxtemplater(zip, {
                  paragraphLoop: true,
                  linebreaks: true,
                });

                // 准备要插入的字符串
                // const data = reviewDocModel;
                //==
                let data: any = {};
                for (const key in reviewDocModel) {
                  console.log(key);
                  if (
                    typeof reviewDocModel[key] === "object" &&
                    reviewDocModel[key] !== null &&
                    !Array.isArray(reviewDocModel[key])
                  ) {
                    const subObject = reviewDocModel[key];
                    for (const subKey in subObject) {
                      data[`${subKey}`] = subObject[subKey];
                      console.log(subObject[subKey]);
                    }
                  } else {
                    data[key] = reviewDocModel[key];
                    console.log(reviewDocModel[key]);
                  }
                }
                console.log(reviewDocModel);
                console.log(data);
                //==
                // 将数据填充到 .docx 模板中
                doc.setData(data);
                doc.render();

                // 将文档生成为一个 Buffer
                const buffer = doc.getZip().generate({ type: "nodebuffer" });
                const outputFilePathDocx = path.join(
                  process.cwd(),
                  `file/output${uuidStr}.docx`
                );
                // 写入到新的 .docx 文件
                fs.writeFileSync(outputFilePathDocx, buffer);
                console.log("写入成功");

                const name =
                  uuidStr.slice(0, 1) +
                  "/" +
                  uuidStr.slice(1, 2) +
                  "/" +
                  paperwork.wxPaidOrders.out_trade_no +
                  path.extname(outputFilePathDocx);
                const oss = OSSmanager.getInstance();
                await oss.put(name, fs.createReadStream(outputFilePathDocx));
                if (fs.existsSync(filePathDocx)) {
                  console.log("delete filePathDocx:" + filePathDocx);
                  fs.unlinkSync(filePathDocx);
                }
                if (fs.existsSync(outputFilePathDocx)) {
                  console.log(
                    "delete outputFilePathDocx:" + outputFilePathDocx
                  );
                  fs.unlinkSync(outputFilePathDocx);
                }
                console.log(name);
                resolve(`${process.env.OSS_FILE}/${name}`);
              }
            });
          })
          .catch((error: any) => {
            console.error("Error fetching the file:", error);
            reject("Error fetching the file");
          });
      });
      if (data.includes("Error")) {
        throw new CommonError(data.toString());
      }
      return data;
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
}

export default PaperworkResolver;
