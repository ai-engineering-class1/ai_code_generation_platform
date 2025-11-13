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
import { ProductPrice } from "@/models";
import { ProductPriceResult, ProductPriceInput } from "./types";
//   import { In, Like } from "typeorm";

@Resolver()
class ProductPriceResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async createProductPrice(
    @Ctx() ctx: GQLContext,
    @Arg("data") dataInput: ProductPriceInput
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    await ProductPrice.create({
      ...dataInput,
      organizationId: user.organizationId,
      userId: user.id,
    }).save();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateProductPrice(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("data") dataInput: ProductPriceInput
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    await ProductPrice.update({ id: id, organizationId: orgId }, dataInput);
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteProductPrice(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const orgId = ctx.req.currentUser.organizationId;
    const model = await ProductPrice.findOneOrFail({
      where: {
        id: id,
        organizationId: orgId,
      },
    });
    await model.remove();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => ProductPriceResult)
  async getProductPrices(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<ProductPriceResult> {
    const orgId = ctx.req.currentUser.organizationId;
    let input: any = {
      organizationId: orgId,
      userId: ctx.req.currentUser.id,
    };
    const [data, count] = await ProductPrice.findAndCount({
      where: input,
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 30,
    });
    const res = new ProductPriceResult();
    res.result = data;
    res.total = count;
    return res;
  }

}

export default ProductPriceResolver;
