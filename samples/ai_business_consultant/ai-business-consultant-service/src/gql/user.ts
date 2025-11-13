import {
  Resolver,
  Query,
  UseMiddleware,
  Ctx,
  Mutation,
  Arg,
  Int,
} from "type-graphql";
import { IsAuth, IsAdminAuth } from "@/middlewares/isAuth";
import { GQLContext } from "@/types/context";
import { Distributor, User } from "@/models";
import { ErrorInterceptor, ResolveTime } from "@/middlewares";
import {
  UserCreateInput,
  UserLoginInput,
  UserUpdateInput,
  UserResult,
  AdminUserUpdateInput,
  UserCreateAsDistributorInput,
  UserOtherInfoUpdateInput,
} from "./types";
// import { createEntity } from "../utils/typeorm";
import { CommonError } from "@/errors";
import { comparePassword, signToken, hash } from "@/utils/authToken";
import { isNonEmptyString } from "@/utils/validations";
import { Not, IsNull } from "typeorm";
import { getAccessToken } from "@/utils/common";
import axios from "axios";
import redis from "ioredis";

//1:管理员，2:律师，3:操作员，4:财务，5:分销商
function getRoleName(user: User) {
  if (user.role === 1) {
    return "管理员";
  } else if (user.role === 2) {
    return "律师";
  } else if (user.role === 3) {
    return "操作员";
  } else if (user.role === 4) {
    return "财务";
  } else if (user.role === 5) {
    return "分销商";
  } else if (user.role === 6) {
    return "分销商管理员";
  } else if (user.role === 7) {
    return "小程序管理员";
  }
  return "";
}

