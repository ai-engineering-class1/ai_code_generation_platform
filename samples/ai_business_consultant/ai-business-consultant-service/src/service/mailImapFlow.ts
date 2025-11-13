import {
  MailListen,
  MailInbox,
  MailOutbox,
  // Organization,
  //   EmailCampaignHistory,
  //   MailSender,
  //   EmailList,
  //   EmailListProfile,
  TargetCustomerAnalysis,
  PromotionalLetter,
  CustomerDiscover,
  CustomerRecord,
  CustomerIdentificationFailed,
} from "@/models";
import { CommonError } from "@/errors";
// import axios from "axios";
// import { askChatAiCharacterQuestion } from "@/utils/chatAi";
// import { RedisManager } from "@/utils/staticClass";
// import { subDays } from "date-fns";
import { requestPerplexityJsonParseEmailContent } from "@/utils/chatAi";
const { ImapFlow } = require("imapflow");
const simpleParser = require("mailparser").simpleParser;
import {
  getCustomerProfileCompanyFromChatGPT,
  getCustomerProfilePersonFromChatGPT,
} from "@/utils/chatAi";
// import { fi } from "date-fns/locale";
import { Like } from "typeorm";
// const fs = require("fs");
// const path = require("path");
// const attachmentDir = path.join(__dirname, "attachments");
//   if (!fs.existsSync(attachmentDir)) {
//     fs.mkdirSync(attachmentDir, { recursive: true });
//   }

import redis from "ioredis";

const redisClient = new redis(process.env.REDIS_URL);

const cretaeCustomerIdentificationFailed = async (
  failedReason: string,
  res: string,
  mail: any,
  customerDiscover: CustomerDiscover
) => {
  const { text, html, attachments, ...mailWithoutTextAndHtml } = mail;
  const mailText = JSON.stringify(mailWithoutTextAndHtml);
  await CustomerIdentificationFailed.create({
    prompt: customerDiscover.aiPrompt,
    emailSubject: mail.subject,
    emailText: mail.text,
    failedResponse: failedReason,
    res: res,
    mailText: mailText,
    organizationId: customerDiscover.organizationId,
    customerDiscoverId: customerDiscover.id,
  }).save();
};

