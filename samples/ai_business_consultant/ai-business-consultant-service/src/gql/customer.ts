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
import { Customer } from "@/models";
import { CustomerInput, CustomerResult } from "./types";

@Resolver()
class CustomerResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createCustomer(
    @Ctx() ctx: GQLContext,
    @Arg("customer") customerInput: CustomerInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    await Customer.create({
      ...customerInput,
      organizationId: orgId,
    }).save();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateCustomer(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("customer") customerInput: CustomerInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    await Customer.update({ id: id, organizationId: orgId }, customerInput);
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteCustomer(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await Customer.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    await model.remove();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => CustomerResult)
  async getCustomers(
    @Ctx() ctx: GQLContext,
    @Arg("risk", () => Int, { nullable: true })
    risk: number,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<CustomerResult> {
    const orgId = ctx.req.currentUser.organizationId;
    let input: any = {
      organizationId: orgId,
    };
    if (Number.isFinite(risk)) {
      input.risk = risk;
    }
    const [data, count] = await Customer.findAndCount({
      where: input,
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 30,
    });
    const res = new CustomerResult();
    res.result = data;
    res.total = count;
    return res;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => Customer)
  async getCustomerInfo(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Customer> {
    const orgId = ctx.req.currentUser.organizationId;

    const model = await Customer.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    
    return model;
  }
}

export default CustomerResolver;
