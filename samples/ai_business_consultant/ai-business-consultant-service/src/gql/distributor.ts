import {
  Resolver,
  Mutation,
  Arg,
  UseMiddleware,
  Int,
  Query,
  Ctx,
} from "type-graphql";

import {
  Distributor,
  DistributorSplitRatio,
  DistributorWithdrawFunds,
  User,
  WxPaidOrders,
  WxUser,
  WxUserScanDistributorRecords,
} from "@/models";
import {
  DistributorInput,
  DistributorUpdateInput,
  DistributorSplitRatioInput,
  UserCreateAsDistributorInput,
  DistributorResult,
  DistributorWithdrawFundsResult,
  WxUserScanDistributorRecordsResult,
} from "@/gql/types";
import { ErrorInterceptor, ResolveTime } from "@/middlewares";
import { GQLContext } from "../types/context";
import { isNonEmptyString, isValidNumber } from "@/utils/validations";
import { IsAdminAuth, IsAdminAndDistributorAuth } from "@/middlewares/isAuth";
import { getAccessToken } from "@/utils/common";
import axios from "axios";
import { CommonError } from "@/errors";
// import { IsNull } from "typeorm";
import { hash } from "@/utils/authToken";
import { subDays, format, startOfMonth, subMonths } from "date-fns";
import { getRepository } from "typeorm";
import { getDistributorCommissionBalance } from "@/utils/distributorSplitRatio";