export const createCustomerRecord = async (
  source: string,
  mail: any,
  customerDiscover: CustomerDiscover
): Promise<number> => {
  let res = "";
  let count = 0;
  const prompt = customerDiscover.aiPrompt + " Email content： " + mail.text;
  console.log(prompt);
  while (res === "" && count < 3) {
    res = await requestPerplexityJsonParseEmailContent(prompt);
    count++;
  }

  if (res !== "") {
    const resModel = JSON.parse(res);
    // console.log("createCustomerRecord:resModel:");
    // console.log(resModel);
    // if (resModel.newcustomer && resModel.newcustomer === "yes") {
      if (resModel.email && resModel.email !== "") {
        const exist = await CustomerRecord.findOne({
          where: {
            email: resModel.email,
            organizationId: customerDiscover.organizationId,
          },
        });
        if (exist) {
          console.log("createCustomerRecord:客户记录已存在");
          await cretaeCustomerIdentificationFailed(
            "客户记录已存在",
            res,
            mail,
            customerDiscover
          );
          return 0;
        }
      }
      if (!resModel.company || resModel.company.trim() === "") {
        console.log("createCustomerRecord:公司名不存在");
        await cretaeCustomerIdentificationFailed(
          "公司名不存在",
          res,
          mail,
          customerDiscover
        );
        return 0;
      }

      const existTCA = await TargetCustomerAnalysis.findOne({
        name: resModel.company ? resModel.company : "",
        organizationId: customerDiscover.organizationId,
      });
      if (existTCA) {
        console.log("createCustomerRecord:目标客户已存在");
        return existTCA.id;
      }

      if (resModel.email && resModel.email.trim() !== "") {
        const existTCAContact = await TargetCustomerAnalysis.findOne({
          contactInfo: Like(`%${resModel.email}%`),
          organizationId: customerDiscover.organizationId,
        });
        if (existTCAContact) {
          console.log("createCustomerRecord:目标客户邮箱已存在");
          return existTCAContact.id;
        }
      }
      console.log("createCustomerRecord:创建客户记录");
      await CustomerRecord.create({
        name: resModel.name ? resModel.name : "",
        company: resModel.company ? resModel.company : "",
        email: resModel.email ? resModel.email : "",
        interest: resModel.interest ? resModel.interest : "",
        source: source, //"实时监控",
        status: "已添加至目标客户",
        organizationId: customerDiscover.organizationId,
        aiResult: res,
        emailSubject: mail.subject,
        emailContent: mail.text,
        phone: resModel.phone ? resModel.phone : "",
        firstContactDate: resModel.firstContactDate
          ? resModel.firstContactDate
          : "",
        priority: resModel.priority ? resModel.priority : "",
        position: resModel.position ? resModel.position : "",
        receiveDate: new Date(mail.date).toLocaleString(),
        customerDiscoverId: customerDiscover.id,
        userId: customerDiscover.userId,
      }).save();

      customerDiscover.scanSuccessCount = customerDiscover.scanSuccessCount + 1;
      await customerDiscover.save();

      const infoArr: any = [];
      const info = {
        id: "",
        name: resModel.name ? resModel.name : "",
        position: resModel.position ? resModel.position : "",
        phone: resModel.phone ? resModel.phone : "",
        email: resModel.email ? resModel.email : "",
        decisionInfluence: "",
        communicationPreference: "",
      };
      // console.log(info);
      // console.log(JSON.stringify(infoArr.push(info)));
      // console.log(JSON.stringify(infoArr, null, 2));
      infoArr.push(info);
      // console.log(JSON.stringify(infoArr));
      const str = JSON.stringify(infoArr);
      console.log(str);
      console.log("createCustomerRecord:创建目标客户分析");
      const model = await TargetCustomerAnalysis.create({
        name: resModel.company ? resModel.company : "",
        organizationId: customerDiscover.organizationId,
        contactInfo: str,
        customerType: "邮箱添加",
        desc: resModel.interest ? resModel.interest : "",
        customerState: 1,
        customerStateChangeTime: new Date(),
        replyStatus: "待沟通",
        userId: customerDiscover.userId,
      }).save();
      try {
        const input =
          "Please determine the business stage classification based on the customer's email content. The classification criteria are as follows:1. Lead: Initial contact, potentially interested in your product/service. 2. Prospect: Lead has been qualified and is actively being pursued. 3. Needs Analysis: You're exploring their needs and understanding their requirements. 4. Proposal: You've presented a proposal or solution. 5. Closed Won: The deal is finalized and the customer is a new client. 6. Closed Lost: The deal was not successful, and the customer is not a client.Requirements: Only return the corresponding number for the classification (e.g., 1, 2, 3, 4, 5, 6) as the judgment result. Do not output anything other than the number. Please make a reasonable inference based on the email content:" +
          mail.text;
        const resState = await requestPerplexityJsonParseEmailContent(input);
        if (resState && resState !== 0) {
          model.customerState = resState;
          model.customerStateChangeTime = new Date();
          await model.save();
        }
        // model.customerState =
        //   resState && resState !== 0 ? resState : model.customerState;
        // await model.save();
        if (model.name && model.name.trim() !== "") {
          console.log("getCustomerProfileCompanyFromChatGPT: 获取公司信息");
          const resCompany = await getCustomerProfileCompanyFromChatGPT(
            model.name
          );
          if (resCompany) {
            model.createDate = resCompany.basic_info.founded;
            model.business =
              resCompany.products_and_services.products.join("，"); // + "，" + res.products_and_services.products.join("，");
            model.service =
              resCompany.products_and_services.solutions.join("，");
            model.desc = resCompany.basic_info.description;
            model.enterpriseScale = resCompany.organization_data.company_size
              ? resCompany.organization_data.company_size
              : "";
            model.industryType = resCompany.basic_info.industry;
            model.companyType = resCompany.organization_data.company_size;
            model.website = resCompany.online_presence.website;
          }
          if (
            model.contactInfo &&
            model.contactInfo.trim() !== "" &&
            model.contactInfo.trim() !== "[]"
          ) {
            const contactArr = JSON.parse(model.contactInfo);
            const contact = contactArr[0];
            if (contact && contact.email) {
              console.log("getCustomerProfilePersonFromChatGPT: 获取个人信息");
              const resPerson = await getCustomerProfilePersonFromChatGPT(
                contact.email
              );
              if (resPerson) {
                const workExperienceArr = [];
                if (resPerson.employment_history.length > 0) {
                  for (const item of resPerson.employment_history) {
                    workExperienceArr.push({
                      companyName: item.organization_name,
                      position: item.title,
                      workingHours: item.start_date,
                    });
                  }
                }
                const info = {
                  id: resPerson.id,
                  name: resPerson.name,
                  position: resPerson.title,
                  phone:
                    contact.phone && contact.phone.trim() !== ""
                      ? contact.phone
                      : resPerson.organization.phone,
                  email: resPerson.email,
                  decisionInfluence: "高",
                  communicationPreference: "邮箱",
                  address: resPerson.country
                    ? resPerson.country +
                      " " +
                      resPerson.city +
                      " " +
                      resPerson.state
                    : "",
                  workExperience: workExperienceArr,
                };
                contactArr.length = 0;
                contactArr.push(info);
                model.contactInfo = JSON.stringify(contactArr);
                await model.save();
              }
            }
          }
        }
      } catch (error) {
        console.log("大模型获取客户数据解析失败");
        model.failedReason = "大模型获取客户数据解析失败";
        await model.save();
      } finally {
        return model.id;
      }
    // } else {
    //   await cretaeCustomerIdentificationFailed(
    //     "不是客户",
    //     res,
    //     mail,
    //     customerDiscover
    //   );

    //   return 0;
    // }
  }
  console.log("createCustomerRecord:大模型识别邮件失败");
  await cretaeCustomerIdentificationFailed(
    "大模型识别邮件失败",
    res,
    mail,
    customerDiscover
  );
  return 0;
};

