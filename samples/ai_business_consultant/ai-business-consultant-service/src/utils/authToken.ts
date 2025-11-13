import { Request } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { InvalidTokenError } from "@/errors";
import { createHash } from "crypto";
import { CommonError } from "@/errors";
import bcrypt from 'bcrypt';

var isPlainObject = (value: any) => {
  return Object.prototype.toString.call(value) === "[object Object]";
};

export const signToken = (payload: object, options?: SignOptions): string =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "180 days",
    ...options,
  });

export const verifyToken = (token: string): { [key: string]: any } => {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (isPlainObject(payload)) {
      return payload as { [key: string]: any };
    }
    throw new Error();
  } catch (error) {
    throw new InvalidTokenError();
  }
};

export const getAuthTokenFromRequest = (req: Request): string | null => {
  const header = req.get("Authorization") || "";
  const [bearer, token] = header.split(" ");
  return bearer === "Bearer" && token ? token : null;
};

export const hash = (password: String): string => {
  const md5 = createHash("md5");
  md5.update(password + "chatbot");
  return md5.digest("hex");
};

export const comparePassword = (password: String, hashedPassword: String) => {
  const md5 = createHash("md5");
  md5.update(password + "chatbot");
  if (hashedPassword !== md5.digest("hex")) {
    throw new CommonError("wrong password");
  }
};


// 加密用户密码
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10; // 定义盐的轮数 (迭代次数)
  const hashedPassword = await bcrypt.hash(password, saltRounds); // 使用 bcrypt 生成哈希密码
  return hashedPassword; // 返回哈希后的密码
};

// 验证用户输入的密码
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  const isMatch = await bcrypt.compare(password, hashedPassword); // 比较输入的密码与存储的哈希密码
  return isMatch; // 返回比较结果，true 表示匹配，false 表示不匹配
};