@Resolver()
class DistributorResolver {
  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async setDistributorUuid(): Promise<Boolean> {
    const distributors = await Distributor.find();
    for (const model of distributors) {
      // const uuid = require("uuid");
      // const uuidStr = uuid.v4();
      if (!model.t1DistributorId) {
        const QRCode = require("qrcode");
        const qrContent = `https://${process.env.WEBCONSOLE_SUBDOMAIN}/#/csd/join/${model.uuid}`;
        const t2QrCode = await QRCode.toDataURL(qrContent);

        model.t2QrCode = t2QrCode;
        await model.save();
      }

      const access_token = await getAccessToken();
      const input = {
        action_name: "QR_LIMIT_STR_SCENE",
        action_info: { scene: { scene_str: model.uuid } },
      };
      const codeRes = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${access_token}`,
        JSON.stringify(input),
        {
          headers: {
            "content-type": "application/json",
          },
        }
      );
      console.log(JSON.stringify(codeRes.data));
      if (codeRes.status === 200) {
        model.wxQrCode = codeRes.data.ticket;
        await model.save();
      } else {
        console.log("get wxQrCode faild.");
      }
    }
    return true;
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Distributor)
  async createDistributor(
    @Ctx() ctx: GQLContext,
    @Arg("distributor") distributorInput: DistributorInput,
    @Arg("user") userInput: UserCreateAsDistributorInput
  ): Promise<Distributor> {
    const admin = ctx.req.currentUser;

    await DistributorSplitRatio.findOneOrFail({
      where: {
        id: distributorInput.distributorSplitRatioId,
        organizationId: admin.organizationId,
      },
    });

    await DistributorSplitRatio.findOneOrFail({
      where: {
        id: distributorInput.distributorSplitRatio2Id,
        organizationId: admin.organizationId,
      },
    });

    if (isValidNumber(distributorInput.distributorSplitRatio3Id)) {
      await DistributorSplitRatio.findOneOrFail({
        where: {
          id: distributorInput.distributorSplitRatio3Id,
          organizationId: admin.organizationId,
        },
      });
    }
    let user = await User.findOne({
      where: {
        email: userInput.email,
        // organizationId: admin.organizationId,
      },
    });
    if (user) {
      throw new CommonError(`User(${userInput.email}) is exist`);
    }
    user = await User.findOne({
      where: {
        phone: userInput.phone,
        // organizationId: admin.organizationId,
      },
    });
    if (user) {
      throw new CommonError(`User(${userInput.phone}) is exist`);
    }
    let model = null;
    try {
      userInput.password = hash(userInput.password);
      const newUser = await User.create({
        ...userInput,
        role: 5,
        organizationId: admin.organizationId,
      }).save();
      const access_token = await getAccessToken();

      const uuid = require("uuid");
      const uuidStr = uuid.v1();
      const QRCode = require("qrcode");

      // 定义二维码内容，可以是带参数的 URL 或任何字符串https://ort.saasflow.cn/#/csd/join/
      const qrContent = `https://${process.env.WEBCONSOLE_SUBDOMAIN}/#/csd/join/${uuidStr}`;
      const t2QrCode = await QRCode.toDataURL(qrContent);
      console.log(t2QrCode);
      model = await Distributor.create({
        ...distributorInput,
        organizationId: newUser.organizationId,
        wxQrCode: "",
        t2QrCode: t2QrCode,
        uuid: uuidStr,
        userId: newUser.id,
      }).save();
      const input = {
        action_name: "QR_LIMIT_STR_SCENE",
        action_info: { scene: { scene_str: model.uuid } },
      };
      const codeRes = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${access_token}`,
        JSON.stringify(input),
        {
          headers: {
            "content-type": "application/json",
          },
        }
      );
      console.log(JSON.stringify(codeRes.data));
      if (codeRes.status === 200) {
        model.wxQrCode = codeRes.data.ticket;
        await model.save();
      } else {
        await model.remove();
        throw new CommonError("Error Qr code");
      }
      return model;
    } catch (error: any) {
      if (model) {
        await model.remove();
      }
      if (error.response) {
        throw new CommonError(JSON.stringify(error.response.data));
      } else if (error.request) {
        throw new CommonError(JSON.stringify(error.request));
      } else {
        throw new CommonError(error.message);
      }
    }
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Distributor)
  async updateDistributor(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("distributor") distributorInput: DistributorUpdateInput
  ): Promise<Distributor> {
    const user = ctx.req.currentUser;
    if (isValidNumber(distributorInput.distributorSplitRatioId)) {
      await DistributorSplitRatio.findOneOrFail({
        where: {
          id: distributorInput.distributorSplitRatioId,
          organizationId: user.organizationId,
        },
      });
    }
    if (isValidNumber(distributorInput.distributorSplitRatio2Id)) {
      await DistributorSplitRatio.findOneOrFail({
        where: {
          id: distributorInput.distributorSplitRatio2Id,
          organizationId: user.organizationId,
        },
      });
    }
    if (isValidNumber(distributorInput.distributorSplitRatio3Id)) {
      await DistributorSplitRatio.findOneOrFail({
        where: {
          id: distributorInput.distributorSplitRatio3Id,
          organizationId: user.organizationId,
        },
      });
    }
    await Distributor.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
    });
    await Distributor.update(id, distributorInput);
    return await Distributor.findOneOrFail(id);
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteDistributor(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await Distributor.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    // await model.remove();
    await model.softRemove();

    return true;
  }

  @UseMiddleware([IsAdminAndDistributorAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [Distributor])
  async getOrgDistributors(@Ctx() ctx: GQLContext): Promise<Distributor[]> {
    const user = ctx.req.currentUser;
    if (user.role === 1) {
      const res = await Distributor.find({
        where: {
          organizationId: user.organizationId,
          // t1DistributorId: IsNull(),
        },
        relations: [
          "t2Distributors",
          "distributorSplitRatio",
          "user",
          "t1Distributor",
          "distributorSplitRatio2",
          "distributorSplitRatio3",
        ],
      });
      return res;
    } else {
      const res = await Distributor.find({
        where: {
          organizationId: user.organizationId,
          //   t1DistributorId: IsNull(),
          userId: user.id,
        },
        relations: [
          "t2Distributors",
          "t2Distributors.user",
          "distributorSplitRatio",
          "user",
          "t1Distributor",
          "t1Distributor.user",
          "t1Distributor.distributorSplitRatio",
          "t1Distributor.distributorSplitRatio2",
          "t1Distributor.distributorSplitRatio3",
          "distributorSplitRatio2",
          "distributorSplitRatio3",
        ],
      });
      return res;
    }
  }

  @UseMiddleware([IsAdminAndDistributorAuth, ErrorInterceptor, ResolveTime])
  @Query(() => DistributorResult)
  async getOrgDistributorsAndCount(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<DistributorResult> {
    const user = ctx.req.currentUser;
    if (user.role === 1) {
      const [models, count] = await Distributor.findAndCount({
        where: {
          organizationId: user.organizationId,
          // t1DistributorId: IsNull(),
        },
        relations: [
          "t2Distributors",
          "t2Distributors.user",
          "distributorSplitRatio",
          "user",
          "t1Distributor",
          "t1Distributor.user",
          "distributorSplitRatio2",
          "distributorSplitRatio3",
        ],
        skip: Number.isFinite(skip) ? skip : 0,
        take: Number.isFinite(take) ? take : 300,
      });
      const res = new DistributorResult();
      res.data = models;
      res.totalCount = count;
      return res;
    } else {
      const [models, count] = await Distributor.findAndCount({
        where: {
          organizationId: user.organizationId,
          //   t1DistributorId: IsNull(),
          userId: user.id,
        },
        relations: [
          "t2Distributors",
          "t2Distributors.user",
          "distributorSplitRatio",
          "user",
          "t1Distributor",
          "t1Distributor.user",
          "t1Distributor.distributorSplitRatio",
          "t1Distributor.distributorSplitRatio2",
          "t1Distributor.distributorSplitRatio3",
          "distributorSplitRatio2",
          "distributorSplitRatio3",
        ],
        skip: Number.isFinite(skip) ? skip : 0,
        take: Number.isFinite(take) ? take : 300,
      });
      const res = new DistributorResult();
      res.data = models;
      res.totalCount = count;
      return res;
    }
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => Distributor)
  async getOrgDistributorByUuid(
    @Arg("uuid", () => String) uuid: string
  ): Promise<Distributor> {
    const res = await Distributor.findOneOrFail({
      where: {
        uuid: uuid,
      },
      relations: ["t1Distributor", "distributorSplitRatio", "user"],
    });
    return res;
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => DistributorSplitRatio)
  async createDistributorSplitRatio(
    @Ctx() ctx: GQLContext,
    @Arg("distributorSplitRatio")
    distributorSplitRatioInput: DistributorSplitRatioInput
  ): Promise<DistributorSplitRatio> {
    const user = ctx.req.currentUser;
    const model = await DistributorSplitRatio.create({
      ...distributorSplitRatioInput,
      organizationId: user.organizationId,
    }).save();

    return model;
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => DistributorSplitRatio)
  async updateDistributorSplitRatio(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("distributorSplitRatio")
    distributorSplitRatioInput: DistributorSplitRatioInput
  ): Promise<DistributorSplitRatio> {
    const user = ctx.req.currentUser;
    await DistributorSplitRatio.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
    });
    await DistributorSplitRatio.update(id, distributorSplitRatioInput);
    return await DistributorSplitRatio.findOneOrFail(id);
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteDistributorSplitRatio(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await DistributorSplitRatio.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    // await model.remove();
    await model.softRemove();

    return true;
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [DistributorSplitRatio])
  async getOrgDistributorSplitRatios(
    @Ctx() ctx: GQLContext
  ): Promise<DistributorSplitRatio[]> {
    const orgId = ctx.req.currentUser.organizationId;
    const res = await DistributorSplitRatio.find({
      organizationId: orgId,
    });
    return res;
  }

  @UseMiddleware([IsAdminAndDistributorAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getOrgDistributorCommissionStatistics(
    @Ctx() ctx: GQLContext,
    @Arg("lastDate", () => Int) lastDate: number
  ): Promise<String> {
    const user = ctx.req.currentUser;
    const model = await Distributor.findOneOrFail({
      where: {
        userId: user.id,
      },
      relations: ["t2Distributors", "t1Distributor"],
    });
    if (model.t1DistributorId) {
      const res: any = [];
      for (let index = 0; index < lastDate; index++) {
        const endTime = format(
          subDays(new Date(), index - 1),
          "yyyy-MM-dd 00:00:00"
        );
        const startTime = format(
          subDays(new Date(), index),
          "yyyy-MM-dd 00:00:00"
        );
        // console.log(`time:${startTime},${endTime}`);
        // "wxPaidOrders.t2DistributorWithdrawFundsId is NULL and wxUser.distributorId = :distributorId",
        const t1Res = await getRepository(WxUser)
          .createQueryBuilder("wxUser")
          .select("wxUser.distributorId", "distributorId")
          .addSelect("SUM(wxPaidOrders.t2_share)", "amount")
          .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
          .where(
            "wxUser.distributorId = :distributorId and wxPaidOrders.state = 'SUCCESS'",
            {
              distributorId: model.id,
            }
          )
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
      for (let index = 0; index < lastDate; index++) {
        const endTime = format(
          subDays(new Date(), index - 1),
          "yyyy-MM-dd 00:00:00"
        );
        const startTime = format(
          subDays(new Date(), index),
          "yyyy-MM-dd 00:00:00"
        );
        // console.log(`time:${startTime},${endTime}`);
        //"wxPaidOrders.t1DistributorWithdrawFundsId is NULL and wxUser.distributorId = :distributorId",
        const t1Res = await getRepository(WxUser)
          .createQueryBuilder("wxUser")
          .select("wxUser.distributorId", "distributorId")
          .addSelect("SUM(wxPaidOrders.t1_share)", "amount")
          .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
          .where(
            "wxUser.distributorId = :distributorId and wxPaidOrders.state = 'SUCCESS'",
            {
              distributorId: model.id,
            }
          )
          .andWhere("wxPaidOrders.createdAt BETWEEN :startDate AND :endDate", {
            startDate: startTime,
            endDate: endTime,
          })
          .groupBy("wxUser.distributorId")
          .getRawOne();
        // console.log(t1Res);
        let t2Res = [];
        if (t2DistributorIds.length > 0) {
          //"wxPaidOrders.t1DistributorWithdrawFundsId is NULL and wxUser.distributorId IN (:...distributorIds)",
          t2Res = await getRepository(WxUser)
            .createQueryBuilder("wxUser")
            .select("wxUser.distributorId", "distributorId")
            .addSelect("SUM(wxPaidOrders.t1_share)", "amount")
            .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
            .where(
              "wxUser.distributorId IN (:...distributorIds) and wxPaidOrders.state = 'SUCCESS'",
              {
                distributorIds: t2DistributorIds,
              }
            )
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

  // @UseMiddleware([ErrorInterceptor, ResolveTime])
  // @Query(() => String)
  // async getOrgDistributorCommissionStatistics1(
  //   @Arg("lastDate", () => Int) lastDate: number
  // ): Promise<String> {
  //   const res: any = [];
  //   for (let index = 0; index < lastDate; index++) {
  //     const startTime = format(subDays(new Date(), index), "yyyy-MM-dd");
  //     const input = {
  //       date: startTime,
  //       amount: index + 1,
  //     };
  //     res.push(input);
  //   }

  //   return JSON.stringify(res);
  // }

  @UseMiddleware([IsAdminAndDistributorAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getOrgDistributorCommissionBalance(
    @Ctx() ctx: GQLContext
  ): Promise<String> {
    const user = ctx.req.currentUser;
    const model = await Distributor.findOneOrFail({
      where: {
        userId: user.id,
      },
      relations: ["t2Distributors", "t1Distributor"],
    });
    const amount = await getDistributorCommissionBalance(model);
    const res = {
      amount: amount,
    };
    console.log(res);
    return JSON.stringify(res);
    // if (model.t1DistributorId) {
    //   const t1Res = await getRepository(WxUser)
    //     .createQueryBuilder("wxUser")
    //     .select("wxUser.distributorId", "distributorId")
    //     .addSelect("SUM(wxPaidOrders.t2_share)", "amount")
    //     .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
    //     .where(
    //       "wxPaidOrders.t2DistributorWithdrawFundsId is NULL and wxUser.distributorId = :distributorId",
    //       {
    //         distributorId: model.id,
    //       }
    //     )
    //     .groupBy("wxUser.distributorId")
    //     .getRawOne();
    //   let amount = 0;
    //   if (t1Res) {
    //     amount = amount + t1Res.amount ? t1Res.amount : 0;
    //   }
    //   console.log(amount);
    //   const res = {
    //     amount: amount,
    //   };
    //   console.log(res);
    //   return JSON.stringify(res);
    // } else {
    //   const t2DistributorIds: any = [];
    //   for (const t2Model of model.t2Distributors) {
    //     t2DistributorIds.push(t2Model.id);
    //   }
    //   console.log("t2DistributorIds:" + t2DistributorIds);
    //   const t1Res = await getRepository(WxUser)
    //     .createQueryBuilder("wxUser")
    //     .select("wxUser.distributorId", "distributorId")
    //     .addSelect("SUM(wxPaidOrders.t1_share)", "amount")
    //     .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
    //     .where(
    //       "wxPaidOrders.t1DistributorWithdrawFundsId is NULL and wxUser.distributorId = :distributorId",
    //       {
    //         distributorId: model.id,
    //       }
    //     )
    //     .groupBy("wxUser.distributorId")
    //     .getRawOne();
    //   // console.log(t1Res);
    //   let t2Res = [];
    //   if (t2DistributorIds.length > 0) {
    //     t2Res = await getRepository(WxUser)
    //       .createQueryBuilder("wxUser")
    //       .select("wxUser.distributorId", "distributorId")
    //       .addSelect("SUM(wxPaidOrders.t1_share)", "amount")
    //       .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
    //       .where(
    //         "wxPaidOrders.t1DistributorWithdrawFundsId is NULL and wxUser.distributorId IN (:...distributorIds)",
    //         {
    //           distributorIds: t2DistributorIds,
    //         }
    //       )
    //       .groupBy("wxUser.distributorId")
    //       .getRawMany();
    //     console.log(t2Res);
    //   }
    //   // console.log(t1Res);
    //   let amount = 0;
    //   if (t1Res) {
    //     amount = amount + t1Res.amount ? t1Res.amount : 0;
    //   }
    //   console.log(amount);
    //   if (t2Res.length > 0) {
    //     for (const res of t2Res) {
    //       amount = amount + res.amount ? res.amount : 0;
    //     }
    //   }
    //   console.log(amount);
    // const res = {
    //   amount: amount,
    // };
    // console.log(res);
    // return JSON.stringify(res);
    // }
  }

  @UseMiddleware([IsAdminAndDistributorAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getTwoMonthDistributorWithdrawFunds(
    @Ctx() ctx: GQLContext
  ): Promise<String> {
    const user = ctx.req.currentUser;
    const model = await Distributor.findOneOrFail({
      where: {
        userId: user.id,
      },
    });

    // 格式化日期（可选）
    const startOfLastMonth = format(
      startOfMonth(subMonths(new Date(), 1)),
      "yyyy-MM-dd 00:00:00"
    );
    const endOfLastMonth = format(
      startOfMonth(subMonths(new Date(), 0)),
      "yyyy-MM-dd 00:00:00"
    );

    const lastMonthAmount = await getRepository(DistributorWithdrawFunds)
      .createQueryBuilder("distributorWithdrawFunds")
      .select("distributorId")
      .addSelect("SUM(amount)", "amount")
      .where("distributorId = :distributorId", {
        distributorId: model.id,
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
      startOfMonth(subMonths(new Date(), -1)),
      "yyyy-MM-dd 00:00:00"
    );

    const thisMonthAmount = await getRepository(DistributorWithdrawFunds)
      .createQueryBuilder("distributorWithdrawFunds")
      .select("distributorId")
      .addSelect("SUM(amount)", "amount")
      .where("distributorId = :distributorId", {
        distributorId: model.id,
      })
      .andWhere("createdAt BETWEEN :startDate AND :endDate", {
        startDate: thisStartOfMonth,
        endDate: thisEndOfMonth,
      })
      .groupBy("distributorId")
      .getRawOne();

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

  @UseMiddleware([IsAdminAndDistributorAuth, ErrorInterceptor, ResolveTime])
  @Query(() => DistributorWithdrawFundsResult)
  async getDistributorWithdrawFundsAndCount(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number,
    @Arg("status", () => String, { nullable: true }) status: string
  ): Promise<DistributorWithdrawFundsResult> {
    const user = ctx.req.currentUser;
    const input: any = {};
    if (isNonEmptyString(status)) {
      if (
        status !== "PROCESSING" &&
        status !== "ACCEPTED" &&
        status !== "FINISHED"
      ) {
        throw new CommonError("Error status");
      }
      input.batch_status = status;
    }
    if (user.role !== 1) {
      const model = await Distributor.findOneOrFail({
        where: {
          userId: user.id,
        },
      });
      input.distributorId = model.id;
      const [models, count] = await DistributorWithdrawFunds.findAndCount({
        where: input,
        relations: [
          "distributor",
          "user",
          "t2WxPaidOrders",
          "t1WxPaidOrders",
          "t2WxPaidOrders.wxUser",
          "t1WxPaidOrders.wxUser",
        ],
        skip: Number.isFinite(skip) ? skip : 0,
        take: Number.isFinite(take) ? take : 100,
      });
      const res = new DistributorWithdrawFundsResult();
      res.data = models;
      res.totalCount = count;
      return res;
    } else {
      const [models, count] = await DistributorWithdrawFunds.findAndCount({
        where: input,
        relations: [
          "distributor",
          "user",
          "t2WxPaidOrders",
          "t1WxPaidOrders",
          "t2WxPaidOrders.wxUser",
          "t1WxPaidOrders.wxUser",
        ],
        skip: Number.isFinite(skip) ? skip : 0,
        take: Number.isFinite(take) ? take : 100,
      });
      const res = new DistributorWithdrawFundsResult();
      res.data = models;
      res.totalCount = count;
      return res;
    }
  }
  @UseMiddleware([IsAdminAndDistributorAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [WxPaidOrders])
  async getWxPaidOrdersByDate(
    @Ctx() ctx: GQLContext,
    @Arg("date", () => String) date: string
  ): Promise<WxPaidOrders[]> {
    const user = ctx.req.currentUser;
    const startDate = format(new Date(date), "yyyy-MM-dd 00:00:00");
    const endDate = format(new Date(date), "yyyy-MM-dd 23:59:59");
    console.log(startDate);
    console.log(endDate);
    if (user.role !== 1) {
      const model = await Distributor.findOneOrFail({
        where: {
          userId: user.id,
        },
        relations: ["t2Distributors", "t1Distributor"],
      });
      if (model.t1DistributorId) {
        const res = await getRepository(WxPaidOrders)
          .createQueryBuilder("wxPaidOrders")
          .leftJoinAndSelect("wxPaidOrders.wxUser", "wxUser")
          .where("wxPaidOrders.createdAt BETWEEN :startDate AND :endDate", {
            startDate: startDate,
            endDate: endDate,
          })
          .andWhere("wxUser.distributorId = :distributorId", {
            distributorId: model.id,
          })
          .getMany();
        return res;
      } else {
        const res = await getRepository(WxPaidOrders)
          .createQueryBuilder("wxPaidOrders")
          .leftJoinAndSelect("wxPaidOrders.wxUser", "wxUser")
          .where("wxUser.distributorId = :distributorId", {
            distributorId: model.id,
          })
          .andWhere("wxPaidOrders.createdAt BETWEEN :startDate AND :endDate", {
            startDate: startDate,
            endDate: endDate,
          })
          .getMany();

        const t2DistributorIds = model.t2Distributors.map((item) => item.id);
        console.log("t2DistributorIds:" + t2DistributorIds);

        if (t2DistributorIds.length > 0) {
          const res2 = await getRepository(WxPaidOrders)
            .createQueryBuilder("wxPaidOrders")
            .leftJoinAndSelect("wxPaidOrders.wxUser", "wxUser")
            .where("wxUser.distributorId IN (:...distributorIds)", {
              distributorIds: t2DistributorIds,
            })
            .andWhere(
              "wxPaidOrders.createdAt BETWEEN :startDate AND :endDate",
              {
                startDate: startDate,
                endDate: endDate,
              }
            )
            .getMany();
          return res.concat(res2);
        }
        return res;
      }
    } else {
      const res = await getRepository(WxPaidOrders)
        .createQueryBuilder("wxPaidOrders")
        .leftJoinAndSelect("wxPaidOrders.wxUser", "wxUser")
        .where("wxPaidOrders.createdAt BETWEEN :startDate AND :endDate", {
          startDate: startDate,
          endDate: endDate,
        })
        .getMany();
      return res;
    }
  }

  @UseMiddleware([IsAdminAndDistributorAuth, ErrorInterceptor, ResolveTime])
  @Query(() => WxUserScanDistributorRecordsResult)
  async getWxUserScanDistributorRecordsAndCount(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<WxUserScanDistributorRecordsResult> {
    const user = ctx.req.currentUser;
    const input: any = {
      state: "invalid",
    };
    if (user.role === 5) {
      const distributor = await Distributor.findOneOrFail({
        where: {
          userId: user.id,
        },
      });
      input.distributorId = distributor.id;
    }
    const [users, count] = await WxUserScanDistributorRecords.findAndCount({
      where: input,
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 300,
      order: { createdAt: "DESC" },
      relations: ["wxUser", "distributor"],
    });
    const res = new WxUserScanDistributorRecordsResult();
    res.data = users;
    res.totalCount = count;

    return res;
  }
}

export default DistributorResolver;