// 监听实时邮件
export const imapFlowStartListenActive = async (model: MailListen) => {
  const silentLogger = {
    trace: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: console.error,
    fatal: () => {},
  };
  const client = new ImapFlow({
    host: model.imapHost,
    port: model.imapPort,
    secure: true,
    auth: {
      user: model.email,
      pass: model.password,
    },
    logger: silentLogger,
  });

  try {
    await client.connect();
    await client.mailboxOpen("INBOX");
    // const yesterday = new Date(Date.now() - 60 * 60 * 1000); // 1 小时内
    // const messageSequence = await client.search({
    //   since: yesterday,
    // });
    // 获取所有邮件的 UID（注意：这会包括所有邮件）
    const uids = await client.search({});
    const messageSequence = uids.slice(-20);

    // const uids = await client.search({ seen: false });
    // const messageSequence = uids.slice(0, 20);
    console.log("Connected to mailbox");
    const messages = [];

    for await (let msg of client.fetch(messageSequence, {
      envelope: true,
      source: true,
    })) {
      // console.log(msg);
      // console.log(JSON.stringify(msg.envelope));
      const parsed = await simpleParser(msg.source, { skipAttachments: true });
      let messageId = await redisClient.get(`messageId:${parsed.messageId}`);
      if (!messageId) {
        messages.push(parsed);
        redisClient.set(`messageId:${parsed.messageId}`, 1, "EX", 48 * 60 * 60);
      }
    }

    messages.forEach(async (mail) => {
      const inbox = await MailInbox.findOne({
        messageId: mail.messageId,
      });
      if (inbox) {
        return;
      }

      const now = Math.floor(new Date().getTime() / 1000);
      const msgTime = Math.floor(mail.date.getTime() / 1000);
      console.log(`nowTime: ${new Date().toLocaleString()}`);
      console.log(`msgTime: ${new Date(mail.date).toLocaleString()}`);
      if (now - msgTime >= 600) {
        console.log("邮件时间过久，不处理");
        return;
      }

      if (!inbox) {
        let tId = null;
        let pId: number | null | undefined = null;
        // const match = mail.html.match(/<!-- Inquiry ID: (\w+-\d+) -->/);
        if (mail.html && mail.html !== "") {
          // const match = mail.html.match(/Tracking Code:\s*([A-Z]+-\d{13}-\d+)/);
          const matchPL = mail.html.match(/PL Code:\s*([A-Z]+-\d{13}-\d+)/);

          const tModel = await TargetCustomerAnalysis.findOne({
            where: {
              organizationId: model.organizationId,
              contactInfo: Like(`%${mail.from.value[0].address}%`),
            },
          });
          if (tModel) {
            // const input =
            //   "请根据客户邮件内容判断其所属的业务阶段分类。分类标准如下：2：意向阶段客户符合目标客户特征，并表现出一定的兴趣或购买意向，适合后续跟进。3：沟通交流阶段客户已展现明确需求，具备购买能力，当前处于与销售团队的初步交流阶段。4：洽谈阶段客户正在与我们就方案、价格、合同等具体细节进行深入沟通，接近成交。5：签约客户客户已完成签约或下单，并正在使用产品或服务，双方保持持续互动。6：暂缓跟进客户曾有合作，但近期沟通较少，暂未表现出进一步合作意愿。7：流失客户客户长期未互动或已明确终止合作，暂不活跃，需重点挽回。0：无法判断邮件内容中未能体现以上任一情况。要求：仅返回分类对应的数字（如：2、3、4、5、6、7或0）作为判断结果。不输出除数字以外的内容。请根据邮件内容进行合理推断。" +
            //   mail.text;

            const input =
              "Please determine the business stage classification based on the customer's email content. The classification criteria are as follows:1. Lead: Initial contact, potentially interested in your product/service. 2. Prospect: Lead has been qualified and is actively being pursued. 3. Needs Analysis: You're exploring their needs and understanding their requirements. 4. Proposal: You've presented a proposal or solution. 5. Closed Won: The deal is finalized and the customer is a new client. 6. Closed Lost: The deal was not successful, and the customer is not a client.Requirements: Only return the corresponding number for the classification (e.g., 1, 2, 3, 4, 5, 6) as the judgment result. Do not output anything other than the number. Please make a reasonable inference based on the email content:" +
              mail.text;
            const res = await requestPerplexityJsonParseEmailContent(input);
            if (res && res !== 0) {
              tModel.customerState = res;
              tModel.customerStateChangeTime = new Date();
            }

            tId = tModel.id;
            tModel.replyStatus = "已回复";
            tModel.traceStatus = "";
            tModel.countdown = null;
            tModel.receiveEmailTime = new Date();
            await tModel.save();

            if (matchPL !== null) {
              const inquiryId = matchPL[1];
              console.log(`邮件 Inquiry ID: ${inquiryId}`);
              const id = inquiryId.split("-")[2];
              const category = inquiryId.split("-")[0];
              if (category && category === "PL") {
                if (id) {
                  const tModel = await PromotionalLetter.findOne(id);
                  if (tModel) {
                    pId = tModel.id;
                  }
                }
              }
            }

            await MailInbox.create({
              organizationId: model.organizationId,
              messageId: mail.messageId,
              subject: mail.subject,
              from: mail.from["value"][0].address,
              fromName: mail.from["value"][0].name,
              to: mail.to["value"][0].address,
              text: mail.text ? mail.text : "",
              html: mail.html,
              receiveTime: mail.date,
              targetCustomerAnalysisId: tId ? tId : null,
              promotionalLetterId: pId ? pId : null,
              customerDiscoverId: model.customerDiscoverId
                ? model.customerDiscoverId
                : null,
              inReplyTo: mail.inReplyTo,
              userId: model.userId,
            }).save();
          } else {
            let discoverTargetCustomerAnalysisId: number | null | undefined = null;
            const customerDiscovers = await CustomerDiscover.find({
              where: {
                mailListenId: model.id,
                enableListen: 1,
                type: 1,
              },
            });
            console.log(`实时监控添加客户:{${customerDiscovers.length}}`);
            if (customerDiscovers.length > 0) {
              customerDiscovers.forEach(async (customerDiscover) => {
                customerDiscover.scanCount = customerDiscover.scanCount + 1;
                await customerDiscover.save();
  
                const from = mail.from["value"][0].address;
                const address = from.split("@")[1];
                if (
                  customerDiscover.titleFilter &&
                  customerDiscover.titleFilter !== ""
                ) {
                  if (customerDiscover.titleFilter === mail.subject) {
                    if (
                      customerDiscover.exceptEmails &&
                      customerDiscover.exceptEmails !== ""
                    ) {
                      if (!customerDiscover.exceptEmails.includes(address)) {
                        console.log("createCustomerRecord");
                        discoverTargetCustomerAnalysisId =
                          await createCustomerRecord(
                            "实时监控",
                            mail,
                            customerDiscover
                          );
                      }
                    }
                  } else {
                    console.log("createCustomerRecord");
                    discoverTargetCustomerAnalysisId = await createCustomerRecord(
                      "实时监控",
                      mail,
                      customerDiscover
                    );
                  }
                } else {
                  console.log("createCustomerRecord");
                  discoverTargetCustomerAnalysisId = await createCustomerRecord(
                    "实时监控",
                    mail,
                    customerDiscover
                  );
                }
                await MailInbox.create({
                  organizationId: model.organizationId,
                  messageId: mail.messageId,
                  subject: mail.subject,
                  from: mail.from["value"][0].address,
                  fromName: mail.from["value"][0].name,
                  to: mail.to["value"][0].address,
                  text: mail.text ? mail.text : "",
                  html: mail.html,
                  receiveTime: mail.date,
                  targetCustomerAnalysisId:
                    discoverTargetCustomerAnalysisId !== null &&
                    discoverTargetCustomerAnalysisId !== 0
                      ? discoverTargetCustomerAnalysisId
                      : null,
                  promotionalLetterId: pId ? pId : null,
                  customerDiscoverId: model.customerDiscoverId
                    ? model.customerDiscoverId
                    : null,
                  inReplyTo: mail.inReplyTo,
                  userId: model.userId,
                }).save();
              });
            }else{
              await MailInbox.create({
                organizationId: model.organizationId,
                messageId: mail.messageId,
                subject: mail.subject,
                from: mail.from["value"][0].address,
                fromName: mail.from["value"][0].name,
                to: mail.to["value"][0].address,
                text: mail.text ? mail.text : "",
                html: mail.html,
                receiveTime: mail.date,
                targetCustomerAnalysisId:
                  discoverTargetCustomerAnalysisId !== null &&
                  discoverTargetCustomerAnalysisId !== 0
                    ? discoverTargetCustomerAnalysisId
                    : null,
                promotionalLetterId: pId ? pId : null,
                customerDiscoverId: model.customerDiscoverId
                  ? model.customerDiscoverId
                  : null,
                inReplyTo: mail.inReplyTo,
                userId: model.userId,
              }).save();
            }
            
            // if (model.customerDiscoverId) {
            //   console.log("实时监控添加客户");
            //   const customerDiscover = await CustomerDiscover.findOne(
            //     model.customerDiscoverId
            //   );
            //   if (
            //     customerDiscover &&
            //     customerDiscover.enableListen === 1 &&
            //     customerDiscover.type === 1
            //   ) {

            //   }
            // }

            
          }

          // if (match !== null) {
          //   const inquiryId = match[1];
          //   console.log(`邮件 Inquiry ID: ${inquiryId}`);
          //   const id = inquiryId.split("-")[2];
          //   const category = inquiryId.split("-")[0];
          //   if (category && category === "TCA") {
          //     const tModel = await TargetCustomerAnalysis.findOne(id);
          //     if (id) {
          //       if (tModel) {
          //         const input =
          //           "请根据客户邮件内容判断其所属的业务阶段分类。分类标准如下：2：意向阶段客户符合目标客户特征，并表现出一定的兴趣或购买意向，适合后续跟进。3：沟通交流阶段客户已展现明确需求，具备购买能力，当前处于与销售团队的初步交流阶段。4：洽谈阶段客户正在与我们就方案、价格、合同等具体细节进行深入沟通，接近成交。5：签约客户客户已完成签约或下单，并正在使用产品或服务，双方保持持续互动。6：暂缓跟进客户曾有合作，但近期沟通较少，暂未表现出进一步合作意愿。7：流失客户客户长期未互动或已明确终止合作，暂不活跃，需重点挽回。0：无法判断邮件内容中未能体现以上任一情况。要求：仅返回分类对应的数字（如：2、3、4、5、6、7或0）作为判断结果。不输出除数字以外的内容。请根据邮件内容进行合理推断。" +
          //           mail.text;
          //         const res = await requestPerplexityJsonParseEmailContent(
          //           input
          //         );
          //         tModel.customerState =
          //           res && res !== 0 ? res : tModel.customerState;
          //         tId = tModel.id;
          //         tModel.replyStatus = "已回复";
          //         await tModel.save();
          //       }
          //     }
          //   }
          //   // 你可以在数据库中查找对应的请求并处理
          // }
        } else {
          console.log("邮件内容为空，不处理");
          console.log("mail.html");
          console.log(mail.html);
        }

        if (tId) {
          return;
        }

        // if (now - msgTime < 120) {
        //   console.log(`new msg:${JSON.stringify(newMsg)}`);

        //   let answer = "";
        //   try {
        //     const res = await axios.post(
        //       "https://api.perplexity.ai/chat/completions",
        //       {
        //         model: "sonar-pro",
        //         messages: [
        //           {
        //             role: "system",
        //             content: "Be precise and concise.",
        //           },
        //           {
        //             role: "user",
        //             content:
        //               "根据下面客户的邮件帮我写一封回复的邮件，直接给我可以回复的邮件，不要带上其他无关的东西。邮件内容：" +
        //               mail.text,
        //           },
        //         ],
        //       },
        //       {
        //         headers: {
        //           accept: "application/json",
        //           "content-type": "application/json",
        //           Authorization: `Bearer ${process.env.PERPLEXITY_APIKEY}`,
        //         },
        //       }
        //     );
        //     console.log(`data:${JSON.stringify(res.data)}`);
        //     answer = res.data.choices[0].message.content;
        //   } catch (error: any) {
        //     console.log("大模型请求失败");
        //     answer = "";
        //     // if (error.response) {
        //     //   throw new CommonError(JSON.stringify(error.response.data));
        //     // } else if (error.request) {
        //     //   throw new CommonError(JSON.stringify(error.request));
        //     // } else {
        //     //   throw new CommonError(error.message);
        //     // }
        //   }
        //   if (answer === "") {
        //     return;
        //   }
        //   answer = answer + `<br/><br/><p>Best regards.</p><br/>`;
        //   if (model.signiture && model.signiture !== "") {
        //     answer = answer + model.signiture;
        //   } else {
        //     const org = await Organization.findOneOrFail(model.organizationId);
        //     answer = answer + `${org.name} ChatAI`;
        //   }
        //   answer =
        //     answer +
        //     `<br/><p>------------------ Original ------------------</p><p>From: "${newMsg.fromName}" &lt;${newMsg.from}&gt;</p><p>Date: ${mail.date}</p><p>To: "${mail.to["value"][0].name}" &lt;${newMsg.to}&gt;</p><p>Subject: ${newMsg.subject}</p><p>${newMsg.html}</p><br/>`;

        //   const emailInput = {
        //     subject: `Re: ${mail.subject}`,
        //     contacts: newMsg.from,
        //     text: answer,
        //     html: answer,
        //     bcc: model.bcc ? model.bcc : "",
        //   };
        //   sendMailFromMailSender(model, emailInput);
        //   await MailOutbox.create({
        //     subject: `Re: ${mail.subject}`,
        //     from: model.email,
        //     fromName: `${model.firstName} ${model.lastName}`,
        //     to: newMsg.from,
        //     text: answer,
        //     html: answer,
        //     sendTime: new Date(),
        //     organizationId: model.organizationId,
        //   }).save();
        // }
      }
    });

    console.log(`Fetched ${messages.length} mails`);
    // await client.logout();
    return "success";
  } catch (err: any) {
    return err.response;
  } finally {
    console.log("Closing connection");
    await client.logout();
  }
};

