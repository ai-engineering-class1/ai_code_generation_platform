import {
  Resolver,
  // Mutation,
  Arg,
  UseMiddleware,
  Int,
  Query,
  Ctx,
} from "type-graphql";

import { endOfDay } from "date-fns";

import { GQLContext } from "@/types/context";
import { IsAuth } from "@/middlewares/isAuth";
import { ErrorInterceptor, ResolveTime } from "@/middlewares";
import { MailInbox, MailOutbox, TargetCustomerAnalysis, User } from "@/models";
import { Between, LessThanOrEqual, LessThan } from "typeorm";
// import { subDays } from "date-fns";
import {
  //今日，本周，本月，三个月，今年, 最近7天, 最近30天, 最近90天，全部
  // getLast7DaysStart,
  getThisMonthStart,
  getThisWeekStart,
  getTodayStart,
  getThreeMonthStart,
  getThisYearStart,
  getLast90DaysStart,
  getLast30DaysStart,
  getLast7DaysStart,
  getThisWeekDaysUntilToday,
  getWeeksOfThisMonthUntilNow,
  // getYesterdayStart,
  //   getLast30DaysStart,
} from "@/utils/dateTime";
import { CommonError } from "@/errors";

@Resolver()
class DashboardCRMResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getEmailInteractionStatistics(
    @Ctx() ctx: GQLContext,
    @Arg("lastDate", () => Int) lastDate: number
  ): Promise<string> {
    const user = ctx.req.currentUser;
    let input: any = {
      organizationId: user.organizationId,
      userId: user.id,
    };
    let time;
    if (lastDate !== 9) {
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
      } else {
        throw new CommonError("Invalid lastDate");
      }
      input.createdAt = Between(time.start, time.end);
    }

    const sendEmailCount = await MailOutbox.count({
      ...input,
      sendStatus: "done",
    });
    const readStatusEmailCount = await MailOutbox.count({
      // organizationId: orgId,
      // updatedAt: Between(time.start, time.end),
      ...input,
      sendStatus: "done",
      readFlag: "read",
    });

    const replyEmailCount = await MailInbox.count({
      ...input,
    });

    const res = {
      sendEmailCount,
      readStatusEmailCount,
      replyEmailCount,
    };
    return JSON.stringify(res);
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getCustomerCRMStatistics(
    @Ctx() ctx: GQLContext,
    @Arg("lastDate", () => Int) lastDate: number
  ): Promise<string> {
    const user = ctx.req.currentUser;
    let input: any = {
      organizationId: user.organizationId,
      userId: user.id,
    };
    let updateInput: any = {
      organizationId: user.organizationId,
      userId: user.id,
    };
    let time;
    if (lastDate !== 9) {
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
      } else {
        throw new CommonError("Invalid lastDate");
      }
      input.createdAt = Between(time.start, time.end);
      updateInput.customerStateChangeTime = Between(time.start, time.end);
    } else {
      const now = new Date();
      const thisMonthEnd = endOfDay(now);
      updateInput.customerStateChangeTime = LessThanOrEqual(thisMonthEnd);
    }

    const total = await TargetCustomerAnalysis.count({
      where: {
        organizationId: user.organizationId,
        userId: user.id,
      },
    });

    const currentTotal = await TargetCustomerAnalysis.count({
      where: input,
    });

    const stateCounts = await TargetCustomerAnalysis.createQueryBuilder(
      "target"
    )
      .select("target.customerState", "customerState")
      .addSelect("COUNT(*)", "count")
      .where(updateInput)
      .andWhere("target.customerState IN (:...states)", {
        states: [1, 2, 3, 4, 5, 6],
      })
      .groupBy("target.customerState")
      .getRawMany();
    const countsMap = Object.fromEntries(
      stateCounts.map((item) => [item.customerState, parseInt(item.count)])
    );
    const customerStateCount1 = countsMap[1] || 0;
    const customerStateCount2 = countsMap[2] || 0;
    const customerStateCount3 = countsMap[3] || 0;
    const customerStateCount4 = countsMap[4] || 0;
    const customerStateCount5 = countsMap[5] || 0;
    const customerStateCount6 = countsMap[6] || 0;
    // const customerStateCount7 = countsMap[5] || 0;
    const customerStateAllCount =
      customerStateCount1 +
      customerStateCount2 +
      customerStateCount3 +
      customerStateCount4 +
      customerStateCount5 +
      customerStateCount6;
    //  +customerStateCount7;

    const res = {
      total,
      currentTotal,
      customerStateCount1,
      customerStateCount2,
      customerStateCount3,
      customerStateCount4,
      customerStateCount5,
      customerStateCount6,
      // customerStateCount7,
      customerStateAllCount,
    };
    return JSON.stringify(res);
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getCustomerTypeStatistics(
    @Ctx() ctx: GQLContext,
    @Arg("lastDate", () => Int) lastDate: number
  ): Promise<string> {
    const user = ctx.req.currentUser;
    let input: any = {
      organizationId: user.organizationId,
      userId: user.id,
    };
    let time;
    if (lastDate !== 9) {
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
      } else {
        throw new CommonError("Invalid lastDate");
      }
      input.createdAt = Between(time.start, time.end);
    }

    const typeCounts = await TargetCustomerAnalysis.createQueryBuilder("target")
      .select("target.customerType", "customerType")
      .addSelect("COUNT(*)", "count")
      .where(input)
      .andWhere("target.customerType IN (:...types)", {
        types: ["邮箱添加", "手动添加", "海关数据添加", "导入添加"],
      })
      .groupBy("target.customerType")
      .getRawMany();

    // 转成 Map，方便访问
    const countsMap = Object.fromEntries(
      typeCounts.map((item) => [item.customerType, parseInt(item.count)])
    );

    const res = {
      emailAddTotal: countsMap["邮箱添加"] || 0,
      manualAddTotal: countsMap["手动添加"] || 0,
      customsAddTotal: countsMap["海关数据添加"] || 0,
      importAddTotal: countsMap["导入添加"] || 0,
    };
    return JSON.stringify(res);
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getMarketTrendsStatistics(
    @Ctx() ctx: GQLContext,
    @Arg("lastDate", () => Int) lastDate: number
    // @Arg("userId", () => String, { nullable: true }) userId: string,
  ): Promise<string> {
    const orgId = ctx.req.currentUser.organizationId;
    const users = await User.find({
      where: {
        organizationId: orgId,
      },
    });
    const result = [];
    for (const user of users) {
      let input: any = {
        organizationId: user.organizationId,
        userId: user.id,
      };
      let updateInput: any = {
        organizationId: user.organizationId,
        userId: user.id,
      };
      let time;
      if (lastDate === 1) {
        time = await getTodayStart();
      } else if (lastDate === 2) {
        time = await getThisWeekStart();
      } else if (lastDate === 3) {
        time = await getLast7DaysStart();
      } else if (lastDate === 4) {
        time = await getLast30DaysStart();
      } else if (lastDate === 5) {
        time = await getLast90DaysStart();
      } else {
        throw new CommonError("Invalid lastDate");
      }
      input.createdAt = Between(time.start, time.end);
      updateInput.customerStateChangeTime = Between(time.start, time.end);

      //总客户数量
      const customerTotal = await TargetCustomerAnalysis.count({
        where: {
          organizationId: user.organizationId,
          userId: user.id,
        },
      });

      //新客户数量
      const newCustomerTotal = await TargetCustomerAnalysis.count({
        where: input,
      });

      //邮件回复率
      const emailCount = await MailOutbox.createQueryBuilder("mail")
        .select("COUNT(DISTINCT mail.targetCustomerAnalysisId)", "count")
        .where("mail.organizationId = :orgId", { orgId: user.organizationId })
        .andWhere("mail.userId = :userId", { userId: user.id })
        .andWhere("mail.sendTime BETWEEN :start AND :end", {
          start: time.start,
          end: time.end,
        })
        .andWhere("mail.sendStatus = :status", { status: "done" })
        .andWhere("mail.targetCustomerAnalysisId IS NOT NULL")
        .getRawOne();

      //老用户活跃数
      const oldCustomerActiveTotal = await TargetCustomerAnalysis.count({
        where: {
          organizationId: user.organizationId,
          userId: user.id,
          receiveEmailTime: Between(time.start, time.end),
          createdAt: LessThan(time.start),
        },
      });

      const oldCustomerTotal = await TargetCustomerAnalysis.count({
        where: {
          userId: user.id,
          organizationId: user.organizationId,
          createdAt: LessThan(time.start),
        },
      });

      //客户不同状态数量
      const stateCounts = await TargetCustomerAnalysis.createQueryBuilder(
        "target"
      )
        .select("target.customerState", "customerState")
        .addSelect("COUNT(*)", "count")
        .where(updateInput)
        .andWhere("target.userId = :userId", { userId: user.id })
        .andWhere("target.customerState IN (:...states)", {
          states: [1, 2, 3, 4, 5, 6],
        })
        .groupBy("target.customerState")
        .getRawMany();
      const countsMap = Object.fromEntries(
        stateCounts.map((item) => [item.customerState, parseInt(item.count)])
      );

      const customerStateCount1 = countsMap[1] || 0;
      const customerStateCount2 = countsMap[2] || 0;
      const customerStateCount3 = countsMap[3] || 0;
      const customerStateCount4 = countsMap[4] || 0;
      const customerStateCount5 = countsMap[5] || 0;
      const customerStateCount6 = countsMap[6] || 0;
      // const customerStateCount7 = countsMap[5] || 0;
      const customerStateAllCount =
        customerStateCount1 +
        customerStateCount2 +
        customerStateCount3 +
        customerStateCount4 +
        customerStateCount5 +
        customerStateCount6;

      const res = {
        userId: user.id,
        userName: user.name,
        customerTotal,
        newCustomerTotal,
        proposalCount: customerStateCount4,
        closedWonCount: customerStateCount5,
        replyEmailRate: emailCount / newCustomerTotal,
        closedWonRate: customerStateCount5 / customerStateAllCount,
        customerStateAllCount,
        oldCustomerActiveRate: oldCustomerActiveTotal / oldCustomerTotal,
      };
      result.push(res);
    }
    return JSON.stringify(result);
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getOrgMarketTrendsStatisticsAll(
    @Ctx() ctx: GQLContext
    // @Arg("lastDate", () => Int) lastDate: number
  ): Promise<string> {
    const user = ctx.req.currentUser;
    // let input: any = {
    //   organizationId: user.organizationId,
    //   // userId: user.id,
    // };
    let updateInput: any = {
      organizationId: user.organizationId,
      // userId: user.id,
    };
    // let time;
    // if (lastDate === 1) {
    //   time = await getTodayStart();
    // } else if (lastDate === 2) {
    //   time = await getThisWeekStart();
    // } else if (lastDate === 3) {
    //   time = await getLast7DaysStart();
    // } else if (lastDate === 4) {
    //   time = await getLast30DaysStart();
    // } else if (lastDate === 5) {
    //   time = await getLast90DaysStart();
    // } else {
    //   throw new CommonError("Invalid lastDate");
    // }
    // input.createdAt = Between(time.start, time.end);
    // updateInput.customerStateChangeTime = Between(time.start, time.end);

    //总客户数量
    const customerTotal = await TargetCustomerAnalysis.count({
      where: {
        organizationId: user.organizationId,
        // userId: user.id,
      },
    });

    // //新客户数量
    // const newCustomerTotal = await TargetCustomerAnalysis.count({
    //   where: input,
    // });

    // //老用户活跃数
    // const oldCustomerActiveTotal = await TargetCustomerAnalysis.count({
    //   where: {
    //     organizationId: user.organizationId,
    //     // userId: user.id,
    //     receiveEmailTime: Between(time.start, time.end),
    //     createdAt: LessThan(time.start),
    //   },
    // });

    // const oldCustomerTotal = await TargetCustomerAnalysis.count({
    //   where: {
    //     // userId: user.id,
    //     organizationId: user.organizationId,
    //     createdAt: LessThan(time.start),
    //   },
    // });

    //邮件回复率
    const emailCount = await MailOutbox.createQueryBuilder("mail")
      .select("COUNT(DISTINCT mail.targetCustomerAnalysisId)", "count")
      .where("mail.organizationId = :orgId", { orgId: user.organizationId })
      // .andWhere("mail.sendTime BETWEEN :start AND :end", {
      //   start: time.start,
      //   end: time.end,
      // })
      .andWhere("mail.sendStatus = :status", { status: "done" })
      .andWhere("mail.targetCustomerAnalysisId IS NOT NULL")
      .getRawOne();

    //客户不同状态数量
    const stateCounts = await TargetCustomerAnalysis.createQueryBuilder(
      "target"
    )
      .select("target.customerState", "customerState")
      .addSelect("COUNT(*)", "count")
      .where(updateInput)
      .andWhere("target.customerState IN (:...states)", {
        states: [1, 2, 3, 4, 5, 6],
      })
      .groupBy("target.customerState")
      .getRawMany();
    const countsMap = Object.fromEntries(
      stateCounts.map((item) => [item.customerState, parseInt(item.count)])
    );
    const customerStateCount4 = countsMap[4] || 0;
    const customerStateCount5 = countsMap[5] || 0;

    const res = {
      customerTotal,
      proposalCount: customerStateCount4,
      replyEmailCount: emailCount,
      replyEmailCountRate: emailCount / customerTotal,
      closedWonTargetRate: customerStateCount5 / customerTotal,
      // oldCustomerActiveRate: oldCustomerActiveTotal / oldCustomerTotal,
    };
    return JSON.stringify(res);
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getOrgMarketTrendsStatistics(
    @Ctx() ctx: GQLContext,
    @Arg("lastDate", () => Int) lastDate: number
  ): Promise<string> {
    const user = ctx.req.currentUser;
    let input: any = {
      organizationId: user.organizationId,
      // userId: user.id,
    };
    let updateInput: any = {
      organizationId: user.organizationId,
      // userId: user.id,
    };
    let time;
    if (lastDate === 1) {
      time = await getTodayStart();
    } else if (lastDate === 2) {
      time = await getThisWeekStart();
    } else if (lastDate === 3) {
      time = await getLast7DaysStart();
    } else if (lastDate === 4) {
      time = await getLast30DaysStart();
    } else if (lastDate === 5) {
      time = await getLast90DaysStart();
    } else {
      throw new CommonError("Invalid lastDate");
    }
    input.createdAt = Between(time.start, time.end);
    updateInput.customerStateChangeTime = Between(time.start, time.end);

    //总客户数量
    const customerTotal = await TargetCustomerAnalysis.count({
      where: {
        organizationId: user.organizationId,
        // userId: user.id,
      },
    });

    //新客户数量
    const newCustomerTotal = await TargetCustomerAnalysis.count({
      where: input,
    });

    //老用户活跃数
    const oldCustomerActiveTotal = await TargetCustomerAnalysis.count({
      where: {
        organizationId: user.organizationId,
        // userId: user.id,
        receiveEmailTime: Between(time.start, time.end),
        createdAt: LessThan(time.start),
      },
    });

    const oldCustomerTotal = await TargetCustomerAnalysis.count({
      where: {
        // userId: user.id,
        organizationId: user.organizationId,
        createdAt: LessThan(time.start),
      },
    });

    //邮件回复率
    const emailCount = await MailOutbox.createQueryBuilder("mail")
      .select("COUNT(DISTINCT mail.targetCustomerAnalysisId)", "count")
      .where("mail.organizationId = :orgId", { orgId: user.organizationId })
      .andWhere("mail.sendTime BETWEEN :start AND :end", {
        start: time.start,
        end: time.end,
      })
      .andWhere("mail.sendStatus = :status", { status: "done" })
      .andWhere("mail.targetCustomerAnalysisId IS NOT NULL")
      .getRawOne();

    //客户不同状态数量
    const stateCounts = await TargetCustomerAnalysis.createQueryBuilder(
      "target"
    )
      .select("target.customerState", "customerState")
      .addSelect("COUNT(*)", "count")
      .where(updateInput)
      .andWhere("target.customerState IN (:...states)", {
        states: [1, 2, 3, 4, 5, 6],
      })
      .groupBy("target.customerState")
      .getRawMany();
    const countsMap = Object.fromEntries(
      stateCounts.map((item) => [item.customerState, parseInt(item.count)])
    );
    const customerStateCount4 = countsMap[4] || 0;
    const customerStateCount5 = countsMap[5] || 0;

    const res = {
      customerTotal,
      newCustomerTotal:newCustomerTotal,
      proposalCount: customerStateCount4,
      replyEmailCount: emailCount,
      replyEmailCountRate: emailCount / customerTotal,
      closedWonTargetRate: customerStateCount5 / customerTotal,
      oldCustomerActiveRate: oldCustomerActiveTotal / oldCustomerTotal,
    };
    return JSON.stringify(res);
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getOrgMarketTrendsStatisticsByDayAndWeek(
    @Ctx() ctx: GQLContext,
    @Arg("dateType", () => Int) dateType: number //1,2
  ): Promise<string> {
    const user = ctx.req.currentUser;
    let input: any = {
      organizationId: user.organizationId,
      // userId: user.id,
    };
    let updateInput: any = {
      organizationId: user.organizationId,
      // userId: user.id,
    };
    let times;
    if (dateType === 1) {
      times = await getThisWeekDaysUntilToday();
    } else {
      times = await getWeeksOfThisMonthUntilNow();
    }
    const result = [];
    for (const time of times) {
      input.createdAt = Between(time.start, time.end);
      updateInput.customerStateChangeTime = Between(time.start, time.end);

      //总客户数量
      const customerTotal = await TargetCustomerAnalysis.count({
        where: {
          organizationId: user.organizationId,
          // userId: user.id,
        },
      });

      //新客户数量
      const newCustomerTotal = await TargetCustomerAnalysis.count({
        where: input,
      });

      //老用户活跃数
      const oldCustomerActiveTotal = await TargetCustomerAnalysis.count({
        where: {
          organizationId: user.organizationId,
          // userId: user.id,
          receiveEmailTime: Between(time.start, time.end),
          createdAt: LessThan(time.start),
        },
      });

      const oldCustomerTotal = await TargetCustomerAnalysis.count({
        where: {
          // userId: user.id,
          organizationId: user.organizationId,
          createdAt: LessThan(time.start),
        },
      });

      //邮件回复率
      const emailCount = await MailOutbox.createQueryBuilder("mail")
        .select("COUNT(DISTINCT mail.targetCustomerAnalysisId)", "count")
        .where("mail.organizationId = :orgId", { orgId: user.organizationId })
        .andWhere("mail.sendTime BETWEEN :start AND :end", {
          start: time.start,
          end: time.end,
        })
        .andWhere("mail.sendStatus = :status", { status: "done" })
        .andWhere("mail.targetCustomerAnalysisId IS NOT NULL")
        .getRawOne();

      //客户不同状态数量
      const stateCounts = await TargetCustomerAnalysis.createQueryBuilder(
        "target"
      )
        .select("target.customerState", "customerState")
        .addSelect("COUNT(*)", "count")
        .where(updateInput)
        .andWhere("target.customerState IN (:...states)", {
          states: [1, 2, 3, 4, 5, 6],
        })
        .groupBy("target.customerState")
        .getRawMany();
      const countsMap = Object.fromEntries(
        stateCounts.map((item) => [item.customerState, parseInt(item.count)])
      );
      const customerStateCount4 = countsMap[4] || 0;
      const customerStateCount5 = countsMap[5] || 0;

      const res = {
        date: time.start,
        customerTotal,
        newCustomerTotal,
        proposalCount: customerStateCount4,
        replyEmailRate: emailCount / newCustomerTotal,
        closedWonTargetRate: customerStateCount5 / newCustomerTotal,
        oldCustomerActiveRate: oldCustomerActiveTotal / oldCustomerTotal,
      };
      result.push(res);
    }
    return JSON.stringify(result);
  }
}

export default DashboardCRMResolver;
