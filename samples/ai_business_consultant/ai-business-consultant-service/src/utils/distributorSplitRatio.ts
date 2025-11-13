import {
  Distributor,
  WxUser,
  DistributorWithdrawFunds,
  WxPaidOrders,
} from "@/models";
import { parseJsonSafely } from "./common";
import { getRepository, In } from "typeorm";
import { format, startOfMonth, subMonths } from "date-fns";

export const calculateWxUserDistributorSplitRatio = async (
  wxUser: WxUser,
  total: number
) => {
  let t1_share = 0;
  let t2_share = 0;
  if (wxUser.distributorId) {
    if (wxUser.distributor.t1DistributorId) {
      if (wxUser.distributor.t1Distributor.distributorSplitRatio2Id) {
        const distributorSplitRatio =
          wxUser.distributor.t1Distributor.distributorSplitRatio2;
        const ratioParse = await parseJsonSafely(
          distributorSplitRatio.ratioJson
        );
        if (ratioParse.success) {
          let ratio = ratioParse.data;
          ratio = ratio.sort(
            (a: { amount: string }, b: { amount: string }) =>
              parseInt(a.amount) - parseInt(b.amount)
          );
          const amount =
            (await calculateDistributorOrderAmountThisMonth(
              wxUser.distributor
            )) / 100;
          let splitRatio = 0;
          ratio.forEach((element: any) => {
            console.log(element);
            if (amount >= parseInt(element.amount)) {
              splitRatio = parseInt(element.splitRatio);
            }
          });
          t2_share = total * splitRatio; //parseInt(ratio[0].splitRatio);
        }
      }
      if (wxUser.distributor.t1Distributor.distributorSplitRatio3Id) {
        const distributorSplitRatio =
          wxUser.distributor.t1Distributor.distributorSplitRatio3;
        const ratioParse = await parseJsonSafely(
          distributorSplitRatio.ratioJson
        );
        if (ratioParse.success) {
          const ratio = ratioParse.data;
          t1_share = total * parseInt(ratio[0].splitRatio);
        }
      }
    } else {
      if (wxUser.distributor.distributorSplitRatioId) {
        const distributorSplitRatio = wxUser.distributor.distributorSplitRatio;
        const ratioParse = await parseJsonSafely(
          distributorSplitRatio.ratioJson
        );
        if (ratioParse.success) {
          let ratio = ratioParse.data;
          ratio = ratio.sort(
            (a: { amount: string }, b: { amount: string }) =>
              parseInt(a.amount) - parseInt(b.amount)
          );

          const amount =
            (await calculateDistributorOrderAmountThisMonth(
              wxUser.distributor
            )) / 100;
          let splitRatio = 0;
          ratio.forEach((element: any) => {
            console.log(element);
            if (amount >= parseInt(element.amount)) {
              splitRatio = parseInt(element.splitRatio);
            }
          });
          t1_share = total * splitRatio; //parseInt(ratio[0].splitRatio);
        }
      }
    }
  }

  const res = {
    t1_share: t1_share,
    t2_share: t2_share,
  };
  return res;
};

export const calculateDistributorOrderAmountThisMonth = async (
  model: Distributor
) => {
  const thisStartOfMonth = format(
    startOfMonth(new Date()),
    "yyyy-MM-dd 00:00:00"
  );
  const thisEndOfMonth = format(
    startOfMonth(subMonths(new Date(), -1)),
    "yyyy-MM-dd 00:00:00"
  );
  const thisMonthAmount = await getRepository(WxPaidOrders)
    .createQueryBuilder("wxPaidOrders")
    .select("SUM(wxPaidOrders.total)", "amount")
    .leftJoin("wxPaidOrders.wxUser", "wxUser")
    .where(
      "wxPaidOrders.state = 'SUCCESS' and wxUser.distributorId = :distributorId",
      {
        distributorId: model.id,
      }
    )
    .andWhere("wxPaidOrders.createdAt BETWEEN :startDate AND :endDate", {
      startDate: thisStartOfMonth,
      endDate: thisEndOfMonth,
    })
    .getRawOne();
  console.log(
    "thisMonthAmount" + thisMonthAmount.amount ? thisMonthAmount.amount : 0
  );
  return thisMonthAmount.amount ? thisMonthAmount.amount : 0;
};