// 发送邮件
export const sendMailFromMailSender = async (model: any, emailInfo: any) => {
  const nodemailer = require("nodemailer");
  try {
    var transporter = nodemailer.createTransport({
      // 邮箱服务的host： 9q: smtp.qq.com; 163:smtp.163.com
      host: model.smtpHost,
      secureConnection: true,
      // SMTP协议端口号
      port: model.smtpPort,
      auth: {
        user: model.email,
        pass: model.password,
      },
      tls: {
        rejectUnauthorized: false, // 拒绝认证就行了，不然会报证书问题
      },
    });
    // 配置发送內容
    var mailoptions = {
      //发件人邮箱
      from: `${model.firstName} ${model.lastName}<${model.email}>`, //model.email,
      // 收件人邮箱，多个邮箱地址用逗号隔开
      to: emailInfo.contacts,
      bcc: emailInfo.bcc ? emailInfo.bcc : "",
      // 邮件主题
      subject: emailInfo.subject,
      //邮件内容 text：纯文本；html：识别标签
      text: emailInfo.text,
      html: emailInfo.html,
      attachments:
        emailInfo.attachments && emailInfo.attachments !== ""
          ? JSON.parse(emailInfo.attachments)
          : [],
    };
    console.log(mailoptions);
    return await new Promise(async (resolve) => {
      await transporter.sendMail(mailoptions, (err: any, info: any) => {
        if (err) {
          console.log("err");
          console.log(err);
          // throw new CommonError(err.message);
          resolve(false);
        } else {
          console.log("info");
          console.log(info);
          resolve(true);
        }
      });
    });
  } catch (error: any) {
    throw new CommonError(error.message);
  }
};

