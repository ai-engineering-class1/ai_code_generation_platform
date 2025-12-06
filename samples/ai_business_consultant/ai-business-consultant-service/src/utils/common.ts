import axios from "axios";
import { CommonError } from "@/errors";
import redis from "ioredis";
import { Organization } from "@/models";

export const getWeiXinPhoneNumber = async (data: any) => {
  const result = await axios.post(
    `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${await getMiniWechatAccessToken()}`,
    data
  );
  console.log(result.data);
  if (result.data.errcode) {
    throw new CommonError(result.data.errmsg);
  }
  return result.data;
};

export const getWeiXinCode2Session = async (code: string) => {
  const accessTokenRes = await axios.get(
    `https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.MINI_WECHAT_AppID}&secret=${process.env.MINI_WECHAT_AppSecret}&js_code=${code}&grant_type=authorization_code`
  );
  console.log(accessTokenRes.data);
  if (accessTokenRes.data.errcode) {
    throw new CommonError(accessTokenRes.data.errmsg);
  }
  return accessTokenRes.data;
};

export const getWeiXinAccessTokenByCode = async (code: string) => {
  const accessTokenRes = await axios.get(
    `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${process.env.WECHAT_AppID}&secret=${process.env.WECHAT_AppSecret}&code=${code}&grant_type=authorization_code`
  );
  console.log(accessTokenRes.data);
  if (accessTokenRes.data.errcode) {
    throw new CommonError(accessTokenRes.data.errmsg);
  }
  return accessTokenRes.data;
};

export const getWeiXinUserInfoByAccessToken = async (
  access_token: string,
  openid: string
) => {
  const res = await axios.get(
    `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`
  );
  console.log(res.data);
  if (res.data.errcode) {
    throw new CommonError(res.data.errmsg);
  }
  return res.data;
};

export const createRandomString = async (len: number) => {
  let data = "ABCDEFGHJKLMNOPQRSTUVWXYZ1234567890"; //"ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
  let str = "";
  for (let i = 0; i < len; i++) {
    str += data.charAt(Math.floor(Math.random() * data.length));
  }
  return str;
};

export const createRandomNumber = async (len: number) => {
  let data = "1234567890"; //"ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
  let str = "";
  for (let i = 0; i < len; i++) {
    str += data.charAt(Math.floor(Math.random() * data.length));
  }
  return str;
};

// Helper function to create Redis client with error handling
const createRedisClient = (): redis | null => {
  if (!process.env.REDIS_URL || process.env.REDIS_URL.trim() === '') {
    return null;
  }
  const client = new redis(process.env.REDIS_URL, {
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
  client.on('error', (err) => {
    console.error('[Redis] Error in common.ts:', err.message);
  });
  return client;
};

export const getMiniWechatAccessToken = async () => {
  const client = createRedisClient();
  if (!client) {
    // If Redis is not available, fetch token directly without caching
    const res = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.MINI_WECHAT_AppID}&secret=${process.env.MINI_WECHAT_AppSecret}`
    );
    return res.data.access_token;
  }
  try {
    client.select(0);
    let access_token = await client.get(`miniWechat_paperwork_notice_key`);
    console.log(`redis MiniWechat access_token:${access_token}`);
    if (access_token === null || access_token === "") {
      const res = await axios.get(
        `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.MINI_WECHAT_AppID}&secret=${process.env.MINI_WECHAT_AppSecret}`
      );
      console.log(res.data);
      access_token = res.data.access_token;
      try {
        client.set(`miniWechat_paperwork_notice_key`, access_token!, "EX", 7200);
      } catch (err) {
        console.warn('[Redis] Failed to cache token:', err);
      }
    }
    return access_token;
  } catch (err) {
    console.warn('[Redis] Failed to get token from cache:', err);
    // Fallback: fetch directly
    const res = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.MINI_WECHAT_AppID}&secret=${process.env.MINI_WECHAT_AppSecret}`
    );
    return res.data.access_token;
  }
};

export const getAccessToken = async () => {
  const client = createRedisClient();
  if (!client) {
    // If Redis is not available, fetch token directly without caching
    const res = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.WECHAT_AppID}&secret=${process.env.WECHAT_AppSecret}`
    );
    return res.data.access_token;
  }
  try {
    client.select(0);
    let access_token = await client.get(`paperwork_notice_key`);
    console.log(`redis access_token:${access_token}`);
    if (access_token === null || access_token === "") {
      const res = await axios.get(
        `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.WECHAT_AppID}&secret=${process.env.WECHAT_AppSecret}`
      );
      console.log(res.data);
      access_token = res.data.access_token;
      try {
        client.set(`paperwork_notice_key`, access_token!, "EX", 7200);
      } catch (err) {
        console.warn('[Redis] Failed to cache token:', err);
      }
    }
    return access_token;
  } catch (err) {
    console.warn('[Redis] Failed to get token from cache:', err);
    // Fallback: fetch directly
    const res = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.WECHAT_AppID}&secret=${process.env.WECHAT_AppSecret}`
    );
    return res.data.access_token;
  }
};

