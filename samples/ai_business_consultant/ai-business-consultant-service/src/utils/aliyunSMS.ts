import { CommonError } from "@/errors";
const SMSClient = require("@alicloud/sms-sdk");

const config = JSON.parse(process.env.ALICLOUD_SMS_CONFIG);

const pushPaperworkConfig = JSON.parse(
  process.env.ALICLOUD_PUSH_PAPERWORK_SMS_CONFIG
);

// 阿里云 AccessKey 信息
const accessKeyId = config.AccessKeyId;
const accessKeySecret = config.AccessKeySecret;

// 初始化短信客户端
const smsClient = new SMSClient({
  accessKeyId: accessKeyId,
  secretAccessKey: accessKeySecret,
});

/**
 * 发送短信验证码
 * @param {string} phoneNumber - 手机号码
 * @param {string} code - 验证码
 */
export const sendSmsCode = async (phoneNumber: string, code: string) => {
  try {
    const input = {
      PhoneNumbers: phoneNumber, // 接收短信的手机号码
      SignName: config.SignName, // 短信签名（需在阿里云控制台配置）
      TemplateCode: config.TemplateCode, // 模板CODE（需在阿里云控制台创建模板）
      TemplateParam: JSON.stringify({ code: code }), // 短信模板参数
    };
    console.log(input);
    const result = await smsClient.sendSMS(input);

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
    const input = {
      PhoneNumbers: phoneNumber, // 接收短信的手机号码
      SignName: pushPaperworkConfig.SignName, // 短信签名（需在阿里云控制台配置）
      TemplateCode: pushPaperworkConfig.TemplateCode, // 模板CODE（需在阿里云控制台创建模板）
      TemplateParam: JSON.stringify({
        spname: productName,
        taskid: taskid,
        taskid2: taskid,
      }), // 短信模板参数
    };
    console.log(input);
    const result = await smsClient.sendSMS(input);

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