// 监听历史邮件
export const imapFlowStartListenHistory = async (
  model: MailListen,
  customerDiscover: CustomerDiscover
) => {
  const silentLogger = {
    trace: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: console.error,
    fatal: () => {},
  };
  const client = new ImapFlow({
    host: model.imapHost,
    port: model.imapPort,
    secure: true,
    auth: {
      user: model.email,
      pass: model.password,
    },
    logger: silentLogger,
  });

  try {
    await client.connect();
    await client.mailboxOpen("INBOX");
    // const yesterday = new Date(Date.now() - 60 * 60 * 1000); // 24 小时内
    // // 只拉取最近 1 天的邮件
    // const messageSequence = await client.search({
    //   since: yesterday,
    // });
    console.log("Connected to mailbox");
    const messages = [];
    for await (let msg of client.fetch("1:*", {
      // for await (let msg of client.fetch(messageSequence, {
      envelope: true,
      source: true,
    })) {
      // console.log(msg);
      // console.log(JSON.stringify(msg.envelope));
      const parsed = await simpleParser(msg.source);
      messages.push(parsed);
    }

    messages.forEach(async (mail) => {
      //   console.log("--- 邮件信息 ---");
      //   console.log("主题:", parsed.subject);
      //   console.log("发件人:", parsed.from.value[0].address);
      //   console.log(
      //     "收件人:",
      //     parsed.to.value.length > 0 ? parsed.to.value[0].address : ""
      //   );
      //   console.log("时间:", new Date(parsed.date).toLocaleString());
      //   // console.log("正文文本:", parsed.text);
      //   // console.log("正文HTML:", parsed.html);
      //   console.log("msgId:", parsed.messageId);
      //   console.log("replyId:", parsed.inReplyTo);
      const inbox = await MailInbox.findOne({
        messageId: mail.messageId,
      });
      // console.log("inbox:" + inbox ? "true" : "false");
      // if (!inbox) {
      customerDiscover.scanCount = customerDiscover.scanCount + 1;
      await customerDiscover.save();
      const time = new Date(mail.date);
      if (
        customerDiscover.scanStartTime &&
        time < customerDiscover.scanStartTime
      ) {
        return;
      }
      if (customerDiscover.scanEndTime && time > customerDiscover.scanEndTime) {
        return;
      }
      if (customerDiscover.titleFilter && customerDiscover.titleFilter !== "") {
        if (customerDiscover.titleFilter !== mail.subject) {
          return;
        }
      }
      console.log("from:" + mail.to["value"][0].address);
      console.log("subject:" + mail.subject);
      // console.log("text:"+mail.text);
      // console.log("html:"+mail.html);
      console.log("date" + mail.date);
      const discoverTargetCustomerAnalysisId = await createCustomerRecord(
        "历史导入",
        mail,
        customerDiscover
      );
      if (!inbox) {
        await MailInbox.create({
          organizationId: model.organizationId,
          messageId: mail.messageId,
          subject: mail.subject,
          from: mail.from["value"][0].address,
          fromName: mail.from["value"][0].name,
          to: model.email,
          text: mail.text ? mail.text : "",
          html: mail.html,
          receiveTime: mail.date,
          targetCustomerAnalysisId:
            discoverTargetCustomerAnalysisId !== null &&
            discoverTargetCustomerAnalysisId === 0
              ? discoverTargetCustomerAnalysisId
              : null,
          // promotionalLetterId: pId ? pId : null,
          customerDiscoverId: customerDiscover.id,
          inReplyTo: mail.inReplyTo,
          userId: model.userId,
        }).save();
      }

      // }
    });

    console.log(`Fetched ${messages.length} mails`);
    await client.logout();
    return "success";
  } catch (err: any) {
    return err.response;
  }
};

