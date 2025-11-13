import {
  Resolver,
  Query,
  UseMiddleware,
  Ctx,
  Mutation,
  Arg,
  Int,
} from "type-graphql";
import { IsAdminAndOperatorAuth, IsAuth } from "@/middlewares/isAuth";
//   import { GQLContext } from "@/types/context";
import {
  LegalDocumentTemplate,
  LegalDocumentElement,
  LegalDocumentProject,
  LegalDocumentType,
  User,
  WxUser,
  Commodity,
} from "@/models";
import { ErrorInterceptor, ResolveTime } from "@/middlewares";
import {
  LegalDocumentProjectInput,
  LegalDocumentProjectUpdateInput,
  LegalDocumentInput,
  LegalDocumentUpdateInput,
  LegalDocumentTypeInput,
  LegalDocumentElementInput,
  LegalDocumentElementUpdateInput,
} from "./types";
import { CommonError } from "@/errors";
import { STS } from "ali-oss";
import { encrypted } from "@/utils/encode";
import { isNonEmptyString, isValidNumber } from "@/utils/validations";
import { IsNull, Like, Not, getRepository } from "typeorm";
import { GQLContext } from "@/types/context";
// import AsyncLock from "async-lock";

function verifyUserPermissions(user: User, project: LegalDocumentProject) {
  if (user.role !== 1 && project.creatorId !== user.id) {
    if (!project.members.some((item) => item.id === user.id)) {
      console.log(
        `user role:${user.role},id:${user.id},creatorId:${project.creatorId}`
      );
      throw new CommonError("No permission.");
    }
  }
}

function verifyCreatorPermissions(user: User, project: LegalDocumentProject) {
  if (user.role !== 1 && project.creatorId !== user.id) {
    console.log(
      `user role:${user.role},id:${user.id},creatorId:${project.creatorId}`
    );
    throw new CommonError("No permission.");
  }
}

