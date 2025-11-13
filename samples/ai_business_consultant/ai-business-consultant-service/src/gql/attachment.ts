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
import { Attachment } from "@/models";
import { AttachmentResult, AttachmentInput } from "./types";
//   import { In, Like } from "typeorm";

@Resolver()
class AttachmentResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createAttachment(
    @Ctx() ctx: GQLContext,
    @Arg("data") dataInput: AttachmentInput
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    await Attachment.create({
      ...dataInput,
      organizationId: user.organizationId,
      userId: user.id,
    }).save();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateAttachment(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("data") dataInput: AttachmentInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    await Attachment.update({ id: id, organizationId: orgId }, dataInput);
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteAttachment(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await Attachment.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    await model.remove();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => AttachmentResult)
  async getAttachments(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<AttachmentResult> {
    const user = ctx.req.currentUser;
    let input: any = {
      organizationId: user.organizationId,
      userId: user.id,
    };
    const [data, count] = await Attachment.findAndCount({
      where: input,
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 30,
      order: { id: "DESC" },
    });
    const res = new AttachmentResult();
    res.result = data;
    res.total = count;
    return res;
  }

}

export default AttachmentResolver;