// 测试邮箱连接
export const testImapFlowConnection = async (model: any) => {
  const silentLogger = {
    trace: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: console.error,
    fatal: () => {},
  };
  const client = new ImapFlow({
    host: model.imapHost,
    port: model.imapPort,
    secure: true,
    auth: {
      user: model.email,
      pass: model.password,
    },
    logger: silentLogger,
  });

  try {
    await client.connect();
    await client.mailboxOpen("INBOX");
    await client.logout();
    return "success";
  } catch (err: any) {
    return err.response;
  }
};

async function findSentMailbox(client: any) {
  const sentKeywords = ["sent", "已发送", "发件箱", "发送"]; // 支持中英文关键词
  let sentMailboxPath = null;

  try {
    const mailboxes = await client.list("", "*");
    for (const mailbox of mailboxes) {
      const path = (mailbox.path || "").toLowerCase();
      console.log("检查文件夹:", path);

      if (sentKeywords.some((keyword) => path.includes(keyword))) {
        sentMailboxPath = mailbox.path;
        console.log("✅ 找到发件箱:", sentMailboxPath);
        break; // 找到一个就停
      }
    }

    if (!sentMailboxPath) {
      console.warn("⚠️ 没找到发件箱，请人工检查");
    }

    return sentMailboxPath;
  } catch (err) {
    console.error("查找发件箱失败:", err);
    return null;
  }
}