@Resolver()
class LegalDocumentResolver {
  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async wxUserGetTemporaryOSSConfig(
    @Arg("openid", () => String) openid: string
  ): Promise<String> {
    await WxUser.findOneOrFail({
      where: {
        openId: openid,
        officialAccountState: "subscribe",
      },
    });
    const config = JSON.parse(process.env.STS_CONFIG);
    let policy;
    if (config.PolicyFile) {
      policy = {
        Statement: [
          {
            Action: ["oss:*"],
            Effect: "Allow",
            Resource: ["acs:oss:*:*:*"],
          },
        ],
        Version: "1",
      };
    }
    const client = new STS({
      accessKeyId: config.AccessKeyId,
      accessKeySecret: config.AccessKeySecret,
    });
    try {
      const result = await client.assumeRole(
        config.RoleArn,
        policy,
        config.TokenExpireTime
      );
      const ossConfig = {
        SecurityToken: result.credentials.SecurityToken,
        AccessKeyId: result.credentials.AccessKeyId,
        AccessKeySecret: result.credentials.AccessKeySecret,
        Expiration: result.credentials.Expiration,
      };
      console.log(ossConfig);
      return encrypted(JSON.stringify(ossConfig));
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
  @Query(() => String)
  async getTemporaryOSSConfig(): Promise<String> {
    const config = JSON.parse(process.env.STS_CONFIG);
    let policy;
    if (config.PolicyFile) {
      policy = {
        Statement: [
          {
            Action: ["oss:*"],
            Effect: "Allow",
            Resource: ["acs:oss:*:*:*"],
          },
        ],
        Version: "1",
      };
    }
    const client = new STS({
      accessKeyId: config.AccessKeyId,
      accessKeySecret: config.AccessKeySecret,
    });
    try {
      const result = await client.assumeRole(
        config.RoleArn,
        policy,
        config.TokenExpireTime
      );
      const ossConfig = {
        SecurityToken: result.credentials.SecurityToken,
        AccessKeyId: result.credentials.AccessKeyId,
        AccessKeySecret: result.credentials.AccessKeySecret,
        Expiration: result.credentials.Expiration,
      };
      console.log(ossConfig);
      return encrypted(JSON.stringify(ossConfig));
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

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => LegalDocumentProject)
  async createLegalDocumentProject(
    @Ctx() ctx: GQLContext,
    @Arg("legalDocumentProject")
    legalDocumentProjectInput: LegalDocumentProjectInput
  ): Promise<LegalDocumentProject> {
    const user = ctx.req.currentUser;
    const existName = await LegalDocumentProject.findOne({
      where: {
        name: legalDocumentProjectInput.name,
        organizationId: user.organizationId,
      },
    });
    if (existName) {
      throw new CommonError(`Name is exist`);
    }
    const model = await LegalDocumentProject.create({
      ...legalDocumentProjectInput,
      organizationId: user.organizationId,
      creatorId: user.id,
    }).save();
    return model;
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => LegalDocumentProject)
  async updateLegalDocumentProject(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("legalDocumentProject")
    legalDocumentProjectInput: LegalDocumentProjectUpdateInput
  ): Promise<LegalDocumentProject> {
    const user = ctx.req.currentUser;
    const project = await LegalDocumentProject.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
      relations: ["members"],
    });
    const existName = await LegalDocumentProject.findOne({
      where: {
        name: legalDocumentProjectInput.name,
        organizationId: user.organizationId,
        id: Not(id),
      },
    });
    if (existName) {
      throw new CommonError(`Name is exist`);
    }
    verifyUserPermissions(user, project);
    await LegalDocumentProject.update(id, legalDocumentProjectInput);
    return await LegalDocumentProject.findOneOrFail(id);
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteLegalDocumentProject(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    const model = await LegalDocumentProject.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
    });
    verifyCreatorPermissions(user, model);
    const commoditys = await Commodity.find({
      where: {
        legalDocumentProjectId: model.id,
      },
    });
    for (const commodity of commoditys) {
      await commodity.softRemove();
    }
    await model.softRemove();
    return true;
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [LegalDocumentProject])
  async getLegalDocumentProjects(
    @Ctx() ctx: GQLContext
  ): Promise<LegalDocumentProject[]> {
    const user = ctx.req.currentUser;
    const res = await LegalDocumentProject.find({
      where: {
        organizationId: user.organizationId,
      },
      relations: ["creator"],
    });
    return res;
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Query(() => LegalDocumentProject)
  async getLegalDocumentProject(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<LegalDocumentProject> {
    const user = ctx.req.currentUser;
    const res = await LegalDocumentProject.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
      relations: [
        "legalDocumentTemplates",
        "legalDocumentElements",
        "members",
        "testers",
        "creator",
      ],
    });
    return res;
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => LegalDocumentProject)
  async updateLegalDocumentProjectMembers(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("memberIds", () => [String]) memberIds: string[]
  ): Promise<LegalDocumentProject> {
    const user = ctx.req.currentUser;
    const project = await LegalDocumentProject.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
    });
    verifyCreatorPermissions(user, project);
    const userRepository = getRepository(User);
    const projectRepository = getRepository(LegalDocumentProject);
    const users = await userRepository.findByIds(memberIds, {
      organizationId: user.organizationId,
    });
    project.members = users;
    await projectRepository.save(project);
    return await LegalDocumentProject.findOneOrFail(id, {
      relations: ["members"],
    });
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => LegalDocumentProject)
  async updateLegalDocumentProjectTesters(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("testerIds", () => [String]) testerIds: string[]
  ): Promise<LegalDocumentProject> {
    const user = ctx.req.currentUser;
    const project = await LegalDocumentProject.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
    });
    verifyCreatorPermissions(user, project);
    const wxUserRepository = getRepository(WxUser);
    const projectRepository = getRepository(LegalDocumentProject);
    const testers = await wxUserRepository.findByIds(testerIds, {
      organizationId: user.organizationId,
    });
    project.testers = testers;
    await projectRepository.save(project);
    return await LegalDocumentProject.findOneOrFail(id, {
      relations: ["testers"],
    });
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => LegalDocumentTemplate)
  async createLegalDocument(
    @Ctx() ctx: GQLContext,
    @Arg("legalDocument") legalDocumentInput: LegalDocumentInput
  ): Promise<LegalDocumentTemplate> {
    const user = ctx.req.currentUser;
    const project = await LegalDocumentProject.findOneOrFail({
      where: {
        id: legalDocumentInput.legalDocumentProjectId,
        organizationId: user.organizationId,
      },
      relations: ["members"],
    });
    verifyUserPermissions(user, project);
    if (legalDocumentInput.legalDocumentTypeId) {
      await LegalDocumentType.findOneOrFail({
        where: {
          id: legalDocumentInput.legalDocumentTypeId,
          organizationId: user.organizationId,
        },
      });
    }
    const model = await LegalDocumentTemplate.create({
      ...legalDocumentInput,
      userId: user.id,
      organizationId: user.organizationId,
    }).save();
    return model;
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => LegalDocumentTemplate)
  async updateLegalDocument(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("legalDocument")
    legalDocumentInput: LegalDocumentUpdateInput
  ): Promise<LegalDocumentTemplate> {
    const user = ctx.req.currentUser;
    const template = await LegalDocumentTemplate.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
      relations: ["legalDocumentProject", "legalDocumentProject.members"],
    });
    verifyUserPermissions(user, template.legalDocumentProject);
    if (legalDocumentInput.legalDocumentTypeId) {
      await LegalDocumentType.findOneOrFail({
        where: {
          id: legalDocumentInput.legalDocumentTypeId,
          organizationId: user.organizationId,
        },
      });
    }

    await LegalDocumentTemplate.update(id, legalDocumentInput);
    return await LegalDocumentTemplate.findOneOrFail(id);
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteLegalDocument(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    const template = await LegalDocumentTemplate.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
      relations: ["legalDocumentProject", "legalDocumentProject.members"],
    });
    verifyUserPermissions(user, template.legalDocumentProject);
    // await template.remove();
    await template.softRemove();
    return true;
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [LegalDocumentTemplate])
  async getLegalDocuments(
    @Ctx() ctx: GQLContext,
    @Arg("legalDocumentProjectId", () => Int) legalDocumentProjectId: number,
    @Arg("fileName", () => String, { nullable: true }) fileName: string,
    @Arg("legalDocumentTypeId", () => Int, { nullable: true })
    legalDocumentTypeId: number
  ): Promise<LegalDocumentTemplate[]> {
    const user = ctx.req.currentUser;
    let input: any = {};
    input.legalDocumentProjectId = legalDocumentProjectId;
    if (isNonEmptyString(fileName)) {
      input.fileName = Like(`%${fileName}%`);
    }
    if (isValidNumber(legalDocumentTypeId)) {
      input.legalDocumentTypeId = legalDocumentTypeId;
    }
    const res = await LegalDocumentTemplate.find({
      ...input,
      organizationId: user.organizationId,
    });
    return res;
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => LegalDocumentType)
  async createLegalDocumentType(
    @Ctx() ctx: GQLContext,
    @Arg("legalDocumentType") legalDocumentTypeInput: LegalDocumentTypeInput
  ): Promise<LegalDocumentType> {
    const user = ctx.req.currentUser;
    const project = await LegalDocumentProject.findOneOrFail({
      where: {
        id: legalDocumentTypeInput.legalDocumentProjectId,
        organizationId: user.organizationId,
      },
      relations: ["members"],
    });
    verifyUserPermissions(user, project);
    const exist = await LegalDocumentType.findOne({
      where: legalDocumentTypeInput,
    });
    if (exist) {
      throw new CommonError(`Name is exist`);
    }
    const model = await LegalDocumentType.create({
      ...legalDocumentTypeInput,
      organizationId: user.organizationId,
    }).save();
    return model;
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => LegalDocumentType)
  async updateLegalDocumentType(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("legalDocumentType") legalDocumentTypeInput: LegalDocumentTypeInput
  ): Promise<LegalDocumentType> {
    const user = ctx.req.currentUser;
    const project = await LegalDocumentProject.findOneOrFail({
      where: {
        id: legalDocumentTypeInput.legalDocumentProjectId,
        organizationId: user.organizationId,
      },
      relations: ["members"],
    });
    verifyUserPermissions(user, project);
    const exist = await LegalDocumentType.findOne({
      where: {
        ...LegalDocumentTypeInput,
        id: Not(id),
      },
    });
    if (exist) {
      throw new CommonError(`Name is exist`);
    }
    await LegalDocumentType.update(id, legalDocumentTypeInput);
    return await LegalDocumentType.findOneOrFail(id);
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteLegalDocumentType(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    const model = await LegalDocumentType.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
      relations: ["legalDocumentProject", "legalDocumentProject.members"],
    });
    verifyUserPermissions(user, model.legalDocumentProject);
    await model.remove();
    return true;
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [LegalDocumentType])
  async getLegalDocumentTypes(
    @Ctx() ctx: GQLContext,
    @Arg("legalDocumentProjectId", () => Int) legalDocumentProjectId: number
  ): Promise<LegalDocumentType[]> {
    const user = ctx.req.currentUser;
    const res = await LegalDocumentType.find({
      legalDocumentProjectId: legalDocumentProjectId,
      organizationId: user.organizationId,
    });
    return res;
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => LegalDocumentElement)
  async createLegalDocumentElement(
    @Ctx() ctx: GQLContext,
    @Arg("legalDocumentElement")
    legalDocumentElementInput: LegalDocumentElementInput
  ): Promise<LegalDocumentElement> {
    const user = ctx.req.currentUser;
    const project = await LegalDocumentProject.findOneOrFail({
      where: {
        id: legalDocumentElementInput.legalDocumentProjectId,
        organizationId: user.organizationId,
      },
      relations: ["members"],
    });
    verifyUserPermissions(user, project);
    // const lock = new AsyncLock();
    // const model = await lock.acquire<LegalDocumentElement>(
    //   `LegalDocumentProject_${project.id}`,
    //   async (done) => {
    //     const model = await LegalDocumentElement.create({
    //       ...legalDocumentElementInput,
    //       organizationId: user.organizationId,
    //     }).save();
    //     model.orderId = model.id;
    //     await model.save();
    //     return done(null, model);
    //   }
    // );
    const model = await LegalDocumentElement.create({
      ...legalDocumentElementInput,
      name: legalDocumentElementInput.name.replace(/\s+/g, ""),
      organizationId: user.organizationId,
    }).save();
    model.orderId = model.id;
    await model.save();
    return model;
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => LegalDocumentElement)
  async updateLegalDocumentElement(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("legalDocumentElement")
    legalDocumentElementInput: LegalDocumentElementUpdateInput
  ): Promise<LegalDocumentElement> {
    const user = ctx.req.currentUser;
    const model = await LegalDocumentElement.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
      relations: ["legalDocumentProject", "legalDocumentProject.members"],
    });
    verifyUserPermissions(user, model.legalDocumentProject);
    if (legalDocumentElementInput.name !== null) {
      legalDocumentElementInput.name = legalDocumentElementInput.name.replace(
        /\s+/g,
        ""
      );
    }
    await LegalDocumentElement.update(id, legalDocumentElementInput);
    return await LegalDocumentElement.findOneOrFail(id);
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteLegalDocumentElement(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    const model = await LegalDocumentElement.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
      relations: ["legalDocumentProject", "legalDocumentProject.members"],
    });
    verifyUserPermissions(user, model.legalDocumentProject);
    await model.remove();
    return true;
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async swapLegalDocumentElementOrder(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("targetId", () => Int) targetId: number
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    const model = await LegalDocumentElement.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
      relations: ["legalDocumentProject", "legalDocumentProject.members"],
    });
    const targetModel = await LegalDocumentElement.findOneOrFail({
      where: {
        id: targetId,
        organizationId: user.organizationId,
      },
      relations: ["legalDocumentProject", "legalDocumentProject.members"],
    });
    if (model.legalDocumentProjectId !== targetModel.legalDocumentProjectId) {
      throw new CommonError("Error target project.");
    }
    verifyUserPermissions(user, model.legalDocumentProject);
    const swapOrderId = model.orderId;
    model.orderId = targetModel.orderId;
    targetModel.orderId = swapOrderId;
    await model.save();
    await targetModel.save();
    return true;
  }

  // @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  // @Mutation(() => Boolean)
  // async updateLegalDocumentElementOrderTest(
  //   @Ctx() ctx: GQLContext
  // ): Promise<Boolean> {
  //   const user = ctx.req.currentUser;
  //   const models = await LegalDocumentElement.find({
  //     where: {
  //       organizationId: user.organizationId,
  //     },
  //   });
  //   for (const model of models) {
  //     model.orderId = model.id;
  //     await model.save();
  //   }
  //   return true;
  // }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [LegalDocumentElement])
  async getLegalDocumentElements(
    @Ctx() ctx: GQLContext,
    @Arg("legalDocumentProjectId", () => Int) legalDocumentProjectId: number
  ): Promise<LegalDocumentElement[]> {
    const user = ctx.req.currentUser;
    // const res = await LegalDocumentElement.find({
    //   where: {
    //     organizationId: user.organizationId,
    //     legalDocumentProjectId: legalDocumentProjectId,
    //     parentLegalDocumentElementId: IsNull(),
    //   },
    //   relations: ["subclassLegalDocumentElements"],
    //   order: { orderId: "ASC" },
    // });
    const repository = getRepository(LegalDocumentElement);
    const res = await repository
      .createQueryBuilder("legalDocumentElement")
      .leftJoinAndSelect(
        "legalDocumentElement.subclassLegalDocumentElements",
        "subclassLegalDocumentElements"
      )
      .where(
        "legalDocumentElement.organizationId = :organizationId and legalDocumentElement.legalDocumentProjectId = :legalDocumentProjectId and legalDocumentElement.parentLegalDocumentElementId is NULL",
        {
          organizationId: user.organizationId,
          legalDocumentProjectId: legalDocumentProjectId,
        }
      )
      .orderBy("legalDocumentElement.orderId", "ASC")
      .addOrderBy("subclassLegalDocumentElements.orderId", "ASC")
      .getMany();
    return res;
    // return res;
  }
  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => LegalDocumentProject)
  async copyLegalDocumentProject(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("projectName", () => String) projectName: string
  ): Promise<LegalDocumentProject> {
    const user = ctx.req.currentUser;
    const existProject = await LegalDocumentProject.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
      // relations: ["legalDocumentTemplates"],
    });
    const existName = await LegalDocumentProject.findOne({
      where: {
        name: projectName,
        organizationId: user.organizationId,
      },
    });
    if (existName) {
      throw new CommonError(`Name is exist`);
    }
    const project = await LegalDocumentProject.create({
      ...existProject,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      organizationId: user.organizationId,
      name: projectName,
      creatorId: user.id,
      copyLegalDocumentProjectId: existProject.id,
      // desc: existProject.desc,
      // character_desc: existProject.character_desc,
      // chatAiName: existProject.chatAiName,
      // chatAiGreeting: existProject.chatAiGreeting,
      // chatAiAvatarUrl: existProject.chatAiAvatarUrl,
      // model: existProject.model,
      // temperature: existProject.temperature,
      // top_p: existProject.top_p,
      // max_tokens: existProject.max_tokens,
      // kbId: existProject.kbId,
      // charDescLaw: existProject.charDescLaw,
      // charDescQos: existProject.charDescQos,
      // charDescCki: existProject.charDescCki,
      // promptKbx: existProject.promptKbx,
      // promptQos: existProject.promptQos,
      // promptCki: existProject.promptCki,
      // promptAsk: existProject.promptAsk,
      // chatAiPeroration: existProject.chatAiPeroration,
      // rechargeReminder: existProject.rechargeReminder,
      // prompt_doc: existProject.prompt_doc,
      // reference_doc: existProject.reference_doc,
      // charDescAsk: existProject.charDescAsk,
      // chardesc_doc: existProject.chardesc_doc,
      // copyLegalDocumentProjectId: existProject.id,
      // qrCodeUrl: existProject.qrCodeUrl,
      // isConsult: existProject.isConsult,
      // trialConsultQuota: existProject.trialConsultQuota,
      // turnsCki: existProject.turnsCki,
      // turnsAsk: existProject.turnsAsk,
      // llmCfgKbx: existProject.llmCfgKbx,
      // llmCfgQos: existProject.llmCfgQos,
      // llmCfgCki: existProject.llmCfgCki,
      // llmCfgAsk: existProject.llmCfgAsk,
      // llmCfgDoc: existProject.llmCfgDoc,
      // nextCkiLabel: existProject.nextCkiLabel,
    }).save();
    const legalDocumentTemplates = await LegalDocumentTemplate.find({
      where: { legalDocumentProjectId: existProject.id },
    });
    for (const legalDocument of legalDocumentTemplates) {
      await LegalDocumentTemplate.create({
        ...legalDocument,
        organizationId: user.organizationId,
        legalDocumentProjectId: project.id,
        userId: user.id,
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        legalDocumentTypeId: undefined,
        // fileName: legalDocument.fileName,
        // fileUrl: legalDocument.fileUrl,
        // size: legalDocument.size,
        // indexStatus: legalDocument.indexStatus,
        // userId: legalDocument.userId,
        // error: legalDocument.error,
        // legalDocumentTypeId: legalDocument.legalDocumentTypeId,
      }).save();
    }
    const parentElements = await LegalDocumentElement.find({
      legalDocumentProjectId: existProject.id,
      parentLegalDocumentElementId: IsNull(),
      organizationId: user.organizationId,
    });
    for (const tempElement of parentElements) {
      const parentElement = await LegalDocumentElement.create({
        ...tempElement,
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        organizationId: user.organizationId,
        legalDocumentProjectId: project.id,
        // name: tempElement.name,
        // desc: tempElement.desc,
        // spec: tempElement.spec,
        // sample: tempElement.sample,
        // question: tempElement.question,
        // questionMore: tempElement.questionMore,
        // dependencyFactor: tempElement.dependencyFactor,
        // dependencyValue: tempElement.dependencyValue,
        // flag: tempElement.flag,
        // prompt: tempElement.prompt,
        // dependencyCondOp: tempElement.dependencyCondOp,
      }).save();
      // parentElement.orderId = parentElement.id;
      // await parentElement.save();
      const subclassElements = await LegalDocumentElement.find({
        legalDocumentProjectId: existProject.id,
        parentLegalDocumentElementId: tempElement.id,
        organizationId: user.organizationId,
      });
      for (const tempSubclassElement of subclassElements) {
        await LegalDocumentElement.create({
          ...tempSubclassElement,
          organizationId: user.organizationId,
          legalDocumentProjectId: project.id,
          parentLegalDocumentElementId: parentElement.id,
          id: undefined,
          createdAt: undefined,
          updatedAt: undefined,
          // name: tempSubclassElement.name,
          // desc: tempSubclassElement.desc,
          // spec: tempSubclassElement.spec,
          // sample: tempSubclassElement.sample,
          // question: tempSubclassElement.question,
          // questionMore: tempSubclassElement.questionMore,
          // dependencyFactor: tempSubclassElement.dependencyFactor,
          // dependencyValue: tempSubclassElement.dependencyValue,
          // flag: tempSubclassElement.flag,
          // prompt: tempSubclassElement.prompt,
          // dependencyCondOp: tempSubclassElement.dependencyCondOp,
        }).save();
        // subElement.orderId = subElement.id;
        // await subElement.save();
      }
    }
    return project;
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => LegalDocumentElement)
  async copyLegalDocumentElement(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("targetId", () => Int) targetId: number
  ): Promise<LegalDocumentElement> {
    const user = ctx.req.currentUser;
    const element = await LegalDocumentElement.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
      relations: [
        "parentLegalDocumentElement",
        "subclassLegalDocumentElements",
      ],
    });
    const targetElement = await LegalDocumentElement.findOneOrFail({
      where: {
        id: targetId,
        organizationId: user.organizationId,
      },
      relations: [
        "legalDocumentProject",
        "legalDocumentProject.members",
        "parentLegalDocumentElement",
        "subclassLegalDocumentElements",
      ],
    });
    verifyUserPermissions(user, targetElement.legalDocumentProject);
    const input = {
      name: element.name,
      desc: element.desc,
      spec: element.spec,
      sample: element.sample,
      question: element.question,
      questionMore: element.questionMore,
      dependencyFactor: element.dependencyFactor,
      dependencyValue: element.dependencyValue,
      flag: element.flag,
      // prompt: element.prompt,
      promptAsk: element.promptAsk,
      promptRef: element.promptRef,
      promptFig: element.promptFig,
      enableAsk: element.enableAsk,
    };

    if (
      element.parentLegalDocumentElementId &&
      targetElement.parentLegalDocumentElementId
    ) {
      await LegalDocumentElement.update(targetElement.id, input);
    } else if (
      !element.parentLegalDocumentElementId &&
      !targetElement.parentLegalDocumentElementId
    ) {
      await LegalDocumentElement.update(targetElement.id, input);
      await LegalDocumentElement.delete({
        parentLegalDocumentElementId: targetElement.id,
      });
      for (const tempSubclassElement of element.subclassLegalDocumentElements) {
        const element = await LegalDocumentElement.create({
          ...tempSubclassElement,
          id: undefined,
          createdAt: undefined,
          updatedAt: undefined,
          parentLegalDocumentElementId: targetElement.id,
          organizationId: targetElement.organizationId,
          legalDocumentProjectId: targetElement.legalDocumentProjectId,

          // name: tempSubclassElement.name,
          // desc: tempSubclassElement.desc,
          // spec: tempSubclassElement.spec,
          // sample: tempSubclassElement.sample,
          // question: tempSubclassElement.question,
          // questionMore: tempSubclassElement.questionMore,
          // dependencyFactor: tempSubclassElement.dependencyFactor,
          // dependencyValue: tempSubclassElement.dependencyValue,
          // flag: tempSubclassElement.flag,
          // prompt: tempSubclassElement.prompt,
          // dependencyCondOp: tempSubclassElement.dependencyCondOp,
        }).save();
        element.orderId = element.id;
        await element.save();
      }
    } else {
      throw new CommonError("Error different element levels.");
    }
    return await LegalDocumentElement.findOneOrFail(targetElement.id);
  }
}

export default LegalDocumentResolver;
