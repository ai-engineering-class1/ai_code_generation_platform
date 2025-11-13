import {
  Resolver,
  Mutation,
  Arg,
  UseMiddleware,
  Int,
  Query,
  Ctx,
} from "type-graphql";
import { ErrorInterceptor, ResolveTime } from "@/middlewares";
import { IsAuth } from "@/middlewares/isAuth";
import { CustomError } from "@/errors";
import { DepartmentInput, DepartmentInputUpdate } from "@/gql/types";
import { Department, Organization, User } from "@/models";
//   import { deleteEntity } from "@/utils/typeorm";
import { GQLContext } from "@/types/context";
import { In } from "typeorm";
@Resolver()
class DepartmentResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Department)
  async createDepartment(
    @Ctx() ctx: GQLContext,
    @Arg("department") input: DepartmentInput,
    @Arg("organizationId", () => Int) orgId: number
  ): Promise<Department> {
    if (
      ctx.req.currentUser.role != 1 ||
      ctx.req.currentUser.organizationId != orgId
    ) {
      throw new CustomError(
        "No permission to create department in this organization!"
      );
    }
    await Organization.findOneOrFail(orgId);
    const leader = await User.findOne({
      where: {
        id: input.leaderUserId,
        organizationId: orgId,
      },
    });
    if (!leader) throw new CustomError("not found leader in this organization");

    if (input.parentDepartmentId != 0) {
      const parentDepart = await Department.findOneOrFail(
        input.parentDepartmentId
      );
      if (parentDepart.organizationId != orgId)
        throw new CustomError(
          "The parent department is not in your organization!"
        );
    }
    //   const departmentUsers = await User.findByIds(input.departmentUsersId,{
    //     organizationId: orgId,
    //   });
    //   for (const user of departmentUsers) {
    //     if (user.organizationId != orgId)
    //       throw new CustomError(
    //         `The user (${user.id}) is not in your organization!`
    //       );
    //   }

    const model = await Department.create({
      name: input.name,
      description: input.description,
      leaderUserId: leader.id,
      // departmentUsers: departmentUsers,
      organizationId: orgId,
      parentDepartmentId: input.parentDepartmentId,
      userId: ctx.req.currentUser.id,
    }).save();
    await User.update(
      { id: In(input.departmentUsersId) },
      { departmentId: model.id }
    );
    return model;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Department)
  async updateDepartment(
    @Arg("id", () => Int) id: number,
    @Arg("department") input: DepartmentInputUpdate
  ): Promise<Department> {
    let leader: User | undefined = undefined;
    const department = await Department.findOneOrFail(id, {
      relations: ["leaderUser"],
    });
    if (input.leaderUserId)
      leader = await User.findOneOrFail(input.leaderUserId);
    const leaderOrgId =
      leader != undefined
        ? leader.organizationId
        : department.leaderUser.organizationId;
    if (input.parentDepartmentId && input.parentDepartmentId != 0) {
      const parentDepart = await Department.findOneOrFail(
        input.parentDepartmentId
      );
      if (parentDepart.organizationId != leaderOrgId)
        throw new CustomError(
          "The parent department is not in your organization!"
        );
      if (parentDepart.parentDepartmentId == department.id) {
        parentDepart.parentDepartmentId = department.parentDepartmentId;
        await parentDepart.save();
      }
    }
    if (input.departmentUsersId && input.departmentUsersId.length > 0) {
      await User.update(
        { departmentId: department.id },
        { departmentId: null }
      );
      await User.update(
        { id: In(input.departmentUsersId), organizationId: leaderOrgId },
        { departmentId: department.id }
      );
    }
    const { departmentUsersId, ...rest } = input;

    await Department.update(id, rest);
    // Object.assign(department, {
    //   ...input,
    //   departmentUsers,
    // });
    // await department.save();
    return await Department.findOneOrFail(department.id, {
      relations: ["leaderUser", "users"],
    });
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async delDepartment(
    @Arg("id", () => Int) id: number,
    @Ctx() ctx: GQLContext
  ): Promise<boolean> {
    const user = ctx.req.currentUser;
    const model = await Department.findOneOrFail({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });
    await Department.update(
      { parentDepartmentId: id },
      { parentDepartmentId: 0 }
    );

    await model.remove();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [Department])
  async getDepartmentByCurrentOrgId(
    @Ctx() ctx: GQLContext
  ): Promise<Department[]> {
    return await Department.find({
      where: {
        organizationId: ctx.req.currentUser.organizationId,
      },
      relations: ["leaderUser", "users"],
    });
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [Department])
  async getDepartmentByParentDepartmentId(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Department[]> {
    return await Department.find({
      where: {
        organizationId: ctx.req.currentUser.organizationId,
        parentDepartmentId: id,
      },
      relations: ["leaderUser", "users"],
    });
  }
}

export default DepartmentResolver;