@Resolver()
class UserResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => User)
  currentUser(@Ctx() ctx: GQLContext): User {
    console.log(
      `name:${ctx.req.currentUser.name},email:${
        ctx.req.currentUser.email
      },role:${getRoleName(ctx.req.currentUser)}`
    );
    return ctx.req.currentUser;
  }

  // @UseMiddleware([ErrorInterceptor, ResolveTime])
  // @Mutation(() => Boolean)
  // async createAdmin(): Promise<Boolean> {
  //   const admin = await User.findOne({
  //     role: 1,
  //   });
  //   if (admin) {
  //     return true;
  //   }
  //   await User.create({
  //     name: "admin",
  //     email: "admin@saasflow.cn",
  //     password: hash("A123456"),
  //     avatarUrl: "https://file.sflow.pro/avatar_default.png",
  //     role: 1,
  //   }).save();

  //   return true;
  // }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => String)
  async login(
    @Arg("user") userInput: UserLoginInput
    // @Ctx() ctx: GQLContext
  ): Promise<String> {
    // console.log(
    //   `origin:${ctx.req.headers["origin"]}\n host:${ctx.req.headers["host"]}`
    // );
    // console.log(`origin:${JSON.stringify(ctx.req.headers)}`);
    if (!isNonEmptyString(userInput.email)) {
      throw new CommonError("Empty email or phone");
    }
    let user = await User.findOne({
      where: {
        email: userInput.email,
      },
    });
    if (!user) {
      user = await User.findOne({
        where: {
          phone: userInput.email,
        },
      });
      if (!user) {
        throw new CommonError(`Not found user(${userInput.email})`);
      }
    }
    comparePassword(userInput.password, user.password);
    if (user.state === 1) {
      user.state = 2;
      await user.save();
    }

    const client = new redis(process.env.REDIS_URL);
    client.select(0);
    client.del(`user_id_${user.id}`);

    return signToken({ sub: user.id });
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => User)
  async createUser(
    @Ctx() ctx: GQLContext,
    @Arg("user") userInput: UserCreateInput
  ): Promise<User> {
    const admin = ctx.req.currentUser;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(userInput.email);

    if (!isValidEmail) {
      throw new CommonError("Email format incorrect");
    }

    let user = await User.findOne({
      where: {
        email: userInput.email,
        // organizationId: admin.organizationId,
      },
    });
    if (user) {
      throw new CommonError(`User(${userInput.email}) is exist`);
    }
    // user = await User.findOne({
    //   where: {
    //     phone: userInput.phone,
    //     // organizationId: admin.organizationId,
    //   },
    // });
    // if (user) {
    //   throw new CommonError(`User(${userInput.phone}) is exist`);
    // }

    // if (isValidNumber(userInput.role)) {
    //   if (![1, 2, 3, 4, 5].includes(userInput.role)) {
    //     throw new CommonError(`Error role`);
    //   }
    // }
    userInput.password = hash(userInput.password);
    const newUser = await User.create({
      ...userInput,
      organizationId: admin.organizationId,
    }).save();
    return newUser;
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => User)
  async updateUserInfoByAdmin(
    @Ctx() ctx: GQLContext,
    @Arg("userId", () => String) userId: string,
    @Arg("user") userInput: AdminUserUpdateInput
  ): Promise<User> {
    const admin = ctx.req.currentUser;
    await User.findOneOrFail({
      where: { id: userId, organizationId: admin.organizationId },
    });
    if (isNonEmptyString(userInput.email)) {
      let user = await User.findOne({
        where: {
          id: Not(userId),
          email: userInput.email,
          // organizationId: admin.organizationId,
        },
      });
      if (user) {
        throw new CommonError(`User(${userInput.email}) is exist`);
      }
    }
    if (isNonEmptyString(userInput.phone)) {
      let user = await User.findOne({
        where: {
          id: Not(userId),
          phone: userInput.phone,
          // organizationId: admin.organizationId,
        },
      });
      if (user) {
        throw new CommonError(`User(${userInput.phone}) is exist`);
      }
    }
    // if (isValidNumber(userInput.role)) {
    //   if (![1, 2, 3, 4, 5].includes(userInput.role)) {
    //     throw new CommonError(`Error role`);
    //   }
    // }
    if (isNonEmptyString(userInput.password)) {
      userInput.password = hash(userInput.password);
    }
    const client = new redis(process.env.REDIS_URL);
    client.select(0);
    client.del(`user_id_${userId}`);
    await User.update(userId, userInput);
    return await User.findOneOrFail(userId);
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => User)
  async updateUserInfo(
    @Ctx() ctx: GQLContext,
    @Arg("user") userInput: UserUpdateInput
  ): Promise<User> {
    const currentUser = ctx.req.currentUser;
    if (isNonEmptyString(userInput.email)) {
      let user = await User.findOne({
        where: {
          id: Not(currentUser.id),
          email: userInput.email,
          // organizationId: currentUser.organizationId,
        },
      });
      if (user) {
        throw new CommonError(`User(${userInput.email}) is exist`);
      }
    }
    if (isNonEmptyString(userInput.phone)) {
      let user = await User.findOne({
        where: {
          id: Not(currentUser.id),
          phone: userInput.phone,
          // organizationId: currentUser.organizationId,
        },
      });
      if (user) {
        throw new CommonError(`User(${userInput.phone}) is exist`);
      }
    }
    const client = new redis(process.env.REDIS_URL);
    client.select(0);
    client.del(`user_id_${currentUser.id}`);
    await User.update(currentUser.id, userInput);
    return await User.findOneOrFail(currentUser.id);
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => User)
  async updateUserPassword(
    @Ctx() ctx: GQLContext,
    @Arg("password", () => String) password: string,
    @Arg("newPassword", () => String) newPassword: string
  ): Promise<User> {
    const userTemp = ctx.req.currentUser;
    const user = await User.findOneOrFail(userTemp.id);
    if (password === "") {
      throw new CommonError(`Empty password`);
    }
    if (password.length < 6) {
      throw new CommonError(
        `The password length must be greater than 6 digits`
      );
    }
    comparePassword(password, user.password);
    user.password = hash(newPassword);
    await user.save();
    return user;
  }

  //查找出不属于任何部门的用户
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [User])
  async getUsersNotInDepartment(@Ctx() ctx: GQLContext): Promise<User[]> {
    const admin = ctx.req.currentUser;
    const users = await User.find({
      where: {
        organizationId: admin.organizationId,
        departmentId: IsNull(),
      },
    });
    return users;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [User])
  async getUsersInDepartment(@Ctx() ctx: GQLContext): Promise<User[]> {
    const admin = ctx.req.currentUser;
    const users = await User.find({
      where: {
        organizationId: admin.organizationId,
        departmentId: Not(IsNull()),
      },
      relations: ["department"],
    });
    return users;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [User])
  async getUsers(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<User[]> {
    const admin = ctx.req.currentUser;
    const users = await User.find({
      where: {
        organizationId: admin.organizationId,
      },
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 300,
    });
    return users;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => UserResult)
  async getUsersAndCount(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<UserResult> {
    const admin = ctx.req.currentUser;
    const res = new UserResult();
    const [users, count] = await User.findAndCount({
      where: {
        organizationId: admin.organizationId,
      },
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 300,
    });
    res.data = users;
    res.totalCount = count;
    return res;
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteUser(
    @Ctx() ctx: GQLContext,
    @Arg("userId", () => String) userId: string
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    const user = await User.findOneOrFail({
      where: { id: userId, organizationId: admin.organizationId },
    });
    await user.softRemove();
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [User])
  async getUserOperators(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<User[]> {
    const admin = ctx.req.currentUser;
    const users = await User.find({
      where: {
        organizationId: admin.organizationId,
        role: 3,
      },
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 300,
    });
    return users;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [User])
  async getUserLawyers(
    @Ctx() ctx: GQLContext,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<User[]> {
    const admin = ctx.req.currentUser;
    const users = await User.find({
      where: {
        organizationId: admin.organizationId,
        role: 2,
      },
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 300,
    });
    return users;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => User)
  async registerUserAsDistributor(
    @Arg("user") userInput: UserCreateAsDistributorInput,
    @Arg("uuid", () => String) uuid: string,
    @Arg("distributorName", () => String) distributorName: string
  ): Promise<User> {
    const distributor = await Distributor.findOneOrFail({
      uuid: uuid,
      t1DistributorId: IsNull(),
    });
    let user = await User.findOne({
      where: {
        email: userInput.email,
        // organizationId: admin.organizationId,
      },
    });
    if (user) {
      throw new CommonError(`User(${userInput.email}) is exist`);
    }
    user = await User.findOne({
      where: {
        phone: userInput.phone,
        // organizationId: admin.organizationId,
      },
    });
    if (user) {
      throw new CommonError(`User(${userInput.phone}) is exist`);
    }
    let model = null;
    try {
      userInput.password = hash(userInput.password);
      const newUser = await User.create({
        ...userInput,
        role: 5,
        organizationId: distributor.organizationId,
      }).save();
      const access_token = await getAccessToken();
      const uuid = require("uuid");
      const uuidStr = uuid.v1();
      model = await Distributor.create({
        name: distributorName,
        organizationId: distributor.organizationId,
        wxQrCode: "",
        t1DistributorId: distributor.id,
        userId: newUser.id,
        uuid: uuidStr,
      }).save();
      const input = {
        action_name: "QR_LIMIT_STR_SCENE",
        action_info: { scene: { scene_str: model.uuid } },
      };
      const codeRes = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${access_token}`,
        JSON.stringify(input),
        {
          headers: {
            "content-type": "application/json",
          },
        }
      );
      console.log(JSON.stringify(codeRes.data));
      if (codeRes.status === 200) {
        model.wxQrCode = codeRes.data.ticket;
        await model.save();
      } else {
        await model.remove();
        throw new CommonError("Error Qr code");
      }

      return newUser;
    } catch (error: any) {
      if (model) {
        await model.remove();
      }
      if (error.response) {
        throw new CommonError(JSON.stringify(error.response.data));
      } else if (error.request) {
        throw new CommonError(JSON.stringify(error.request));
      } else {
        throw new CommonError(error.message);
      }
    }
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async verifyUserEmail(
    @Arg("email", () => String) email: string
  ): Promise<Boolean> {
    const user = await User.findOne({
      where: {
        email: email,
      },
    });
    if (user) {
      return false;
    }
    return true;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async verifyUserPhone(
    @Arg("phone", () => String) phone: string
  ): Promise<Boolean> {
    const user = await User.findOne({
      where: {
        phone: phone,
      },
    });
    if (user) {
      return false;
    }
    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateUserOtherInfo(
    @Ctx() ctx: GQLContext,
    @Arg("user") userInput: UserOtherInfoUpdateInput
  ): Promise<Boolean> {
    const currentUser = ctx.req.currentUser;
    const client = new redis(process.env.REDIS_URL);
    client.select(0);
    client.del(`user_id_${currentUser.id}`);
    await User.update(currentUser.id, userInput);
    return true;
  }
}

export default UserResolver;