// 导入发件箱邮件历史
export const imapFlowImportSentMessagesBoxHistory = async (model: any) => {
  const silentLogger = {
    trace: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: console.error,
    fatal: () => {},
  };
  const client = new ImapFlow({
    host: model.imapHost,
    port: model.imapPort,
    secure: true,
    auth: {
      user: model.email,
      pass: model.password,
    },
    logger: silentLogger,
  });

  try {
    await client.connect();
    const sentMailbox = await findSentMailbox(client);
    if (sentMailbox) {
      await client.mailboxOpen(sentMailbox); // 直接打开发件箱
      console.log("成功打开发件箱:", sentMailbox);
    } else {
      console.log("未找到发件箱，请人工检查");
      return "未找到发件箱，请人工检查";
    }
    // await client.mailboxOpen("Sent Messages"); // 替换为你真实的发件箱路径

    let messages = await client.fetch("1:*", {
      envelope: true,
      uid: true,
      source: true,
    });
    const uuid = require("uuid");
    const messagesArr = [];
    for await (let message of messages) {
      const parsed = await simpleParser(message.source);
      messagesArr.push(parsed);
    }
    for (const mail of messagesArr) {
      const tcaModel = await TargetCustomerAnalysis.findOne({
        where: {
          organizationId: model.organizationId,
          contactInfo: Like(`%${mail.to.value[0].address}%`),
        },
      });
      const existMsg = await MailOutbox.findOne({
        organizationId: model.organizationId,
        messageId: mail.messageId,
      });
      if (existMsg) {
        if (tcaModel && existMsg.targetCustomerAnalysisId === null) {
          existMsg.targetCustomerAnalysisId = tcaModel ? tcaModel.id : null;
          await existMsg.save();
        }
        console.log("邮件已存在，跳过");
        continue;
      }

      const uuidStr = uuid.v1();
      await MailOutbox.create({
        subject: mail.subject,
        from: mail.from.value[0].address,
        fromName: mail.from.value[0].name,
        to: mail.to.value[0].address,
        text: mail.text,
        html: mail.html,
        sendTime: new Date(mail.date),
        organizationId: model.organizationId,
        sendStatus: "done",
        targetCustomerAnalysisId: tcaModel ? tcaModel.id : null,
        uuid: uuidStr,
        messageId: mail.messageId,
        inReplyTo: mail.inReplyTo,
        userId: model.userId,
      }).save();
    }
    return "success";
  } catch (err: any) {
    return err.response;
  } finally {
    await client.logout();
  }
};

