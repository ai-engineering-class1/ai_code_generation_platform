// var { MailListener } = require("mail-listener5");
// import {
//   MailListen,
//   MailInbox,
//   MailOutbox,
//   Organization,
//   EmailCampaignHistory,
//   MailSender,
//   EmailList,
//   EmailListProfile,
//   TargetCustomerAnalysis,
//   PromotionalLetter,
//   CustomerDiscover,
//   CustomerRecord,
// } from "@/models";
import { CommonError } from "@/errors";
// import axios from "axios";
// // import { askChatAiCharacterQuestion } from "@/utils/chatAi";
// import { RedisManager } from "@/utils/staticClass";
// import { subDays } from "date-fns";
// import { requestPerplexityJsonParseEmailContent } from "@/utils/chatAi";
// // const fs = require("fs");
// // const path = require("path");
// // const attachmentDir = path.join(__dirname, "attachments");
// //   if (!fs.existsSync(attachmentDir)) {
// //     fs.mkdirSync(attachmentDir, { recursive: true });
// //   }

// const createCustomerRecord = async (
//   // organizationId: number,
//   source: string,
//   mail: any,
//   // aiPrompt: string,
//   customerDiscover: CustomerDiscover
// ) => {
//   let res = "";
//   let count = 0;
//   const prompt = customerDiscover.aiPrompt + " Email content： " + mail.text;
//   console.log(prompt);
//   while (res === "" && count < 3) {
//     res = await requestPerplexityJsonParseEmailContent(prompt);
//     count++;
//   }

//   if (res !== "") {
//     const resModel = JSON.parse(res);
//     // console.log("createCustomerRecord:resModel:");
//     // console.log(resModel);
//     if (resModel.newcustomer && resModel.newcustomer === "yes") {
//       if (resModel.email && resModel.email !== "") {
//         const exist = await CustomerRecord.findOne({
//           where: {
//             email: resModel.email,
//             organizationId: customerDiscover.organizationId,
//           },
//         });
//         if (exist) {
//           return;
//         }
//       }
//       customerDiscover.scanSuccessCount = customerDiscover.scanSuccessCount + 1;
//       await customerDiscover.save();

//       await CustomerRecord.create({
//         name: resModel.name ? resModel.name : "",
//         company: resModel.company ? resModel.company : "",
//         email: resModel.email ? resModel.email : "",
//         interest: resModel.interest ? resModel.interest : "",
//         source: source, //"实时监控",
//         status: "已添加至目标客户",
//         organizationId: customerDiscover.organizationId,
//         aiResult: res,
//         emailSubject: mail.subject,
//         emailContent: mail.text,
//         phone: resModel.phone ? resModel.phone : "",
//         firstContactDate: resModel.firstContactDate
//           ? resModel.firstContactDate
//           : "",
//         priority: resModel.priority ? resModel.priority : "",
//         position: resModel.position ? resModel.position : "",
//         receiveDate: new Date(mail.date).toLocaleString(),
//         customerDiscoverId: customerDiscover.id,
//       }).save();

//       await TargetCustomerAnalysis.create({
//         name: resModel.company ? resModel.company : "",
//         organizationId: customerDiscover.organizationId,
//         contactInfo: res,
//       }).save();
//     }
//   }
// };

