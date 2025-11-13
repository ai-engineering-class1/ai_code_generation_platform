import {
  Resolver,
  // Mutation,
  Arg,
  UseMiddleware,
  Int,
  Query,
  Mutation,
  Ctx,
} from "type-graphql";

import { ErrorInterceptor, ResolveTime } from "@/middlewares";
import {
  IsAdminAndDistributorAuth,
  IsAdminAuth,
  IsAuth,
} from "@/middlewares/isAuth";
import { CommonError } from "@/errors";
import axios from "axios";
import fs from "fs";
import crypto from "crypto";
import path from "path";
import {
  Commodity,
  LlmTrace,
  WxPaidOrders,
  WxRefundOrders,
  WxUser,
  Paperwork,
  WxUserConsultQuota,
  Distributor,
  DistributorWithdrawFunds,
  LegalDocumentProject,
  // LegalDocumentProject,
} from "@/models";
import { format } from "date-fns";
import {
  wxPayLinkResult,
  WxPaidOrdersResult,
  LlmTraceResult,
  LlmTraceUpdateInput,
  ProjectAndConsultQuotasResult,
} from "./types";
import { GQLContext } from "@/types/context";
import { isNonEmptyString, isValidNumber } from "@/utils/validations";
import { createRandomNumber, createRandomString } from "@/utils/common";
import {
  calculateWxUserDistributorSplitRatio,
  // getDistributorCommissionBalance,
  // updateWxPaidOrdersRelateDistributorWithdrawFunds,
  getDistributorCommissionBalanceOrderIds,
  updateWxPaidOrdersDistributorWithdrawFundsId,
  getDistributorAllShare,
} from "@/utils/distributorSplitRatio";
import {
  Like,
  In,
  getConnection,
  IsNull,
  MoreThan,
  getRepository,
} from "typeorm";
import { encryptedName, wxResourceDecrypt } from "@/utils/encode";
// import AsyncLock from "async-lock";
//====微信支付
function createSign(
  method: string,
  url: string,
  timestamp: number,
  nonce_str: string,
  order: any
) {
  let signStr;
  if (order === "") {
    signStr = `${method}\n${url}\n${timestamp}\n${nonce_str}\n\n`;
  } else {
    signStr = `${method}\n${url}\n${timestamp}\n${nonce_str}\n${JSON.stringify(
      order
    )}\n`;
  }

  console.log(signStr);
  const filePath = path.join(process.cwd(), "certificate/apiclient_key.pem");
  let cert = fs.readFileSync(filePath, "utf-8");
  let sign = crypto.createSign("RSA-SHA256");
  sign.update(signStr);
  return sign.sign(cert, "base64");
}

function createPaySign(
  timestamp: number,
  nonce_str: string,
  prepay_id: string
) {
  let signStr = `${process.env.WECHAT_AppID}\n${timestamp}\n${nonce_str}\n${prepay_id}\n`;
  console.log(signStr);
  const filePath = path.join(process.cwd(), "certificate/apiclient_key.pem");
  let cert = fs.readFileSync(filePath, "utf-8");
  let sign = crypto.createSign("RSA-SHA256");
  sign.update(signStr);
  return sign.sign(cert, "base64");
}

//=====