export const getDistributorCommissionBalance = async (model: Distributor) => {
  if (model.t1DistributorId) {
    const t1Res = await getRepository(WxUser)
      .createQueryBuilder("wxUser")
      .select("wxUser.distributorId", "distributorId")
      .addSelect("SUM(wxPaidOrders.t2_share)", "amount")
      .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
      .where(
        "wxPaidOrders.t2DistributorWithdrawFundsId is NULL and wxPaidOrders.state = 'SUCCESS'  and wxUser.distributorId = :distributorId",
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
    // const res = {
    //   amount: amount,
    // };
    // console.log(res);
    return amount;
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
        "wxPaidOrders.t1DistributorWithdrawFundsId is NULL and wxPaidOrders.state = 'SUCCESS' and wxUser.distributorId = :distributorId",
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
          "wxPaidOrders.t1DistributorWithdrawFundsId is NULL and wxPaidOrders.state = 'SUCCESS' and wxUser.distributorId IN (:...distributorIds)",
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
    // const res = {
    //   amount: amount,
    // };
    // console.log(res);
    return amount;
  }
};

export const updateWxPaidOrdersRelateDistributorWithdrawFunds = async (
  model: Distributor,
  dWFund: DistributorWithdrawFunds
) => {
  if (model.t1DistributorId) {
    const t1Res = await getRepository(WxUser)
      .createQueryBuilder("wxUser")
      .select("wxUser.distributorId", "distributorId")
      .addSelect("wxPaidOrders.id", "wxPaidOrdersId")
      .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
      .where(
        "wxPaidOrders.t2DistributorWithdrawFundsId is NULL and wxPaidOrders.state = 'SUCCESS' and wxUser.distributorId = :distributorId",
        {
          distributorId: model.id,
        }
      )
      .getRawMany();
    if (t1Res.length > 0) {
      for (const res of t1Res) {
        await WxPaidOrders.update(
          { id: res.wxPaidOrdersId },
          {
            t2DistributorWithdrawFundsId: dWFund.id,
          }
        );
      }
    }
    // const res = {
    //   amount: amount,
    // };
    // console.log(res);
    // return amount;
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
      .addSelect("wxPaidOrders.id", "wxPaidOrdersId")
      // .addSelect("SUM(wxPaidOrders.t1_share)", "amount")
      .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
      .where(
        "wxPaidOrders.t1DistributorWithdrawFundsId is NULL and wxPaidOrders.state = 'SUCCESS' and wxUser.distributorId = :distributorId",
        {
          distributorId: model.id,
        }
      )
      // .groupBy("wxUser.distributorId")
      .getRawMany();
    if (t1Res.length > 0) {
      for (const res of t1Res) {
        await WxPaidOrders.update(
          { id: res.wxPaidOrdersId },
          {
            t1DistributorWithdrawFundsId: dWFund.id,
          }
        );
      }
    }
    // console.log(t1Res);
    let t2Res = [];
    if (t2DistributorIds.length > 0) {
      t2Res = await getRepository(WxUser)
        .createQueryBuilder("wxUser")
        .select("wxUser.distributorId", "distributorId")
        .addSelect("wxPaidOrders.id", "wxPaidOrdersId")
        // .addSelect("SUM(wxPaidOrders.t1_share)", "amount")
        .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
        .where(
          "wxPaidOrders.t1DistributorWithdrawFundsId is NULL and wxPaidOrders.state = 'SUCCESS' and wxUser.distributorId IN (:...distributorIds)",
          {
            distributorIds: t2DistributorIds,
          }
        )
        // .groupBy("wxUser.distributorId")
        .getRawMany();
      console.log(t2Res);
    }
    // console.log(t1Res);
    if (t2Res.length > 0) {
      for (const res of t2Res) {
        await WxPaidOrders.update(
          { id: res.wxPaidOrdersId },
          {
            t1DistributorWithdrawFundsId: dWFund.id,
          }
        );
      }
    }
  }
};

export const getDistributorCommissionBalanceOrderIds = async (
  model: Distributor
) => {
  let res: any = {
    distributor: model,
    t1_wxPaidOrdersIds: [],
    t2_wxPaidOrdersIds: [],
  };
  if (model.t1DistributorId) {
    const t1Res = await getRepository(WxUser)
      .createQueryBuilder("wxUser")
      .select("wxUser.distributorId", "distributorId")
      .addSelect("wxPaidOrders.id", "wxPaidOrdersId")
      .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
      .where(
        "wxPaidOrders.t2DistributorWithdrawFundsId is NULL and wxPaidOrders.state = 'SUCCESS'  and wxUser.distributorId = :distributorId",
        {
          distributorId: model.id,
        }
      )
      .getRawMany();

    res.t2_wxPaidOrdersIds =
      t1Res.length > 0 ? t1Res.map((x) => x.wxPaidOrdersId) : [];
    return res;
  } else {
    const t2DistributorIds = model.t2Distributors.map((item) => item.id);
    console.log("t2DistributorIds:" + t2DistributorIds);
    const t1Res = await getRepository(WxUser)
      .createQueryBuilder("wxUser")
      .select("wxUser.distributorId", "distributorId")
      .addSelect("wxPaidOrders.id", "wxPaidOrdersId")
      .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
      .where(
        "wxPaidOrders.t1DistributorWithdrawFundsId is NULL and wxPaidOrders.state = 'SUCCESS' and wxUser.distributorId = :distributorId",
        {
          distributorId: model.id,
        }
      )
      .getRawMany();
    const t1ResIds = t1Res.length > 0 ? t1Res.map((x) => x.wxPaidOrdersId) : [];
    // console.log(t1Res);
    let t2Res = [];
    if (t2DistributorIds.length > 0) {
      t2Res = await getRepository(WxUser)
        .createQueryBuilder("wxUser")
        .select("wxUser.distributorId", "distributorId")
        .addSelect("wxPaidOrders.id", "wxPaidOrdersId")
        .leftJoin("wxUser.wxPaidOrders", "wxPaidOrders")
        .where(
          "wxPaidOrders.t1DistributorWithdrawFundsId is NULL and wxPaidOrders.state = 'SUCCESS' and wxUser.distributorId IN (:...distributorIds)",
          {
            distributorIds: t2DistributorIds,
          }
        )
        // .groupBy("wxUser.distributorId")
        .getRawMany();
      console.log(t2Res);
    }
    const t2ResIds = t2Res.length > 0 ? t2Res.map((x) => x.wxPaidOrdersId) : [];
    res.t1_wxPaidOrdersIds = t1ResIds.concat(t2ResIds);
    return res;
  }
};

export const getDistributorAllShare = async (obj: any) => {
  const orderRepository = getRepository(WxPaidOrders);
  let totalAmount;
  if (obj.distributor.t1DistributorId) {
    console.log("二级分销商");
    if (obj.t2_wxPaidOrdersIds.length < 1) return 0;
    totalAmount = await orderRepository
      .createQueryBuilder("wxPaidOrders")
      .select("SUM(t2_share)", "amount")
      .where("id IN (:...ids)", {
        ids: obj.t2_wxPaidOrdersIds,
      })
      .getRawOne();
  } else {
    console.log("一级分销商");
    if (obj.t1_wxPaidOrdersIds.length < 1) return 0;
    totalAmount = await orderRepository
      .createQueryBuilder("wxPaidOrders")
      .select("SUM(t1_share)", "amount")
      .where("id IN (:...ids)", {
        ids: obj.t1_wxPaidOrdersIds,
      })
      .getRawOne();
  }
  return totalAmount.amount ? totalAmount.amount : 0;
};

export const updateWxPaidOrdersDistributorWithdrawFundsId = async (
  obj: any,
  dWFundId: number
) => {
  if (obj.distributor.t1DistributorId) {
    if (obj.t2_wxPaidOrdersIds.length < 1) return;
    await WxPaidOrders.update(
      {
        id: In(obj.t2_wxPaidOrdersIds),
      },
      {
        t2DistributorWithdrawFundsId: dWFundId,
      }
    );
  } else {
    if (obj.t1_wxPaidOrdersIds.length < 1) return;
    await WxPaidOrders.update(
      {
        id: In(obj.t1_wxPaidOrdersIds),
      },
      {
        t1DistributorWithdrawFundsId: dWFundId,
      }
    );
  }
};
