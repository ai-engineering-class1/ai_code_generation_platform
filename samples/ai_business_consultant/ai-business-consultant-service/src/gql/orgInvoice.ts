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
  import { OrgInvoice } from "@/models";
  import { OrgInvoiceUpdateInput,OrgInvoiceInput } from "./types";
  
  @Resolver()
  class OrgInvoiceResolver {
    @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
    @Mutation(() => Boolean)
    async createOrgInvoice(
      @Ctx() ctx: GQLContext,
      @Arg("data") dataInput: OrgInvoiceInput
    ): Promise<Boolean> {
      const orgId = ctx.req.currentUser.organizationId;
      await OrgInvoice.create({
        ...dataInput,
        organizationId: orgId,
      }).save();
      return true;
    }
  
    @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
    @Mutation(() => Boolean)
    async updateOrgInvoice(
      @Ctx() ctx: GQLContext,
      @Arg("id", () => Int) id: number,
      @Arg("data") dataInput: OrgInvoiceUpdateInput
    ): Promise<Boolean> {
      const orgId = ctx.req.currentUser.organizationId;
      await OrgInvoice.update({ id: id, organizationId: orgId }, dataInput);
      return true;
    }
  
    @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
    @Mutation(() => Boolean)
    async deleteOrgInvoice(
      @Ctx() ctx: GQLContext,
      @Arg("id", () => Int) id: number
    ): Promise<Boolean> {
      const orgId = ctx.req.currentUser.organizationId;
      const model = await OrgInvoice.findOneOrFail({
        where: {
          id: id,
          organizationId: orgId,
        },
      });
      await model.remove();
      return true;
    }
  
    @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
    @Query(() => [OrgInvoice])
    async getOrgInvoices(
      @Ctx() ctx: GQLContext,
      @Arg("skip", () => Int, { nullable: true })
      skip: number,
      @Arg("take", () => Int, { nullable: true })
      take: number
    ): Promise<OrgInvoice[]> {
      const orgId = ctx.req.currentUser.organizationId;
      const data = await OrgInvoice.find({
        where: {
          organizationId: orgId,
        },
        skip: Number.isFinite(skip) ? skip : 0,
        take: Number.isFinite(take) ? take : 30,
      });
      return data;
    }
  }
  
  export default OrgInvoiceResolver;
  