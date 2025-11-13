import {
  Resolver,
  UseMiddleware,
  Mutation,
  Query,
  Arg,
  Int,
  Ctx,
} from "type-graphql";
import { ErrorInterceptor, ResolveTime } from "@/middlewares";
import { Sfbot, SfbotCharacter } from "@/models";
import { IsAdminAuth, IsAuth } from "@/middlewares/isAuth";
import {
  SfbotUpdateInput,
  SfbotCreateInput,
  SfbotResult,
  SfbotCharacterUpdateInput,
  SfbotCharacterInput,
} from "./types";
import redis from "ioredis";
import { GQLContext } from "@/types/context";
import { CommonError } from "@/errors";

@Resolver()
class SfbotResolver {
  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Sfbot)
  async createSfbot(
    @Ctx() ctx: GQLContext,
    @Arg("sfbot")
    sfbotCreateInput: SfbotCreateInput
  ): Promise<Sfbot> {
    const admin = ctx.req.currentUser;

    const uuid = require("uuid");
    const uuidStr = uuid.v1();
    const sfbot = await Sfbot.create({
      ...sfbotCreateInput,
      uuid: uuidStr,
      organizationId: admin.organizationId,
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
    return sfbot;
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Sfbot)
  async updateSfbot(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("sfbot") sfbotInput: SfbotUpdateInput
  ): Promise<Sfbot> {
    const admin = ctx.req.currentUser;

    await Sfbot.findOneOrFail({
      id: id,
      organizationId: admin.organizationId,
    });
    await Sfbot.update(id, sfbotInput);
    const sfbot = await Sfbot.findOneOrFail(id);
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
    return sfbot;
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteSfbot(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    const sfbot = await Sfbot.findOneOrFail({
      id: id,
      organizationId: admin.organizationId,
    });
    const client = new redis(process.env.REDIS_URL);
    client.select(0);
    client.del(`sfbot:org:${sfbot.organizationId}:bot:${sfbot.id}`);
    await sfbot.remove();
    return true;
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [Sfbot])
  async getSfbots(@Ctx() ctx: GQLContext): Promise<Sfbot[]> {
    const admin = ctx.req.currentUser;
    const models = await Sfbot.find({
      where: {
        organizationId: admin.organizationId,
      },
    });
    return models;
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Query(() => SfbotResult)
  async getSfbotsAndCount(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<SfbotResult> {
    const admin = ctx.req.currentUser;
    const [models, count] = await Sfbot.findAndCount({
      where: {
        organizationId: admin.organizationId,
      },
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 300,
    });
    const res = new SfbotResult();
    res.data = models;
    res.totalCount = count;
    return res;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => Sfbot)
  async getOrgSfbotFromUuid(
    @Arg("uuid", () => String) uuid: string
  ): Promise<Sfbot> {
    const model = await Sfbot.findOneOrFail({
      where: {
        uuid: uuid,
      },
      relations: ["organization"],
    });
    return model;
  }

  //SfbotCharacter
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createSfbotCharacter(
    @Ctx() ctx: GQLContext,
    @Arg("sfbotCharacter") sfbotCharacterInput: SfbotCharacterInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    if (sfbotCharacterInput.state) {
      if (
        sfbotCharacterInput.state !== "private" &&
        sfbotCharacterInput.state !== "public"
      ) {
        throw new CommonError("Error state");
      }
    }
    await SfbotCharacter.create({
      ...sfbotCharacterInput,
      organizationId: orgId,
    }).save();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateSfbotCharacter(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("sfbotCharacter") sfbotCharacterInput: SfbotCharacterUpdateInput
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    // const model = await SfbotCharacter.findOneOrFail(id);
    if (sfbotCharacterInput.state) {
      if (
        sfbotCharacterInput.state !== "private" &&
        sfbotCharacterInput.state !== "public"
      ) {
        throw new CommonError("Error state");
      }
    }
    await SfbotCharacter.update(
      { id: id, organizationId: user.organizationId },
      sfbotCharacterInput
    );
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteSfbotCharacter(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    const model = await SfbotCharacter.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
    });
    await model.remove();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [SfbotCharacter])
  async getSfbotCharacters(@Ctx() ctx: GQLContext): Promise<SfbotCharacter[]> {
    const user = ctx.req.currentUser;
    const res = await SfbotCharacter.find({
      where: {
        organizationId: user.organizationId,
      },
    });
    return res;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => [SfbotCharacter])
  async getSfbotCharactersBySfbotId(
    @Arg("sfbotId", () => Int) sfbotId: number
  ): Promise<SfbotCharacter[]> {
    const sfbot = await Sfbot.findOneOrFail(sfbotId);
    const defautlChatai = await SfbotCharacter.findOne({
      title: "ChatAI default",
      sfbotId: sfbotId,
    });
    if (!defautlChatai) {
      await SfbotCharacter.create({
        title: "ChatAI default",
        organizationId: sfbot.organizationId,
        sfbotId: sfbot.id,
        icon: "https://file.sflow.pro/c/c/958ce6a6a441d6b45d757b91ee87ee.png",
      }).save();
    }
    const res = await SfbotCharacter.find({
      where: {
        sfbotId: sfbotId,
      },
    });

    return res;
  }
}

export default SfbotResolver;
