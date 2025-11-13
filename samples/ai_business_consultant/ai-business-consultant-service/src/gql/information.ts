import {
  Resolver,
  Mutation,
  Arg,
  UseMiddleware,
  Int,
  Query,
  Ctx,
} from "type-graphql";

import { Information } from "@/models";
import { InformationInput } from "@/gql/types";
import { ErrorInterceptor, ResolveTime } from "@/middlewares";
import { IsAdminAuth, IsAdminAndOperatorAuth } from "@/middlewares/isAuth";
import { GQLContext } from "../types/context";
import { CommonError } from "@/errors";
import { Not } from "typeorm";

@Resolver()
class InformationResolver {
  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Information)
  async createInformation(
    @Ctx() ctx: GQLContext,
    @Arg("information") informationInput: InformationInput
  ): Promise<Information> {
    const orgId = ctx.req.currentUser.organizationId;
    const exist = await Information.findOne({
      where: {
        name: informationInput.name,
      },
    });
    if (exist) {
      throw new CommonError("name is exist");
    }
    const model = await Information.create({
      ...informationInput,
      organizationId: orgId,
    }).save();
    return model;
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Information)
  async updateInformation(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("information") informationInput: InformationInput
  ): Promise<Information> {
    const orgId = ctx.req.currentUser.organizationId;
    const exist = await Information.findOne({
      where: {
        id: Not(id),
        name: informationInput.name,
      },
    });
    if (exist) {
      throw new CommonError("name is exist");
    }
    await Information.update(
      {
        id: id,
        organizationId: orgId,
      },
      informationInput
    );
    return await Information.findOneOrFail(id);
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteInformation(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await Information.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    await model.remove();
    return true;
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [Information])
  async getOrgInformations(@Ctx() ctx: GQLContext): Promise<Information[]> {
    const orgId = ctx.req.currentUser.organizationId;
    const res = await Information.find({
      organizationId: orgId,
    });
    return res;
  }
}

export default InformationResolver;