// export const mailListenerStart = async (model: MailListen) => {
//   //   var { MailListener } = require("mail-listener5");
//   model.errInfo = "";
//   await model.save();
//   // const emailDate = new Date().getTime();
//   // const formattedDate = emailDate.toUTCString().split(' ').slice(1, 4).join('-'); // "07-Apr-2025"
//   const emailDate = new Date();
//   const formattedDate = emailDate
//     .toUTCString()
//     .split(" ")
//     .slice(1, 4)
//     .join("-"); // "07-Apr-2025"
//   var mailListener = new MailListener({
//     username: model.email,
//     password: model.password,
//     host: model.imapHost,
//     port: model.imapPort, // imap port
//     tls: true,
//     connTimeout: 10000, // Default by node-imap
//     authTimeout: 5000, // Default by node-imap,
//     debug: console.log, // Or your custom function with only one incoming argument. Default: null
//     autotls: "never", // default by node-imap
//     tlsOptions: { rejectUnauthorized: false },
//     mailbox: "INBOX", // mailbox to monitor
//     searchFilter: ["UNSEEN", ["SINCE", formattedDate]], // the search filter being used after an IDLE notification has been retrieved
//     markSeen: true, // all fetched email willbe marked as seen and not fetched next time
//     fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
//     attachments: false, // download attachments as they are encountered to the project directory
//     attachmentOptions: { directory: "attachments/" }, // specify a download directory for attachments
//   });

//   mailListener.start();

//   mailListener.on("server:connected", function () {
//     console.log("连接成功🔗");
//     console.log("imapConnected");
//   });

//   mailListener.on("mailbox", function (mailbox: { messages: { total: any } }) {
//     console.log("Total number of mails: ", mailbox.messages.total); // this field in mailbox gives the total number of emails
//   });

//   mailListener.on("server:disconnected", async function () {
//     console.log("断开连接🔗");
//     console.log(mailListener.imap._config);
//     const config = mailListener.imap._config;
//     const listener = await MailListen.findOne({
//       email: config.user,
//       password: config.password,
//     });
//     console.log(
//       "listener: " +
//         listener?.firstName +
//         listener?.lastName +
//         "  state: " +
//         listener?.state
//     );
//     if (listener) {
//       if (listener.state === "start") {
//         mailListenerStart(listener);
//         console.log("imapRestart");
//       } else {
//         listener.state = "stop";
//         listener.errInfo = "Logout";
//         await listener.save();
//       }
//     }
//     console.log("imapDisconnected");
//   });

//   mailListener.on("error", async function (err: any) {
//     console.log("连接错误🔗");
//     console.log(err);
//     console.log(mailListener.imap._config);
//     const config = mailListener.imap._config;
//     const listener = await MailListen.findOne({
//       email: config.user,
//       password: config.password,
//       imapHost: config.host,
//       imapPort: config.port,
//     });
//     if (listener) {
//       listener.state = "stop";
//       listener.errInfo = err.message;
//       await listener.save();
//     }
//   });

//   //   mailListener.on("headers", function (headers: any, seqno: number) {
//   //     // do something with mail headers
//   //     console.log(headers.get("subject"));
//   //     console.log(headers.get("from")["value"][0].address);
//   //     console.log(headers.get("from")["value"][0].name);
//   //     console.log("keefe:" + seqno);
//   //   });

//   //   mailListener.on("body", function (body: any, seqno: number) {
//   //     console.log(body["text"]);
//   //     console.log("keefe:" + seqno);
//   //     // do something with mail body
//   //   });

//   mailListener.on("mail", async function (mail: any, seqno: any) {
//     console.log("收到新邮件🔗");
//     console.log(`Email#${seqno}`);
//     if (mail.to["value"].length < 1) {
//       // console.log(mail);
//       return;
//     }

//     // console.log(mail.to["value"][0].address);
//     const model = await MailListen.findOne({
//       where: {
//         email: mail.to["value"][0].address,
//       },
//       relations: ["sfbotCharacter", "sfbotCharacter.sfbot"],
//     });
//     console.log("model customerDiscoverId: " + model?.customerDiscoverId);
//     if (model && model.state === "start") {
//       if (!mail.messageId) {
//         // console.log(mail);
//         return;
//       }

//       //实时监控添加客户
//       if (model.customerDiscoverId) {
//         console.log("实时监控添加客户");
//         const customerDiscover = await CustomerDiscover.findOne(
//           model.customerDiscoverId
//         );
//         if (
//           customerDiscover &&
//           customerDiscover.enableListen === 1 &&
//           customerDiscover.type === 1
//         ) {
//           customerDiscover.scanCount = customerDiscover.scanCount + 1;
//           await customerDiscover.save();

