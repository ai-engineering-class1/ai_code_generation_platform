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
import { EstablishCommunication } from "@/models";
import {
  EstablishCommunicationUpdateInput,
  EstablishCommunicationInput,
  EstablishCommunicationResult,
} from "./types";
import { In, Like } from "typeorm";

@Resolver()
class EstablishCommunicationResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createEstablishCommunication(
    @Ctx() ctx: GQLContext,
    @Arg("data") dataInput: EstablishCommunicationInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    await EstablishCommunication.create({
      ...dataInput,
      organizationId: orgId,
    }).save();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateEstablishCommunication(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("data") dataInput: EstablishCommunicationUpdateInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    await EstablishCommunication.update(
      { id: id, organizationId: orgId },
      dataInput
    );
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteEstablishCommunication(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await EstablishCommunication.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    await model.remove();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => EstablishCommunicationResult)
  async getEstablishCommunications(
    @Ctx() ctx: GQLContext,
    @Arg("status", () => [String], { nullable: true })
    status: string[],
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number,
    @Arg("name", () => String, { nullable: true })
    name: string
  ): Promise<EstablishCommunicationResult> {
    const orgId = ctx.req.currentUser.organizationId;
    let input: any = {
      organizationId: orgId,
    };
    if (status && status.length > 0) {
      input.status = In(status);
    }
    if (name && name !== "") {
      input.name = Like(`%${name}%`);
    }
    const [data, count] = await EstablishCommunication.findAndCount({
      where: input,
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 30,
    });
    const res = new EstablishCommunicationResult();
    res.result = data;
    res.total = count;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => EstablishCommunication)
  async getEstablishCommunicationDetail(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<EstablishCommunication> {
    const orgId = ctx.req.currentUser.organizationId;
    const data = await EstablishCommunication.findOneOrFail({
      where: {
        organizationId: orgId,
        id: id,
      },
    });
    return data;
  }
}

export default EstablishCommunicationResolver;
