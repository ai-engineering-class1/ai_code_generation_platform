import { Resolver, UseMiddleware, Mutation, Arg, Int } from "type-graphql";
import { ErrorInterceptor } from "@/middlewares/errorInterceptor";
// import { signToken } from "@/utils/authToken";
// import { createClient } from "redis";
import redis from "ioredis";
import {
  startOfDay,
  endOfDay,
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";
import {
  Commodity,
  LegalDocumentProject,
  WxUser,
  Distributor,
  User,
  DistributorWithdrawFunds,
  WxPaidOrders,
  Paperwork,
  MailListen,
} from "@/models";
import { IsNull, MoreThan, getRepository, Between } from "typeorm";
import axios from "axios";
import { getAccessToken } from "@/utils/common";
import { isNonEmptyString } from "@/utils/validations";
import { encryptedName, wxResourceDecrypt } from "@/utils/encode";
import {
  getDistributorAllShare,
  getDistributorCommissionBalanceOrderIds,
} from "@/utils/distributorSplitRatio";
import { hashPassword, verifyPassword } from "@/utils/authToken";
import { sendSmsCode } from "@/utils/aliyunSMS";
import path from "path";
import fs from "fs";
// import { OSSmanager } from "@/utils/staticClass";
import { CommonError } from "@/errors";
import { sendMailFromMailSender } from "@/service/mailListener";
import {
  requestPerplexityJsonParseEmailContent,
  getCustomerProfilePersonFromChatGPT,
  getCustomerProfileCompanyFromChatGPT,
} from "@/utils/chatAi";
import {
  getLast7DaysStart,
  getThisMonthStart,
  getThisWeekStart,
  getTodayStart,
  getYesterdayStart,
  getLast30DaysStart,
  getThisWeekDaysUntilToday,
  getWeeksOfThisMonthUntilNow,
} from "@/utils/dateTime";
import { ResolveTime } from "@/middlewares";

const client = new redis(process.env.REDIS_URL);

function createRandomNumber(len: number) {
  let data = "1234567890"; //"ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
  let str = "";
  for (let i = 0; i < len; i++) {
    str += data.charAt(Math.floor(Math.random() * data.length));
  }
  return str;
}
@Resolver()
class ActionTestResolver {
  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest1(): Promise<string> {
    // const client = await createClient({
    //   url: process.env.REDIS_URL,
    // }).connect();
    // await client.set("key", "value");
    // const value = await client.get("key");
    // console.log(value);
    // await client.disconnect();
    const client = new redis(process.env.REDIS_URL);
    await client.set("key", "value", "EX", 3600);
    const v = await client.get("key");
    console.log(v);
    return "guest"; //signToken({ sub: user.id });
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest2(): Promise<string> {
    const time = format(new Date(), "yyyy-MM-dd HH:mm:ss");
    console.log(time);
    const time1 = format(new Date(), "yyMMddHHmmss");
    console.log(time1 + createRandomNumber(4));
    return "guest"; //signToken({ sub: user.id });
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest3(): Promise<string> {
    const fs = require("fs");
    const Docxtemplater = require("docxtemplater");
    const JSZip = require("jszip");

    // 读取 .docx 文件
    const content = fs.readFileSync("template.docx");
    // 解压缩 .docx 文件
    const zip = new JSZip(content);

    // 创建 docxtemplater 实例
    const doc = new Docxtemplater();
    doc.loadZip(zip);

    // 准备要插入的字符串
    const data = {
      myText: "这是要插入的字符串1111111111111111111111111111111111111",
    };

    // 将数据填充到 .docx 模板中
    doc.setData(data);
    doc.render();

    // 将文档生成为一个 Buffer
    const buffer = doc.getZip().generate({ type: "nodebuffer" });
    // 写入到新的 .docx 文件
    fs.writeFileSync("output.docx", buffer);
    console.log("写入成功");
    return "guest"; //signToken({ sub: user.id });
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest4(): Promise<string> {
    const createdDate = new Date("2024-06-11T06:00:00Z").getTime();
    console.log(new Date("2024-06-11T14:00:00Z").toISOString());
    console.log(new Date());
    console.log(createdDate);
    const currentDate = new Date().getTime();
    console.log(currentDate);
    const timeDifference = currentDate - createdDate;

    const timeDifferenceInMinutes = timeDifference / (1000 * 60);
    console.log(timeDifferenceInMinutes);
    if (timeDifferenceInMinutes > 30) {
      console.log("时间差大于30分钟，执行操作");
    }
    return "guest"; //signToken({ sub: user.id });
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => [Commodity])
  async actionTest5(
    @Arg("openid", () => String) openid: string
  ): Promise<Commodity[]> {
    const wxUser = await WxUser.findOneOrFail({
      openId: openid,
    });
    const testingCommoditys = await Commodity.find({
      where: [
        {
          organizationId: wxUser.organizationId,
          status: "Testing",
          state: "Public",
          stock: IsNull(),
        },
        {
          organizationId: wxUser.organizationId,
          status: "Testing",
          state: "Public",
          stock: MoreThan(0),
        },
      ],
      relations: ["legalDocumentProject", "legalDocumentProject.testers"],
    });
    return testingCommoditys;
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest6(): Promise<string> {
    const input = {
      expire_seconds: 604800,
      action_name: "QR_STR_SCENE",
      action_info: { scene: { scene_str: "test" } },
    };
    const access_token = await getAccessToken();
    const codeUrlRes = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${access_token}`,
      JSON.stringify(input),
      {
        headers: {
          "content-type": "application/json",
        },
      }
    );
    if (codeUrlRes.status === 200) {
      console.log(codeUrlRes.data);
    } else {
      console.log(codeUrlRes);
    }

    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest7(): Promise<string> {
    const QRCode = require("qrcode");

    // 定义二维码内容，可以是带参数的 URL 或任何字符串
    const qrContent =
      "https://ort.saasflow.cn?qrcode=333333333333333333333333333333333333333333";
    // QRCode.toDataURL(qrContent, (err: any, url: any) => {
    //   if (err) throw err;
    //   console.log(url);
    // });
    const res = await QRCode.toDataURL(qrContent);
    console.log(res);
    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest8(): Promise<string> {
    const token = "Easiio2024";
    const nonce = "409848331";
    const signature = "2c6f5bdc8042c551109edb412af1ebf583ffc84c";
    const timestamp = "1719906301";
    const verifyStr = `${timestamp}${nonce}${token}`;
    console.log("verifyStr:" + verifyStr);
    const crypto = require("crypto");
    const hash = crypto.createHash("sha1").update(verifyStr).digest("hex");
    console.log("hash:" + hash);
    if (hash === signature) {
      console.log(1);
    } else {
      console.log(0);
    }
    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest9(): Promise<string> {
    const crypto = require("crypto");
    let encryptedText = Buffer.from(
      "7d86b661b9d4d8b525134405a27113b92083b09b",
      "hex"
    );
    let decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from("fHJ2e8Xf1fPdWDWkkWiq5GOLijr4gjlfQOurTITQfAn", "hex"),
      Buffer.from(process.env.WECHAT_AppID, "hex")
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest10(): Promise<string> {
    const message = {
      ToUserName: "gh_9321fce79f50",
      FromUserName: "oUtVHwN0L6MYjvXTfBhqd3HwoYKc",
      CreateTime: "1719975995",
      MsgType: "event",
      Event: "subscribe",
      EventKey: "",
    };
    console.log("Message:", message);
    if (isNonEmptyString(message.MsgType) && message.MsgType === "event") {
      console.log("MsgType:", message.MsgType);
      if (isNonEmptyString(message.Event) && message.Event === "SCAN") {
      } else if (
        isNonEmptyString(message.Event) &&
        message.Event === "subscribe"
      ) {
      } else if (
        isNonEmptyString(message.Event) &&
        message.Event === "unsubscribe"
      ) {
      }
    }
    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => [LegalDocumentProject])
  async actionTest11(): Promise<LegalDocumentProject[]> {
    // const res = await LegalDocumentProject.find({
    //   where:[{
    //     deletedAt:Not(IsNull())
    //   },{
    //     deletedAt:IsNull()
    //   }]
    // });
    const repository = getRepository(LegalDocumentProject);
    const res = await repository
      .createQueryBuilder("legalDocumentProject")
      .withDeleted()
      .getMany();
    return res;
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => [Commodity])
  async actionTest12(): Promise<Commodity[]> {
    // const res = await LegalDocumentProject.find({
    //   where:[{
    //     deletedAt:Not(IsNull())
    //   },{
    //     deletedAt:IsNull()
    //   }]
    // });
    const repository = getRepository(Commodity);
    const res = await repository
      .createQueryBuilder("commodity")
      // .withDeleted()
      .leftJoinAndSelect(
        "commodity.legalDocumentProject",
        "legalDocumentProject"
      )
      .getMany();
    return res;
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest13(): Promise<String> {
    const models = await Distributor.find();
    const ids = models.map((item) => item.id);
    console.log(ids);
    for (let index = 0; index < 30; index++) {
      const endTime = format(
        subDays(new Date(), index - 1),
        "yyyy-MM-dd 00:00:00"
      );
      const startTime = format(
        subDays(new Date(), index),
        "yyyy-MM-dd 00:00:00"
      );
      console.log(`time:${startTime},${endTime}`);
      // const repository = getRepository(WxPaidOrders);
      // const t1Res = await repository
      //   .createQueryBuilder("wxPaidOrders")
      //   .select("wxUser.distributorId")
      //   .addSelect("COUNT(wxPaidOrders.t1_share)")
      //   .leftJoinAndSelect("wxPaidOrders.wxUser", "wxUser")
      //   // .leftJoinAndSelect("wxUser", "wxUser.distributor")
      //   .where("wxUser.distributorId IN (:...distributorIds)", {
      //     distributorIds: ids,
      //   })
      //   .andWhere("wxPaidOrders.createdAt BETWEEN :startDate AND :endDate", {
      //     startDate: startTime,
      //     endDate: endTime,
      //   })
      //   .groupBy("wxUser.distributorId")
      //   .getRawMany();
      const t1Res = await getRepository(WxUser)
        .createQueryBuilder("wxUser")
        .select("wxUser.distributorId", "distributorId")
        .addSelect("SUM(wxPaidOrders.t1_share)", "amount")
        .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
        .where("wxUser.distributorId IN (:...distributorIds)", {
          distributorIds: ids,
        })
        .andWhere("wxPaidOrders.createdAt BETWEEN :startDate AND :endDate", {
          startDate: startTime,
          endDate: endTime,
        })
        .groupBy("wxUser.distributorId")
        .getRawMany();
      console.log(t1Res);
    }

    return "res";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest14(): Promise<String> {
    const repository = getRepository(User);
    const t1Res = await repository
      .createQueryBuilder("user")
      .select("name")
      .addSelect("email")
      .getMany();
    console.log(t1Res);

    const repository1 = getRepository(User);
    const t2Res = await repository1
      .createQueryBuilder("user")
      .select("name")
      .addSelect("role")
      .getRawMany();
    console.log(t2Res);

    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest15(): Promise<String> {
    const results = await getRepository(WxUser)
      .createQueryBuilder("wxUser")
      .select("wxUser.distributorId", "distributorId")
      .addSelect("SUM(wxPaidOrders.t1_share)", "amount")
      .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
      .where("wxUser.distributorId IN (:...distributorIds)", {
        distributorIds: [7, 8, 9],
      })
      // .andWhere("wxPaidOrders.createdAt BETWEEN :startDate AND :endDate", {
      //   startDate: "2024-07-12 00:00:00",
      //   endDate: "2024-07-13 00:00:00",
      // })
      .groupBy("wxUser.distributorId")
      .getRawMany();
    // console.log(results);
    let all = 0;
    for (const res of results) {
      console.log(res);
      all = all + res.amount ? res.amount : 0;
    }
    console.log(all);

    const results2 = await getRepository(WxUser)
      .createQueryBuilder("wxUser")
      .select("wxUser.distributorId", "distributorId")
      .addSelect("SUM(wxPaidOrders.t1_share)", "amount")
      .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
      .where("wxUser.distributorId = :distributorId", {
        distributorId: 8,
      })
      // .andWhere("wxPaidOrders.createdAt BETWEEN :startDate AND :endDate", {
      //   startDate: "2024-07-12 00:00:00",
      //   endDate: "2024-07-13 00:00:00",
      // })
      .groupBy("wxUser.distributorId")
      .getRawOne();
    console.log(results2);
    const results3 = await getRepository(WxUser)
      .createQueryBuilder("wxUser")
      .select("wxUser.distributorId", "distributorId")
      .addSelect("SUM(wxPaidOrders.t1_share)", "amount")
      .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
      .where("wxUser.distributorId = :distributorId", {
        distributorId: 9,
      })
      // .andWhere("wxPaidOrders.createdAt BETWEEN :startDate AND :endDate", {
      //   startDate: "2024-07-12 00:00:00",
      //   endDate: "2024-07-13 00:00:00",
      // })
      .groupBy("wxUser.distributorId")
      .getRawOne();
    console.log(results3);
    console.log(results3.amount);

    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest16(@Arg("id", () => Int) id: number): Promise<String> {
    const model = await Distributor.findOneOrFail(id, {
      relations: ["t2Distributors", "t1Distributor"],
    });
    if (model.t1DistributorId) {
      const res: any = [];
      for (let index = 0; index < 30; index++) {
        const endTime = format(
          subDays(new Date(), index - 1),
          "yyyy-MM-dd 00:00:00"
        );
        const startTime = format(
          subDays(new Date(), index),
          "yyyy-MM-dd 00:00:00"
        );
        // console.log(`time:${startTime},${endTime}`);
        const t1Res = await getRepository(WxUser)
          .createQueryBuilder("wxUser")
          .select("wxUser.distributorId", "distributorId")
          .addSelect("SUM(wxPaidOrders.t2_share)", "amount")
          .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
          .where("wxUser.distributorId = :distributorId", {
            distributorId: model.id,
          })
          .andWhere("wxPaidOrders.createdAt BETWEEN :startDate AND :endDate", {
            startDate: startTime,
            endDate: endTime,
          })
          .groupBy("wxUser.distributorId")
          .getRawOne();
        let amount = 0;
        if (t1Res) {
          amount = amount + t1Res.amount ? t1Res.amount : 0;
        }
        console.log(amount);
        const input = {
          date: format(subDays(new Date(), index), "yyyy-MM-dd"),
          amount: amount,
        };
        res.push(input);
      }
      console.log(res);
      return JSON.stringify(res);
    } else {
      // const t2DistributorIds: any = [];
      // for (const t2Model of model.t2Distributors) {
      //   t2DistributorIds.push(t2Model.id);
      // }
      const t2DistributorIds = model.t2Distributors.map((item) => item.id);
      console.log("t2DistributorIds:" + t2DistributorIds);
      const res: any = [];
      for (let index = 0; index < 30; index++) {
        const endTime = format(
          subDays(new Date(), index - 1),
          "yyyy-MM-dd 00:00:00"
        );
        const startTime = format(
          subDays(new Date(), index),
          "yyyy-MM-dd 00:00:00"
        );
        // console.log(`time:${startTime},${endTime}`);
        const t1Res = await getRepository(WxUser)
          .createQueryBuilder("wxUser")
          .select("wxUser.distributorId", "distributorId")
          .addSelect("SUM(wxPaidOrders.t1_share)", "amount")
          .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
          .where("wxUser.distributorId = :distributorId", {
            distributorId: model.id,
          })
          .andWhere("wxPaidOrders.createdAt BETWEEN :startDate AND :endDate", {
            startDate: startTime,
            endDate: endTime,
          })
          .groupBy("wxUser.distributorId")
          .getRawOne();
        // console.log(t1Res);
        let t2Res = [];
        if (t2DistributorIds.length > 0) {
          t2Res = await getRepository(WxUser)
            .createQueryBuilder("wxUser")
            .select("wxUser.distributorId", "distributorId")
            .addSelect("SUM(wxPaidOrders.t1_share)", "amount")
            .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
            .where("wxUser.distributorId IN (:...distributorIds)", {
              distributorIds: t2DistributorIds,
            })
            .andWhere(
              "wxPaidOrders.createdAt BETWEEN :startDate AND :endDate",
              {
                startDate: startTime,
                endDate: endTime,
              }
            )
            .groupBy("wxUser.distributorId")
            .getRawMany();
          console.log(t2Res);
        }
        // console.log(t1Res);
        let amount = 0;
        if (t1Res) {
          amount = amount + t1Res.amount ? t1Res.amount : 0;
        }
        console.log(amount);
        if (t2Res.length > 0) {
          for (const res of t2Res) {
            amount = amount + res.amount ? res.amount : 0;
          }
        }
        console.log(amount);
        const input = {
          date: format(subDays(new Date(), index), "yyyy-MM-dd"),
          amount: amount,
        };
        res.push(input);
      }
      console.log(res);
      return JSON.stringify(res);
    }
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest17(@Arg("id", () => Int) id: number): Promise<String> {
    const model = await Distributor.findOneOrFail(id, {
      relations: ["t2Distributors", "t1Distributor"],
    });
    if (model.t1DistributorId) {
      const t1Res = await getRepository(WxUser)
        .createQueryBuilder("wxUser")
        .select("wxUser.distributorId", "distributorId")
        .addSelect("SUM(wxPaidOrders.t2_share)", "amount")
        .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
        .where(
          "wxPaidOrders.t2DistributorWithdrawFundsId is NULL and wxUser.distributorId = :distributorId",
          {
            distributorId: model.id,
          }
        )
        .groupBy("wxUser.distributorId")
        .getRawOne();
      let amount = 0;
      if (t1Res) {
        amount = amount + t1Res.amount ? t1Res.amount : 0;
      }
      console.log(amount);
      const res = {
        amount: amount,
      };
      console.log(res);
      return JSON.stringify(res);
    } else {
      // const t2DistributorIds: any = [];
      // for (const t2Model of model.t2Distributors) {
      //   t2DistributorIds.push(t2Model.id);
      // }
      const t2DistributorIds = model.t2Distributors.map((item) => item.id);
      console.log("t2DistributorIds:" + t2DistributorIds);
      const t1Res = await getRepository(WxUser)
        .createQueryBuilder("wxUser")
        .select("wxUser.distributorId", "distributorId")
        .addSelect("SUM(wxPaidOrders.t1_share)", "amount")
        .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
        .where(
          "wxPaidOrders.t1DistributorWithdrawFundsId is NULL and wxUser.distributorId = :distributorId",
          {
            distributorId: model.id,
          }
        )
        .groupBy("wxUser.distributorId")
        .getRawOne();
      // console.log(t1Res);
      let t2Res = [];
      if (t2DistributorIds.length > 0) {
        t2Res = await getRepository(WxUser)
          .createQueryBuilder("wxUser")
          .select("wxUser.distributorId", "distributorId")
          .addSelect("SUM(wxPaidOrders.t1_share)", "amount")
          .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
          .where(
            "wxPaidOrders.t1DistributorWithdrawFundsId is NULL and wxUser.distributorId IN (:...distributorIds)",
            {
              distributorIds: t2DistributorIds,
            }
          )
          .groupBy("wxUser.distributorId")
          .getRawMany();
        console.log(t2Res);
      }
      // console.log(t1Res);
      let amount = 0;
      if (t1Res) {
        amount = amount + t1Res.amount ? t1Res.amount : 0;
      }
      console.log(amount);
      if (t2Res.length > 0) {
        for (const res of t2Res) {
          amount = amount + res.amount ? res.amount : 0;
        }
      }
      console.log(amount);
      const res = {
        amount: amount,
      };
      console.log(res);
      return JSON.stringify(res);
    }
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest18(@Arg("id", () => Int) id: number): Promise<String> {
    // 格式化日期（可选）
    const startOfLastMonth = format(
      startOfMonth(subMonths(new Date(), 1)),
      "yyyy-MM-dd 00:00:00"
    );
    const endOfLastMonth = format(
      endOfMonth(subMonths(new Date(), 1)),
      "yyyy-MM-dd 00:00:00"
    );

    const lastMonthAmount = await getRepository(DistributorWithdrawFunds)
      .createQueryBuilder("distributorWithdrawFunds")
      .select("distributorId")
      .addSelect("SUM(amount)", "amount")
      .where("distributorId = :distributorId", {
        distributorId: id,
      })
      .andWhere("createdAt BETWEEN :startDate AND :endDate", {
        startDate: startOfLastMonth,
        endDate: endOfLastMonth,
      })
      .groupBy("distributorId")
      .getRawOne();

    // 格式化日期（可选）
    const thisStartOfMonth = format(
      startOfMonth(new Date()),
      "yyyy-MM-dd 00:00:00"
    );
    const thisEndOfMonth = format(
      endOfMonth(new Date()),
      "yyyy-MM-dd 00:00:00"
    );

    const thisMonthAmount = await getRepository(DistributorWithdrawFunds)
      .createQueryBuilder("distributorWithdrawFunds")
      .select("distributorId")
      .addSelect("SUM(amount)", "amount")
      .where("distributorId = :distributorId", {
        distributorId: id,
      })
      .andWhere("createdAt BETWEEN :startDate AND :endDate", {
        startDate: thisStartOfMonth,
        endDate: thisEndOfMonth,
      })
      .groupBy("distributorId")
      .getRawOne();

    console.log(thisMonthAmount);
    let lastAmount = 0;
    let thisAmount = 0;
    if (lastMonthAmount) {
      lastAmount = lastMonthAmount.amount ? lastMonthAmount.amount : 0;
    }
    if (thisMonthAmount) {
      thisAmount = thisMonthAmount.amount ? thisMonthAmount.amount : 0;
    }
    const res = {
      lastMonthAmount: lastAmount,
      thisMonthAmount: thisAmount,
    };
    return JSON.stringify(res);
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest19(): Promise<string> {
    const name = encryptedName("名字");
    return name;
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest20(): Promise<string> {
    const input = {
      effective_time: "2024-07-30T14:18:52+08:00",
      encrypt_certificate: {
        algorithm: "AEAD_AES_256_GCM",
        associated_data: "certificate",
        ciphertext:
          "O7WuVoeKxqyYvgUA5JPWT4QLO5Sw/ykNWcisSiecKNRhLU2+ZAaBZBZSEkJYYv+2vRyTlOLWzs0Cb0CHQGDAVXBTJWKcPvsA5Sn0kZrad2BbyPd/1NhWqYe7w+EueHDV+sLHeAP0158Yozap4/S27RwN1oQbkVPFRALfU5JF2x6HImd4hV9EhxoTsIlZ0DYrOr3flgG70kwXTPscmqhBS6Sr8IlTB9qmLZ5l5/mCXoc7/X9xpCm6Dgumf839KA72Me/mSwj8xi0IknesmDIgVhCwze6ucyl1PqQh32aMhK9ah0qgj6EQALP2RQJ8bXkyfKXtIOjaq8s5TnK4nMzynpepyzlruHSZOUkVw4bYgdjSeJ1J4nNoeN1j7WplvABAESoqFaHxDA54FE4CKSa5nFgxfO7vwiRVJdb8vfbGOpRj8kX70BycQe2CjaXv9iZTUKY2kIm/PvThelhlAu3B+pRKutB4Pef+/STre4vK+dR3CNyPK//saNQcOXnish0khOXlAI78rqxC1cNwaixPprqvS6r5+uq6IdiKQBgOe2YpBEYrv9wdoEDMZLoA1rLC2++rQo2OZXHghjPYt4/fzbfDJnGOL/r7XMWexg6Clv2ehW/DCT+b2SdzqyQPgD04fQUt9S5Q39WQqXh6l4hvOB9fc4SPHgJOLjQtyvCwjEen76m9mgqRjSN24SYj0Dt4qBmNCjyl1jSDuB5GHHm4fhOfMppsMGYrWPDd+JYRv/+YsZCIYBE5bTT45dVXAuwQzjQJSHo1ATZVe5T9RZxE0x1KKYl09aD2bhcMWSZqp+N5R5QYOj8gE463hwYI+IzupoN6fCzS5zoIjooeNAXldTGQaAjuawgMA4X2Cv3YPKXBXPANv/ttxKXv2mr5rgQsBXkz/pXwXcR/9CIkUs9STFOKWSn6k9PAY03U4b1lv16ptIMsECZfO2GT6bB08giKsxUCc4wmDiFvf4cvRYxwv3uuEkROVbQn/mdWeenkyOMQKRFcuDCGgoB0fIjqYJOcV7b8oxGLtsstTAa6fQO6LB1bp+AKNws+qmy964BhgK+R98FrQYNGw/jPlN25moEX1mL0yU0k4cyHH1/qCL8LGDdSFC/wNUPHf9KPoRNsXzgyg42G5sAZXeR34+v8+bTS7YXEjLnp5Cuz05fHgTz+xOm4ElWbmxolRtJhbNauP2zFmyd/pYh3ji8ucKY0L+B3I8qqw9i2U7jn9BhNvt6BfBE1sMdxOegR9TniKhqBSraLADdum+AYANVcshkvJFxDKeWFyNjln/TXcdWKYDbioQOlr4A/BfC779QIo8xRNh4XXVQ8Sr8Hvw87d14yJVbZ3FcdnpNBwzcq0IqfayQc4oRz1R0cWsIdoSuufWOZ01dt2hyt6ZOsOjxeOXww9r0xmBynUlcDOVo7wy+F1v6lDLF1M8Sn6fsif1qo1+5AMcqhtcuB2Q8+DC3xm+QAKrfEuSR8QuaOEdv2mUCWB2pDgwMBN5c8QcGzPT1bd6b2GscWMFU6FLF1TC4P7JHGYkWK9v+Jv6Z3K1BrgwNPBMbn0qaxFUwVd4R1gV4ENRTTIR2AzQlt+AddG3e9YIcc+W9jvWoBbEfxP4jHkMc+WZ/UEQsN+jaR0ohKkM0y4CW+iSL5jg9Tgetn3PcEFvH5hv3PPPS1WM0Ee8DvQQfjL/gsCf7JnrmWxJVjFK0Tv3WygMK1LsN0tgo5Q4XbmWbZHnsmCv+8MfiDhkUPQL1CitKaWs38c8a+842zE4GuBLJvgheB/ABlCJFmeyJFL9xryHEPhiSDo14Nyk1O7BZyG5nb2MRan0ylU1lgy9myFj0zLp6ifdVJAb4XmrKDyAEYCVUSziAI96e+ER53HBHvRAMjQ8y23ulLz7pU+i5hQY3x5Tczrhs9c7ZWw5NQBwvrEi3LR6hlN6pV2HGOyGDodyo5OzDT8OAZBHDZ+rjtyMFbkyf65ADk0GSOEb0XIiU0unPUVySZ",
        nonce: "c585b5a65c0d",
      },
      expire_time: "2029-07-29T14:18:52+08:00",
      serial_no: "5A16776AEDA5CBECD1D0CEAAB3750F9AFB35A48A",
    };
    const resourceData = wxResourceDecrypt(
      input.encrypt_certificate.nonce,
      input.encrypt_certificate.ciphertext,
      input.encrypt_certificate.associated_data
    );
    console.log(resourceData);
    return JSON.stringify(resourceData);
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest21(): Promise<string> {
    const data = [1, 3, 5, 6, 7, 8, 4, 4, 3, 2, 8];
    const s = data.filter((item) => item === 4);
    console.log(s);
    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest22(): Promise<string> {
    const items = [
      { id: 1, name: "item1", amount: 0 },
      { id: 2, name: "item2", amount: 0 },
      { id: 3, name: "item3", amount: 0 },
      { id: 4, name: "item3", amount: 0 },
      { id: 5, name: "item3", amount: 0 },
      { id: 6, name: "item3", amount: 2 },
      { id: 7, name: "item3", amount: 2 },
      { id: 8, name: "item3", amount: 0 },
    ];
    // const ids = items.map((item) => {
    //   if (item.id > 5) {
    //     return item.id;
    //   }
    // });
    // const ids = items
    //   .filter((item) => item.id > 3)
    //   .filter((item) => item.id < 7); // 过滤掉 id <= 5 的项
    //   // .map((item) => item);

    // console.log(ids); // 输出: [1, 2, 3]
    // const arr = [1, 2, 3, 4];
    const sum = items.reduce((acc, curr) => acc + curr.amount, 0);
    console.log(sum); // 输出: 10

    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest23(): Promise<string> {
    const model = await LegalDocumentProject.findOneOrFail(75);
    const input = {
      ...model,
      // id: undefined,
      // createdAt: undefined,
      // updatedAt: undefined,
      // nextCkiLabel: "test",
    } as { id?: any; updatedAt?: any; createdAt?: any; nextCkiLabel?: any };
    delete input.id;
    delete input.updatedAt;
    delete input.createdAt;
    delete input.nextCkiLabel;
    console.log(input);
    await LegalDocumentProject.create({
      ...input,
    }).save();
    // const { id, createdAt, ...newEntity } = model;

    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest24(): Promise<string> {
    const url1 =
      "https://file.orientlaw.cn/3/6/借贷，答辩，long-B+2-1_2408072118290304.docx";
    console.log(url1);
    const url2 = encodeURIComponent(url1);
    console.log(url2);
    console.log(decodeURIComponent(url2));
    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => [WxPaidOrders])
  async actionTest25(): Promise<WxPaidOrders[]> {
    const res = await getRepository(WxPaidOrders)
      .createQueryBuilder("wxPaidOrders")
      .leftJoin("wxPaidOrders.wxUser", "wxUser")
      .getMany();
    console.log(res[0].wxUser);

    return [];
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest26(): Promise<string> {
    // const nums =[1,2,3,5,6,7,8];
    // const target = 15
    // const map = new Map();
    // for (let i = 0; i < nums.length; i++) {
    //     const complement = target - nums[i];
    //     if (map.has(complement)) {
    //         console.log([map.get(complement), i]);
    //     }
    //     map.set(nums[i], i);
    // }
    // console.log(nums.sort((a,b)=> b-a));
    // console.log(nums.reverse());
    // let n = 5;
    // if (n <= 2) console.log(n);
    // let prev = 1, curr = 2;
    // for (let i = 3; i <= n; i++) {
    //     [prev, curr] = [curr, prev + curr];
    //     console.log([prev, curr]);
    // }
    // console.log(curr);
    // const root =[1,2,3,5,6,7,8];
    // if (root === null) return 0;
    // return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
    // const node15 = new TreeNode(15);
    // const node7 = new TreeNode(7);
    // const node20 = new TreeNode(20, node15, node7);
    // const node9 = new TreeNode(9);
    // const root = new TreeNode(3, node9, node20);
    // console.log(maxDepth(root));
    return process.cwd();
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest27(): Promise<string> {
    // 格式化日期（可选）
    const thisStartOfMonth = format(
      startOfMonth(new Date()),
      "yyyy-MM-dd 00:00:00"
    );
    const thisEndOfMonth = format(
      startOfMonth(subMonths(new Date(), -1)),
      "yyyy-MM-dd 00:00:00"
    );
    console.log(thisStartOfMonth);
    console.log(thisEndOfMonth);

    const thisMonthAmount = await getRepository(WxPaidOrders)
      .createQueryBuilder("wxPaidOrders")
      .select("SUM(wxPaidOrders.total)", "amount")
      .leftJoin("wxPaidOrders.wxUser", "wxUser")
      .where(
        "wxPaidOrders.state = 'SUCCESS' and wxUser.distributorId = :distributorId",
        {
          distributorId: 9,
        }
      )
      .andWhere("wxPaidOrders.createdAt BETWEEN :startDate AND :endDate", {
        startDate: thisStartOfMonth,
        endDate: thisEndOfMonth,
      })
      .getRawOne();
    console.log(thisMonthAmount.amount ? thisMonthAmount.amount : 0);
    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest28(): Promise<string> {
    let data = [
      { amount: "0", splitRatio: "3" },
      { amount: "200", splitRatio: "4" },
      { amount: "500", splitRatio: "5" },
      { amount: "1000", splitRatio: "6" },
    ];
    // data = data.sort((a, b) => parseInt(a.amount) - parseInt(b.amount));
    // console.log(data);
    // data = data.sort((a, b) => parseInt(b.amount) - parseInt(a.amount));
    const res = data.map((x) => parseInt(x.amount));
    console.log(res);
    const res1 = data.filter((x) => parseInt(x.amount) >= 500);
    console.log(res1);
    const res2 = data.some((x) => parseInt(x.amount) >= 500);
    console.log(res2);
    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest29(): Promise<string> {
    enum Color {
      red,
      green,
      black,
    }

    enum ColorStr {
      red = "red",
      green = "green",
      black = "black",
    }
    console.log(Color["red"]);
    console.log(Color);
    console.log(ColorStr);
    // let c1 = ColorStr.red;
    // console.log(c1);
    // const green  = "green";
    // console.log(Object.values(ColorStr).some((x)=>x===green));
    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest30(@Arg("id", () => Int) id: number): Promise<string> {
    // const arr = [1,3,4,5,7,8,9]
    // console.log(...arr)
    const distributor = await Distributor.findOneOrFail(id, {
      relations: ["t1Distributor", "t2Distributors"],
    });
    const obj = await getDistributorCommissionBalanceOrderIds(distributor);
    console.log(obj.t1_wxPaidOrdersIds);
    console.log(obj.t2_wxPaidOrdersIds);
    const amount = await getDistributorAllShare(obj);
    console.log(amount);
    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest31(): Promise<string> {
    const password = "123456";
    const hashedPassword = await hashPassword(password);
    console.log(hashedPassword);
    const isMatch = await verifyPassword(password, hashedPassword);
    console.log(isMatch);
    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest32(@Arg("id", () => Int) id: number): Promise<string> {
    const paperwork = await Paperwork.findOne(id);
    if (!paperwork) {
      console.log("paperwork not found");
    }
    console.log(paperwork!.reviewDocJson);
    const reviewDocModel = JSON.parse(
      paperwork!.reviewDocJson.replace(/\n/g, "\\n").replace(/\r/g, "\\r")
    );
    // console.log(reviewDocModel);
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
    console.log(data);
    return "xx";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest33(): Promise<string> {
    const result = await sendSmsCode("", "871682");
    return JSON.stringify(result);
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest34(): Promise<string> {
    const fs = require("fs");
    const PizZip = require("pizzip");
    const Docxtemplater = require("docxtemplater");
    // 读取 DOCX 模板文件
    // path.join(process.cwd(), "certificate/apiclient_key.pem");
    const templatePath = path.join(process.cwd(), "template.docx");
    const outputPath = path.join(process.cwd(), "output.docx");

    // 读取模板文件
    fs.readFile(templatePath, "binary", function (err: any, content: any) {
      if (err) {
        console.error("Error reading template:", err);
        return;
      }

      // 使用 PizZip 解压 DOCX 模板内容
      const zip = new PizZip(content);

      // 创建 Docxtemplater 实例
      // const doc = new Docxtemplater(zip);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // 设置替换的数据
      const data: { [key: string]: string } = {
        自然人原告的身份信息:
          "姓名：张木林\n性别：\n出生日期：\n民族：\n工作单位：启东市松辉建材有限公司，职务：总经理，联系电话：13785634976\n住所地（户籍所在地）：启东市汇龙镇东郊村御龙街4幢88号门面\n经常居住地：",
        "法人、非法人组织原告的身份信息":
          "名称：启东市松辉建材有限公司\n住所地：启东市汇龙镇东郊村御龙街4幢88号门面\n注册地/登记地：无\n法定代表人：张木林，职务：总经理，联系电话：13785634976\n统一社会信用代码：无\n类型：有限责任公司☑、股份有限公司□、上市公司□、其他企业法人□、事业单位口社会团体□、基金会□、社会服务机构□、机关法人□、农村集体经济组织法人□、城镇农村的合作经济组织法人□、基层群众性自治组织法人□、个人独资企业□、合伙企业□、不具有法人资格的专业服务机构□、国有□（控股□、参股□）、民营☑",
        委托诉讼代理人的身份信息:
          "姓名：无\n单位：无   职务 ：无   联系电话：无\n代理权限：无\n证件类型：居民身份证□ 律师执业证□",
        送达的相关信息:
          "地址： 启东市汇龙镇东郊村御龙街4幢88号门面\n收件人： 张木林\n电话： 13785634976",
        电子送达: "是□ ，方式：无\n否☑",
        "法人、非法人组织被告的身份信息":
          "名称：南通和也建设工程有限公司\n住所地：启东经济开发区牡丹江西路2222号\n注册地/登记地：无\n法定代表人：黄学飞，职务：法定代表人，联系电话：13901462980\n统一社会信用代码：无\n类型：有限责任公司☑、股份有限公司□、上市公司□、其他企业法人□、事业单位口社会团体□、基金会□、社会服务机构□、机关法人□、农村集体经济组织法人□、城镇农村的合作经济组织法人□、基层群众性自治组织法人□、个人独资企业□、合伙企业□、不具有法人资格的专业服务机构□、国有□（控股□、参股□）、民营☑",
        自然人被告的身份信息:
          "姓名：黄学飞\n性别：男\n1960年1月26日出生，汉族\n工作单位：南通和也建设工程有限公司，职务：法定代表人，联系电话：13901462980\n住启东市汇龙镇江海南路508号职工新村41幢203室",
        "法人、非法人组织第三人的身份信息":
          "名称：无\n住所地：无\n注册地/登记地：无\n法定代表人：无，职务：无，联系电话：无\n统一社会信用代码：无\n类型：无",
        自然人第三人的身份信息:
          "姓名：无\n性别：无\n出生日期：无，民族：无\n工作单位：无，职务：无，联系电话：无\n住所地（户籍所在地）：无\n经常居住地：无",
        核实原告诉请:
          "要求被告偿还货款1,217,460元，并支付案件受理费、保全费、律师费及保全担保费用，总计1,221,677元。",
        "作为卖方，要求给付的价款": "1,217,460元",
        "作为卖方，要求支付的迟延利息": "无",
        "作为买方，要求赔偿的损失": "无",
        "作为买方，是否要求卖方对标的物瑕疵承担责任": "无",
        要求继续履行或是解除合同:
          "继续履行☑，完成义务：供货☑\n判令解除合同□\n确认买卖合同已于*年*月*日解除□",
        是否主张担保权利:
          "是☑，内容：被告黄学飞在承诺函中明确表示为南通和也建设工程有限公司的债务承担连带责任\n否□",
        是否主张实现债权的费用及费用明细:
          "是☑，内容：律师费3,000元，保全担保费用1,217.46元\n否□",
        其他请求: "无其他诉求",
        此次买卖标的的总额: "1,221,677元",
        诉请依据: "合同约定：无正式买卖合同\n法律规定：《民法典》相关规定",
        约定管辖: "有□，合同条款及内容：无特别约定\n无☑",
        诉讼保全:
          "已经诉前保全：否☑   保全法院：无 保全时间：无\n申请诉讼保全：是☑",
        合同的签订情况:
          "无正式买卖合同，自2019年1月至2021年8月期间，原告向被告提供木方等建筑材料",
        合同的签订主体:
          "出卖人（卖方）：启东市松辉建材有限公司\n买受人（买方）：南通和也建设工程有限公司",
        买卖标的物情况: "木方等建筑材料",
        合同约定的价格及支付方式: "未按时支付货款",
        "合同约定的交货时间、地点、方式、风险承担、安装、调试、验收":
          "无具体约定",
        "合同约定的质量标准及检验方式、质量异议期限": "无具体约定",
        合同约定的违约金: "无",
        合同履行情况:
          "标的物按期交付，但货款只支付了其中一部分，剩下的1,217,460元货款至今未支付。原告隔月通过电话催促被告支付剩余货款，最近一次催促时间为2024年12月10日。",
        价款支付及标的物交付情况: "按期交付标的物，逾期未付款1,217,460元",
        是否存在迟延履行: "是☑，迟延时间：未具体提及，逾期付款☑逾期交货□",
        是否催促过履行: "是☑，催促情况：2024年12月10日通过电话进行了催促\n否□",
        合同约定的标的物情况: "木方等建筑材料",
        买卖合同标的物有无质量争议: "无☑",
        标的物质量规格或履行方式是否存在不符合约定的情况: "否☑",
        是否曾就标的物质量问题进行协商: "否☑",
        "被告应当支付的利息、违约金、赔偿金":
          "利息□*元\n违约金□*元\n赔偿金□*元\n共计金额：无，计算方式：无",
        "担保、抵押情况":
          "被告黄学飞在承诺函中明确表示为南通和也建设工程有限公司的债务承担连带责任；承诺函未约定具体的保证期间；根据法律规定，未约定保证期间的，保证期间为主债务履行期届满之日起六个月；无其他形式的担保或抵押合同。",
        "是否签物的担保(抵押、质押)合同": "是□，签订时间：无\n否☑",
        担保: "担保人：黄学飞\n担保物：无",
        是否是最高额担保: "是□，担保债权的确定时间：无\n担保额度：无\n否☑",
        "是否办理抵押、质押登记": "是□，正式登记□\n预告登记□\n否☑",
        是否签订保证合同: "是☑，正式登记□\n预告登记□\n否□",
        保证方式: "一般保证□\n连带责任保证☑",
        其他担保方式: "是□，形式：无\n否☑",
        其他需要说明的内容: "无",
        其他情况: "无",
        证据清单:
          "1. 原告身份信息：原告为启东市松辉建材有限公司，住所地为启东市汇龙镇东郊村御龙街4幢88号门面，法定代表人为张木林\n2. 被告身份信息：被告一为南通和也建设工程有限公司，住所地为启东经济开发区牡丹江西路2222号，法定代表人为黄学飞；被告二为黄学飞，男，1960年1月26日生，汉族，住所地为启东市汇龙镇江海南路508号职工新村41幢203室，联系电话为13901462980\n3. 诉讼请求和依据：要求被告偿还货款1,217,460元，并支付案件受理费、保全费、律师费及保全担保费用，总计1,221,677元。诉请依据为《结算单》载明截至2022年1月22日止，被告南通和也建设工程有限公司仍拖欠原告人民币1,217,460元；被告黄学飞对该欠款承担连带清偿责任\n4. 合同签订情况：原告与被告南通和也建设工程有限公司之间没有签订正式的买卖合同，自2019年1月至2021年8月期间，原告向被告提供木方等建筑材料，但双方未签订正式的买卖合同\n5. 合同履行情况：标的物按期交付，但货款只支付了其中一部分，剩下的1,217,460元货款至今未支付。原告隔月通过电话催促被告支付剩余货款，最近一次催促时间为2024年12月10日\n6. 担保、抵押情况：被告黄学飞在承诺函中明确表示为南通和也建设工程有限公司的债务承担连带责任，但承诺函未约定具体的保证期间；根据法律规定，未约定保证期间的，保证期间为主债务履行期届满之日起六个月；无其他形式的担保或抵押合同\n7. 其他情况：原告明确放弃要求被告南通和也建设工程有限公司及黄学飞支付任何利息、违约金或赔偿金，放弃时间为2025年01月21日\n8. 财产保全措施：本案是否申请诉讼保全：是；申请保全的法院：起诉的法院；申请保全的时间：起诉时一并申请\n9. 约定管辖：原告启东市松辉建材有限公司与被告南通和也建设工程有限公司、黄学飞之间没有关于管辖法院的特别约定\n10. 起诉日期：2025年01月21日",
        获取老版本起诉状: "无",
        合同签订情况: "无",
      };

      // 将换行符替换为 <w:t> 或段落标签
      // data.details = data.details.replace(/\n/g, "<w:p/>"); // 使用 <w:p/> 来表示段落
      // for (const key in data) {
      //   if (data.hasOwnProperty(key)) {
      //     // data[key] = data[key].replace(/\n/g, "<w:br/>");  // 在每个值后添加 "xxx"
      //     data[key] = data[key].replace(/\n/g, "{{line_break}}");
      //   }
      // }
      // 替换模板中的占位符
      doc.setData(data);

      try {
        // 渲染文档
        doc.render();
      } catch (error) {
        console.error("Error rendering template:", error);
        return;
      }

      // 获取生成的 DOCX 文件内容
      const buf = doc.getZip().generate({ type: "nodebuffer" });

      // 将生成的文件保存到输出路径
      fs.writeFile(outputPath, buf, function (err: any) {
        if (err) {
          console.error("Error writing output file:", err);
        } else {
          console.log("Output file created at", outputPath);
        }
      });
    });
    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest35(): Promise<string> {
    const data = `{\\n    \\\"\\\\u60a8\\\\u7684\\\\u4f01\\\\u4e1a\\\\u540d\\\\u79f0\\\\u662f\\\\u4ec0\\\\u4e48\\\\uff1f\\\": \\\"hello\\\",\\n    \\\"\\\\u60a8\\\\u63d0\\\\u4f9b\\\\u54ea\\\\u4e9b\\\\u4ea7\\\\u54c1\\\\u6216\\\\u670d\\\\u52a1\\\\uff1f\\\": \\\"\\\\u786c\\\\u4ef6\\\\u5f00\\\\u53d1\\\",\\n    \\\"\\\\u60a8\\\\u7684\\\\u4f01\\\\u4e1a\\\\u5c5e\\\\u4e8e\\\\u54ea\\\\u4e2a\\\\u884c\\\\u4e1a\\\\uff1f\\\": \\\"\\\\u7269\\\\u8054\\\\u7f51\\\",\\n    \\\"\\\\u60a8\\\\u7684\\\\u4f01\\\\u4e1a\\\\u4f4d\\\\u4e8e\\\\u54ea\\\\u91cc\\\\uff0c\\\\u60a8\\\\u5728\\\\u54ea\\\\u91cc\\\\u9500\\\\u552e\\\\u60a8\\\\u7684\\\\u4ea7\\\\u54c1/\\\\u670d\\\\u52a1\\\\uff1f\\\": \\\"\\\\u6df1\\\\u5733\\\",\\n    \\\"\\\\u60a8\\\\u7684\\\\u7406\\\\u60f3\\\\u5ba2\\\\u6237\\\\u662f\\\\u8c01\\\\uff1f\\\\uff08\\\\u5982\\\\u679c\\\\u4e0d\\\\u786e\\\\u5b9a\\\\uff0c\\\\u8bf7\\\\u63cf\\\\u8ff0\\\\u60a8\\\\u7684\\\\u5178\\\\u578b\\\\u4e70\\\\u5bb6\\\\uff09\\\": \\\"\\\\u5927\\\\u5382\\\",\\n    \\\"\\\\u60a8\\\\u5728\\\\u5438\\\\u5f15\\\\u5ba2\\\\u6237\\\\u65b9\\\\u9762\\\\u9762\\\\u4e34\\\\u7684\\\\u6700\\\\u5927\\\\u6311\\\\u6218\\\\u662f\\\\u4ec0\\\\u4e48\\\\uff1f\\\": \\\"\\\\u8425\\\\u9500\\\",\\n    \\\"\\\\u60a8\\\\u7684\\\\u6700\\\\u5927\\\\u7ade\\\\u4e89\\\\u5bf9\\\\u624b\\\\u662f\\\\u8c01\\\\uff1f\\\\uff08\\\\u5982\\\\u679c\\\\u4e0d\\\\u786e\\\\u5b9a\\\\uff0c\\\\u8bf7\\\\u5217\\\\u51fa\\\\u51e0\\\\u4e2a\\\\u7c7b\\\\u4f3c\\\\u7684\\\\u4f01\\\\u4e1a\\\\uff09\\\": \\\"\\\\u4e0d\\\\u786e\\\\u5b9a\\\",\\n    \\\"\\\\u60a8\\\\u7684\\\\u4f01\\\\u4e1a\\\\u6216\\\\u4ea7\\\\u54c1\\\\u4e0e\\\\u7ade\\\\u4e89\\\\u5bf9\\\\u624b\\\\u6709\\\\u4ec0\\\\u4e48\\\\u4e0d\\\\u540c\\\\u4e4b\\\\u5904\\\\uff1f\\\": \\\"\\\\u8bbe\\\\u65bd\\\\u7cbe\\\\u826f\\\",\\n    \\\"\\\\u60a8\\\\u76ee\\\\u524d\\\\u5982\\\\u4f55\\\\u9500\\\\u552e\\\\u60a8\\\\u7684\\\\u4ea7\\\\u54c1/\\\\u670d\\\\u52a1\\\\uff1f\\\\uff08\\\\u5728\\\\u7ebf\\\\u3001\\\\u96f6\\\\u552e\\\\u3001B2B\\\\u7b49\\\\uff09\\\": \\\"\\\\u5728\\\\u7ebf\\\",\\n    \\\"\\\\u60a8\\\\u4f30\\\\u8ba1\\\\u7684\\\\u6bcf\\\\u6708\\\\u6536\\\\u5165\\\\u662f\\\\u591a\\\\u5c11\\\\uff1f\\\": \\\"10\\\\u4e07\\\",\\n    \\\"\\\\u60a8\\\\u4f30\\\\u8ba1\\\\u7684\\\\u6bcf\\\\u6708\\\\u8425\\\\u9500\\\\u9884\\\\u7b97\\\\u662f\\\\u591a\\\\u5c11\\\\uff1f\\\\uff08\\\\u5982\\\\u679c\\\\u6ca1\\\\u6709\\\\uff0c\\\\u8bf7\\\\u586b\\\\u5199$0\\\\uff09\\\": \\\"0\\\",\\n    \\\"\\\\u60a8\\\\u76ee\\\\u524d\\\\u5982\\\\u4f55\\\\u8425\\\\u9500\\\\u60a8\\\\u7684\\\\u4f01\\\\u4e1a\\\\uff1f\\\\uff08\\\\u793e\\\\u4ea4\\\\u5a92\\\\u4f53\\\\u3001\\\\u5e7f\\\\u544a\\\\u3001\\\\u53e3\\\\u7891\\\\u7b49\\\\uff09\\\": \\\"\\\\u5e7f\\\\u544a\\\",\\n    \\\"\\\\u60a8\\\\u5728\\\\u63a5\\\\u4e0b\\\\u6765\\\\u7684\\\\u4e00\\\\u4e2a\\\\u5e74\\\\u5185\\\\u7684\\\\u6700\\\\u5927\\\\u5546\\\\u4e1a\\\\u76ee\\\\u6807\\\\u662f\\\\u4ec0\\\\u4e48\\\\uff1f\\\": \\\"\\\\u505a\\\\u7684\\\\u66f4\\\\u597d\\\",\\n    \\\"\\\\u60a8\\\\u5e0c\\\\u671bAI\\\\u5728\\\\u54ea\\\\u65b9\\\\u9762\\\\u6700\\\\u80fd\\\\u5e2e\\\\u52a9\\\\u60a8\\\\uff1f\\\\uff08\\\\u4f8b\\\\u5982\\\\uff0c\\\\u627e\\\\u5230\\\\u5ba2\\\\u6237\\\\u3001\\\\u589e\\\\u52a0\\\\u9500\\\\u552e\\\\u3001\\\\u6539\\\\u5584\\\\u8425\\\\u9500\\\\u7b49\\\\uff09\\\": \\\"\\\\u6539\\\\u5584\\\\u8425\\\\u9500\\\",\\n    \\\"\\\\u60a8\\\\u662f\\\\u5426\\\\u9700\\\\u8981\\\\u5bf9\\\\u65b0\\\\u5e02\\\\u573a\\\\u6216\\\\u4ea7\\\\u54c1\\\\u6269\\\\u5f20\\\\u673a\\\\u4f1a\\\\u8fdb\\\\u884c\\\\u6d1e\\\\u5bdf\\\\uff1f\\\\uff08\\\\u662f/\\\\u5426\\\\uff09\\\": \\\"\\\\u662f\\\"\\n}`;
    // 清理多余的斜杠、换行符并转成中文
    const cleanedData = JSON.parse(
      data.replace(/\\\\/g, "").replace(/\\"/g, '"')
    );
    console.log(cleanedData);
    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest36(
    @Arg("prompt", () => String) prompt: string
  ): Promise<String> {
    const input1 = {
      content: prompt,
    };
    try {
      const res = await axios.post(
        "http://127.0.0.1:5700/askQuestionFromChatGPTMini",
        input1,
        {
          headers: {
            "content-type": "application/json",
          },
        }
      );
      console.log(`data:${JSON.stringify(res.data)}`);
      return res.data.data.choices[0].message.content;
    } catch (error: any) {
      if (error.response) {
        // throw new CommonError(JSON.stringify(error.response.data));
      } else if (error.request) {
        // throw new CommonError(JSON.stringify(error.request));
      } else {
        // throw new CommonError(error.message);
      }
      return "";
    }
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest37(): Promise<string> {
    const emailBody =
      "这是一封回复邮件数据 <!-- Inquiry ID: sdfsdfs8f78ds7f8sd29-17 -->";
    const match = emailBody.match(/<!-- Inquiry ID: (\w+-\d+) -->/);
    if (match) {
      const inquiryId = match[1];
      console.log(`邮件 Inquiry ID: ${inquiryId}`);
      const id = inquiryId.split("-")[1];
      if (id) {
        console.log(`model ID: ${id}`);
      }
      // 你可以在数据库中查找对应的请求并处理
    }

    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest38(): Promise<string> {
    const time = new Date().getTime();
    console.log(time);
    const emailBody = `
      Best regards,  
      John Doe  
      TradeAtlas  
      Tracking Code: TA-20240318-001
`;

    const match = emailBody.match(/Tracking Code:\s*([A-Z]+-\d{13}-\d+)/);

    if (match) {
      const trackingCode = match[1];
      const id = trackingCode.split("-")[2];
      console.log(id);
      console.log(`解析到的 Tracking Code: ${trackingCode}`);
    } else {
      console.log("未找到 Tracking Code");
    }

    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest39(): Promise<string> {
    const res = await axios.post(
      "https://abc.easiio.com/chatapi/execute/service3/perplexity_query/generate_industry_analysis",
      {
        args: {
          json_data: {
            session_id: "de79124c-ff84-45a4-9bcd-fea2bf8c344a",
          },
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      }
    );
    console.log(res);
    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest40(): Promise<string> {
    const Docxtemplater = require("docxtemplater");
    const JSZip = require("jszip");
    const fileUrl =
      "https://file.sflow.pro/abc/industry_analysis_report_template.docx";
    try {
      console.log("ready reviewDocModel");
      // const reviewDocModel = JSON.parse(
      //   paperwork.reviewDocJson.replace(/\n/g, "\\n").replace(/\r/g, "\\r")
      // );
      const reviewDocModel: any = {
        session_name: "AI Report",
        报告概览: {
          行业: "软件服务外包",
          生成日期: "2025-03-26",
        },
        行业趋势分析: {
          "产业热点 & 新兴技术": {
            当前市场规模: "4979.39亿元",
            年复合增长率: "11.8%",
            技术热点: "人工智能、云计算、大数据分析、区块链、物联网",
          },
          政策影响分析: {
            关键政策: "《关于促进服务外包产业高质量发展的指导意见》",
            趋势: "政府支持服务外包产业发展，鼓励企业数字化转型，推动产业向高附加值领域升级",
          },
          竞争格局分析: {
            市场集中度: "中等",
            主要参与者:
              "宝信软件、超图软件、浪潮软件、久其软件、用友网络、中软国际",
          },
        },
        市场机会评估: {
          赛道推荐: "IT应用服务、业务流程外包、IT基础设施服务离岸外包",
          传统行业结合新赛道的可行性评估:
            "传统制造业与设计研发外包结合具有较高可行性，全球制造业设计研发逐渐向发展中国家转移",
          "SWOT 分析": {
            "优势（Strengths）": [
              "技术人才储备丰富",
              "成本优势明显",
              "政策支持力度大",
              "产业基础设施完善",
              "国际市场认可度提升",
            ],
            "劣势（Weaknesses）": [
              "高端人才相对缺乏",
              "自主创新能力需提升",
              "品牌影响力有待加强",
              "国际化程度不足",
              "项目管理水平有待提高",
            ],
            "机会（Opportunities）": [
              "全球数字化转型加速",
              "新兴技术应用场景扩大",
              "国内市场需求持续增长",
              "国际市场开拓空间广阔",
              "产业链向高附加值环节延伸",
            ],
            "威胁（Threats）": [
              "国际竞争日益激烈",
              "技术更新迭代加快",
              "人力成本优势逐渐减弱",
              "地缘政治风险增加",
              "数据安全和隐私保护要求提高",
            ],
          },
        },
        数据支持: {
          "过去数据 vs. 未来发展预测": {
            市场规模: "2023年4979.39亿元，2025年预计达到5700亿元",
            增长率: "年均增长率约11-12%",
            企业数量: null,
            融资金额: null,
            总结来说:
              "软件服务外包行业保持稳定增长，预计未来几年将继续保持两位数的增长率",
          },
          产业链上下游数据: {
            上游基础设施层: "软件供应商、硬件供应商、软件外协开发商",
            中游核心技术层: "软件开发、系统集成、数据分析、测试与维护服务",
            下游应用层: "金融、互联网、能源、电信、交通等支柱型产业",
          },
        },
        投资建议与战略: {
          "短期投资建议 (1-2年)":
            "关注AI、云计算等新兴技术在软件外包领域的应用，投资具有技术创新能力和优质客户资源的企业，重点布局金融、互联网等高增长领域的软件外包服务",
        },
        风险提示:
          "行业竞争加剧可能导致利润率下降，技术更新迭代速度快可能增加研发投入压力，国际贸易环境变化可能影响海外业务拓展，数据安全和隐私保护法规趋严可能增加合规成本",
      };
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
                      // data[`${subKey}`] = subObject[subKey];
                      if (
                        typeof subObject[subKey] === "object" &&
                        subObject[subKey] !== null &&
                        !Array.isArray(subObject[subKey])
                      ) {
                        const subObject2 = subObject[subKey];
                        for (const subKey2 in subObject2) {
                          data[`${subKey2}`] = subObject2[subKey2];
                        }
                      } else {
                        data[subKey] = subObject[subKey];
                      }
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
                resolve(outputFilePathDocx);
                // const name =
                //   uuidStr.slice(0, 1) +
                //   "/" +
                //   uuidStr.slice(1, 2) +
                //   "/" +
                //   paperwork.wxPaidOrders.out_trade_no +
                //   path.extname(outputFilePathDocx);
                // const oss = OSSmanager.getInstance();
                // await oss.put(name, fs.createReadStream(outputFilePathDocx));
                // const nameAI =
                //   uuidStr.slice(0, 1) +
                //   "/" +
                //   uuidStr.slice(1, 2) +
                //   "/" +
                //   paperwork.wxPaidOrders.out_trade_no +
                //   "_ai" +
                //   path.extname(outputFilePathDocx);
                // const ossAi = OSSmanager.getInstance();
                // await ossAi.put(
                //   nameAI,
                //   fs.createReadStream(outputFilePathDocx)
                // );
                // if (fs.existsSync(filePathDocx)) {
                //   console.log("delete filePathDocx:" + filePathDocx);
                //   fs.unlinkSync(filePathDocx);
                // }
                // if (fs.existsSync(outputFilePathDocx)) {
                //   console.log(
                //     "delete outputFilePathDocx:" + outputFilePathDocx
                //   );
                //   fs.unlinkSync(outputFilePathDocx);
                // }

                // console.log(name);
                // resolve(
                //   `${process.env.OSS_FILE}/${name},${process.env.OSS_FILE}/${nameAI}`
                // );
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
      return data.toString();
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

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => User)
  async actionTest41(): Promise<User> {
    const userId = "128cc467-9709-4883-81e5-fd1b0516a7e2";
    client.select(0);
    let userStr = await client.get(`user_id_${userId}`);
    if (userStr) {
      console.log("get user from redis");
      const user = JSON.parse(userStr);
      return user;
    } else {
      console.log("get user from db");
      const user = await User.createQueryBuilder("user")
        .leftJoinAndSelect("user.distributor", "distributor")
        .select([
          "user.id",
          "user.name",
          "user.email",
          "user.phone",
          "user.role",
          "user.avatarUrl",
          "user.organizationId",
          "user.state",
          "user.createdAt",
          "user.updatedAt",
          "user.realName",
          "user.desc",
          "distributor.t1DistributorId",
        ])
        .where("user.id = :userId", { userId })
        .getOne();
      if (!user) {
        throw new CommonError("User not found");
      }
      const userStr = JSON.stringify(user);
      client.set(`user_id_${userId}`, userStr, "EX", 3600);
      return user;
    }
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest42(
    @Arg("email", () => String) email: string
  ): Promise<string> {
    const listener = await MailListen.findOneOrFail({
      where: {
        id: 2,
      },
    });
    const emailInput = {
      subject: "test emailSubject",
      contacts: email,
      text: "test emailContent",
      html: "test emailContent",
    };
    const flag = await sendMailFromMailSender(listener, emailInput);
    console.log("flage: " + flag);
    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest43(): Promise<string> {
    const Imap = require("imap-simple");
    const model = await MailListen.findOneOrFail(3);
    const config = {
      imap: {
        user: model.email,
        password: model.password,
        host: model.imapHost, // 例如 Gmail 使用 "imap.gmail.com"
        port: model.imapPort, // 例如 Gmail 使用 993
        tls: true,
        authTimeout: 3000,
      },
    };

    const batchSize = 100; // 每次获取 100 封邮件
    let allMessages = []; // 用来保存所有消息的数组
    let currentIndex = 0; // 当前邮件的索引
    let hasMore = true; // 是否有更多邮件需要处理

    try {
      console.log(config);
      const connection = await Imap.connect(config);
      await connection.openBox("INBOX"); // 选择 "INBOX" 邮件箱

      const searchCriteria = ["ALL"]; // 搜索所有邮件
      const fetchOptions = { bodies: ["HEADER", "TEXT"], markSeen: true };

      while (hasMore) {
        const messages = await connection.search(searchCriteria, fetchOptions);

        if (messages.length > 0) {
          messages.forEach((message: any) => {
            const header = message.parts.find(
              (part: any) => part.which === "HEADER"
            );
            const body = message.parts.find(
              (part: any) => part.which === "TEXT"
            );

            // 处理邮件
            console.log("📩 邮件主题:", header.body.subject[0]);
            console.log("📨 发件人:", header.body.from[0]);
            console.log("📝 内容:", body.body);
            console.log("📅 接收时间:", header.body.date[0]);

            allMessages.push({
              subject: header.body.subject[0],
              from: header.body.from[0],
              body: body.body,
              date: header.body.date[0],
            });
          });

          // 增加索引，处理下一个批次
          currentIndex += batchSize;
          console.log("已处理第 " + currentIndex + " 封邮件。");
          // 如果没有更多邮件了，停止
          if (messages.length < batchSize) {
            hasMore = false;
          }
        } else {
          // 没有更多邮件了，停止
          hasMore = false;
        }
      }

      connection.end();
      console.log("已处理所有邮件。");
    } catch (error) {
      console.error("❌ 读取邮件失败:", error);
    }

    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest44(): Promise<string> {
    const model = await MailListen.findOneOrFail(2);
    var { MailListener } = require("mail-listener5"); // NOTE: A FUTURE VERSION (release date TBA) will not require ES6 destructuring or referring to the class after the require statement (i.e. require('mail-listener5').MailListener). At this stage, this is necessary because index.js exports the MailListener class as a property of module.exports.
    let total = 0;
    const emailDate = new Date();
    const formattedDate = emailDate
      .toUTCString()
      .split(" ")
      .slice(1, 4)
      .join("-"); // "07-Apr-2025"
    var mailListener = new MailListener({
      username: model.email,
      password: model.password,
      host: model.imapHost,
      port: model.imapPort, // imap port
      tls: true,
      connTimeout: 10000, // Default by node-imap
      authTimeout: 5000, // Default by node-imap,
      debug: console.log, // Or your custom function with only one incoming argument. Default: null
      autotls: "never", // default by node-imap
      tlsOptions: { rejectUnauthorized: false },
      mailbox: "INBOX", // mailbox to monitor
      searchFilter: ["UNSEEN", ["SINCE", formattedDate]], // the search filter being used after an IDLE notification has been retrieved
      markSeen: true, // all fetched email willbe marked as seen and not fetched next time
      fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
      attachments: true, // download attachments as they are encountered to the project directory
      attachmentOptions: { directory: "attachments/" }, // specify a download directory for attachments
    });

    mailListener.start();
    mailListener.on("server:connected", function () {
      console.log("imapConnected");
    });

    mailListener.on(
      "mailbox",
      function (mailbox: { messages: { total: any } }) {
        console.log("Total number of mails: ", mailbox.messages.total); // this field in mailbox gives the total number of emails
        total = mailbox.messages.total;
        if (total === 0) {
          mailListener.stop();
        }
      }
    );

    mailListener.on("server:disconnected", function () {
      console.log("imapDisconnected");
      mailListener.stop();
    });

    mailListener.on("error", function (err: any) {
      console.log(err);
      mailListener.stop();
    });

    mailListener.on("mail", function (mail: any, seqno: any) {
      // do something with the whole email as a single object
      if (total === 0) {
        // mailListener.stop();
      }

      console.log("Seqno: ", seqno);
      console.log(
        "from:" + mail.to["value"][0] ? mail.to["value"][0].address : ""
      );
      console.log("subject:" + mail.subject);
      // console.log("text:"+mail.text);
      // console.log("html:"+mail.html);
      console.log("date: " + mail.date);
      console.log("attachments:");
      console.log(mail.attachments);
      const time = new Date(mail.date).toLocaleString();
      console.log("time: " + time);
      // if (total === seqno) {
      //   console.log("mailListener end");
      //   // mailListener.stop();
      //   mailListener.stop();
      // }
    });
    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest45(): Promise<string> {
    const html = "sfsdfsdfsdfsfsd";
    const match = html.match(/Tracking Code:\s*([A-Z]+-\d{13}-\d+)/);
    console.log(match);
    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest46(): Promise<string> {
    const model = await MailListen.findOneOrFail(4);
    const { ImapFlow } = require("imapflow");
    const simpleParser = require("mailparser").simpleParser;
    setImmediate(async () => {
      try {
        const silentLogger = {
          trace: () => {},
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: console.error,
          fatal: () => {},
        };
        const client = new ImapFlow({
          host: model.imapHost,
          port: model.imapPort,
          secure: true,
          auth: {
            user: model.email,
            pass: model.password,
          },
          logger: silentLogger,
        });

        try {
          await client.connect();
          await client.mailboxOpen("INBOX");
          // for await (let mailbox of client.list()) {
          //   console.log(mailbox.path); // 输出所有文件夹路径
          // }
          // const yesterday = new Date(Date.now() - 60 * 60 * 1000); // 24 小时内
          // // 只拉取最近 1 天的邮件
          // const messageSequence = await client.search({
          //   since: yesterday,
          // });
          console.log("Connected to mailbox");
          const messages = [];
          for await (let msg of client.fetch("1:*", {
            // for await (let msg of client.fetch(messageSequence, {
            envelope: true,
            source: true,
          })) {
            // console.log(msg);
            // console.log(JSON.stringify(msg.envelope));
            const parsed = await simpleParser(msg.source);
            messages.push(parsed);
          }

          messages.forEach((parsed) => {
            if (!parsed.inReplyTo) {
              return;
            }
            console.log("--- 邮件信息 ---");
            console.log("主题:", parsed.subject);
            console.log("发件人:", parsed.from.value[0].address);
            console.log(
              "收件人:",
              parsed.to.value.length > 0 ? parsed.to.value[0].address : ""
            );
            console.log("时间:", new Date(parsed.date).toLocaleString());
            // console.log("正文文本:", parsed.text);
            // console.log("正文HTML:", parsed.html);
            console.log("msgId:", parsed.messageId);
            console.log("replyId:", parsed.inReplyTo);
          });

          console.log(`Fetched ${messages.length} mails`);
          await client.logout();
          return "success";
        } catch (err: any) {
          return err.response;
        }
        // console.log("任务完成");
      } catch (err) {
        console.error("任务失败", err);
      }
    });
    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest47(): Promise<string> {
    const model = await MailListen.findOneOrFail(6);
    const { ImapFlow } = require("imapflow");
    // const simpleParser = require("mailparser").simpleParser;

    const silentLogger = {
      trace: () => {},
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: console.error,
      fatal: () => {},
    };
    const client = new ImapFlow({
      host: model.imapHost,
      port: model.imapPort,
      secure: true,
      auth: {
        user: model.email,
        pass: model.password,
      },
      logger: silentLogger,
    });

    try {
      await client.connect();
      await client.mailboxOpen("INBOX");
      await client.logout();
      return "success";
    } catch (err: any) {
      return err.response;
    }
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest48(): Promise<string> {
    let infoArr: any = [];
    const info = {
      id: "",
      decisionInfluence: "",
      communicationPreference: "",
    };
    console.log(info);
    infoArr.push(info);
    // console.log(JSON.stringify(infoArr));
    const str = JSON.stringify(infoArr);
    console.log(str);
    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest49(
    @Arg("prompt", () => String) prompt: string
  ): Promise<string> {
    const input =
      "请根据客户邮件内容判断其所属的业务阶段分类。分类标准如下：2：意向阶段客户符合目标客户特征，并表现出一定的兴趣或购买意向，适合后续跟进。3：沟通交流阶段客户已展现明确需求，具备购买能力，当前处于与销售团队的初步交流阶段。4：洽谈阶段客户正在与我们就方案、价格、合同等具体细节进行深入沟通，接近成交。5：签约客户客户已完成签约或下单，并正在使用产品或服务，双方保持持续互动。6：暂缓跟进客户曾有合作，但近期沟通较少，暂未表现出进一步合作意愿。7：流失客户客户长期未互动或已明确终止合作，暂不活跃，需重点挽回。0：无法判断邮件内容中未能体现以上任一情况。要求：仅返回分类对应的数字（如：2、3、4、5、6、7或0）作为判断结果。不输出除数字以外的内容。请根据邮件内容进行合理推断。" +
      prompt;
    const res = await requestPerplexityJsonParseEmailContent(input);
    console.log(res);
    return res;
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest50(): Promise<string> {
    const now = new Date();

    // 今天
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // 昨天
    const yesterday = subDays(now, 1);
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);

    // 最近7天（包括今天）
    const last7DaysStart = startOfDay(subDays(now, 6)); // 6天前的0点
    const last7DaysEnd = endOfDay(now); // 今天的23:59:59

    console.log("今天:", todayStart, "-", todayEnd);
    console.log("昨天:", yesterdayStart, "-", yesterdayEnd);
    console.log("最近7天:", last7DaysStart, "-", last7DaysEnd);
    console.log(Between(last7DaysStart, last7DaysEnd));

    console.log(getTodayStart());
    console.log(getYesterdayStart());
    console.log(getLast7DaysStart());
    console.log(getLast30DaysStart());
    console.log(getThisWeekStart());
    console.log(getThisMonthStart());
    return "res";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest51(
    @Arg("prompt", () => String) prompt: string
  ): Promise<string> {
    const res = await getCustomerProfilePersonFromChatGPT(prompt);
    console.log(res);
    console.log(res.employment_history[0].organization_name);
    return "res";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest52(
    @Arg("prompt", () => String) prompt: string
  ): Promise<string> {
    const res = await getCustomerProfileCompanyFromChatGPT(prompt);
    console.log(res.basic_info.founded);
    return "res";
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => String)
  async actionTest53(): Promise<string> {
    const strArr = [];
    strArr.push("hello");
    strArr.push("world");
    console.log(strArr);
    strArr.length = 0;
    console.log(strArr);
    strArr.push("down");
    console.log(strArr);
    return "res";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest54(): Promise<string> {
    const model = await MailListen.findOneOrFail(4);
    const { ImapFlow } = require("imapflow");
    const simpleParser = require("mailparser").simpleParser;
    setImmediate(async () => {
      try {
        const silentLogger = {
          trace: () => {},
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: console.error,
          fatal: () => {},
        };
        const client = new ImapFlow({
          host: model.imapHost,
          port: model.imapPort,
          secure: true,
          auth: {
            user: model.email,
            pass: model.password,
          },
          logger: silentLogger,
        });
        try {
          await client.connect();
          // for await (let mailbox of client.list()) {
          //   console.log(mailbox.path); // 输出所有文件夹路径
          // }
          await client.mailboxOpen("Sent Messages"); // 替换为你真实的发件箱路径
          const yesterday = new Date(Date.now() - 60 * 60 * 1000); // 24 小时内
          const messageSequence = await client.search({
            since: yesterday,
          });
          // 获取最近10封邮件的简要信息
          let messages = await client.fetch(messageSequence, {
            envelope: true,
            uid: true,
            source: true,
          });

          for await (let message of messages) {
            const parsed = await simpleParser(message.source);
            // console.log(parsed.text);
            // console.log({
            //   subject: message.envelope.subject,
            //   to: message.envelope.to,
            //   date: message.envelope.date,
            //   text: message.envelope.text,
            //   uid: message.uid,
            // });
            console.log("--- 邮件信息 ---");
            console.log("主题:", parsed.subject);
            console.log("发件人:", parsed.from.value[0].address);
            console.log("发件人名字:", parsed.from.value[0].name);
            console.log(
              "收件人:",
              parsed.to.value.length > 0 ? parsed.to.value[0].address : ""
            );
            console.log("时间:", new Date(parsed.date).toLocaleString());
            // console.log("正文文本:", parsed.text);
            // console.log("正文HTML:", parsed.html);
            console.log("msgId:", parsed.messageId);
            console.log("replyId:", parsed.inReplyTo);
          }
          console.log("Connected to mailbox");
          await client.mailboxOpen("Sent Messages");
          await client.logout();
          return "success";
        } catch (err: any) {
          return err.response;
        }
        // console.log("任务完成");
      } catch (err) {
        console.error("任务失败", err);
      }
    });
    return "";
  }

  @UseMiddleware([ErrorInterceptor])
  @Mutation(() => String)
  async actionTest55(): Promise<string> {
    const model = await MailListen.findOneOrFail(4);
    const { ImapFlow } = require("imapflow");
    // const simpleParser = require("mailparser").simpleParser;
    setImmediate(async () => {
      try {
        const silentLogger = {
          trace: () => {},
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: console.error,
          fatal: () => {},
        };
        const client = new ImapFlow({
          host: model.imapHost,
          port: model.imapPort,
          secure: true,
          auth: {
            user: model.email,
            pass: model.password,
          },
          logger: silentLogger,
        });
        const sentKeywords = ["sent", "已发送", "发件箱", "发送"]; // 支持中英文关键词
        let sentMailboxPath = null;
        try {
          await client.connect();
          console.log("IMAP连接成功");
          // await client.mailboxOpen("INBOX");
          const mailboxes = await client.list("", "*");
          for (const mailbox of mailboxes) {
            const path = (mailbox.path || "").toLowerCase();
            console.log("检查文件夹:", path);

            if (sentKeywords.some((keyword) => path.includes(keyword))) {
              sentMailboxPath = mailbox.path;
              console.log("✅ 找到发件箱:", sentMailboxPath);
              break; // 找到一个就停
            }
          }

          if (!sentMailboxPath) {
            console.warn("⚠️ 没找到发件箱，请人工检查");
          }
          console.log("Connected to mailbox");
          await client.logout();
          return "success";
        } catch (err: any) {
          return err.response;
        }
        // console.log("任务完成");
      } catch (err) {
        console.error("任务失败", err);
      }
    });
    return "";
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => String)
  async actionTest56(): Promise<string> {
    // let person: { name: string; age?: number,[k: string]: any };
    // person = { name: "keefelin" };
    // console.log(person);
    // person.age = 25;
    // person.gender = "male";
    // console.log(person);

    // let car: { price: number; color: string; [k: string]: any };
    // car = { price: 10000, color: "red" };
    // console.log(car);
    // car.brand = "Toyota";
    // console.log(car);

    // let student: {
    //   // student 隔分】⻋回【用使，容内体具的象对 制限
    //   id: string;
    //   name: string;
    //   age: number;
    //   grade: number;
    // };

    // student = { id: "001", name: "keefelin", age: 25, grade: 3 };
    // console.log(student);
    // student.grade = 4;
    // console.log(student);
    // enum Color {
    //   Red,
    //   Blue,
    //   Black,
    // }
    // console.log(Color);
    // console.log(Color.Red);
    // function test<T,K>(a: T, b: K): T {
    //   console.log(a, b);
    //   return a;
    // }
    // test(1, "2");
    // const customerStateCounts: {[k: string]: any} = {};
    // let customerStateAllCount = 0;
    // for (let i = 1; i <= 6; i++) {
    //   customerStateCounts[i] = i;
    //   customerStateAllCount += customerStateCounts[i];
    // }
    // console.log(customerStateCounts);
    // console.log({ ...customerStateCounts });
    // console.log(customerStateAllCount);
    const res1 = getThisWeekDaysUntilToday();
    console.log(res1);
    const res2 = getWeeksOfThisMonthUntilNow();
    console.log(res2);
    //测试CI/CD4
    return "res";
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => String)
  async actionTest57(): Promise<string> {
    return "res";
  }
}

export default ActionTestResolver;