//           const from = mail.from["value"][0].address;
//           const address = from.split("@")[1];
//           if (
//             customerDiscover.titleFilter &&
//             customerDiscover.titleFilter !== ""
//           ) {
//             if (customerDiscover.titleFilter === mail.subject) {
//               if (
//                 customerDiscover.exceptEmails &&
//                 customerDiscover.exceptEmails !== ""
//               ) {
//                 if (!customerDiscover.exceptEmails.includes(address)) {
//                   console.log("createCustomerRecord");
//                   await createCustomerRecord(
//                     "实时监控",
//                     mail,
//                     customerDiscover
//                   );
//                 }
//               }
//             } else {
//               console.log("createCustomerRecord");
//               await createCustomerRecord("实时监控", mail, customerDiscover);
//             }
//           } else {
//             console.log("createCustomerRecord");
//             await createCustomerRecord("实时监控", mail, customerDiscover);
//           }
//         }
//       }

//       const inbox = await MailInbox.findOne({
//         messageId: mail.messageId,
//       });
//       if (!inbox) {
//         let tId = null;
//         let pId = null;
//         // const match = mail.html.match(/<!-- Inquiry ID: (\w+-\d+) -->/);
//         if (mail.html && mail.html !== "") {
//           const match = mail.html.match(/Tracking Code:\s*([A-Z]+-\d{13}-\d+)/);
//           const matchPL = mail.html.match(/PL Code:\s*([A-Z]+-\d{13}-\d+)/);
//           if (match !== null) {
//             const inquiryId = match[1];
//             console.log(`邮件 Inquiry ID: ${inquiryId}`);
//             const id = inquiryId.split("-")[2];
//             const category = inquiryId.split("-")[0];
//             if (category && category === "TCA") {
//               const tModel = await TargetCustomerAnalysis.findOne(id);
//               if (id) {
//                 if (tModel) {
//                   tId = tModel.id;
//                   tModel.replyStatus = "已回复";
//                   await tModel.save();
//                 }
//               }
//             }
//             // 你可以在数据库中查找对应的请求并处理
//           }

//           if (matchPL !== null) {
//             const inquiryId = matchPL[1];
//             console.log(`邮件 Inquiry ID: ${inquiryId}`);
//             const id = inquiryId.split("-")[2];
//             const category = inquiryId.split("-")[0];
//             if (category && category === "PL") {
//               if (id) {
//                 const tModel = await PromotionalLetter.findOne(id);
//                 if (tModel) {
//                   pId = tModel.id;
//                 }
//               }
//             }
//           }
//         }

//         const newMsg = await MailInbox.create({
//           organizationId: model.organizationId,
//           messageId: mail.messageId,
//           subject: mail.subject,
//           from: mail.from["value"][0].address,
//           fromName: mail.from["value"][0].name,
//           to: mail.to["value"][0].address,
//           text: mail.text ? mail.text : "",
//           html: mail.html,
//           receiveTime: mail.date,
//           targetCustomerAnalysisId: tId ? tId : null,
//           promotionalLetterId: pId ? pId : null,
//           customerDiscoverId: model.customerDiscoverId
//             ? model.customerDiscoverId
//             : null,
//         }).save();
//         const now = Math.floor(new Date().getTime() / 1000);
//         const msgTime = Math.floor(newMsg.receiveTime.getTime() / 1000);
//         console.log(`new:${now}`);
//         console.log(`msgTime:${msgTime}`);

