import {
  Resolver,
  UseMiddleware,
  Mutation,
  Query,
  Arg,
  Int,
  Ctx,
} from "type-graphql";
import { ErrorInterceptor, ResolveTime } from "@/middlewares";
import {
  createRandomNumber,
  getWeiXinAccessTokenByCode,
  getWeiXinUserInfoByAccessToken,
  getWeiXinCode2Session,
  getWeiXinPhoneNumber,
} from "@/utils/common";
import {
  Sfbot,
  WxUser,
  ChatHistory,
  LlmTrace,
  Distributor,
  OrgCarouselImage,
  OrgMainImage,
  OrgModelText,
  OrgUsageExample,
} from "@/models";
import { IsAuth, IsAdminAuth } from "@/middlewares/isAuth";
import { GQLContext } from "@/types/context";
import AsyncLock from "async-lock";
import { ChatHistoryInput, WxUserResult } from "./types";
import { CommonError } from "@/errors";
import { isNonEmptyString } from "@/utils/validations";
import { Like, Not } from "typeorm";
import axios from "axios";
import { getAccessToken } from "@/utils/common";
import redis from "ioredis";
import { sendSmsCode } from "@/utils/aliyunSMS";

const client = new redis(process.env.REDIS_URL);
@Resolver()
class WxUserResolver {
  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => WxUser)
  async currentWxUser(
    @Arg("openid", () => String) openid: string
  ): Promise<WxUser> {
    const user = await WxUser.findOneOrFail({
      where: {
        openId: openid,
      },
    });
    console.log(`name:${user.name}`);
    return user;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getWeiXinAccessToken(
    @Arg("code", () => String) code: string
  ): Promise<string> {
    const token = await getWeiXinAccessTokenByCode(code);
    return JSON.stringify(token);
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => String)
  async weiXinLogin(
    @Arg("access_token", () => String, { nullable: true }) access_token: string,
    @Arg("openid", () => String) openid: string,
    @Arg("sfbotUuid", () => String) sfbotUuid: string,
    @Arg("fromUserId", () => String, { nullable: true }) fromUserId: string
  ): Promise<string> {
    console.log(`access_token:${access_token}`);
    console.log(`openid:${openid}`);
    const sfbot = await Sfbot.findOneOrFail({
      where: {
        uuid: sfbotUuid,
      },
    });
    const existUser = await WxUser.findOne({
      openId: openid,
    });
    if (existUser) {
      if (isNonEmptyString(access_token)) {
        if (
          !isNonEmptyString(existUser.name) ||
          !isNonEmptyString(existUser.avatarUrl)
        ) {
          const model = await getWeiXinUserInfoByAccessToken(
            access_token,
            openid
          );
          existUser.name = model.nickname;
          existUser.avatarUrl = model.headimgurl;
          existUser.sex = model.sex ? model.sex : null;
          await existUser.save();
        }
      }
      return openid;
    }
    const model = await getWeiXinUserInfoByAccessToken(access_token, openid);
    await WxUser.create({
      name: model.nickname,
      avatarUrl: model.headimgurl,
      openId: openid,
      organizationId: sfbot.organizationId,
      sex: model.sex ? model.sex : null,
      fromUserId: fromUserId,
    }).save();
    return openid;
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteWxUser(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => String) id: string
  ): Promise<Boolean> {
    const admin = ctx.req.currentUser;
    const user = await WxUser.findOneOrFail({
      where: {
        id: id,
        organizationId: admin.organizationId,
      },
    });
    await user.softRemove();
    return true;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateWxUserOperate(
    @Arg("openid", () => String) openid: string
  ): Promise<Boolean> {
    const lock = new AsyncLock();
    await lock.acquire<boolean>(`key_${openid}`, async (done) => {
      const user = await WxUser.findOneOrFail({
        where: {
          openId: openid,
        },
      });
      user.lastOperateDate = new Date();
      await user.save();
      return done(null, true);
    });

    return true;
  }

  // @UseMiddleware([ErrorInterceptor, ResolveTime])
  // @Mutation(() => WxUser)
  // async updateWxUserPayDate(
  //   @Arg("openid", () => String) openid: string
  // ): Promise<WxUser> {
  //   const user = await WxUser.findOneOrFail({
  //     where: {
  //       openId: openid,
  //     },
  //   });
  //   user.lastPayDate = new Date();
  //   await user.save();
  //   return user;
  // }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [WxUser])
  async getWxUsers(
    @Ctx() ctx: GQLContext,
    @Arg("name", () => String, { nullable: true })
    name: string,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<WxUser[]> {
    const user = ctx.req.currentUser;
    const input: any = {};
    if (user.role === 5) {
      const distributor = await Distributor.findOneOrFail({
        where: {
          userId: user.id,
        },
      });
      input.distributorId = distributor.id;
    } else {
      input.organizationId = user.organizationId;
    }
    if (isNonEmptyString(name)) {
      input.name = Like(`%${name}%`);
    }
    const users = await WxUser.find({
      where: input,
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 300,
      order: { createdAt: "DESC" },
    });

    return users;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => WxUser)
  async getWxUserById(@Arg("id", () => String) id: string): Promise<WxUser> {
    const user = await WxUser.findOneOrFail(id);
    return user;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => WxUserResult)
  async getWxUsersAndCount(
    @Ctx() ctx: GQLContext,
    @Arg("name", () => String, { nullable: true })
    name: string,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<WxUserResult> {
    const user = ctx.req.currentUser;
    const input: any = {};
    if (user.role === 5) {
      const distributor = await Distributor.findOneOrFail({
        where: {
          userId: user.id,
        },
      });
      input.distributorId = distributor.id;
    } else {
      input.organizationId = user.organizationId;
    }

    if (isNonEmptyString(name)) {
      input.name = Like(`%${name}%`);
    }
    const [users, count] = await WxUser.findAndCount({
      where: input,
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 300,
      order: { createdAt: "DESC" },
    });
    const res = new WxUserResult();
    res.data = users;
    res.totalCount = count;

    return res;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => ChatHistory)
  async createChatHistory(
    @Arg("chatHistory")
    chatHistoryInput: ChatHistoryInput
  ): Promise<ChatHistory> {
    const wxUser = await WxUser.findOneOrFail({
      openId: chatHistoryInput.openid,
    });
    if (
      chatHistoryInput.state != "send" &&
      chatHistoryInput.state != "receive"
    ) {
      throw new CommonError(`Error state`);
    }
    const lock = new AsyncLock();
    const model = await lock.acquire<ChatHistory>(
      `key_${wxUser.id}`,
      async (done) => {
        const model = await ChatHistory.create({
          wxUserId: wxUser.id,
          organizationId: wxUser.organizationId,
          state: chatHistoryInput.state,
          message: chatHistoryInput.message,
        }).save();
        return done(null, model);
      }
    );

    return model;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => [ChatHistory])
  async getChatHistory(
    @Arg("openid", () => String) openid: string,
    @Arg("skip", () => Int, { nullable: true })
    skip: number,
    @Arg("take", () => Int, { nullable: true })
    take: number
  ): Promise<ChatHistory[]> {
    const wxUser = await WxUser.findOneOrFail({
      openId: openid,
    });

    const res = await ChatHistory.find({
      where: {
        wxUserId: wxUser.id,
      },
      relations: ["wxUser"],
      skip: Number.isFinite(skip) ? skip : 0,
      take: Number.isFinite(take) ? take : 300,
    });
    return res;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteChatHistory(
    @Arg("openid", () => String) openid: string
  ): Promise<Boolean> {
    const wxUser = await WxUser.findOneOrFail({
      openId: openid,
    });
    await ChatHistory.delete({
      wxUserId: wxUser.id,
    });
    return true;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async feedbackLlmTrace(
    @Arg("id", () => Int)
    id: number,
    @Arg("openid", () => String) openid: string,
    @Arg("evaluate", () => Int) evaluate: number,
    @Arg("feedback", () => String, { nullable: true }) feedback: string
  ): Promise<Boolean> {
    await WxUser.findOneOrFail({
      openId: openid,
    });
    const llmTrace = await LlmTrace.findOneOrFail({
      where: {
        id: id,
        openid: openid,
      },
    });
    if (evaluate !== -1 && evaluate !== 1) {
      throw new CommonError("Error evaluate");
    }
    llmTrace.evaluate = evaluate;
    if (isNonEmptyString(feedback)) {
      llmTrace.feedback = feedback;
    }
    await llmTrace.save();
    return true;
  }

  //微信公众号菜单查看接口
  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getWxOfficialAccountMenus(): Promise<String> {
    const res = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/get_current_selfmenu_info?access_token=${await getAccessToken()}`
    );
    console.log(res.data);
    // if (res.status === 200) {
    //   if (res.data.is_menu_open === 1) {
    //     return JSON.stringify(res.data);
    //   } else {

    //   }
    // }
    return JSON.stringify(res.data);
  }

  //微信公众号菜单创建接口
  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async createWxOfficialAccountMenus(): Promise<String> {
    const input = {
      button: [
        // {
        //   type: "view",
        //   name: "免费起诉状",
        //   url: `https://${process.env.WECHAT_H5}/#/chat/user`,
        // },
        // {
        //   type: "miniprogram",
        //   name: "进入小程序",
        //   url: "http://www.qq.com",
        //   appid: "wx925cfb9412803f6d",
        //   pagepath: "pages/index/index",
        //   sub_button: [],
        // },
        {
          type: "view",
          name: "我的订单",
          url: `https://${process.env.WECHAT_H5}/#/my`,
        },
        {
          type: "view",
          name: "法律咨询",
          url: `https://${process.env.WECHAT_H5}/#/chat/user`,
        },
        {
          type: "view",
          name: "文书起草",
          url: `https://${process.env.WECHAT_H5}/#/price`,
        },
        {
          type: "view",
          name: "我的订单",
          url: `https://${process.env.WECHAT_H5}/#/my`,
        },
      ],
    };
    console.log(input);
    const createRes = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${await getAccessToken()}`,
      input
    );
    console.log(createRes.data);
    const res = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/get_current_selfmenu_info?access_token=${await getAccessToken()}`
    );
    return JSON.stringify(res.data);
  }

  //微信公众号菜单删除接口
  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async deleteWxOfficialAccountMenus(): Promise<String> {
    const res = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/menu/delete?access_token=${await getAccessToken()}`
    );
    console.log(res.data);
    return JSON.stringify(res.data);
  }

  //微信公众号菜单自动回复设置
  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async setWxOfficialAccountAutoReply(): Promise<String> {
    const input = {
      is_add_friend_reply_open: 1,
      is_autoreply_open: 1,
      add_friend_autoreply_info: {
        type: "text",
        content: "Thanks for your attention!",
      },
      message_default_autoreply_info: {
        type: "text",
        content: "Hello, this is autoreply!",
      },
    };
    const res = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/set_current_autoreply_info?access_token=${await getAccessToken()}`,
      input
    );
    console.log(res.data);
    return JSON.stringify(res.data);
  }

  //微信公众号菜单自动回复设置
  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getWxOfficialAccountAutoReply(): Promise<String> {
    const res = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/get_current_autoreply_info?access_token=${await getAccessToken()}`
    );
    console.log(res.data);
    return JSON.stringify(res.data);
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async updateWxUserPhoneNumber(
    @Arg("miniOpenid", () => String, { nullable: true }) miniOpenid: string,
    @Arg("openid", () => String) openid: string,
    @Arg("phoneNumber", () => String) phoneNumber: string,
    @Arg("code", () => String, { nullable: true }) code: string
  ): Promise<Boolean> {
    if (isNonEmptyString(code)) {
      const existCode = await client.get(phoneNumber);
      if (existCode == null) {
        throw new CommonError("Code not found");
      }
      if (existCode.toString() !== code) {
        throw new CommonError("Code error");
      }
    }

    const wxUser = await WxUser.findOne({
      where: {
        openId: openid,
      },
    });
    if (!wxUser) {
      throw new CommonError("User not found");
    }
    // if (wxUser.phoneNumber == null || wxUser.phoneNumber == "") {
    //   throw new CommonError("Phone number not exist");
    // }
    const otherWxUser = await WxUser.findOne({
      where: {
        phoneNumber: phoneNumber,
        openId: Not(openid),
      },
    });
    if (otherWxUser) {
      throw new CommonError("Phone number already exist");
    }

    if (isNonEmptyString(miniOpenid)) {
      wxUser.miniOpenId = miniOpenid;
    }
    wxUser.phoneNumber = phoneNumber;
    await wxUser.save();
    return true;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async confirmWxUserPhoneNumber(
    @Arg("openid", () => String) openid: string,
    @Arg("miniOpenid", () => String, { nullable: true }) miniOpenid: string,
    @Arg("phoneNumber", () => String) phoneNumber: string,
    @Arg("code", () => String) code: string
  ): Promise<Boolean> {
    const existCode = await client.get(phoneNumber);
    if (existCode == null) {
      throw new CommonError("Code not found");
    }
    if (existCode.toString() !== code) {
      throw new CommonError("Code error");
    }

    const wxUser = await WxUser.findOne({
      where: {
        openId: openid,
      },
    });
    if (!wxUser) {
      throw new CommonError("User not found");
    }
    const otherWxUser = await WxUser.findOne({
      where: {
        phoneNumber: phoneNumber,
        openId: Not(openid),
      },
    });
    if (otherWxUser) {
      throw new CommonError("Phone number already exist");
    }
    if (wxUser.phoneNumber != null) {
      throw new CommonError("Phone number already exist");
    }

    if (wxUser.fromUserId != null) {
      const fromWxUser = await WxUser.findOne({
        where: {
          id: wxUser.fromUserId,
        },
      });
      if (fromWxUser) {
        fromWxUser.freeTimes += 3;
        await fromWxUser.save();
      }
    }

    if (isNonEmptyString(miniOpenid)) {
      wxUser.miniOpenId = miniOpenid;
    }
    wxUser.phoneNumber = phoneNumber;
    wxUser.freeTimes += 3;
    await wxUser.save();

    return true;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async sendWxUserPhoneNumberCode(
    @Arg("openid", () => String) openid: string,
    @Arg("phoneNumber", () => String) phoneNumber: string
  ): Promise<Boolean> {
    const existCode = await client.get(phoneNumber);
    if (existCode != null) {
      return false;
    }
    const wxUser = await WxUser.findOne({
      where: {
        openId: openid,
      },
    });
    if (!wxUser) {
      throw new CommonError("User not found");
    }

    const newCode = await createRandomNumber(6);
    await client.set(phoneNumber, newCode, "EX", 70);
    const result = await sendSmsCode(phoneNumber, newCode);
    console.log(result);
    return true;
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => String)
  async sendWxUserPhoneNumberCodeTest(
    @Arg("openid", () => String) openid: string,
    @Arg("phoneNumber", () => String) phoneNumber: string
  ): Promise<String> {
    const wxUser = await WxUser.findOne({
      where: {
        openId: openid,
      },
    });
    if (!wxUser) {
      throw new CommonError("User not found");
    }
    if (wxUser.phoneNumber == null || wxUser.phoneNumber == "") {
      const existCode = await client.get(phoneNumber);
      if (existCode != null) {
        return existCode;
      }
      const newCode = await createRandomNumber(6);
      await client.set(phoneNumber, newCode, "EX", 70);
      // const result = await sendSmsCode(phoneNumber, newCode);
      // console.log(result);
      return newCode;
    } else {
      return "";
    }
  }

  //小程序登录
  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getWinXinCode2Session(
    @Arg("js_code", () => String) js_code: string
  ): Promise<string> {
    const result = await getWeiXinCode2Session(js_code);
    return JSON.stringify(result);
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getWinXinUserPhoneNumber(
    @Arg("code", () => String) code: string
  ): Promise<string> {
    const data = {
      code: code,
    };
    const result = await getWeiXinPhoneNumber(data);
    return JSON.stringify(result);
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => String)
  async getMiniMainPageData(
    @Arg("id", () => Int) id: number,
    @Arg("type", () => String) type: string
  ): Promise<String> {
    let res: any = null;
    if (type === "carousel") {
      res = await OrgCarouselImage.findOne(id);
    } else if (type === "main") {
      res = await OrgMainImage.findOne(id);
    } else if (type === "model") {
      res = await OrgModelText.findOne(id);
    } else if (type === "example") {
      res = await OrgUsageExample.findOne(id);
    }
    if (res) {
      return JSON.stringify(res);
    }
    return "No found";
  }
}

export default WxUserResolver;
