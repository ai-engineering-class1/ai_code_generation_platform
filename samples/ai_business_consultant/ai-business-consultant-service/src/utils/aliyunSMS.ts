import { CommonError } from "@/errors";
const SMSClient = require("@alicloud/sms-sdk");

// Lazy initialization to avoid errors when config is empty
let config: any = null;
let pushPaperworkConfig: any = null;
let smsClient: any = null;

const getConfig = () => {
  if (!config) {
    const configStr = process.env.ALICLOUD_SMS_CONFIG;
    if (!configStr || configStr === 'undefined' || configStr.trim() === '') {
      throw new CommonError('ALICLOUD_SMS_CONFIG is not configured');
    }
    config = JSON.parse(configStr);
  }
  return config;
};

const getPushPaperworkConfig = () => {
  if (!pushPaperworkConfig) {
    const configStr = process.env.ALICLOUD_PUSH_PAPERWORK_SMS_CONFIG;
    if (!configStr || configStr === 'undefined' || configStr.trim() === '') {
      throw new CommonError('ALICLOUD_PUSH_PAPERWORK_SMS_CONFIG is not configured');
    }
    pushPaperworkConfig = JSON.parse(configStr);
  }
  return pushPaperworkConfig;
};

const getSmsClient = () => {
  if (!smsClient) {
    const cfg = getConfig();
    if (!cfg.AccessKeyId || cfg.AccessKeyId === '') {
      throw new CommonError('SMS AccessKeyId is required');
    }
    smsClient = new SMSClient({
      accessKeyId: cfg.AccessKeyId,
      secretAccessKey: cfg.AccessKeySecret,
    });
  }
  return smsClient;
};

/**
 * 发送短信验证码
 * @param {string} phoneNumber - 手机号码
 * @param {string} code - 验证码
 */
export const sendSmsCode = async (phoneNumber: string, code: string) => {
  try {
    const cfg = getConfig();
    const client = getSmsClient();
    const input = {
      PhoneNumbers: phoneNumber, // 接收短信的手机号码
      SignName: cfg.SignName, // 短信签名（需在阿里云控制台配置）
      TemplateCode: cfg.TemplateCode, // 模板CODE（需在阿里云控制台创建模板）
      TemplateParam: JSON.stringify({ code: code }), // 短信模板参数
    };
    console.log(input);
    const result = await client.sendSMS(input);

    if (result.Code === "OK") {
      console.log("短信发送成功:", result);
      return result;
    } else {
      console.error("短信发送失败:", result.Message);
      throw new CommonError("短信发送失败");
    }
  } catch (error: any) {
    console.error("发送短信异常:", error.message);
    throw new CommonError("发送短信异常");
  }
};

export const sendSmsPaperWork = async (
  phoneNumber: string,
  productName: string,
  taskid: string
) => {
  try {
    const cfg = getPushPaperworkConfig();
    const client = getSmsClient();
    const input = {
      PhoneNumbers: phoneNumber, // 接收短信的手机号码
      SignName: cfg.SignName, // 短信签名（需在阿里云控制台配置）
      TemplateCode: cfg.TemplateCode, // 模板CODE（需在阿里云控制台创建模板）
      TemplateParam: JSON.stringify({
        spname: productName,
        taskid: taskid,
        taskid2: taskid,
      }), // 短信模板参数
    };
    console.log(input);
    const result = await client.sendSMS(input);

    if (result.Code === "OK") {
      console.log("短信发送成功:", result);
      return result;
    } else {
      console.error("短信发送失败:", result.Message);
      throw new CommonError("短信发送失败");
    }
  } catch (error: any) {
    console.error("发送短信异常:", error.message);
    throw new CommonError("发送短信异常");
  }
};