//         if (tId) {
//           return;
//         }
//         if (now - msgTime < 60) {
//           console.log(`new msg:${JSON.stringify(newMsg)}`);
//           // const chatai = await askChatAiCharacterQuestion(
//           //   model.sfbotCharacter,
//           //   mail.text
//           // );
//           // if (typeof chatai === "string" && chatai.trim() == ""){
//           //   throw new CommonError("Error: The server is overloaded or not ready yet");
//           // }
//           // let answer = chatai.result;
//           // const input1 = {
//           //   content: mail.text,
//           // };
//           let answer;
//           try {
//             const res = await axios.post(
//               "https://api.perplexity.ai/chat/completions",
//               {
//                 model: "sonar-pro",
//                 messages: [
//                   {
//                     role: "system",
//                     content: "Be precise and concise.",
//                   },
//                   {
//                     role: "user",
//                     content:
//                       "根据下面客户的邮件帮我写一封回复的邮件，直接给我可以回复的邮件，不要带上其他无关的东西。邮件内容：" +
//                       mail.text,
//                   },
//                 ],
//               },
//               {
//                 headers: {
//                   accept: "application/json",
//                   "content-type": "application/json",
//                   Authorization: `Bearer ${process.env.PERPLEXITY_APIKEY}`,
//                 },
//               }
//             );
//             console.log(`data:${JSON.stringify(res.data)}`);
//             answer = res.data.choices[0].message.content;
//           } catch (error: any) {
//             if (error.response) {
//               throw new CommonError(JSON.stringify(error.response.data));
//             } else if (error.request) {
//               throw new CommonError(JSON.stringify(error.request));
//             } else {
//               throw new CommonError(error.message);
//             }
//           }
//           answer = answer + `<br/><br/><p>Best regards.</p><br/>`;
//           if (model.signiture && model.signiture !== "") {
//             answer = answer + model.signiture;
//           } else {
//             const org = await Organization.findOneOrFail(model.organizationId);
//             answer = answer + `${org.name} ChatAI`;
//           }
//           answer =
//             answer +
//             `<br/><p>------------------ Original ------------------</p><p>From: "${newMsg.fromName}" &lt;${newMsg.from}&gt;</p><p>Date: ${mail.date}</p><p>To: "${mail.to["value"][0].name}" &lt;${newMsg.to}&gt;</p><p>Subject: ${newMsg.subject}</p><p>${newMsg.html}</p><br/>`;

//           const emailInput = {
//             subject: `Re: ${mail.subject}`,
//             contacts: newMsg.from,
//             text: answer,
//             html: answer,
//             bcc: model.bcc ? model.bcc : "",
//           };
//           sendMailFromMailSender(model, emailInput);
//           MailOutbox.create({
//             subject: `Re: ${mail.subject}`,
//             from: model.email,
//             fromName: `${model.firstName} ${model.lastName}`,
//             to: newMsg.from,
//             text: answer,
//             html: answer,
//             sendTime: new Date(),
//             organizationId: model.organizationId,
//           }).save();

//           // let profile = await EmailListProfile.findOne({
//           //   email: newMsg.from,
//           //   organizationId: model.organizationId,
//           // });
//           // if (!profile) {
//           //   const nameArr = newMsg.fromName.split(" ");
//           //   profile = await EmailListProfile.create({
//           //     email: newMsg.from,
//           //     firstname: nameArr[0] ? nameArr[0] : "",
//           //     lastname: nameArr[1] ? nameArr[1] : "",
//           //     organizationId: model.organizationId,
//           //   }).save();
//           //   const redis = RedisManager.getInstance();
//           //   const jsonInput = {
//           //     action: "save",
//           //     id: profile.id,
//           //     email: profile.email,
//           //     firstname: profile.firstname,
//           //     lastname: profile.lastname,
//           //     profile: "",
//           //     orgid: profile.organizationId,
//           //   };
//           //   redis.select(2);
//           //   redis.lpush(`queue:email:profile`, JSON.stringify(jsonInput));
//           // }
//         }
//       }
//     } else {
//       if (mailListener.imap._config.user === mail.to["value"][0].address) {
//         console.log("mailListener.stop");
//         mailListener.stop();
//       }
//     }
//   });

//   //   mailListener.stop();
// };

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

