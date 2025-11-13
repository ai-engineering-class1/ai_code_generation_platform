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
import { MarketAnalysisReport, StrategySuggestions } from "@/models";
import {
  MarketAnalysisReportInput,
  MarketAnalysisReportResult,
  AnalysisMarketPositioningInput,
  AnalysisMarketInput,
  AnalysisMarketStrategyInput,
  AnalysisMarketStrategySuggestionsInput,
  StrategySuggestionsInput,
} from "./types";
import axios from "axios";
import { CommonError } from "@/errors";
import { exportAiReport } from "@/utils/chatAi";

const requestUrl = async (url: string, session_id: string) => {
  const res = await axios.post(
    url,
    {
      args: {
        json_data: {
          session_id: session_id,
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
    if (res.data.result.status === "success") {
      try {
        const model = JSON.parse(
          res.data.result.data.replaceAll("```json", "").replaceAll("```", "")
        );
        console.log(model);
        return res.data.result.data
          .replaceAll("```json", "")
          .replaceAll("```", "");
      } catch (error) {
        return "";
      }
    }
  }
  return "";
};

const requestUrlTemplate = async (
  url: string,
  session_id: string,
  template: string
) => {
  const res = await axios.post(
    url,
    {
      args: {
        json_data: {
          session_id: session_id,
          template: template,
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
    if (res.data.result.status === "success") {
      try {
        const model = JSON.parse(
          res.data.result.data.replaceAll("```json", "").replaceAll("```", "")
        );
        console.log(model);
        return res.data.result.data
          .replaceAll("```json", "")
          .replaceAll("```", "");
      } catch (error) {
        return "";
      }
    }
  }
  return "";
};

const getGenerateMarketAnalysis = async (session_id: string) => {
  return await requestUrl(
    "https://abc.easiio.com/chatapi/execute/service3/market/generate_analysis_report",
    session_id
  );
};

const getGeneratePositioningReport = async (
  session_id: string,
  category: number
) => {
  return await requestUrl(
    `https://abc.easiio.com/chatapi/execute/service3/market/generate_positioning_report${category}`,
    session_id
  );
};

const getGenerateIndustryCompetitionReport = async (session_id: string) => {
  return await requestUrl(
    "https://abc.easiio.com/chatapi/execute/service3/market/generate_industry_competition",
    session_id
  );
};

const getGenerateStrategyRecommendationsReport = async (session_id: string) => {
  return await requestUrl(
    "https://abc.easiio.com/chatapi/execute/service3/market/generate_strategy_recommendations",
    session_id
  );
};

const getMarketMoreGenerateStrategyRecommendationsReport = async (
  session_id: string,
  template: string
) => {
  return await requestUrlTemplate(
    "https://abc.easiio.com/chatapi/execute/service3/market_more/generate_strategy_recommendations",
    session_id,
    template
  );
};

@Resolver()
class MarketAnalysisResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Int)
  async createMarketAnalysisReport(
    @Ctx() ctx: GQLContext,
    @Arg("data") dataInput: MarketAnalysisReportInput
  ): Promise<number> {
    const user = ctx.req.currentUser;
    const model = await MarketAnalysisReport.create({
      ...dataInput,
      organizationId: user.organizationId,
      userId: user.id,
    }).save();
    return model.id;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateMarketAnalysisReport(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("data") dataInput: MarketAnalysisReportInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    await MarketAnalysisReport.update(
      { id: id, organizationId: orgId },
      dataInput
    );
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteMarketAnalysisReport(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await MarketAnalysisReport.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    await model.remove();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => MarketAnalysisReportResult)
  async getMarketAnalysisReports(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number,
    @Arg("category", () => Int, { nullable: true })
    category: number
  ): Promise<MarketAnalysisReportResult> {
    const orgId = ctx.req.currentUser.organizationId;
    const input: any = {
      organizationId: orgId,
    };

    if (category) {
      input.category = category;
    }
    const [data, count] = await MarketAnalysisReport.findAndCount({
      where: input,
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 30,
    });
    const res = new MarketAnalysisReportResult();
    res.result = data;
    res.total = count;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => MarketAnalysisReport)
  async getMarketAnalysisReportInfo(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<MarketAnalysisReport> {
    const orgId = ctx.req.currentUser.organizationId;

    const model = await MarketAnalysisReport.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });

    return model;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Int)
  async analysisMarketPositioningReport(
    @Ctx() ctx: GQLContext,
    @Arg("data") dataInput: AnalysisMarketPositioningInput
  ): Promise<number> {
    const orgId = ctx.req.currentUser.organizationId;
    console.log(orgId);
    console.log(dataInput);
    return 1;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Int)
  async analysisMarketReport(
    @Ctx() ctx: GQLContext,
    @Arg("data") dataInput: AnalysisMarketInput
  ): Promise<number> {
    const orgId = ctx.req.currentUser.organizationId;
    console.log(orgId);
    console.log(dataInput);
    return 1;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Int)
  async analysisMarketingStrategyReport(
    @Ctx() ctx: GQLContext,
    @Arg("data") dataInput: AnalysisMarketStrategyInput
  ): Promise<number> {
    const orgId = ctx.req.currentUser.organizationId;
    console.log(orgId);
    console.log(dataInput);
    return 1;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Int)
  async analysisMarketingStrategySuggestionsReport(
    @Ctx() ctx: GQLContext,
    @Arg("data") dataInput: AnalysisMarketStrategySuggestionsInput
  ): Promise<number> {
    const orgId = ctx.req.currentUser.organizationId;
    console.log(orgId);
    console.log(dataInput);
    return 1;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => MarketAnalysisReport)
  async getMarketAnalysisAiReports(
    @Ctx() ctx: GQLContext,
    @Arg("session_id", () => String) session_id: string,
    @Arg("session_name", () => String) session_name: string
    // @Arg("category", () => Int, { nullable: true }) category: number
  ): Promise<MarketAnalysisReport> {
    const user = ctx.req.currentUser;
    const existModel = await MarketAnalysisReport.findOne({
      where: {
        session_id: session_id,
        category: 1,
      },
    });
    if (existModel) {
      return existModel;
    }

    let res = "";
    let count = 0;
    while (res === "" && count < 3) {
      res = await getGenerateMarketAnalysis(session_id);
      count++;
    }

    if (res !== "") {
      const model = await MarketAnalysisReport.create({
        name: "",
        organizationId: user.organizationId,
        aiReport: res,
        session_id: session_id,
        session_name: session_name,
        category: 1,
        userId: user.id,
      }).save();
      return model;
    }
    throw new CommonError("Analysis failed");
  }

  // @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  // @Query(() => MarketAnalysisReport)
  // async getMarketPositioningAnalysisAiReports(
  //   @Ctx() ctx: GQLContext,
  //   @Arg("session_id", () => String) session_id: string,
  //   @Arg("session_name", () => String) session_name: string,
  //   @Arg("positionCategory", () => Int) positionCategory: number
  // ): Promise<MarketAnalysisReport> {
  //   const orgId = ctx.req.currentUser.organizationId;
  //   const existModel = await MarketAnalysisReport.findOne({
  //     where: {
  //       session_id: session_id,
  //       category: 2,
  //       // positionCategory: positionCategory,
  //     },
  //   });
  //   if (existModel) {
  //     // return existModel;
  //     if (positionCategory === 1) {
  //       if (existModel.aiReport && existModel.aiReport !== "") {
  //         return existModel;
  //       } else {
  //         let res = "";
  //         let count = 0;
  //         while (res === "" && count < 3) {
  //           res = await getGeneratePositioningReport(
  //             session_id,
  //             positionCategory
  //           );
  //           count++;
  //         }

  //         if (res !== "") {
  //           existModel.aiReport = res;
  //           await existModel.save();
  //           return existModel;
  //         } else {
  //           throw new CommonError("Analysis failed");
  //         }
  //       }
  //     } else if (positionCategory === 2) {
  //       if (existModel.aiReport2 && existModel.aiReport2 !== "") {
  //         return existModel;
  //       } else {
  //         let res = "";
  //         let count = 0;
  //         while (res === "" && count < 3) {
  //           res = await getGeneratePositioningReport(
  //             session_id,
  //             positionCategory
  //           );
  //           count++;
  //         }

  //         if (res !== "") {
  //           existModel.aiReport2 = res;
  //           await existModel.save();
  //           return existModel;
  //         } else {
  //           throw new CommonError("Analysis failed");
  //         }
  //       }
  //     } else if (positionCategory === 3) {
  //       if (existModel.aiReport3 && existModel.aiReport3 !== "") {
  //         return existModel;
  //       } else {
  //         let res = "";
  //         let count = 0;
  //         while (res === "" && count < 3) {
  //           res = await getGeneratePositioningReport(
  //             session_id,
  //             positionCategory
  //           );
  //           count++;
  //         }

  //         if (res !== "") {
  //           existModel.aiReport3 = res;
  //           await existModel.save();
  //           return existModel;
  //         } else {
  //           throw new CommonError("Analysis failed");
  //         }
  //       }
  //     } else {
  //       if (existModel.aiReport4 && existModel.aiReport4 !== "") {
  //         return existModel;
  //       } else {
  //         let res = "";
  //         let count = 0;
  //         while (res === "" && count < 3) {
  //           res = await getGeneratePositioningReport(
  //             session_id,
  //             positionCategory
  //           );
  //           count++;
  //         }

  //         if (res !== "") {
  //           existModel.aiReport4 = res;
  //           await existModel.save();
  //           return existModel;
  //         } else {
  //           throw new CommonError("Analysis failed");
  //         }
  //       }
  //     }
  //   }

  //   let res = "";
  //   let count = 0;
  //   while (res === "" && count < 3) {
  //     res = await getGeneratePositioningReport(session_id, positionCategory);
  //     count++;
  //   }

  //   if (res !== "") {
  //     const model = await MarketAnalysisReport.create({
  //       name: "",
  //       organizationId: orgId,
  //       aiReport: res,
  //       session_id: session_id,
  //       session_name: session_name,
  //       category: 2,
  //       positionCategory: positionCategory,
  //     }).save();
  //     if (positionCategory === 1) {
  //       model.aiReport = res;
  //     } else if (positionCategory === 2) {
  //       model.aiReport2 = res;
  //     } else if (positionCategory === 3) {
  //       model.aiReport3 = res;
  //     } else {
  //       model.aiReport4 = res;
  //     }
  //     await model.save();

  //     return model;
  //   }
  //   throw new CommonError("Analysis failed");
  // }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => MarketAnalysisReport)
  async getMarketPositioningAnalysisAiReports(
    @Ctx() ctx: GQLContext,
    @Arg("session_id", () => String) session_id: string,
    @Arg("session_name", () => String) session_name: string,
    @Arg("positionCategory", () => Int) positionCategory: number
  ): Promise<MarketAnalysisReport> {
    const user = ctx.req.currentUser;
    const existModel = await MarketAnalysisReport.findOne({
      where: {
        session_id: session_id,
        category: 2,
        // positionCategory: positionCategory,
      },
    });
    if (existModel) {
      return existModel;
    }

    let aiReport = "";
    let aiReport2 = "";
    let aiReport3 = "";
    let aiReport4 = "";
    for (let i = 1; i <= 4; i++) {
      let res = "";
      let count = 0;
      while (res === "" && count < 3) {
        res = await getGeneratePositioningReport(session_id, i);
        count++;
      }

      if (res !== "") {
        if (i === 1) {
          aiReport = res;
        } else if (i === 2) {
          aiReport2 = res;
        } else if (i === 3) {
          aiReport3 = res;
        } else {
          aiReport4 = res;
        }
      }
    }
    if (
      aiReport !== "" &&
      aiReport2 !== "" &&
      aiReport3 !== "" &&
      aiReport4 !== ""
    ) {
      const model = await MarketAnalysisReport.create({
        name: "",
        organizationId: user.organizationId,
        session_id: session_id,
        session_name: session_name,
        category: 2,
        positionCategory: positionCategory,
        aiReport: aiReport,
        aiReport2: aiReport2,
        aiReport3: aiReport3,
        aiReport4: aiReport4,
        userId: user.id,
      }).save();
      return model;
    }

    throw new CommonError("Analysis failed");
  }

  //行业竞争分析
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => MarketAnalysisReport)
  async getMarketIndustryCompetitionAnalysisAiReports(
    @Ctx() ctx: GQLContext,
    @Arg("session_id", () => String) session_id: string,
    @Arg("session_name", () => String) session_name: string
  ): Promise<MarketAnalysisReport> {
    const user = ctx.req.currentUser;
    const existModel = await MarketAnalysisReport.findOne({
      where: {
        session_id: session_id,
        category: 3,
      },
    });
    if (existModel) {
      return existModel;
    }

    let res = "";
    let count = 0;
    while (res === "" && count < 3) {
      res = await getGenerateIndustryCompetitionReport(session_id);
      count++;
    }

    if (res !== "") {
      const model = await MarketAnalysisReport.create({
        name: "",
        organizationId: user.organizationId,
        aiReport: res,
        session_id: session_id,
        session_name: session_name,
        category: 3,
        userId: user.id,
      }).save();
      return model;
    }
    throw new CommonError("Analysis failed");
  }

  //策略建议
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => MarketAnalysisReport)
  async getMarketStrategyRecommendationsAnalysisAiReports(
    @Ctx() ctx: GQLContext,
    @Arg("session_id", () => String) session_id: string,
    @Arg("session_name", () => String) session_name: string
  ): Promise<MarketAnalysisReport> {
    const user = ctx.req.currentUser;
    const existModel = await MarketAnalysisReport.findOne({
      where: {
        session_id: session_id,
        category: 4,
      },
    });
    if (existModel) {
      return existModel;
    }

    let res = "";
    let count = 0;
    while (res === "" && count < 3) {
      res = await getGenerateStrategyRecommendationsReport(session_id);
      count++;
    }

    if (res !== "") {
      const model = await MarketAnalysisReport.create({
        name: "",
        organizationId: user.organizationId,
        aiReport: res,
        session_id: session_id,
        session_name: session_name,
        category: 4,
        userId: user.id,
      }).save();
      return model;
    }
    throw new CommonError("Analysis failed");
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async exportMarketStrategyRecommendationsAnalysisAiReports(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<string> {
    const orgId = ctx.req.currentUser.organizationId;
    const existModel = await MarketAnalysisReport.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    // industry_analysis_report
    const fileUrl =
      "https://file.sflow.pro/abc/strategy_recommendations_report_template.docx";
    const res = await exportAiReport(
      existModel,
      fileUrl,
      "market_strategy_recommendations_report.docx"
    );
    if (res && res !== "") {
      return res;
    }
    throw new CommonError("Export failed");
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getMarketMoreStrategyRecommendationsAnalysisAsiReports(
    @Ctx() ctx: GQLContext,
    @Arg("session_id", () => String) session_id: string,
    @Arg("session_name", () => String) session_name: string,
    @Arg("template", () => String) template: string
  ): Promise<string> {
    const user = ctx.req.currentUser;
    const model = await MarketAnalysisReport.findOne({
      where: {
        organizationId: user.organizationId,
        session_id: session_id,
        template: template,
        session_name: session_name,
        category: 4,
      },
    });
    if (model) {
      return model.aiReport;
    }

    const res = await getMarketMoreGenerateStrategyRecommendationsReport(
      session_id,
      template
    );
    if (res !== "") {
      await MarketAnalysisReport.create({
        name: "",
        organizationId: user.organizationId,
        aiReport: res,
        session_id: session_id,
        session_name: session_name,
        category: 4,
        template: template,
        userId: user.id,
      }).save();
      return res;
    }
    throw new CommonError("Analysis failed");
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createStrategySuggestions(
    @Ctx() ctx: GQLContext,
    @Arg("data") dataInput: StrategySuggestionsInput
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    await StrategySuggestions.create({
      ...dataInput,
      organizationId: user.organizationId,
      userId: user.id,
    }).save();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateStrategySuggestions(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("data") dataInput: StrategySuggestionsInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    await StrategySuggestions.update(
      { id: id, organizationId: orgId },
      dataInput
    );
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteStrategySuggestions(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await StrategySuggestions.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    await model.remove();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [StrategySuggestions])
  async getStrategySuggestions(
    @Ctx() ctx: GQLContext
  ): Promise<StrategySuggestions[]> {
    const orgId = ctx.req.currentUser.organizationId;

    const res = await StrategySuggestions.find({
      where: {
        organizationId: orgId,
      },
    });
    return res;
  }
}

export default MarketAnalysisResolver;