// 导入发件箱邮件最近一小时记录
export const imapFlowImportSentMessagesBoxActive = async (model: any) => {
  const silentLogger = {
    trace: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: console.error,
    fatal: () => {},
  };
  const client = new ImapFlow({
    host: model.imapHost,
    port: model.imapPort,
    secure: true,
    auth: {
      user: model.email,
      pass: model.password,
    },
    logger: silentLogger,
  });

  try {
    await client.connect();
    const sentMailbox = await findSentMailbox(client);
    if (sentMailbox) {
      await client.mailboxOpen(sentMailbox); // 直接打开发件箱
      console.log("成功打开发件箱:", sentMailbox);
    } else {
      console.log("未找到发件箱，请人工检查");
      return "未找到发件箱，请人工检查";
    }
    // await client.mailboxOpen("Sent Messages"); // 替换为你真实的发件箱路径

    // const yesterday = new Date(Date.now() - 60 * 60 * 1000); // 24 小时内
    // const messageSequence = await client.search({
    //   since: yesterday,
    // });
    const allUids = await client.search({});
    const messageSequence = allUids.slice(-20);
    // let messages = await client.fetch(messageSequence, {
    //   envelope: true,
    //   uid: true,
    //   source: true,
    // });
    const uuid = require("uuid");
    const messagesArr = [];
    for await (let message of client.fetch(messageSequence, {
      envelope: true,
      uid: true,
      source: true,
    })) {
      // const parsed = await simpleParser(message.source);
      // messagesArr.push(parsed);

      const parsed = await simpleParser(message.source, {
        skipAttachments: true,
      });
      let messageId = await redisClient.get(
        `send_messageId:${parsed.messageId}`
      );
      if (!messageId) {
        messagesArr.push(parsed);
        redisClient.set(
          `send_messageId:${parsed.messageId}`,
          1,
          "EX",
          48 * 60 * 60
        );
      }
    }

    // for await (let message of messages) {
    //   const parsed = await simpleParser(message.source);
    //   messagesArr.push(parsed);

    // }
    for (const mail of messagesArr) {
      const tcaModel = await TargetCustomerAnalysis.findOne({
        where: {
          organizationId: model.organizationId,
          contactInfo: Like(`%${mail.to.value[0].address}%`),
        },
      });
      const existMsg = await MailOutbox.findOne({
        organizationId: model.organizationId,
        messageId: mail.messageId,
      });
      if (existMsg) {
        console.log("邮件已存在，跳过");
        if (tcaModel && existMsg.targetCustomerAnalysisId === null) {
          existMsg.targetCustomerAnalysisId = tcaModel ? tcaModel.id : null;
          await existMsg.save();
        }
        continue;
      }
      if (tcaModel) {
        const input =
          "Please determine the business stage classification based on the customer's email content. The classification criteria are as follows:1. Lead: Initial contact, potentially interested in your product/service. 2. Prospect: Lead has been qualified and is actively being pursued. 3. Needs Analysis: You're exploring their needs and understanding their requirements. 4. Proposal: You've presented a proposal or solution. 5. Closed Won: The deal is finalized and the customer is a new client. 6. Closed Lost: The deal was not successful, and the customer is not a client.Requirements: Only return the corresponding number for the classification (e.g., 1, 2, 3, 4, 5, 6) as the judgment result. Do not output anything other than the number. Please make a reasonable inference based on the email content:" +
          mail.text;
        const res = await requestPerplexityJsonParseEmailContent(input);
        // tcaModel.customerState =
        //   res && res !== 0 ? res : tcaModel.customerState;
        if (res && res !== 0) {
          tcaModel.customerState = res;
          tcaModel.customerStateChangeTime = new Date();
        }
        tcaModel.replyStatus = "已发送";
        tcaModel.traceStatus = "待跟进";
        tcaModel.countdown = 7;
        await tcaModel.save();
      }

      console.log("发现新的发送邮件：" + mail.subject);
      // console.log(mail);
      const uuidStr = uuid.v1();
      await MailOutbox.create({
        subject: mail.subject ? mail.subject : "",
        from: mail.from.value[0].address,
        fromName: mail.from.value[0].name,
        to: mail.to.value[0].address,
        text: mail.text,
        html: mail.html,
        sendTime: new Date(mail.date),
        organizationId: model.organizationId,
        sendStatus: "done",
        targetCustomerAnalysisId: tcaModel ? tcaModel.id : null,
        uuid: uuidStr,
        messageId: mail.messageId,
        inReplyTo: mail.inReplyTo,
        userId: model.userId,
      }).save();
    }
    console.log(`Fetched ${messagesArr.length} mails`);
    return "success";
  } catch (err: any) {
    return err.response;
  } finally {
    await client.logout();
  }
};