// function sleep(ms: number) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// export const markEmailReply = async (outbox: MailOutbox, newMsg: MailInbox) => {
//   outbox.replyFlag = "replied";
//   outbox.replyCount = outbox.replyCount + 1;
//   await outbox.save();
//   newMsg.replyUuid = outbox.uuid;
//   await newMsg.save();
//   if (outbox.emailCampaignHistoryId) {
//     const ecHistory = await EmailCampaignHistory.findOneOrFail(
//       outbox.emailCampaignHistoryId
//     );
//     ecHistory.replyCount = ecHistory.replyCount + 1;
//     await ecHistory.save();
//   }
//   const emailList = await EmailList.findOne({
//     email: outbox.to,
//     organizationId: outbox.organizationId,
//   });
//   if (emailList) {
//     emailList.replyCount = emailList.replyCount + 1;
//     await emailList.save();
//   }
//   const unsubscribe = new RegExp("Unsubscribe from this type of email", "gi");
//   let matchStr = newMsg.html;
//   matchStr = matchStr.replace(unsubscribe, "");
//   const reg = new RegExp("unsubscribe", "gi");
//   if (matchStr.match(reg)) {
//     const result = matchStr.match(reg);
//     const count = !result ? 0 : result.length;
//     if (count > 0 && emailList) {
//       emailList.subscribe = "cancel";
//       await emailList.save();
//     }
//   }
//   let profile = await EmailListProfile.findOne({
//     email: newMsg.from,
//     organizationId: outbox.organizationId,
//   });
//   if (!profile) {
//     const nameArr = newMsg.fromName.split(" ");
//     profile = await EmailListProfile.create({
//       email: newMsg.from,
//       firstname: nameArr[0] ? nameArr[0] : "",
//       lastname: nameArr[1] ? nameArr[1] : "",
//       organizationId: outbox.organizationId,
//     }).save();
//     const redis = RedisManager.getInstance();
//     const jsonInput = {
//       action: "save",
//       id: profile.id,
//       email: profile.email,
//       firstname: profile.firstname,
//       lastname: profile.lastname,
//       profile: "",
//       orgid: profile.organizationId,
//     };
//     redis.select(2);
//     redis.lpush(`queue:email:profile`, JSON.stringify(jsonInput));
//   }
// };

// export const mailSenderStart = async (model: MailSender) => {
//   try {
//     let mailMsgCount = 0;
//     const emailDate = subDays(new Date(), 1).getTime();
//     var mailListener = new MailListener({
//       username: model.email,
//       password: model.password,
//       host: model.imapHost,
//       port: model.imapPort, // imap port
//       tls: true,
//       connTimeout: 10000, // Default by node-imap
//       authTimeout: 5000, // Default by node-imap,
//       debug: console.log, // Or your custom function with only one incoming argument. Default: null
//       autotls: "never", // default by node-imap
//       tlsOptions: { rejectUnauthorized: false },
//       mailbox: "INBOX", // mailbox to monitor
//       searchFilter: ["UNSEEN", ["SINCE", emailDate]], // the search filter being used after an IDLE notification has been retrieved
//       markSeen: true, // all fetched email willbe marked as seen and not fetched next time
//       fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
//       attachments: false, // download attachments as they are encountered to the project directory
//       attachmentOptions: { directory: "attachments/" }, // specify a download directory for attachments
//     });

//     mailListener.start();

//     mailListener.on("server:connected", function () {
//       console.log("mail sender imapConnected");
//     });

//     mailListener.on(
//       "mailbox",
//       async function (mailbox: { messages: { total: any } }) {
//         console.log(
//           "mail sender Total number of mails: ",
//           mailbox.messages.total
//         ); // this field in mailbox gives the total number of emails
//         mailMsgCount = mailbox.messages.total;
//         console.log(`mailMsgCount:${mailMsgCount}`);
//         await sleep(15 * 1000);
//         mailListener.stop();
//       }
//     );

//     mailListener.on("server:disconnected", async function () {
//       console.log("mail sender imapDisconnected");
//     });

//     mailListener.on("error", async function (err: any) {
//       console.log(err);
//     });