@Resolver()
class PaymentResolver {

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => String)
  //查找用户咨询过的对话
  async getMiniWeixinCodeUrl(
    @Arg("openid", () => String) openid: string,
    @Arg("commodityId", () => Int) commodityId: number
  ): Promise<string> {
    const wxUser = await WxUser.findOneOrFail({
      where: {
        openId: openid,
      },
      relations: [
        "distributor",
        "distributor.distributorSplitRatio",
        "distributor.t1Distributor",
        "distributor.t1Distributor.distributorSplitRatio2",
        "distributor.t1Distributor.distributorSplitRatio3",
      ],
    });
    const commodity = await Commodity.findOneOrFail({
      where: [
        {
          organizationId: wxUser.organizationId,
          id: commodityId,
          stock: IsNull(),
        },
        {
          organizationId: wxUser.organizationId,
          id: commodityId,
          stock: MoreThan(0),
        },
      ],
      relations: ["legalDocumentProject"],
    });
    // const model = await WxPaidOrders.findOne({
    //   where: {
    //     wxUserId: wxUser.id,
    //     commodityId: commodity.id,
    //     state: "SUCCESS",
    //   },
    //   order: {
    //     id: "DESC",
    //   },
    // });
    // if (model) {
    //   return model.out_trade_no;
    // }
    if (isValidNumber(commodity.stock) && commodity.stock < 1) {
      throw new CommonError("Empty stock");
    }
    const out_trade_no =
      format(new Date(), "yyMMddHHmmss") + (await createRandomNumber(4));
    const input = {
      mchid: process.env.WECHAT_MCHID, // "1649637331",
      out_trade_no: out_trade_no,
      appid: process.env.WECHAT_AppID,
      description: "Easiio chat ai",
      notify_url: process.env.API_URL.replace("graphql", "wxNotify"),
      amount: {
        total: commodity.price,
        currency: "CNY",
      },
      payer: {
        openid: openid,
      },
    };
    console.log(input);
    if (commodity.price === 0 || wxUser.freeTimes > 0) {
      const model = await WxPaidOrders.create({
        out_trade_no: out_trade_no,
        total: commodity.price,
        currency: "CNY",
        type: "weixinpay",
        wxUserId: wxUser.id,
        organizationId: wxUser.organizationId,
        commodityId: commodity.id,
        success_time: new Date().toISOString(),
        state: "SUCCESS",
      }).save();

      wxUser.lastPayDate = new Date();
      if (commodity.price !== 0) {
        wxUser.freeTimes -= 1;
      }
      await wxUser.save();
      commodity.salesVolume += 1;
      await commodity.save();
      if (
        commodity.legalDocumentProject &&
        commodity.legalDocumentProject.isConsult === 0
      ) {
        console.log("create paperwork");
        const uuid = require("uuid");
        const uuidStr = uuid.v1();
        await Paperwork.create({
          wxUserId: wxUser.id,
          legalDocumentProjectId: commodity.legalDocumentProjectId!,
          organizationId: wxUser.organizationId,
          wxPaidOrdersId: model.id,
          uuid: uuidStr,
        }).save();
      } else if (
        commodity.legalDocumentProject &&
        commodity.legalDocumentProject.isConsult === 1
      ) {
        const existWxUserConsultQuota = await WxUserConsultQuota.findOne({
          wxUserId: wxUser.id,
          legalDocumentProjectId: commodity.legalDocumentProjectId!,
          organizationId: wxUser.organizationId,
        });
        if (existWxUserConsultQuota) {
          existWxUserConsultQuota.quotaConsult += commodity.availableQueries;
          existWxUserConsultQuota.latestOrderTime = new Date();
          existWxUserConsultQuota.validDays = commodity.validDays;
          await existWxUserConsultQuota.save();
        } else {
          await WxUserConsultQuota.create({
            wxUserId: wxUser.id,
            legalDocumentProjectId: commodity.legalDocumentProjectId!,
            organizationId: wxUser.organizationId,
            quotaConsult: commodity.availableQueries,
            latestOrderTime: new Date(),
            validDays: commodity.validDays,
          }).save();
        }
      } else {
        console.log("add chat queries");
        wxUser.availableQueries += commodity.availableQueries;
        await wxUser.save();
      }
      console.log(commodity.stock);
      if (isValidNumber(commodity.stock) && commodity.stock > 0) {
        // commodity.stock -= 1;
        // await commodity.save();
        await Commodity.update(commodity.id, {
          stock: commodity.stock - 1,
        });
      }
      return out_trade_no;
    }
    return "";
    
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getWeixinCodeUrl(
    @Arg("openid", () => String) openid: string,
    @Arg("commodityId", () => Int) commodityId: number
  ): Promise<string> {
    const wxUser = await WxUser.findOneOrFail({
      where: {
        openId: openid,
      },
      relations: [
        "distributor",
        "distributor.distributorSplitRatio",
        "distributor.t1Distributor",
        "distributor.t1Distributor.distributorSplitRatio2",
        "distributor.t1Distributor.distributorSplitRatio3",
      ],
    });
    const commodity = await Commodity.findOneOrFail({
      where: [
        {
          organizationId: wxUser.organizationId,
          id: commodityId,
          stock: IsNull(),
        },
        {
          organizationId: wxUser.organizationId,
          id: commodityId,
          stock: MoreThan(0),
        },
      ],
      relations: ["legalDocumentProject"],
    });
    if (isValidNumber(commodity.stock) && commodity.stock < 1) {
      throw new CommonError("Empty stock");
    }
    const out_trade_no =
      format(new Date(), "yyMMddHHmmss") + (await createRandomNumber(4));
    const input = {
      mchid: process.env.WECHAT_MCHID, // "1649637331",
      out_trade_no: out_trade_no,
      appid: process.env.WECHAT_AppID,
      description: "Easiio chat ai",
      notify_url: process.env.API_URL.replace("graphql", "wxNotify"),
      amount: {
        total: commodity.price,
        currency: "CNY",
      },
      payer: {
        openid: openid,
      },
    };
    console.log(input);
    if (commodity.price === 0 || wxUser.freeTimes > 0) {
      const model = await WxPaidOrders.create({
        out_trade_no: out_trade_no,
        total: commodity.price,
        currency: "CNY",
        type: "weixinpay",
        wxUserId: wxUser.id,
        organizationId: wxUser.organizationId,
        commodityId: commodity.id,
        success_time: new Date().toISOString(),
        state: "SUCCESS",
      }).save();

      wxUser.lastPayDate = new Date();
      if (commodity.price !== 0) {
        wxUser.freeTimes -= 1;
      }
      await wxUser.save();
      commodity.salesVolume += 1;
      await commodity.save();
      if (
        commodity.legalDocumentProject &&
        commodity.legalDocumentProject.isConsult === 0
      ) {
        console.log("create paperwork");
        const uuid = require("uuid");
        const uuidStr = uuid.v1();
        await Paperwork.create({
          wxUserId: wxUser.id,
          legalDocumentProjectId: commodity.legalDocumentProjectId!,
          organizationId: wxUser.organizationId,
          wxPaidOrdersId: model.id,
          uuid: uuidStr,
        }).save();
      } else if (
        commodity.legalDocumentProject &&
        commodity.legalDocumentProject.isConsult === 1
      ) {
        const existWxUserConsultQuota = await WxUserConsultQuota.findOne({
          wxUserId: wxUser.id,
          legalDocumentProjectId: commodity.legalDocumentProjectId!,
          organizationId: wxUser.organizationId,
        });
        if (existWxUserConsultQuota) {
          existWxUserConsultQuota.quotaConsult += commodity.availableQueries;
          existWxUserConsultQuota.latestOrderTime = new Date();
          existWxUserConsultQuota.validDays = commodity.validDays;
          await existWxUserConsultQuota.save();
        } else {
          await WxUserConsultQuota.create({
            wxUserId: wxUser.id,
            legalDocumentProjectId: commodity.legalDocumentProjectId!,
            organizationId: wxUser.organizationId,
            quotaConsult: commodity.availableQueries,
            latestOrderTime: new Date(),
            validDays: commodity.validDays,
          }).save();
        }
      } else {
        console.log("add chat queries");
        wxUser.availableQueries += commodity.availableQueries;
        await wxUser.save();
      }
      console.log(commodity.stock);
      if (isValidNumber(commodity.stock) && commodity.stock > 0) {
        // commodity.stock -= 1;
        // await commodity.save();
        await Commodity.update(commodity.id, {
          stock: commodity.stock - 1,
        });
      }
      return out_trade_no;
    }
    let timestamp = Math.floor(new Date().getTime() / 1000);
    let nonce_str = await createRandomString(32);
    let signature = createSign(
      "POST",
      "/v3/pay/transactions/jsapi",
      timestamp,
      nonce_str,
      input
    );
    let Authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${process.env.WECHAT_MCHID}",nonce_str="${nonce_str}",timestamp="${timestamp}",signature="${signature}",serial_no="${process.env.WECHAT_SERIAL_NO}"`;

    try {
      const res = await axios.post(
        "https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi",
        JSON.stringify(input),
        {
          headers: {
            Authorization: Authorization,
            "content-type": "application/json",
          },
        }
      );
      console.log(res.data);
      const share = await calculateWxUserDistributorSplitRatio(
        wxUser,
        commodity.price
      );
      await WxPaidOrders.create({
        out_trade_no: out_trade_no,
        total: commodity.price,
        currency: "CNY",
        type: "weixinpay",
        wxUserId: wxUser.id,
        organizationId: wxUser.organizationId,
        commodityId: commodity.id,
        t1_share: share.t1_share,
        t2_share: share.t2_share,
      }).save();
      const wxRes = new wxPayLinkResult();
      wxRes.timestamp = timestamp;
      wxRes.nonce_str = nonce_str;
      wxRes.paySign = createPaySign(
        timestamp,
        nonce_str,
        `prepay_id=${res.data.prepay_id}`
      );
      wxRes.prepay_id = res.data.prepay_id;
      wxRes.out_trade_no = out_trade_no;
      console.log(commodity.stock);
      if (isValidNumber(commodity.stock) && commodity.stock > 0) {
        // commodity.stock -= 1;
        // await commodity.save();
        await Commodity.update(commodity.id, {
          stock: commodity.stock - 1,
        });
      }
      return JSON.stringify(wxRes);
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

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => WxPaidOrders)
  async getWxPaidOrderByOuttradeno(
    @Arg("outtradeno", () => String) outtradeno: string
  ): Promise<WxPaidOrders> {
    const model = await WxPaidOrders.findOneOrFail({
      out_trade_no: outtradeno,
    });
    return model;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => [WxPaidOrders])
  async getSelfWxPaidOrders(
    @Arg("openid", () => String) openid: string,
    @Arg("state", () => String, { nullable: true }) state: string,
    @Arg("status", () => [Int], { nullable: true }) status: number[]
  ): Promise<WxPaidOrders[]> {
    const wxUser = await WxUser.findOneOrFail({
      openId: openid,
    });
    let sql = `wxPaidOrders.wxUserId = '${wxUser.id}'`;
    // let input: any = {
    //   wxUserId: wxUser.id,
    // };

    if (isNonEmptyString(state)) {
      // input.state = state;
      sql += ` and wxPaidOrders.state = '${state}'`;
    }
    if (status && status.length > 0) {
      // input.status = In(status);
      sql += ` and wxPaidOrders.status in (${status.join(",")})`;
    }
    // console.log(input);
    console.log(`sql:` + sql);
    // const res = await WxPaidOrders.find({
    //   where: input,
    //   relations: ["commodity", "commodity.legalDocumentProject"],
    //   order: { id: "DESC" },
    // });
    const repository = getRepository(WxPaidOrders);
    const res = await repository
      .createQueryBuilder("wxPaidOrders")
      .withDeleted()
      .leftJoinAndSelect("wxPaidOrders.commodity", "commodity")
      .leftJoinAndSelect(
        "commodity.legalDocumentProject",
        "legalDocumentProject"
      )
      .where(sql)
      .orderBy("wxPaidOrders.id", "DESC")
      .getMany();
    return res;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => WxPaidOrdersResult)
  async getSelfWxPaidOrdersAndCount(
    @Arg("openid", () => String) openid: string,
    @Arg("state", () => String, { nullable: true }) state: string,
    @Arg("status", () => [Int], { nullable: true }) status: number[],
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<WxPaidOrdersResult> {
    const wxUser = await WxUser.findOneOrFail({
      openId: openid,
    });
    // let input: any = {
    //   wxUserId: wxUser.id,
    // };

    // if (isNonEmptyString(state)) {
    //   input.state = state;
    // }
    // if (status && status.length > 0) {
    //   input.status = In(status);
    // }
    // const [orders, count] = await WxPaidOrders.findAndCount({
    //   where: input,
    //   relations: ["commodity", "commodity.legalDocumentProject"],
    //   skip: Number.isFinite(skip) ? skip : 0,
    //   take: Number.isFinite(take) ? take : 1000,
    //   order: { id: "DESC" },
    // });
    let sql = `wxPaidOrders.wxUserId = '${wxUser.id}'`;

    if (isNonEmptyString(state)) {
      sql += ` and wxPaidOrders.state = '${state}'`;
    }
    if (status && status.length > 0) {
      sql += ` and wxPaidOrders.status in (${status.join(",")})`;
    }
    console.log(`sql:` + sql);

    const repository = getRepository(WxPaidOrders);
    const [orders, count] = await repository
      .createQueryBuilder("wxPaidOrders")
      .withDeleted()
      .leftJoinAndSelect("wxPaidOrders.commodity", "commodity")
      .leftJoinAndSelect(
        "commodity.legalDocumentProject",
        "legalDocumentProject"
      )
      .where(sql)
      .orderBy("wxPaidOrders.id", "DESC")
      .skip(Number.isFinite(skip) ? skip : 0)
      .take(Number.isFinite(take) ? take : 1000)
      .getManyAndCount();
    const res = new WxPaidOrdersResult();
    res.data = orders;
    res.totalCount = count;
    return res;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => WxPaidOrders)
  async getSelfWxPaidOrder(
    @Arg("openid", () => String) openid: string,
    @Arg("out_trade_no", () => String) out_trade_no: string
  ): Promise<WxPaidOrders> {
    const wxUser = await WxUser.findOneOrFail({
      openId: openid,
    });
    const res = await WxPaidOrders.findOneOrFail({
      where: {
        out_trade_no: out_trade_no,
        wxUserId: wxUser.id,
      },
      relations: ["commodity", "commodity.legalDocumentProject", "paperwork"],
    });
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [WxPaidOrders])
  async getWxPaidOrders(
    @Ctx() ctx: GQLContext,
    @Arg("state", () => String, { nullable: true }) state: string,
    @Arg("status", () => Int, { nullable: true }) status: number
    // @Arg("skip", () => Int, { nullable: true })
    // skip: number,
    // @Arg("take", () => Int, { nullable: true })
    // take: number
  ): Promise<WxPaidOrders[]> {
    const user = ctx.req.currentUser;
    const input: any = {};
    if (user.role === 5) {
      const distributor = await Distributor.findOneOrFail({
        where: {
          userId: user.id,
        },
      });
      let wxUsers;
      if (distributor.t1DistributorId) {
        wxUsers = await WxUser.find({
          where: {
            distributorId: distributor.id,
          },
        });
      } else {
        const t2Distributors = await Distributor.find({
          where: {
            t1DistributorId: distributor.id,
          },
        });
        // const tIds: any[] = [distributor.id];
        // t2Distributors.forEach((element) => {
        //   tIds.push(element.id);
        // });
        const tIds = t2Distributors.map((item) => item.id);
        wxUsers = await WxUser.find({
          where: [
            {
              distributorId: In(tIds),
            },
            {
              distributorId: distributor.id,
            },
          ],
        });
      }
      // const ids: any[] = [];
      // wxUsers.forEach((element) => {
      //   ids.push(element.id);
      // });
      const ids = wxUsers.map((item) => item.id);
      input.wxUserId = In(ids);
    } else {
      input.organizationId = user.organizationId;
    }

    if (isNonEmptyString(state)) {
      input.state = state;
    }
    if (isValidNumber(status)) {
      input.status = status;
    }
    const res = await WxPaidOrders.find({
      where: input,
      relations: [
        "wxUser",
        "wxUser.distributor",
        "wxUser.distributor.t1Distributor",
        "commodity",
      ],
      // skip: Number.isFinite(skip) ? skip : 0,
      // take: Number.isFinite(take) ? take : 1000,
      order: { id: "DESC" },
    });
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => WxPaidOrdersResult)
  async getWxPaidOrdersAndCount(
    @Ctx() ctx: GQLContext,
    @Arg("state", () => String, { nullable: true }) state: string,
    @Arg("status", () => Int, { nullable: true }) status: number,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<WxPaidOrdersResult> {
    const user = ctx.req.currentUser;
    const input: any = {};
    if (user.role === 5) {
      const distributor = await Distributor.findOneOrFail({
        where: {
          userId: user.id,
        },
      });
      let wxUsers;
      if (distributor.t1DistributorId) {
        wxUsers = await WxUser.find({
          where: {
            distributorId: distributor.id,
          },
        });
      } else {
        const t2Distributors = await Distributor.find({
          where: {
            t1DistributorId: distributor.id,
          },
        });
        // const tIds: any[] = [distributor.id];
        // t2Distributors.forEach((element) => {
        //   tIds.push(element.id);
        // });
        const tIds = t2Distributors.map((item) => item.id);
        wxUsers = await WxUser.find({
          where: [
            {
              distributorId: In(tIds),
            },
            {
              distributorId: distributor.id,
            },
          ],
        });
      }

      // const ids: any[] = [];
      // wxUsers.forEach((element) => {
      //   ids.push(element.id);
      // });
      const ids = wxUsers.map((item) => item.id);
      input.wxUserId = In(ids);
    } else {
      input.organizationId = user.organizationId;
    }

    if (isNonEmptyString(state)) {
      input.state = state;
    }
    if (isValidNumber(status)) {
      input.status = status;
    }
    const [orders, count] = await WxPaidOrders.findAndCount({
      where: input,
      withDeleted: true,
      relations: [
        "wxUser",
        "wxUser.distributor",
        "wxUser.distributor.t1Distributor",
        "commodity",
      ],
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 1000,
      order: { id: "DESC" },
    });
    const res = new WxPaidOrdersResult();
    res.data = orders;
    res.totalCount = count;
    return res;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getWeixinPayInfoByOuttradeno(
    @Arg("outtradeno", () => String) outtradeno: string
  ): Promise<string> {
    let timestamp = Math.floor(new Date().getTime() / 1000);
    let nonce_str = await createRandomString(32);
    let signature = createSign(
      "GET",
      `/v3/pay/transactions/out-trade-no/${outtradeno}?mchid=${process.env.WECHAT_MCHID}`,
      timestamp,
      nonce_str,
      ""
    );
    let Authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${process.env.WECHAT_MCHID}",nonce_str="${nonce_str}",timestamp="${timestamp}",signature="${signature}",serial_no="${process.env.WECHAT_SERIAL_NO}"`;

    try {
      const res = await axios.get(
        `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${outtradeno}?mchid=${process.env.WECHAT_MCHID}`,
        {
          headers: {
            Authorization: Authorization,
            "content-type": "application/json",
          },
        }
      );
      console.log(res.data);
      return JSON.stringify(res.data);
    } catch (error) {
      throw new CommonError(JSON.stringify(error));
    }
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => String)
  async refundWeixinPay(
    @Ctx() ctx: GQLContext,
    @Arg("outtradeno", () => String) outtradeno: string
  ): Promise<string> {
    const admin = ctx.req.currentUser;
    const pay = await WxPaidOrders.findOne({
      out_trade_no: outtradeno,
      organizationId: admin.organizationId,
    });
    if (!pay) {
      throw new CommonError("Error order");
    }
    const out_refund_no = "Refund_order" + Math.floor(new Date().getTime());
    const input = {
      out_trade_no: pay.out_trade_no,
      out_refund_no: out_refund_no,
      reason: "User actively applies for a refund",
      amount: {
        refund: pay.total,
        currency: "CNY",
        total: pay.total,
      },
    };
    console.log(input);
    let timestamp = Math.floor(new Date().getTime() / 1000);
    let nonce_str = await createRandomString(32);
    let signature = createSign(
      "POST",
      "/v3/refund/domestic/refunds",
      timestamp,
      nonce_str,
      input
    );
    let Authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${process.env.WECHAT_MCHID}",nonce_str="${nonce_str}",timestamp="${timestamp}",signature="${signature}",serial_no="${process.env.WECHAT_SERIAL_NO}"`;

    try {
      const res = await axios.post(
        "https://api.mch.weixin.qq.com/v3/refund/domestic/refunds",
        JSON.stringify(input),
        {
          headers: {
            Authorization: Authorization,
            "content-type": "application/json",
          },
        }
      );
      const rowModel = JSON.parse(res.data);
      await WxRefundOrders.create({
        out_trade_no: pay.out_trade_no,
        out_refund_no: out_refund_no,
        transaction_id: pay.transaction_id,
        total: pay.total,
        currency: "CNY",
        type: "weixinpay",
        wxUserId: pay.wxUserId,
        refund_id: rowModel.id,
        success_time: rowModel.success_time,
        status: rowModel.status,
        channel: rowModel.channel,
        refund: rowModel.amount.refund,
        rawData: res.data,
        organizationId: admin.organizationId,
        commodityId: pay.commodityId,
      }).save();
      return JSON.stringify(res.data);
    } catch (error: any) {
      throw new CommonError(error.message);
    }
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getWeixinRefundInfoByOutrefundno(
    @Arg("outrefundno", () => String) outrefundno: string
  ): Promise<string> {
    let timestamp = Math.floor(new Date().getTime() / 1000);
    let nonce_str = await createRandomString(32);
    let signature = createSign(
      "GET",
      `/v3/refund/domestic/refunds/${outrefundno}`,
      timestamp,
      nonce_str,
      ""
    );
    let Authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${process.env.WECHAT_MCHID}",nonce_str="${nonce_str}",timestamp="${timestamp}",signature="${signature}",serial_no="${process.env.WECHAT_SERIAL_NO}"`;

    try {
      const res = await axios.get(
        `https://api.mch.weixin.qq.com/v3/refund/domestic/refunds/${outrefundno}`,
        {
          headers: {
            Authorization: Authorization,
            "content-type": "application/json",
          },
        }
      );
      console.log(res.data);
      return JSON.stringify(res.data);
    } catch (error: any) {
      throw new CommonError(error.message);
    }
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => LlmTraceResult)
  async getLlmTrace(
    @Ctx() ctx: GQLContext,
    @Arg("outtradeno", () => String) outtradeno: string,
    @Arg("element", () => String, { nullable: true }) element: string,
    @Arg("skip", () => Int) skip: number,
    @Arg("take", () => Int) take: number,
    @Arg("id", () => Int, { nullable: true }) id: number,
    @Arg("evaluate", () => Int, { nullable: true }) evaluate: number,
    @Arg("solved", () => Int, { nullable: true }) solved: number,
    @Arg("serviceAction", () => Int, { nullable: true }) serviceAction: number,
    @Arg("project", () => String, { nullable: true }) project: string
  ): Promise<LlmTraceResult> {
    let input: any = {};
    if (element && element !== "") {
      input = {
        organizationId: ctx.req.currentUser.organizationId,
        element: Like(`%${element}%`),
      };
    }
    if (outtradeno && outtradeno !== "") {
      input.taskid = Like(`%${outtradeno}%`);
    }
    if (project && project !== "") {
      input.project = project;
    }
    if (isValidNumber(id)) {
      input.id = id;
    }
    if (isValidNumber(evaluate)) {
      input.evaluate = evaluate;
    }
    if (isValidNumber(solved)) {
      input.solved = solved;
    }
    if (isValidNumber(serviceAction)) {
      if (serviceAction === -1) {
        // input.taskid = Like("0%");
        // input.action = 2;
        console.log(input);
        const [result, count] = await LlmTrace.findAndCount({
          where: [
            { ...input, taskid: Like("0%") },
            { ...input, action: 2 },
          ],
          skip: skip,
          take: take,
          order: { id: "DESC" },
        });
        for (let index = 0; index < result.length; index++) {
          result[index].wxUser = await WxUser.findOne({
            where: {
              openId: result[index].openid,
            },
            withDeleted: true,
          });
        }
        const res = new LlmTraceResult();
        res.data = result;
        res.totalCount = count;
        return res;
      } else {
        input.action = serviceAction;
      }
    }
    console.log(input);
    const [result, count] = await LlmTrace.findAndCount({
      where: input,
      skip: skip,
      take: take,
      order: { id: "DESC" },
    });
    for (let index = 0; index < result.length; index++) {
      result[index].wxUser = await WxUser.findOne({
        where: {
          openId: result[index].openid,
        },
        withDeleted: true,
      });
    }
    const res = new LlmTraceResult();
    res.data = result;
    res.totalCount = count;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [String])
  async getLlmTraceElement(
    @Ctx() ctx: GQLContext,
    @Arg("outtradeno", () => String) outtradeno: string
  ): Promise<string[]> {
    const model = await LlmTrace.findOne({
      organizationId: ctx.req.currentUser.organizationId,
      taskid: outtradeno,
    });
    if (!model) {
      return [];
    }
    const connection = getConnection();
    const res = await connection.query(
      `select distinct(element) from llm_trace where taskid = ?;`,
      [outtradeno]
    );
    // let arr: string[] = [];
    // res.forEach((temp: { element: string }) => {
    //   arr.push(temp.element);
    // });
    const arr = res.map((item: { element: any }) => item.element);
    return arr;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => LlmTraceResult)
  async getOrgLlmTrace(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int) skip: number,
    @Arg("take", () => Int) take: number
  ): Promise<LlmTraceResult> {
    const [result, count] = await LlmTrace.findAndCount({
      where: {
        organizationId: ctx.req.currentUser.organizationId,
      },
      skip: skip,
      take: take,
      order: { id: "DESC" },
    });
    for (let index = 0; index < result.length; index++) {
      result[index].wxUser = await WxUser.findOne({
        where: {
          openId: result[index].openid,
        },
        withDeleted: true,
      });
    }
    // console.log(result);
    const res = new LlmTraceResult();
    res.data = result;
    res.totalCount = count;
    return res;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => [WxUserConsultQuota])
  async getWxUserConsultQuotas(
    @Arg("openid", () => String) openid: string
  ): Promise<WxUserConsultQuota[]> {
    const wxUser = await WxUser.findOneOrFail({
      openId: openid,
    });

    const repository = getRepository(WxUserConsultQuota);
    const res = await repository
      .createQueryBuilder("wxUserConsultQuota")
      .withDeleted()
      .leftJoinAndSelect("wxUserConsultQuota.wxUser", "wxUser")
      .leftJoinAndSelect(
        "wxUserConsultQuota.legalDocumentProject",
        "legalDocumentProject"
      )
      .where("wxUserConsultQuota.wxUserId = :wxUserId", { wxUserId: wxUser.id })
      .getMany();

    return res;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => ProjectAndConsultQuotasResult)
  async getProjectAndConsultQuotas(
    @Arg("openid", () => String) openid: string,
    @Arg("projectId", () => String) projectId: string
  ): Promise<ProjectAndConsultQuotasResult> {
    const wxUser = await WxUser.findOneOrFail({
      openId: openid,
    });
    const project = await LegalDocumentProject.findOneOrFail(projectId);

    const consultQuotas = await WxUserConsultQuota.findOne({
      wxUserId: wxUser.id,
      legalDocumentProjectId: project.id,
    });
    const res = new ProjectAndConsultQuotasResult();
    res.project = project;
    if (consultQuotas) {
      res.consultQuotas = consultQuotas;
    }
    return res;
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async testCalculateWxUserDistributorSplitRatio(): Promise<Boolean> {
    const orders = await WxPaidOrders.find();
    for (const order of orders) {
      const wxUser = await WxUser.findOneOrFail({
        where: {
          id: order.wxUserId,
        },
        relations: [
          "distributor",
          "distributor.distributorSplitRatio",
          "distributor.t1Distributor",
          "distributor.t1Distributor.distributorSplitRatio2",
          "distributor.t1Distributor.distributorSplitRatio3",
        ],
      });
      const share = await calculateWxUserDistributorSplitRatio(
        wxUser,
        order.total
      );
      order.t1_share = share.t1_share;
      order.t2_share = share.t2_share;
      await order.save();
    }
    return true;
  }

  // @UseMiddleware([IsAdminAndDistributorAuth, ErrorInterceptor, ResolveTime])
  // @Mutation(() => DistributorWithdrawFunds)
  // async wxIncomeTransferToDistributor(
  //   @Ctx() ctx: GQLContext
  // ): Promise<DistributorWithdrawFunds> {
  //   const user = ctx.req.currentUser;
  //   const distributor = await Distributor.findOneOrFail({
  //     where: {
  //       userId: user.id,
  //     },
  //     relations: ["t2Distributors", "t1Distributor"],
  //   });

  //   if (!user.wxUserId) {
  //     throw new CommonError("Please bind wechat.");
  //   }
  //   if (!isNonEmptyString(user.realName)) {
  //     throw new CommonError("Please enter your real name.");
  //   }
  //   const amount = await getDistributorCommissionBalance(distributor);
  //   if (amount / 10000 < 10) {
  //     throw new CommonError("The minimum withdrawal amount is ￥10.");
  //   }
  //   const wxUser = await WxUser.findOneOrFail(user.wxUserId);

  //   const lock = new AsyncLock();
  //   const model = await lock.acquire<DistributorWithdrawFunds>(
  //     `wxIncomeTransferToDistributor_${distributor.id}`,
  //     async (done) => {
  //       const out_batch_no =
  //         "t" +
  //         format(new Date(), "yyMMddHHmmss") +
  //         (await createRandomNumber(4));
  //       const input = {
  //         appid: process.env.WECHAT_AppID, // "wx6fb0aeefefdfce5e",
  //         out_batch_no: out_batch_no,
  //         batch_name: "给分销商转账",
  //         batch_remark: "给分销商转账",
  //         total_amount: amount / 100,
  //         total_num: 1,
  //         transfer_detail_list: [
  //           {
  //             out_detail_no: "d" + out_batch_no,
  //             transfer_amount: amount / 100,
  //             transfer_remark: "分销商收益",
  //             openid: wxUser.openId,
  //             user_name: encryptedName(user.realName),
  //             //   "o2p6tXtjjGOhzMBTacxcaAHJhyrJdWYsa5S6PuXZHy6rjoMPOpnMcUJtph9Uj11+tws0QxAHQSiap2kStF6qCOwPpv5vP0xW2bMCLAJWZ723iaLbHPw0EFEX/XIwa9iHKoa0GvmMcUB7imNsZJONFvbhZkDMGHBFTcT+9lI89ccxC60MBOAdwJ9mJO9bfLBoRjO6CVwchSc7zg9joaZO2tjdzU6C0Kuzd0E/kAr/iYUZjfPZXUvTPkvF89QArbXLVsLUN+V5nK+YGdeI1BRvws1d+zZpeFFH1QMf2V7OTdE493pKCiomyQ/RmIuxYJvxMRtSSGZ1IWDHYOA6A7mXKQ==",
  //           },
  //         ],
  //         //ehF62H3sVPLC2rQcQKsbgyTmAa6yhcugqf+j76KErxwiUSSG0LrJBy4Jnrmx6Q0+/vC4O7NUmwAgcvhK9EaLOFtWzaDkCWxJUra6plUT2pWraK9fN58huuwmyA1/0SAd20GwOhaeKI0Zn4pnrfv2tQaKernC+OJMXC91ENicH20dFPA7Q232dOpayMn8Tgz28eazcpQCIhrxz5lnW8hTL9JYRSveBYPz9/eGK6sjcOkWFtknBtAgRee4QXQN+WRIReqX4zl0WR4xjREk0PD0ATpWk6EISDEMGZMlgAigaSWfGBg7+ekoyrRvsVpJP6s/ZJUZUkKgA7J5E5AUo848gA==
  //         transfer_scene_id: "1001",
  //         notify_url: process.env.API_URL.replace(
  //           "graphql",
  //           "wxTransferToDistributorNotify"
  //         ),
  //       };
  //       console.log(input);
  //       let timestamp = Math.floor(new Date().getTime() / 1000);
  //       let nonce_str = await createRandomString(32);
  //       let signature = createSign(
  //         "POST",
  //         "/v3/transfer/batches",
  //         timestamp,
  //         nonce_str,
  //         input
  //       );
  //       let Authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${process.env.WECHAT_MCHID}",nonce_str="${nonce_str}",timestamp="${timestamp}",signature="${signature}",serial_no="${process.env.WECHAT_SERIAL_NO}"`;
  //       console.log(Authorization);
  //       try {
  //         const res = await axios.post(
  //           "https://api.mch.weixin.qq.com/v3/transfer/batches",
  //           JSON.stringify(input),
  //           {
  //             headers: {
  //               Authorization: Authorization,
  //               "content-type": "application/json",
  //               Accept: "application/json",
  //               "Wechatpay-Serial": process.env.WECHAT_PUBLIC_KEY,
  //             },
  //           }
  //         );
  //         console.log(res.data);
  //         if (res.data.batch_status === "ACCEPTED") {
  //           const distributorWithdrawFunds =
  //             await DistributorWithdrawFunds.create({
  //               amount: amount / 100,
  //               out_batch_no: out_batch_no,
  //               batch_id: res.data.batch_id,
  //               distributorId: distributor.id,
  //               userId: user.id,
  //             }).save();
  //           await updateWxPaidOrdersRelateDistributorWithdrawFunds(
  //             distributor,
  //             distributorWithdrawFunds
  //           );
  //           // return distributorWithdrawFunds;
  //           return done(null, distributorWithdrawFunds);
  //         }
  //         throw new CommonError("Error transfer batches");
  //       } catch (error: any) {
  //         if (error.response) {
  //           throw new CommonError(JSON.stringify(error.response.data));
  //         } else if (error.request) {
  //           throw new CommonError(JSON.stringify(error.request));
  //         } else {
  //           throw new CommonError(error.message);
  //         }
  //       }
  //     }
  //   );
  //   return model;
  // }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async wxIncomeTransferToDistributorTest(): Promise<Boolean> {
    const out_batch_no =
      "t" + format(new Date(), "yyMMddHHmmss") + (await createRandomNumber(4));
    const input = {
      appid: process.env.WECHAT_AppID, // "wx6fb0aeefefdfce5e",
      out_batch_no: out_batch_no,
      batch_name: "测试给分销商转账",
      batch_remark: "测试给分销商转账",
      total_amount: 30,
      total_num: 1,
      transfer_detail_list: [
        {
          out_detail_no: "d" + out_batch_no,
          transfer_amount: 30,
          transfer_remark: "分销商收益",
          openid: "oUtVHwN0L6MYjvXTfBhqd3HwoYKc",
          user_name: encryptedName("li"),
          //   "o2p6tXtjjGOhzMBTacxcaAHJhyrJdWYsa5S6PuXZHy6rjoMPOpnMcUJtph9Uj11+tws0QxAHQSiap2kStF6qCOwPpv5vP0xW2bMCLAJWZ723iaLbHPw0EFEX/XIwa9iHKoa0GvmMcUB7imNsZJONFvbhZkDMGHBFTcT+9lI89ccxC60MBOAdwJ9mJO9bfLBoRjO6CVwchSc7zg9joaZO2tjdzU6C0Kuzd0E/kAr/iYUZjfPZXUvTPkvF89QArbXLVsLUN+V5nK+YGdeI1BRvws1d+zZpeFFH1QMf2V7OTdE493pKCiomyQ/RmIuxYJvxMRtSSGZ1IWDHYOA6A7mXKQ==",
        },
      ],
      //ehF62H3sVPLC2rQcQKsbgyTmAa6yhcugqf+j76KErxwiUSSG0LrJBy4Jnrmx6Q0+/vC4O7NUmwAgcvhK9EaLOFtWzaDkCWxJUra6plUT2pWraK9fN58huuwmyA1/0SAd20GwOhaeKI0Zn4pnrfv2tQaKernC+OJMXC91ENicH20dFPA7Q232dOpayMn8Tgz28eazcpQCIhrxz5lnW8hTL9JYRSveBYPz9/eGK6sjcOkWFtknBtAgRee4QXQN+WRIReqX4zl0WR4xjREk0PD0ATpWk6EISDEMGZMlgAigaSWfGBg7+ekoyrRvsVpJP6s/ZJUZUkKgA7J5E5AUo848gA==
      transfer_scene_id: "1001",
      notify_url: process.env.API_URL.replace(
        "graphql",
        "wxTransferToDistributorNotify"
      ),
    };
    console.log(input);
    let timestamp = Math.floor(new Date().getTime() / 1000);
    let nonce_str = await createRandomString(32);
    let signature = createSign(
      "POST",
      "/v3/transfer/batches",
      timestamp,
      nonce_str,
      input
    );
    let Authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${process.env.WECHAT_MCHID}",nonce_str="${nonce_str}",timestamp="${timestamp}",signature="${signature}",serial_no="${process.env.WECHAT_SERIAL_NO}"`;
    console.log(Authorization);
    try {
      const res = await axios.post(
        "https://api.mch.weixin.qq.com/v3/transfer/batches",
        JSON.stringify(input),
        {
          headers: {
            Authorization: Authorization,
            "content-type": "application/json",
            Accept: "application/json",
            "Wechatpay-Serial": process.env.WECHAT_PUBLIC_KEY,
          },
        }
      );
      console.log(res.data);
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

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => LlmTrace)
  async updateLlmTrace(
    // @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("llmTrace")
    llmTraceUpdateInput: LlmTraceUpdateInput
  ): Promise<LlmTrace> {
    // const user = ctx.req.currentUser;
    await LlmTrace.findOneOrFail({
      where: {
        id: id,
      },
    });
    await LlmTrace.update(id, llmTraceUpdateInput);
    return await LlmTrace.findOneOrFail(id);
  }

  //获取微信支付public_key
  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getPublicKeyCertificates(): Promise<String> {
    let timestamp = Math.floor(new Date().getTime() / 1000);
    let nonce_str = await createRandomString(32);
    let signature = createSign(
      "GET",
      `/v3/certificates`,
      timestamp,
      nonce_str,
      ""
    );
    let Authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${process.env.WECHAT_MCHID}",nonce_str="${nonce_str}",timestamp="${timestamp}",signature="${signature}",serial_no="${process.env.WECHAT_SERIAL_NO}"`;

    const res = await axios.get(
      `https://api.mch.weixin.qq.com/v3/certificates`,
      {
        headers: {
          Accept: "application/json",
          Authorization: Authorization,
          "User-Agent": "https://zh.wikipedia.org/wiki/User_agent",
        },
      }
    );
    console.log(res.data);
    if (res.data.data.length > 0) {
      for (const input of res.data.data) {
        const resourceData = wxResourceDecrypt(
          input.encrypt_certificate.nonce,
          input.encrypt_certificate.ciphertext,
          input.encrypt_certificate.associated_data
        );
        console.log(JSON.stringify(resourceData));
      }
    }
    return JSON.stringify(res.data);
  }

  @UseMiddleware([IsAdminAndDistributorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => DistributorWithdrawFunds)
  async distributorApplyWxIncomeTransfer(
    @Ctx() ctx: GQLContext
  ): Promise<DistributorWithdrawFunds> {
    const user = ctx.req.currentUser;
    const distributor = await Distributor.findOneOrFail({
      where: {
        userId: user.id,
      },
      relations: ["t2Distributors", "t1Distributor"],
    });

    if (!user.wxUserId) {
      throw new CommonError("请先绑定微信账号。");
    }
    if (!isNonEmptyString(user.realName)) {
      throw new CommonError("请在用户信息中补充您的真实姓名。");
    }
    // const amount = await getDistributorCommissionBalance(distributor);
    const obj = await getDistributorCommissionBalanceOrderIds(distributor);
    const amount = await getDistributorAllShare(obj);
    if (amount / 10000 <= 10) {
      throw new CommonError("最低提款金额为10元。");
    }
    // const wxUser = await WxUser.findOneOrFail(user.wxUserId);

    const out_batch_no =
      "t" + format(new Date(), "yyMMddHHmmss") + (await createRandomNumber(4));
    const distributorWithdrawFunds = await DistributorWithdrawFunds.create({
      amount: amount / 100,
      out_batch_no: out_batch_no,
      batch_id: "",
      distributorId: distributor.id,
      // userId: user.id,
      batch_status: "PROCESSING",
    }).save();
    // await updateWxPaidOrdersRelateDistributorWithdrawFunds(
    //   distributor,
    //   distributorWithdrawFunds
    // );
    await updateWxPaidOrdersDistributorWithdrawFundsId(
      obj,
      distributorWithdrawFunds.id
    );
    return distributorWithdrawFunds;
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => DistributorWithdrawFunds)
  async acceptedDistributorApplyWxIncomeTransfer(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<DistributorWithdrawFunds> {
    const user = ctx.req.currentUser;
    const distributorWithdrawFunds =
      await DistributorWithdrawFunds.findOneOrFail({
        where: {
          id: id,
          batch_status: "PROCESSING",
        },
        relations: ["distributor", "distributor.user"],
      });

    if (!distributorWithdrawFunds.distributor.user.wxUserId) {
      throw new CommonError("Please bind wechat.");
    }
    if (!isNonEmptyString(distributorWithdrawFunds.distributor.user.realName)) {
      throw new CommonError("Please enter your real name.");
    }

    const wxUser = await WxUser.findOneOrFail(
      distributorWithdrawFunds.distributor.user.wxUserId
    );

    const out_batch_no = distributorWithdrawFunds.out_batch_no;
    const input = {
      appid: process.env.WECHAT_AppID, // "wx6fb0aeefefdfce5e",
      out_batch_no: out_batch_no,
      batch_name: "给分销商转账",
      batch_remark: "给分销商转账",
      total_amount: distributorWithdrawFunds.amount,
      total_num: 1,
      transfer_detail_list: [
        {
          out_detail_no: "d" + out_batch_no,
          transfer_amount: distributorWithdrawFunds.amount,
          transfer_remark: "分销商收益",
          openid: wxUser.openId,
          user_name: encryptedName(
            distributorWithdrawFunds.distributor.user.realName
          ),
        },
      ],
      transfer_scene_id: "1001",
      notify_url: process.env.API_URL.replace(
        "graphql",
        "wxTransferToDistributorNotify"
      ),
    };
    console.log(input);
    let timestamp = Math.floor(new Date().getTime() / 1000);
    let nonce_str = await createRandomString(32);
    let signature = createSign(
      "POST",
      "/v3/transfer/batches",
      timestamp,
      nonce_str,
      input
    );
    let Authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${process.env.WECHAT_MCHID}",nonce_str="${nonce_str}",timestamp="${timestamp}",signature="${signature}",serial_no="${process.env.WECHAT_SERIAL_NO}"`;
    console.log(Authorization);
    try {
      const res = await axios.post(
        "https://api.mch.weixin.qq.com/v3/transfer/batches",
        JSON.stringify(input),
        {
          headers: {
            Authorization: Authorization,
            "content-type": "application/json",
            Accept: "application/json",
            "Wechatpay-Serial": process.env.WECHAT_PUBLIC_KEY,
          },
        }
      );
      console.log(res.data);
      if (res.data.batch_status === "ACCEPTED") {
        distributorWithdrawFunds.batch_id = res.data.batch_id;
        distributorWithdrawFunds.userId = user.id;
        distributorWithdrawFunds.approvedDate = new Date();
        distributorWithdrawFunds.batch_status = "ACCEPTED";
        await distributorWithdrawFunds.save();
        return distributorWithdrawFunds;
      }
      throw new CommonError("Error transfer batches");
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

export default PaymentResolver;