export const getJsapiTicket = async () => {
  const client = createRedisClient();
  if (!client) {
    // If Redis is not available, fetch ticket directly without caching
    const accessToken = await getAccessToken();
    const res = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`
    );
    return res.data.ticket;
  }
  try {
    client.select(0);
    let jsapi_ticket = await client.get(`jsapi_ticket`);
    console.log(`redis jsapi_ticket:${jsapi_ticket}`);
    if (jsapi_ticket === null || jsapi_ticket === "") {
      const res = await axios.get(
        `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${await getAccessToken()}&type=jsapi`
      );
      console.log(res.data);
      jsapi_ticket = res.data.ticket;
      try {
        client.set(`jsapi_ticket`, jsapi_ticket!, "EX", 7200);
      } catch (err) {
        console.warn('[Redis] Failed to cache ticket:', err);
      }
    }
    return jsapi_ticket;
  } catch (err) {
    console.warn('[Redis] Failed to get jsapi_ticket from cache:', err);
    // Fallback: fetch directly
    const accessToken = await getAccessToken();
    const res = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`
    );
    return res.data.ticket;
  }
};

export const parseJsonSafely = async (jsonString: string) => {
  try {
    const parsedObject = JSON.parse(jsonString);
    console.log("Parsed JSON:", parsedObject);
    return {
      success: true,
      data: parsedObject,
    };
  } catch (error: any) {
    console.error("Failed to parse JSON:", error.message);
    return {
      success: false,
      error: "json parse failed",
    };
  }
};

export const getWeiXinOfficialMsgReply = async (openid: string) => {
  const org = await Organization.findOneOrFail(1);
  const input = {
    touser: openid,
    msgtype: "text",
    text: {
      content: org.miniMsgReply.replace(
        new RegExp("${process.env.MINI_WECHAT_AppID}", "g"),
        process.env.MINI_WECHAT_AppID
      ),
      //       content: `感谢您的咨询。如果您需要生成要素式起诉状，点击 <a data-miniprogram-appid="${process.env.MINI_WECHAT_AppID}" data-miniprogram-nickname="商品介绍" data-miniprogram-path="pages/home/home?pageUrl=pricedetail%2Fa922fa43-3fda-42a9-b4ce-4a42f445d71d" data-miniprogram-type="text" href=" ">（帮写起诉状）</a>，对话就可以生成[呲牙]
      // 如果您需要咨询法律问题，点击<a data-miniprogram-appid="${process.env.MINI_WECHAT_AppID}" data-miniprogram-nickname="法律咨询" data-miniprogram-path="pages/home/home?pageUrl=chat%2Fuser" data-miniprogram-type="text" href=" ">（免费咨询）</a>24小时恭候您[666]`,
    },
  };
  const res = await axios.post(
    `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${await getAccessToken()}`,
    input
  );
  console.log(res.data);
  return res.data;
};

export const getWeiXinOfficialSubscriptionReply = async (openid: string) => {
  const org = await Organization.findOneOrFail(1);
  const input = {
    touser: openid,
    msgtype: "text",
    text: {
      content: org.miniSubscriptionReply.replace(
        new RegExp("${process.env.MINI_WECHAT_AppID}", "g"),
        process.env.MINI_WECHAT_AppID
      ),
      //       content: `阁下慧眼关注，兄弟对您敬仰之情有如滔滔江水，连绵不绝[抱拳][抱拳]
      // 如果您需要生成要素式起诉状，点击<a data-miniprogram-appid="${process.env.MINI_WECHAT_AppID}" data-miniprogram-nickname="商品介绍" data-miniprogram-path="pages/home/home?pageUrl=pricedetail%2Fa922fa43-3fda-42a9-b4ce-4a42f445d71d" data-miniprogram-type="text" href=" ">（帮写起诉状）</a>，对话就可以生成[呲牙]
      // 如果您需要咨询法律问题，点击<a data-miniprogram-appid="${process.env.MINI_WECHAT_AppID}" data-miniprogram-nickname="法律咨询" data-miniprogram-path="pages/home/home?pageUrl=chat%2Fuser" data-miniprogram-type="text" href=" ">（免费咨询）</a>24小时AI恭候您[666]

      // `,
    },
  };
  const res = await axios.post(
    `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${await getAccessToken()}`,
    input
  );
  console.log(res.data);
  return res.data;
};

export const printLogInfo = async (name: string, data: string) => {
  const fs = require("fs");

  const logMessage = `[${new Date().toISOString()}] - INFO: name:${name}，data:${JSON.stringify(
    data
  )}\n`;

  // 追加日志到 `app.log` 文件
  fs.appendFile("logInfo.log", logMessage, (err: any) => {
    if (err) {
      console.error("写入日志失败:", err);
    }
  });
};