//     mailListener.on("mail", async function (mail: any, seqno: any) {
//       console.log(`Email#${seqno}`);
//       console.log("mail sender receive mail");
//       if (mail.to["value"].length < 1) {
//         // console.log(mail);
//         return;
//       }

//       // console.log(mail.to["value"][0].address);
//       const model = await MailSender.findOne({
//         where: {
//           email: mail.to["value"][0].address,
//         },
//       });
//       if (model) {
//         if (!mail.messageId) {
//           return;
//         }
//         const inbox = await MailInbox.findOne({
//           messageId: mail.messageId,
//         });

//         if (!inbox) {
//           let tId = null;
//           let pId = null;
//           // const match = mail.html.match(/<!-- Inquiry ID: (\w+-\d+) -->/);
//           if (mail.html && mail.html !== "") {
//             const match = mail.html.match(
//               /Tracking Code:\s*([A-Z]+-\d{13}-\d+)/
//             );
//             if (match) {
//               const inquiryId = match[1];
//               console.log(`邮件 Inquiry ID: ${inquiryId}`);
//               const id = inquiryId.split("-")[2];
//               const category = inquiryId.split("-")[0];
//               if (category && category === "PL") {
//                 if (id) {
//                   const tModel = await PromotionalLetter.findOne(id);
//                   if (tModel) {
//                     pId = tModel.id;
//                     // tModel.replyStatus = "已回复";
//                     // await tModel.save();
//                   }
//                 }
//               } else {
//                 if (id) {
//                   const tModel = await TargetCustomerAnalysis.findOne(id);
//                   if (tModel) {
//                     tId = tModel.id;
//                     tModel.replyStatus = "已回复";
//                     await tModel.save();
//                   }
//                 }
//               }
//             }
//           }

//           const newMsg = await MailInbox.create({
//             organizationId: model.organizationId,
//             messageId: mail.messageId,
//             subject: mail.subject,
//             from: mail.from["value"][0].address,
//             fromName: mail.from["value"][0].name,
//             to: mail.to["value"][0].address,
//             text: mail.text ? mail.text : "",
//             html: mail.html,
//             receiveTime: mail.date,
//             targetCustomerAnalysisId: tId ? tId : null,
//             promotionalLetterId: pId ? pId : null,
//           }).save();
//           const now = Math.floor(new Date().getTime() / 1000);
//           const msgTime = Math.floor(newMsg.receiveTime.getTime() / 1000);
//           console.log(`new:${now}`);
//           console.log(`msgTime:${msgTime}`);
//           //contact 回复邮件
//           //=================
//           const existMailOutboxs = await MailOutbox.find({
//             from: newMsg.to,
//             to: newMsg.from,
//           });
//           for (const outbox of existMailOutboxs) {
//             if (outbox.uuid && outbox.uuid !== "") {
//               var reg = new RegExp(outbox.uuid);
//               var subjectReg = new RegExp(outbox.subject);
//               if (newMsg.html.match(reg)) {
//                 await markEmailReply(outbox, newMsg);
//                 return;
//               } else if (newMsg.subject.match(subjectReg)) {
//                 await markEmailReply(outbox, newMsg);
//                 return;
//               }
//             }
//           }
//         }
//       } else {
//         if (mailListener.imap._config.user === mail.to["value"][0].address) {
//           console.log("mailListener.stop");
//           mailListener.stop();
//         }
//       }
//       console.log(`mailMsgCount:${mailMsgCount},seqno:${seqno}`);
//       if (mailMsgCount == seqno) {
//         console.log("mailListener.stop");
//         mailListener.stop();
//       }
//     });
//   } catch (error: any) {
//     console.log(`catch error mailListener${error.message}`);
//   }
// };

