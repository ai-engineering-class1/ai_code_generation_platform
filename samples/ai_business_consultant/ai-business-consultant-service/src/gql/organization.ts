import {
  Resolver,
  UseMiddleware,
  Mutation,
  Query,
  Arg,
  // Int,
  Ctx,
  Int,
} from "type-graphql";
import { ErrorInterceptor, ResolveTime } from "@/middlewares";
import {
  Organization,
  User,
  Sfbot,
  WxUser,
  OrgCarouselImage,
  OrgMainImage,
  OrgModelText,
  OrgUsageExample,
  OrgLawyer,
  OrgBranch,
} from "@/models";
import {
  IsAdminAuth,
  IsFounderAdminAuth,
  IsAuth,
  IsAdminAndMiniMainPageAuth,
} from "@/middlewares/isAuth";
import {
  OrganizationInput,
  AdminCreateInput,
  OrganizationUpdateInput,
  OrgCarouselImageInput,
  OrgMainImageInput,
  OrgModelTextInput,
  OrgUsageExampleInput,
  OrgLawyerInput,
  OrgBranchInput,
} from "./types";
import { GQLContext } from "@/types/context";
import { CommonError } from "@/errors";
import { hash } from "@/utils/authToken";
import redis from "ioredis";

@Resolver()
class OrganizationResolver {
  @UseMiddleware([IsFounderAdminAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [Organization])
  async getAllOrganizations(): Promise<Organization[]> {
    const orgs = await Organization.find();
    return orgs;
  }

  @UseMiddleware([IsFounderAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Organization)
  async createOrganization(
    @Arg("organization")
    organizationInput: OrganizationInput,
    @Arg("admin") userInput: AdminCreateInput
  ): Promise<Organization> {
    let user = await User.findOne({
      where: {
        email: userInput.email,
      },
    });
    if (user) {
      throw new CommonError(`User(${userInput.email}) is exist`);
    }
    const org = await Organization.create(organizationInput).save();

    userInput.password = hash(userInput.password);
    await User.create({
      ...userInput,
      organizationId: org.id,
    }).save();

    const uuid = require("uuid");
    const uuidStr = uuid.v1();
    const sfbot = await Sfbot.create({
      password: userInput.email,
      character_desc:
        "You are a friendly customer service agent for Sflow Video. The goal of Sflow Video is to convert existing documents into high-quality videos, and Sflow makes promotion easier!",
      chatAiName: "ChatAI",
      chatAiGreeting:
        "Hello, I am ChatAl Assistant, I will provide you with friendly, professional and efficient service. Are there any questions I can help you answer?",
      uuid: uuidStr,
      organizationId: org.id,
    }).save();
    const client = new redis(process.env.REDIS_URL);
    client.select(0);
    client.hset(
      `sfbot:org:${sfbot.organizationId}:bot:${sfbot.id}`,
      "character_desc",
      sfbot.character_desc
    );
    client.hset(
      `sfbot:org:${sfbot.organizationId}:bot:${sfbot.id}`,
      "password",
      sfbot.password
    );
    return org;
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Organization)
  async updateOrganization(
    @Ctx() ctx: GQLContext,
    @Arg("organization")
    organizationInput: OrganizationUpdateInput
  ): Promise<Organization> {
    const admin = ctx.req.currentUser;
    await Organization.findOneOrFail(admin.organizationId);
    await Organization.update(admin.organizationId, organizationInput);

    return await Organization.findOneOrFail(admin.organizationId);
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async upgradeOrganizationPlan(
    @Ctx() ctx: GQLContext,
    @Arg("plan", () => Int) plan: number
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    await Organization.update(admin.organizationId, { plan: plan });

    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => Organization)
  async getOrganization(@Ctx() ctx: GQLContext): Promise<Organization> {
    const user = ctx.req.currentUser;
    const org = await Organization.findOneOrFail(user.organizationId, {
      relations: [
        "orgCarouselImages",
        "orgMainImages",
        "orgModelTexts",
        "orgUsageExamples",
        "orgLawyers",
        "orgBranchs",
        "orgCarouselImages.user",
        "orgMainImages.user",
        "orgModelTexts.user",
        "orgUsageExamples.user",
      ],
    });
    return org;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => Organization)
  async getOrganizationByWxUser(
    @Arg("openid", () => String) openid: string
  ): Promise<Organization> {
    const wxUser = await WxUser.findOne({
      where: {
        openId: openid,
      },
      relations: [
        "organization",
        "organization.orgCarouselImages",
        "organization.orgMainImages",
        "organization.orgModelTexts",
        "organization.orgUsageExamples",
        "organization.orgLawyers",
        "organization.orgBranchs",
      ],
    });
    if (!wxUser) {
      throw new CommonError("User not found");
    }
    return wxUser.organization;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => [OrgBranch])
  async getOrgBranchsByWxUser(
    @Arg("openid", () => String) openid: string
  ): Promise<OrgBranch[]> {
    const wxUser = await WxUser.findOne({
      where: {
        openId: openid,
      },
    });
    if (!wxUser) {
      throw new CommonError("User not found");
    }
    const list = await OrgBranch.find({
      where: {
        organizationId: wxUser.organizationId,
      },
      relations: ["user"],
    });

    return list;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => [OrgLawyer])
  async getOrgLawyersByWxUser(
    @Arg("openid", () => String) openid: string
  ): Promise<OrgLawyer[]> {
    const wxUser = await WxUser.findOne({
      where: {
        openId: openid,
      },
    });
    if (!wxUser) {
      throw new CommonError("User not found");
    }
    const list = await OrgLawyer.find({
      where: {
        organizationId: wxUser.organizationId,
      },
      relations: ["user"],
    });

    return list;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => [OrgUsageExample])
  async getOrgUsageExamplesByWxUser(
    @Arg("openid", () => String) openid: string
  ): Promise<OrgUsageExample[]> {
    const wxUser = await WxUser.findOne({
      where: {
        openId: openid,
      },
    });
    if (!wxUser) {
      throw new CommonError("User not found");
    }
    const list = await OrgUsageExample.find({
      where: {
        organizationId: wxUser.organizationId,
      },
      relations: ["user"],
    });

    return list;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => [OrgModelText])
  async getOrgModelTextsByWxUser(
    @Arg("openid", () => String) openid: string
  ): Promise<OrgModelText[]> {
    const wxUser = await WxUser.findOne({
      where: {
        openId: openid,
      },
    });
    if (!wxUser) {
      throw new CommonError("User not found");
    }
    const list = await OrgModelText.find({
      where: {
        organizationId: wxUser.organizationId,
      },
      relations: ["user"],
    });

    return list;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => [OrgMainImage])
  async getOrgMainImagesByWxUser(
    @Arg("openid", () => String) openid: string
  ): Promise<OrgMainImage[]> {
    const wxUser = await WxUser.findOne({
      where: {
        openId: openid,
      },
    });
    if (!wxUser) {
      throw new CommonError("User not found");
    }
    const list = await OrgMainImage.find({
      where: {
        organizationId: wxUser.organizationId,
      },
      relations: ["user"],
    });

    return list;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => [OrgCarouselImage])
  async getOrgCarouselImagesByWxUser(
    @Arg("openid", () => String) openid: string
  ): Promise<OrgCarouselImage[]> {
    const wxUser = await WxUser.findOne({
      where: {
        openId: openid,
      },
    });
    if (!wxUser) {
      throw new CommonError("User not found");
    }
    const list = await OrgCarouselImage.find({
      where: {
        organizationId: wxUser.organizationId,
      },
      relations: ["user"],
    });

    return list;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createOrgCarouselImage(
    @Ctx() ctx: GQLContext,
    @Arg("orgCarouselImage")
    orgCarouselImageInput: OrgCarouselImageInput
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    await OrgCarouselImage.create({
      ...orgCarouselImageInput,
      organizationId: admin.organizationId,
      userId: admin.id,
    }).save();

    return true;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateOrgCarouselImage(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("orgCarouselImage")
    orgCarouselImageInput: OrgCarouselImageInput
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    await OrgCarouselImage.update(
      { id: id, organizationId: admin.organizationId },
      orgCarouselImageInput
    );
    return true;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteOrgCarouselImage(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    await OrgCarouselImage.delete({
      id: id,
      organizationId: admin.organizationId,
    });
    return true;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => [OrgCarouselImage])
  async getOrgCarouselImages(
    @Ctx() ctx: GQLContext
  ): Promise<OrgCarouselImage[]> {
    const admin = ctx.req.currentUser;
    const list = await OrgCarouselImage.find({
      where: {
        organizationId: admin.organizationId,
      },
      relations: ["user"],
    });
    return list;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createOrgMainImage(
    @Ctx() ctx: GQLContext,
    @Arg("orgMainImage")
    orgMainImageInput: OrgMainImageInput
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    await OrgMainImage.create({
      ...orgMainImageInput,
      organizationId: admin.organizationId,
      userId: admin.id,
    }).save();

    return true;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateOrgMainImage(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("orgMainImage")
    orgMainImageInput: OrgMainImageInput
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    await OrgMainImage.update(
      { id: id, organizationId: admin.organizationId },
      orgMainImageInput
    );
    return true;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteOrgMainImage(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    await OrgMainImage.delete({ id: id, organizationId: admin.organizationId });
    return true;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => [OrgMainImage])
  async getOrgMainImages(@Ctx() ctx: GQLContext): Promise<OrgMainImage[]> {
    const admin = ctx.req.currentUser;
    const list = await OrgMainImage.find({
      where: {
        organizationId: admin.organizationId,
      },
      relations: ["user"],
    });
    return list;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createOrgModelText(
    @Ctx() ctx: GQLContext,
    @Arg("orgModelText")
    orgModelTextInput: OrgModelTextInput
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    await OrgModelText.create({
      ...orgModelTextInput,
      organizationId: admin.organizationId,
      userId: admin.id,
    }).save();

    return true;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateOrgModelText(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("orgModelText")
    orgModelTextInput: OrgModelTextInput
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    await OrgModelText.update(
      { id: id, organizationId: admin.organizationId },
      orgModelTextInput
    );
    return true;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteOrgModelText(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    await OrgModelText.delete({ id: id, organizationId: admin.organizationId });
    return true;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => [OrgModelText])
  async getOrgModelTexts(@Ctx() ctx: GQLContext): Promise<OrgModelText[]> {
    const admin = ctx.req.currentUser;
    const list = await OrgModelText.find({
      where: {
        organizationId: admin.organizationId,
      },
      relations: ["user"],
    });
    return list;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createOrgUsageExample(
    @Ctx() ctx: GQLContext,
    @Arg("orgUsageExample")
    orgUsageExampleInput: OrgUsageExampleInput
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    await OrgUsageExample.create({
      ...orgUsageExampleInput,
      organizationId: admin.organizationId,
      userId: admin.id,
    }).save();

    return true;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateOrgUsageExample(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("orgUsageExample")
    orgUsageExampleInput: OrgUsageExampleInput
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    await OrgUsageExample.update(
      { id: id, organizationId: admin.organizationId },
      orgUsageExampleInput
    );
    return true;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteOrgUsageExample(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    await OrgUsageExample.delete({
      id: id,
      organizationId: admin.organizationId,
    });
    return true;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => [OrgUsageExample])
  async getOrgUsageExamples(
    @Ctx() ctx: GQLContext
  ): Promise<OrgUsageExample[]> {
    const admin = ctx.req.currentUser;
    const list = await OrgUsageExample.find({
      where: {
        organizationId: admin.organizationId,
      },
      relations: ["user"],
    });
    return list;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createOrgLawyer(
    @Ctx() ctx: GQLContext,
    @Arg("orgLawyer")
    orgLawyerInput: OrgLawyerInput
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    await OrgLawyer.create({
      ...orgLawyerInput,
      organizationId: admin.organizationId,
    }).save();

    return true;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateOrgLawyer(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("orgLawyer")
    orgLawyerInput: OrgLawyerInput
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    await OrgLawyer.update(
      { id: id, organizationId: admin.organizationId },
      orgLawyerInput
    );
    return true;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteOrgLawyer(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    await OrgLawyer.delete({ id: id, organizationId: admin.organizationId });
    return true;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => [OrgLawyer])
  async getOrgLawyers(@Ctx() ctx: GQLContext): Promise<OrgLawyer[]> {
    const admin = ctx.req.currentUser;
    const list = await OrgLawyer.find({
      where: {
        organizationId: admin.organizationId,
      },
    });
    return list;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createOrgBranch(
    @Ctx() ctx: GQLContext,
    @Arg("orgBranch")
    orgBranchInput: OrgBranchInput
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    await OrgBranch.create({
      ...orgBranchInput,
      organizationId: admin.organizationId,
    }).save();

    return true;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateOrgBranch(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("orgBranch")
    orgBranchInput: OrgBranchInput
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    await OrgBranch.update(
      { id: id, organizationId: admin.organizationId },
      orgBranchInput
    );
    return true;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteOrgBranch(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    await OrgBranch.delete({ id: id, organizationId: admin.organizationId });
    return true;
  }

  @UseMiddleware([IsAdminAndMiniMainPageAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => [OrgBranch])
  async getOrgBranchs(@Ctx() ctx: GQLContext): Promise<OrgBranch[]> {
    const admin = ctx.req.currentUser;
    const list = await OrgBranch.find({
      where: {
        organizationId: admin.organizationId,
      },
    });
    return list;
  }
}

export default OrganizationResolver;
