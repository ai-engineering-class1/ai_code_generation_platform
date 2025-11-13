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
import { MailInbox, MenuIndexContent, SfbotCharacter } from "@/models";
import {
  MenuIndexContentResult,
  MenuIndexContentInput,
  //   MenuIndexContentUpdateInput,
} from "./types";
import { CustomError } from "@/errors";
import { RedisManager } from "@/utils/staticClass";
// import { IsNull, Not } from "typeorm";
import { runTest } from "@/utils/ftsearch";

@Resolver()
class MenuIndexContentResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createMenuIndexContent(
    @Ctx() ctx: GQLContext,
    @Arg("menuIndexContent") menuIndexContentInput: MenuIndexContentInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    if (
      menuIndexContentInput.type !== "file" &&
      menuIndexContentInput.type !== "link" &&
      menuIndexContentInput.type !== "text" &&
      menuIndexContentInput.type !== "sitemap"
    ) {
      throw new CustomError("Error type");
    }
    if (menuIndexContentInput.permissionFlag !== null) {
      if (
        menuIndexContentInput.permissionFlag < 0 ||
        menuIndexContentInput.permissionFlag > 2
      ) {
        throw new CustomError("Error permission");
      }
    }

    let sfbotCharacter = null;
    if (
      menuIndexContentInput.sfbotCharacterId &&
      menuIndexContentInput.sfbotCharacterId !== 0
    ) {
      menuIndexContentInput.sfbots = [];
      sfbotCharacter = await SfbotCharacter.findOneOrFail({
        id: menuIndexContentInput.sfbotCharacterId,
        organizationId: orgId,
      });
    }

    const model = await MenuIndexContent.create({
      ...menuIndexContentInput,
      organizationId: orgId,
    }).save();
    const redis = RedisManager.getInstance();
    // 0: external
    // 1: internal.all
    // 2: internal.restricted  (这个还得配置 userid/groupid)
    let sfbots = "";
    const resArr: any = [];
    if (
      menuIndexContentInput.sfbots &&
      menuIndexContentInput.sfbots.length > 0
    ) {
      menuIndexContentInput.sfbots.forEach((model) => {
        resArr.push(model.id);
      });
      sfbots = resArr.join(",");
    }
    const jsonInput = {
      action: "save",
      id: model.id,
      category: model.type,
      url: model.content,
      text: model.content,
      orgid: orgId,
      public: model.permissionFlag,
      filename: model.fileName,
      chatbots: sfbotCharacter
        ? `${sfbotCharacter.sfbotId},c${sfbotCharacter.id}`
        : sfbots,
    };
    redis.select(2);
    redis.lpush(`queue:file:indexing`, JSON.stringify(jsonInput));
    // const res = await MenuIndexContent.findOneOrFail(model.id, {
    //   relations: ["sfbots", "sfbotCharacter"],
    // });

    // if (process.env.HOST_NAME === "sflow.io") {
    //   await createElasticsearch("menu_index_content", `${model.id}`, {
    //     category: model.type,
    //     url: model.content,
    //     text: model.content,
    //     orgid: orgId,
    //     public: model.permissionFlag,
    //     filename: model.fileName,
    //     sfbots: resArr,
    //     sfbotCharacterId: sfbotCharacter ? sfbotCharacter.id : null,
    //   });
    // }
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateMenuIndexContent(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("menuIndexContent") menuIndexContentInput: MenuIndexContentInput
  ): Promise<Boolean> {
    if (
      menuIndexContentInput.type !== "file" &&
      menuIndexContentInput.type !== "link" &&
      menuIndexContentInput.type !== "text" &&
      menuIndexContentInput.type !== "sitemap"
    ) {
      throw new CustomError("Error type");
    }
    if (menuIndexContentInput.permissionFlag !== null) {
      if (
        menuIndexContentInput.permissionFlag < 0 ||
        menuIndexContentInput.permissionFlag > 2
      ) {
        throw new CustomError("Error permission");
      }
    }

    const model = await MenuIndexContent.findOneOrFail(id);
    // authorizationOrg(ctx.req.currentUser, model.organizationId);
    console.log(menuIndexContentInput.sfbots);
    const orgId = ctx.req.currentUser.organizationId;
    Object.assign(model, menuIndexContentInput);
    await model.save();
    // await MenuIndexContent.update(id, menuIndexContentInput);
    // await updateEntity(MenuIndexContent, id, menuIndexContentInput);
    // await MenuIndexContent.update(id, menuIndexContentInput);
    const res = await MenuIndexContent.findOneOrFail(id, {
      relations: ["sfbots", "sfbotCharacter"],
    });

    let sfbotCharacter = null;
    if (
      menuIndexContentInput.sfbotCharacterId &&
      menuIndexContentInput.sfbotCharacterId !== 0
    ) {
      menuIndexContentInput.sfbots = [];
      sfbotCharacter = await SfbotCharacter.findOneOrFail({
        id: menuIndexContentInput.sfbotCharacterId,
        organizationId: orgId,
      });
    }

    let sfbots = "";
    const resArr: any = [];
    if (
      menuIndexContentInput.sfbots &&
      menuIndexContentInput.sfbots.length > 0
    ) {
      menuIndexContentInput.sfbots.forEach((model) => {
        resArr.push(model.id);
      });
      sfbots = resArr.join(",");
    }
    const redis = RedisManager.getInstance();
    const jsonInput = {
      action: "save",
      id: res.id,
      category: res.type,
      url: res.content,
      text: res.content,
      orgid: orgId,
      public: res.permissionFlag,
      filename: res.fileName,
      chatbots: sfbotCharacter
        ? `${sfbotCharacter.sfbotId},c${sfbotCharacter.id}`
        : sfbots,
    };
    redis.select(2);
    redis.lpush(`queue:file:indexing`, JSON.stringify(jsonInput));
    // if (process.env.HOST_NAME === "sflow.io") {
    //   await updateElasticsearchById("menu_index_content", `${model.id}`, {
    //     category: model.type,
    //     url: model.content,
    //     text: model.content,
    //     orgid: orgId,
    //     public: model.permissionFlag,
    //     filename: model.fileName,
    //     sfbots: resArr,
    //     sfbotCharacterId: sfbotCharacter ? sfbotCharacter.id : null,
    //   });
    // }
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteMenuIndexContent(
    @Arg("id", () => Int) id: number,
    @Ctx() ctx: GQLContext
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const parentModel = await MenuIndexContent.findOneOrFail({
      where: {
        organizationId: orgId,
        id: id,
      },
    });
    // authorizationOrg(ctx.req.currentUser, parentModel.organizationId);
    if (parentModel.type === "folder" || parentModel.type === "email") {
      const res = await MenuIndexContent.find({
        parentId: parentModel.id,
      });
      await MenuIndexContent.delete(id);
      for (const tempModel of res) {
        if (tempModel.markId !== 0) {
          const mailInbox = await MailInbox.findOne(tempModel.markId);
          if (mailInbox) {
            mailInbox.indexStatus = "No indexed";
            await mailInbox.save();
          }
        }
        await MenuIndexContent.delete(tempModel.id);
        const redis = RedisManager.getInstance();
        const jsonInput = {
          action: "delete",
          id: tempModel.id,
          category: tempModel.type,
          orgid: tempModel.organizationId,
        };
        redis.select(2);
        redis.lpush(`queue:file:indexing`, JSON.stringify(jsonInput));

        // if (process.env.HOST_NAME === "sflow.io") {
        //   await deleteElasticsearchById(
        //     "menu_index_content",
        //     `${tempModel.id}`
        //   );
        // }
      }
    } else {
      await MenuIndexContent.delete(id);
      const redis = RedisManager.getInstance();
      const jsonInput = {
        action: "delete",
        id: parentModel.id,
        category: parentModel.type,
        orgid: parentModel.organizationId,
      };
      redis.select(2);
      redis.lpush(`queue:file:indexing`, JSON.stringify(jsonInput));

      //   if (process.env.HOST_NAME === "sflow.io") {
      //     await deleteElasticsearchById(
      //       "menu_index_content",
      //       `${parentModel.id}`
      //     );
      //   }
    }
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => MenuIndexContentResult)
  async getOrgMenuIndexContents(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<MenuIndexContentResult> {
    const user = ctx.req.currentUser;
    const [result, count] = await MenuIndexContent.findAndCount({
      where: {
        // sfbotCharacterId: IsNull(),
        organizationId: user.organizationId,
        source: "org",
        // parentId: 0,
        // indexedSource: Not("user"),
      },
      relations: ["menuIndexContentSitemapHit", "sfbots"],
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 100,
      order: {
        id: "DESC",
      },
    });
    const res = new MenuIndexContentResult();
    res.result = result;
    res.total = count;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => MenuIndexContent)
  async getMenuIndexContentDetail(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<MenuIndexContent> {
    const orgId = ctx.req.currentUser.organizationId;
    const data = await MenuIndexContent.findOneOrFail({
      where: {
        organizationId: orgId,
        id: id,
      },
    });
    return data;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async noticeMenuIndexContent(
    @Arg("id", () => Int) id: number,
    @Arg("indexStatus", () => String, { nullable: true }) indexStatus: string,
    @Arg("error", () => String, { nullable: true }) error: string
  ): Promise<Boolean> {
    const model = await MenuIndexContent.findOneOrFail(id);
    model.indexStatus = indexStatus ? indexStatus : "indexed";
    model.error = error ? error : "";
    await model.save();
    // menuIndexContentNotification(model);

    return true;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async knowledgebaseFtSearch(
    @Arg("query", () => String) query: string,
    @Arg("orgId", () => Int, { nullable: true }) orgId: number
  ): Promise<String> {
    let res;
    if (orgId) {
      res = await runTest(query, orgId, "kb");
    } else {
      res = await runTest(query, null, "kb");
    }
    return JSON.stringify(res);
  }
}

export default MenuIndexContentResolver;