// export const getEmailHistory = async (
//   model: MailListen,
//   customerDiscover: CustomerDiscover
// ) => {
//   let total = 0;
//   var mailListener = new MailListener({
//     username: model.email,
//     password: model.password,
//     host: model.imapHost,
//     port: model.imapPort, // imap port
//     tls: true,
//     connTimeout: 10000, // Default by node-imap
//     authTimeout: 5000, // Default by node-imap,
//     debug: null, // Or your custom function with only one incoming argument. Default: null
//     autotls: "never", // default by node-imap
//     tlsOptions: { rejectUnauthorized: false },
//     mailbox: "INBOX", // mailbox to monitor
//     searchFilter: ["ALL"], // the search filter being used after an IDLE notification has been retrieved
//     markSeen: true, // all fetched email willbe marked as seen and not fetched next time
//     fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
//     attachments: true, // download attachments as they are encountered to the project directory
//     attachmentOptions: { directory: "attachments/" }, // specify a download directory for attachments
//   });

//   mailListener.start();
//   mailListener.on("server:connected", function () {
//     console.log("imapConnected");
//   });

//   mailListener.on("mailbox", function (mailbox: { messages: { total: any } }) {
//     console.log("Total number of mails: ", mailbox.messages.total); // this field in mailbox gives the total number of emails
//     total = mailbox.messages.total;
//     if (total === 0) {
//       mailListener.stop();
//     }
//   });

//   mailListener.on("server:disconnected", function () {
//     console.log("imapDisconnected");
//     mailListener.stop();
//   });

//   mailListener.on("error", function (err: any) {
//     console.log(err);
//     mailListener.stop();
//   });

//   mailListener.on("mail", async function (mail: any, seqno: any) {
//     // do something with the whole email as a single object
//     if (total === 0) {
//       mailListener.stop();
//     }
//     if (mail.to["value"].length < 1) {
//       if (total === seqno) {
//         console.log("mailListener end");
//         mailListener.stop();
//       }
//       return;
//     }

//     if (!mail.messageId) {
//       if (total === seqno) {
//         console.log("mailListener end");
//         mailListener.stop();
//       }
//       return;
//     }
//     const inbox = await MailInbox.findOne({
//       messageId: mail.messageId,
//     });
//     if (!inbox) {
//       customerDiscover.scanCount = customerDiscover.scanCount + 1;
//       await customerDiscover.save();
//       const time = new Date(mail.date);
//       if (
//         customerDiscover.scanStartTime &&
//         time < customerDiscover.scanStartTime
//       ) {
//         if (total === seqno) {
//           console.log("mailListener end");
//           mailListener.stop();
//         }
//         return;
//       }
//       if (customerDiscover.scanEndTime && time > customerDiscover.scanEndTime) {
//         if (total === seqno) {
//           console.log("mailListener end");
//           mailListener.stop();
//         }
//         return;
//       }
//       if (customerDiscover.titleFilter && customerDiscover.titleFilter !== "") {
//         if (customerDiscover.titleFilter !== mail.subject) {
//           if (total === seqno) {
//             console.log("mailListener end");
//             mailListener.stop();
//           }
//           return;
//         }
//       }
//       console.log("Seqno: ", seqno);
//       console.log("from:" + mail.to["value"][0].address);
//       console.log("subject:" + mail.subject);
//       // console.log("text:"+mail.text);
//       // console.log("html:"+mail.html);
//       console.log("date" + mail.date);

//       await MailInbox.create({
//         organizationId: model.organizationId,
//         messageId: mail.messageId,
//         subject: mail.subject,
//         from: mail.from["value"][0].address,
//         fromName: mail.from["value"][0].name,
//         to: mail.to["value"][0].address,
//         text: mail.text ? mail.text : "",
//         html: mail.html,
//         receiveTime: mail.date,
//         // targetCustomerAnalysisId: tId ? tId : null,
//         // promotionalLetterId: pId ? pId : null,
//         customerDiscoverId: model.customerDiscoverId
//           ? model.customerDiscoverId
//           : null,
//       }).save();

//       await createCustomerRecord("历史导入", mail, customerDiscover);
//     }

//     if (total === seqno) {
//       console.log("mailListener end");
//       mailListener.stop();
//     }
//   });
// };
