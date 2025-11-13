import { verifyToken, getAuthTokenFromRequest } from "@/utils/authToken";
import { InvalidTokenError } from "@/errors";
import { User } from "@/models";
import { MiddlewareFn } from "type-graphql";
import { GQLContext } from "types/context";
import redis from "ioredis";

const client = new redis(process.env.REDIS_URL);
const getUser = async (userId: string): Promise<User> => {
  // const userId = "128cc467-9709-4883-81e5-fd1b0516a7e2";
  client.select(0);
  let userStr = await client.get(`user_id_${userId}`);
  // client.del(`user_id_${userId}`);
  if (userStr) {
    // console.log("get user from redis");
    const user = JSON.parse(userStr);
    return user;
  } else {
    console.log("get user from db");
    const user = await User.createQueryBuilder("user")
      .leftJoinAndSelect("user.distributor", "distributor")
      .leftJoinAndSelect("user.organization", "organization")
      .select([
        "user.id as id",
        "user.name as name",
        "user.email as email",
        "user.phone as phone",
        "user.role as role",
        "user.avatarUrl as avatarUrl",
        "user.organizationId as organizationId",
        "user.state as state",
        "user.createdAt as createdAt",
        "user.updatedAt as updatedAt",
        "user.realName as realName",
        "user.desc as `desc`",
        "user.companySituation as companySituation",
        "user.companyProductAndService as companyProductAndService",
        "user.title as title",
        "organization.name AS orgName"
      ])
      .where("user.id = :userId", { userId })
      .getRawOne();
    console.log(user);
    if (!user) {
      throw new InvalidTokenError(
        "Authentication token is invalid: User not found."
      );
    }
    const userStr = JSON.stringify(user);
    client.set(`user_id_${userId}`, userStr, "EX", 7200);
    return user;
  }
};

export const IsAuth: MiddlewareFn<GQLContext> = async ({ context }, next) => {
  const token = getAuthTokenFromRequest(context.req);
  if (!token) {
    throw new InvalidTokenError("Authentication token not found.");
  }
  const userId = verifyToken(token).sub;
  if (!userId) {
    throw new InvalidTokenError("Authentication token is invalid.");
  }
  // const user = await User.findOne(userId, {
  //   relations: ["distributor"],
  // });
  // if (!user) {
  //   throw new InvalidTokenError(
  //     "Authentication token is invalid: User not found."
  //   );
  // }
  const user = await getUser(userId);
  context.req.currentUser = user;
  return next();
};

export const IsAdminAuth: MiddlewareFn<GQLContext> = async (
  { context },
  next
) => {
  const token = getAuthTokenFromRequest(context.req);
  if (!token) {
    throw new InvalidTokenError("Authentication token not found.");
  }
  const userId = verifyToken(token).sub;
  if (!userId) {
    throw new InvalidTokenError("Authentication token is invalid.");
  }
  // const user = await User.findOne(userId);
  // if (!user) {
  //   throw new InvalidTokenError(
  //     "Authentication token is invalid: User not found."
  //   );
  // }
  const user = await getUser(userId);
  if (user.role !== 1) {
    console.log(`name:${user.name},role:${user.role}`);
    throw new InvalidTokenError("No permission.");
  }
  context.req.currentUser = user;
  return next();
};

export const IsTestAuth: MiddlewareFn<GQLContext> = async (
  { context },
  next
) => {
  const key = context.req.get("apikey");
  if (key !== "EA7B2D7577B384651578C12A8AFD0031")
    throw new InvalidTokenError("ApiKey is invalid.");
  return next();
};

// export const IsNormalAuth: MiddlewareFn<GQLContext> = async (
//   { context },
//   next
// ) => {
//   const token = getAuthTokenFromRequest(context.req);
//   if (!token) {
//     throw new InvalidTokenError("Authentication token not found.");
//   }
//   const userId = verifyToken(token).sub;
//   if (!userId) {
//     throw new InvalidTokenError("Authentication token is invalid.");
//   }
//   const user = await User.findOne(userId);
//   if (!user) {
//     throw new InvalidTokenError(
//       "Authentication token is invalid: User not found."
//     );
//   }
//   if (user.role !== 1 && user.role !== 2 && user.role !== 3) {
//     throw new InvalidTokenError("No permission.");
//   }
//   context.req.currentUser = user;
//   return next();
// };

