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
import { IndustryAnalysis } from "@/models";
import {
  IndustryAnalysisResult,
  IndustryAnalysisInput,
  AnalysisIndustryInput,
} from "./types";
import axios from "axios";
import { CommonError } from "@/errors";
import { exportAiReport } from "@/utils/chatAi";

const getGenerateIndustryAnalysis = async (session_id: string) => {
  try {
    const res = await axios.post(
      "https://abc.easiio.com/chatapi/execute/service3/perplexity_query/generate_industry_analysis",
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
  } catch (error) {
    return "";
  }
};

@Resolver()
class IndustryAnalysisResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Int)
  async createIndustryAnalysis(
    @Ctx() ctx: GQLContext,
    @Arg("data") dataInput: IndustryAnalysisInput
  ): Promise<number> {
    const user = ctx.req.currentUser;
    const model = await IndustryAnalysis.create({
      ...dataInput,
      organizationId: user.organizationId,
      userId: user.id,
    }).save();
    return model.id;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateIndustryAnalysis(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("data") dataInput: IndustryAnalysisInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    await IndustryAnalysis.update({ id: id, organizationId: orgId }, dataInput);
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteIndustryAnalysis(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await IndustryAnalysis.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    await model.remove();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => IndustryAnalysisResult)
  async getIndustryAnalysiss(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<IndustryAnalysisResult> {
    const orgId = ctx.req.currentUser.organizationId;
    const [data, count] = await IndustryAnalysis.findAndCount({
      where: {
        organizationId: orgId,
      },
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 30,
    });
    const res = new IndustryAnalysisResult();
    res.result = data;
    res.total = count;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => IndustryAnalysis)
  async getIndustryAnalysisInfo(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<IndustryAnalysis> {
    const orgId = ctx.req.currentUser.organizationId;

    const model = await IndustryAnalysis.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });

    return model;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Int)
  async analysisIndustryReport(
    @Ctx() ctx: GQLContext,
    @Arg("data") dataInput: AnalysisIndustryInput
  ): Promise<number> {
    const orgId = ctx.req.currentUser.organizationId;
    console.log(orgId);
    console.log(dataInput);
    return 1;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => IndustryAnalysis)
  async getIndustryAnalysisAiReports(
    @Ctx() ctx: GQLContext,
    @Arg("session_id", () => String) session_id: string,
    @Arg("session_name", () => String) session_name: string
  ): Promise<IndustryAnalysis> {
    const user = ctx.req.currentUser;
    const existModel = await IndustryAnalysis.findOne({
      where: {
        session_id: session_id,
      },
    });
    if (existModel) {
      return existModel;
    }
    const model = await IndustryAnalysis.create({
      name: "",
      industry: "",
      childIndustry: "",
      dateRange: "",
      organizationId: user.organizationId,
      aiReport: "",
      session_id: session_id,
      session_name: session_name,
      state: "waiting",
      userId: user.id,
    }).save();

    let res = "";
    let count = 0;
    while (res === "" && count < 3) {
      res = await getGenerateIndustryAnalysis(session_id);
      count++;
    }

    if (res !== "") {
      model.aiReport = res;
      model.state = "done";
      await model.save();
      return model;
    }
    await model.remove();
    throw new CommonError("Analysis failed");
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async exportIndustryAnalysisAiReports(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("aiReport", () => String, { nullable: true }) aiReport: string
  ): Promise<string> {
    const orgId = ctx.req.currentUser.organizationId;
    const existModel = await IndustryAnalysis.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    if (aiReport && aiReport.trim() !== "") {
      existModel.aiReport = aiReport;
    }
    // industry_analysis_report
    const fileUrl =
      "https://file.sflow.pro/abc/industry_analysis_report_template.docx";
    const res = await exportAiReport(
      existModel,
      fileUrl,
      "industry_analysis_report.docx"
    );
    if (res && res !== "") {
      return res;
    }
    throw new CommonError("Export failed");
  }
}

export default IndustryAnalysisResolver;