export const IsFounderAdminAuth: MiddlewareFn<GQLContext> = async (
  { context },
  next
) => {
  const token = getAuthTokenFromRequest(context.req);
  if (!token) {
    throw new InvalidTokenError("Authentication token not found.");
  }
  const userId = verifyToken(token).sub;
  if (!userId) {
    throw new InvalidTokenError("Authentication token is invalid.");
  }
  // const user = await User.findOne(userId);
  // if (!user) {
  //   throw new InvalidTokenError(
  //     "Authentication token is invalid: User not found."
  //   );
  // }
  const user = await getUser(userId);
  if (user.role !== 1 && user.organizationId != 1) {
    throw new InvalidTokenError("No permission.");
  }
  context.req.currentUser = user;
  return next();
};

export const IsAdminAndLawyerAuth: MiddlewareFn<GQLContext> = async (
  { context },
  next
) => {
  const token = getAuthTokenFromRequest(context.req);
  if (!token) {
    throw new InvalidTokenError("Authentication token not found.");
  }
  const userId = verifyToken(token).sub;
  if (!userId) {
    throw new InvalidTokenError("Authentication token is invalid.");
  }
  // const user = await User.findOne(userId);
  // if (!user) {
  //   throw new InvalidTokenError(
  //     "Authentication token is invalid: User not found."
  //   );
  // }
  const user = await getUser(userId);
  if (user.role !== 1 && user.role !== 2) {
    console.log(`name:${user.name},role:${user.role}`);
    throw new InvalidTokenError("No permission.");
  }
  context.req.currentUser = user;
  return next();
};

export const IsAdminAndLawyerAndOperatorAuth: MiddlewareFn<GQLContext> = async (
  { context },
  next
) => {
  const token = getAuthTokenFromRequest(context.req);
  if (!token) {
    throw new InvalidTokenError("Authentication token not found.");
  }
  const userId = verifyToken(token).sub;
  if (!userId) {
    throw new InvalidTokenError("Authentication token is invalid.");
  }
  // const user = await User.findOne(userId);
  // if (!user) {
  //   throw new InvalidTokenError(
  //     "Authentication token is invalid: User not found."
  //   );
  // }
  const user = await getUser(userId);
  if (user.role !== 1 && user.role !== 2 && user.role !== 3) {
    console.log(`name:${user.name},role:${user.role}`);
    throw new InvalidTokenError("No permission.");
  }
  context.req.currentUser = user;
  return next();
};

export const IsAdminAndOperatorAuth: MiddlewareFn<GQLContext> = async (
  { context },
  next
) => {
  const token = getAuthTokenFromRequest(context.req);
  if (!token) {
    throw new InvalidTokenError("Authentication token not found.");
  }
  const userId = verifyToken(token).sub;
  if (!userId) {
    throw new InvalidTokenError("Authentication token is invalid.");
  }
  // const user = await User.findOne(userId);
  // if (!user) {
  //   throw new InvalidTokenError(
  //     "Authentication token is invalid: User not found."
  //   );
  // }
  const user = await getUser(userId);
  if (user.role !== 1 && user.role !== 3) {
    console.log(`name:${user.name},role:${user.role}`);
    throw new InvalidTokenError("No permission.");
  }
  context.req.currentUser = user;
  return next();
};

export const IsAdminAndDistributorAuth: MiddlewareFn<GQLContext> = async (
  { context },
  next
) => {
  const token = getAuthTokenFromRequest(context.req);
  if (!token) {
    throw new InvalidTokenError("Authentication token not found.");
  }
  const userId = verifyToken(token).sub;
  if (!userId) {
    throw new InvalidTokenError("Authentication token is invalid.");
  }
  // const user = await User.findOne(userId, {
  //   relations: ["distributor"],
  // });
  // if (!user) {
  //   throw new InvalidTokenError(
  //     "Authentication token is invalid: User not found."
  //   );
  // }
  const user = await getUser(userId);
  if (user.role !== 1 && user.role !== 5) {
    console.log(`name:${user.name},role:${user.role}`);
    throw new InvalidTokenError("No permission.");
  }
  context.req.currentUser = user;
  return next();
};

export const IsAdminAndMiniMainPageAuth: MiddlewareFn<GQLContext> = async (
  { context },
  next
) => {
  const token = getAuthTokenFromRequest(context.req);
  if (!token) {
    throw new InvalidTokenError("Authentication token not found.");
  }
  const userId = verifyToken(token).sub;
  if (!userId) {
    throw new InvalidTokenError("Authentication token is invalid.");
  }
  // const user = await User.findOne(userId);
  // if (!user) {
  //   throw new InvalidTokenError(
  //     "Authentication token is invalid: User not found."
  //   );
  // }
  const user = await getUser(userId);
  if (user.role !== 1 && user.role !== 7) {
    console.log(`name:${user.name},role:${user.role}`);
    throw new InvalidTokenError("No permission.");
  }
  context.req.currentUser = user;
  return next();
};
