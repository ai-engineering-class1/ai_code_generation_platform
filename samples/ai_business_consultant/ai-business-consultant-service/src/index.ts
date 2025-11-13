require("module-alias").addAlias("@", __dirname);
import "dotenv/config";
import "reflect-metadata";
import * as Sentry from "@sentry/node";
import { RewriteFrames } from "@sentry/integrations";
import Express from "express";
import cors from "cors";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { GraphQLSchema } from "graphql";
import createDatabaseConnection from "@/database/createConnection";
import { RESOLVERS } from "@/gql";
import { apolloServerSentryPlugin } from "@/gql/plugins/sentry";
import {
  Distributor,
  DistributorWithdrawFunds,
  Organization,
  Paperwork,
  WxPaidOrders,
  WxUser,
  WxUserConsultQuota,
  WxUserScanDistributorRecords,
  // MailListen,
  MailOutbox,
  TargetCustomerAnalysis,
  PromotionalLetter,
  PromotionalLetterRecord,
} from "@/models";
import { CustomError } from "./errors/customErrors";
// import { mailListenerStart } from "@/service/mailListener";

import { wxResourceDecrypt } from "@/utils/encode";
import AsyncLock from "async-lock";
import { scheduleInit } from "@/service/schedule";
import { isNonEmptyString } from "@/utils/validations";
import {
  getWeiXinOfficialMsgReply,
  getWeiXinOfficialSubscriptionReply,
} from "@/utils/common";
import path from "path";
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

// import { emailCampaignViewed } from "@/utils/sendEmail";

// import { isValidNumber } from "@/utils/validations";

Sentry.init({
  environment: process.env.APP_ENV,
  release: "easiio-ai-consultant",
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new RewriteFrames({
      root: process.cwd(),
    }) as any,
  ],
});

const establishDatabaseConnection = async (): Promise<void> => {
  try {
    await createDatabaseConnection();
    scheduleInit();
  } catch (error) {
    console.log(error);
  }
};

const initExpressGraphql = async () => {
  const schema = await buildSchema({
    resolvers: RESOLVERS,
  }).catch((err) => console.log(err));

  const apolloServer = new ApolloServer({
    schema: schema as GraphQLSchema,
    context: ({ req, res }: any) => ({ req, res }),
    playground: true,
    introspection: true,
    plugins: [apolloServerSentryPlugin as any],
  });

  const app = Express();

  app.use(Sentry.Handlers.requestHandler());

  app.use(cors());
  app.use(Express.json({ limit: "51200kb" }));
  app.use(Express.urlencoded({ extended: true }));
  app.use(Express.text({ type: "text/xml" }));

  app.get("/", (_, res) => {
    res.json({ server: "easiio-ai-consultant" });
  });

  app.post("/wxNotify", async (req, res) => {
    console.log("body");
    console.log(req.body);
    console.log("headers");
    console.log(req.headers);
    const data = req.body;
    const lock = new AsyncLock();
    await lock.acquire<boolean>(`key_wxNotify`, async (done) => {
      let model = await WxPaidOrders.findOne({
        notify_id: data.id,
      });

      if (!model) {
        const resourceData = wxResourceDecrypt(
          data.resource.nonce,
          data.resource.ciphertext,
          data.resource.associated_data
        );
        const resourceModel = JSON.parse(resourceData);
        model = await WxPaidOrders.findOne({
          where: {
            out_trade_no: resourceModel.out_trade_no,
          },
          relations: [
            "wxUser",
            "commodity",
            "commodity.legalDocumentProject",
            "commodity.lawyers",
          ],
        });
        if (model) {
          if (!model.commodity) {
            console.log("商品不存在");
            return done(null, true);
          }

          model.notify_id = data.id;
          model.transaction_id = resourceModel.transaction_id;
          model.success_time = resourceModel.success_time;
          model.state = resourceModel.trade_state;
          model.rawData = resourceData;
          await model.save();
          model.wxUser.lastPayDate = new Date();
          await model.wxUser.save();
          model.commodity.salesVolume += 1;
          await model.commodity.save();
          if (
            model.commodity.legalDocumentProject &&
            model.commodity.legalDocumentProject.isConsult === 0
          ) {
            // let lawyerId = null;
            // if (model.commodity.lawyers && model.commodity.lawyers.length > 0) {
            //   const randomNum = Math.floor(
            //     Math.random() * model.commodity.lawyers.length
            //   );
            //   lawyerId = model.commodity.lawyers[randomNum].id;
            // }
            console.log("create paperwork");
            const uuid = require("uuid");
            const uuidStr = uuid.v1();
            await Paperwork.create({
              wxUserId: model.wxUser.id,
              legalDocumentProjectId: model.commodity.legalDocumentProjectId!,
              organizationId: model.wxUser.organizationId,
              wxPaidOrdersId: model.id,
              uuid: uuidStr,
              // lawyerId: lawyerId ? lawyerId : null,
            }).save();
          } else if (
            model.commodity.legalDocumentProject &&
            model.commodity.legalDocumentProject.isConsult === 1
          ) {
            const existWxUserConsultQuota = await WxUserConsultQuota.findOne({
              wxUserId: model.wxUser.id,
              legalDocumentProjectId: model.commodity.legalDocumentProjectId!,
              organizationId: model.wxUser.organizationId,
            });
            if (existWxUserConsultQuota) {
              existWxUserConsultQuota.quotaConsult +=
                model.commodity.availableQueries;
              existWxUserConsultQuota.latestOrderTime = new Date();
              existWxUserConsultQuota.validDays = model.commodity.validDays;
              await existWxUserConsultQuota.save();
            } else {
              await WxUserConsultQuota.create({
                wxUserId: model.wxUser.id,
                legalDocumentProjectId: model.commodity.legalDocumentProjectId!,
                organizationId: model.wxUser.organizationId,
                quotaConsult: model.commodity.availableQueries,
                latestOrderTime: new Date(),
                validDays: model.commodity.validDays,
              }).save();
            }
          } else {
            console.log("add chat queries");
            model.wxUser.availableQueries += model.commodity.availableQueries;
            await model.wxUser.save();
          }

          console.log("SUCCESS");
          // wxPayNotification(model);
        } else {
          console.log("out_trade_no 不存在");
        }
      } else {
        console.log("notify_id 已存在");
      }
      return done(null, true);
    });
    res.json({ code: "SUCCESS", message: "" });
  });

  app.get("/wxOfficialAccountSubscription", async (req, res) => {
    console.log("query");
    console.log(req.query);
    const token = "Easiio2024";
    const nonce = req.query.nonce;
    const timestamp = req.query.timestamp;
    const signature = req.query.signature;
    const verifyStr = `${timestamp}${nonce}${token}`;
    console.log("verifyStr:" + verifyStr);
    const crypto = require("crypto");
    const hash = crypto.createHash("sha1").update(verifyStr).digest("hex");
    console.log("hash:" + hash);
    if (hash === signature) {
      console.log(1);
    } else {
      console.log(0);
    }
    res.send(req.query.echostr);
  });

  app.post("/wxOfficialAccountSubscription", async (req, res) => {
    console.log("body");
    console.log(req.body);
    console.log("query");
    console.log(req.query);
    let xml = req.body;

    const token = process.env.WX_OFFICIAL_ACCOUNT_CALLBACK_TOKEN;
    const nonce = req.query.nonce;
    const timestamp = req.query.timestamp;
    const signature = req.query.signature;
    const verifyStr = `${timestamp}${nonce}${token}`;
    console.log("verifyStr:" + verifyStr);
    const crypto = require("crypto");
    const hash = crypto.createHash("sha1").update(verifyStr).digest("hex");
    console.log("hash:" + hash);
    if (hash === signature) {
      console.log(1);
    } else {
      console.log(0);
    }

    const xml2js = require("xml2js");
    // 解析 XML
    xml2js.parseString(
      xml,
      { explicitArray: false },
      async (err: any, result: { xml: any }) => {
        if (err) {
          console.error("Error parsing XML:", err);
          return res.status(400).send("Invalid XML");
        }

        // 输出解析后的 JavaScript 对象
        console.log("Parsed XML:", result);

        // 根据解析后的数据进行处理
        const message = result.xml;
        console.log("Message:", message);
        if (isNonEmptyString(message.MsgType) && message.MsgType === "text") {
          //           const input = `<xml>
          //   <ToUserName>${message.ToUserName}</ToUserName>
          //   <FromUserName>${message.FromUserName}</FromUserName>
          //   <CreateTime>${new Date().getTime()}</CreateTime>
          //   <MsgType>${"text"}</MsgType>
          //   <Content>${"你好"}</Content>
          // </xml>`;
          //           res.send(input);
          await getWeiXinOfficialMsgReply(message.FromUserName);
          res.json("success");
          return;
        }
        if (isNonEmptyString(message.MsgType) && message.MsgType === "event") {
          console.log("MsgType:", message.MsgType);
          if (isNonEmptyString(message.Event) && message.Event === "SCAN") {
            if (!isNonEmptyString(message.Ticket)) {
              console.log("No found ticket");
              res.json("success");
              return;
            }
            const ticket = message.Ticket;
            const distributor = await Distributor.findOne({
              where: {
                wxQrCode: ticket,
              },
            });
            if (!distributor) {
              console.log("No found ticket");
              res.json("success");
              return;
            }
            const wxUser = await WxUser.findOne({
              where: {
                openId: message.FromUserName,
              },
            });
            if (wxUser) {
              console.log(`wx_user already exist`);
              // wxUser.distributorId = distributor.id;
              // await wxUser.save();
              const existScan = await WxUserScanDistributorRecords.findOne({
                where: {
                  distributorId: distributor.id,
                  wxUserId: wxUser.id,
                },
              });
              if (!existScan) {
                await WxUserScanDistributorRecords.create({
                  distributorId: distributor.id,
                  wxUserId: wxUser.id,
                  state: "invalid",
                }).save();
              }
            } else {
              console.log("create wx_user by scan");
              const wxUser = await WxUser.create({
                name: "",
                avatarUrl: "",
                openId: message.FromUserName,
                organizationId: distributor.organizationId,
                distributorId: distributor.id,
                // officialAccountState: "SCAN",
              }).save();
              await WxUserScanDistributorRecords.create({
                distributorId: distributor.id,
                wxUserId: wxUser.id,
                state: "valid",
              }).save();
            }
          } else if (
            isNonEmptyString(message.Event) &&
            message.Event === "unsubscribe"
          ) {
            const wxUser = await WxUser.findOne({
              where: {
                openId: message.FromUserName,
              },
            });
            if (wxUser) {
              console.log(
                `wx_user (${wxUser.name},${wxUser.openId}):${message.Event}`
              );
              wxUser.officialAccountState = "unsubscribe";
              await wxUser.save();
            } else {
              console.log(`No found wx_user:${message.Event}`);
            }
          } else if (
            isNonEmptyString(message.Event) &&
            message.Event === "subscribe"
          ) {
            await getWeiXinOfficialSubscriptionReply(message.FromUserName);
            let wxUser = await WxUser.findOne({
              where: {
                openId: message.FromUserName,
              },
            });
            if (wxUser) {
              console.log(
                `wx_user (${wxUser.name},${wxUser.openId}):${message.Event}`
              );
              wxUser.officialAccountState = "subscribe";
              await wxUser.save();
              if (isNonEmptyString(message.Ticket)) {
                const ticket = message.Ticket;
                const distributor = await Distributor.findOne({
                  where: {
                    wxQrCode: ticket,
                  },
                });
                if (!distributor) {
                  console.log("No found ticket from subscribe");
                  res.json("success");
                  return;
                }
                const existScan = await WxUserScanDistributorRecords.findOne({
                  where: {
                    distributorId: distributor.id,
                    wxUserId: wxUser.id,
                  },
                });
                if (!existScan) {
                  await WxUserScanDistributorRecords.create({
                    distributorId: distributor.id,
                    wxUserId: wxUser.id,
                    state: "invalid",
                  }).save();
                }
              }
              res.json("success");
              return;
            } else {
              console.log(`No found wx_user:${message.Event}`);
              const org = await Organization.findOneOrFail();
              wxUser = await WxUser.create({
                name: "",
                avatarUrl: "",
                openId: message.FromUserName,
                organizationId: org.id,
                // distributorId: distributor.id,
                // officialAccountState: "SCAN",
              }).save();
            }
            if (isNonEmptyString(message.Ticket)) {
              const ticket = message.Ticket;
              const distributor = await Distributor.findOne({
                where: {
                  wxQrCode: ticket,
                },
              });
              if (!distributor) {
                console.log("No found ticket");
                res.json("success");
                return;
              }
              wxUser.distributorId = distributor.id;
              wxUser.organizationId = distributor.organizationId;
              await wxUser.save();
              await WxUserScanDistributorRecords.create({
                distributorId: distributor.id,
                wxUserId: wxUser.id,
                state: "valid",
              }).save();
            }
          }
        }

        res.json("success");
      }
    );

    // res.json("success");
  });

  app.post("/wxTransferToDistributorNotify", async (req, res) => {
    console.log("body");
    console.log(req.body);
    console.log("headers");
    console.log(req.headers);
    const data = req.body;
    const resourceData = wxResourceDecrypt(
      data.resource.nonce,
      data.resource.ciphertext,
      data.resource.associated_data
    );
    const resourceModel = JSON.parse(resourceData);
    console.log(resourceModel);
    const distributorWithdrawFunds = await DistributorWithdrawFunds.findOne({
      where: {
        batch_id: resourceModel.batch_id,
        out_batch_no: resourceModel.out_batch_no,
        batch_status: "ACCEPTED",
      },
    });
    if (!distributorWithdrawFunds) {
      console.log("No found distributorWithdrawFunds");
      res.json({ code: 200, message: "success" });
      return;
    }
    if (
      resourceModel.mchid === process.env.WECHAT_MCHID &&
      resourceModel.batch_status === "FINISHED" &&
      resourceModel.success_amount !== 0 &&
      resourceModel.success_num !== 0 &&
      resourceModel.fail_amount === 0 &&
      resourceModel.fail_num === 0
    ) {
      distributorWithdrawFunds.batch_status = "FINISHED";
      distributorWithdrawFunds.notiyInfo = resourceData;
      distributorWithdrawFunds.finishedDate = new Date();
      await distributorWithdrawFunds.save();
    } else {
      distributorWithdrawFunds.batch_status = "PROCESSING";
      distributorWithdrawFunds.notiyInfo = resourceData;
      await distributorWithdrawFunds.save();
      // await distributorWithdrawFunds.remove();
    }
    res.json({ code: 200, message: "success" });
  });

  apolloServer.applyMiddleware({ app });
  app.use(Sentry.Handlers.errorHandler());

  app.get("/res/img/:img", async (req, res) => {
    console.log(`res.img:${req.params.img}`);
    console.log(req.headers.host);
    if (req.params.img) {
      const ext = path.extname(req.params.img);
      const imgName = path.parse(req.params.img).name;
      if (ext === ".png") {
        try {
          const jsonStr = Buffer.from(imgName, "base64").toString("utf8");
          const imgNameModel = JSON.parse(jsonStr);
          console.log(imgNameModel);
          if (
            imgNameModel.category &&
            imgNameModel.category === "promotionalLetter"
          ) {
            const model = await PromotionalLetter.findOne(
              imgNameModel.promotionalLetterId
            );
            if (model) {
            }
            if (imgNameModel.promotionalLetterRecordId) {
              const plRecord = await PromotionalLetterRecord.findOne(
                imgNameModel.promotionalLetterRecordId
              );
              if (plRecord) {
                if (plRecord.readEmailText && plRecord.readEmailText !== "") {
                  if (!plRecord.readEmailText.includes(imgNameModel.toEmail)) {
                    plRecord.readFlag = plRecord.readFlag + 1;
                    plRecord.readEmailText =
                      plRecord.readEmailText + "," + imgNameModel.toEmail;
                  }
                } else {
                  plRecord.readFlag = plRecord.readFlag + 1;
                  plRecord.readEmailText = imgNameModel.toEmail;
                }
                await plRecord.save();
              }
            }
          } else {
            console.log(`res.img:${jsonStr}`);
            const model = await TargetCustomerAnalysis.findOne(
              imgNameModel.targetCustomerAnalysisId
            );
            if (model && model.replyStatus !== "已回复") {
              model.replyStatus = "已查阅";
              await model.save();
            }
          }

          const outBox = await MailOutbox.findOne({
            uuid: imgNameModel.uuid,
          });
          if (outBox) {
            console.log(`MailOutbox,from: ${outBox.from},to: ${outBox.to}`);
            outBox.readFlag = "read";
            outBox.readCount = outBox.readCount + 1;
            await outBox.save();
            // if (outBox.emailCampaignHistoryId) {
            //   const ecHistory = await EmailCampaignHistory.findOneOrFail(
            //     outBox.emailCampaignHistoryId
            //   );
            //   ecHistory.viewCount = ecHistory.viewCount + 1;
            //   await ecHistory.save();
            // }
            // if (outBox.emailCampaignId) {
            //   const emailCampaign = await EmailCampaign.findOneOrFail(
            //     outBox.emailCampaignId
            //   );
            //   if (emailCampaign.notiEmail && emailCampaign.notiEmail) {
            //     const input = {
            //       req: req,
            //       emailCampaign: emailCampaign,
            //       text: "The email you sent has been viewed",
            //     };
            //     await emailCampaignViewed(input);
            //   }
            // }
          }
        } catch (error) {
          const file = path.join(
            process.cwd(),
            "src/resources/transparent.png"
          );
          const rs = fs.createReadStream(file);
          rs.pipe(res);
        }
      }
    }
    const file = path.join(process.cwd(), "src/resources/transparent.png");
    const rs = fs.createReadStream(file);
    rs.pipe(res);
  });

  const multer = require("multer");
  const upload = multer({ dest: "uploads/" });

  app.post(
    "/uploadAudioFile",
    upload.single("file"),
    async (req: any, res: any) => {
      console.log(req.file);
      console.log(req.body);
      const fileExt = path.extname(req.file.originalname);
      const finalPath = req.file.path + fileExt;
      fs.renameSync(req.file.path, finalPath);
      const form = new FormData();
      form.append("file", fs.createReadStream(finalPath));
      form.append("model", "gpt-4o-transcribe");//gpt-4o-transcribe,gpt-4o-mini-transcribe,whisper-1
      form.append("prompt", req.body.prompt);
      try {
        const result = await axios.post(
          "https://api.openai.com/v1/audio/transcriptions",
          form,
          {
            headers: {
              ...form.getHeaders(),
              Authorization: `Bearer ${process.env.OPENAI_KEY}`,
            },
            timeout: 20000,
          }
        );
        console.log(result.data);
        res.json(result.data);
      } catch (error: any) {
        if (error.response) {
          throw new CustomError(
            error.response.data.error?.message ||
              JSON.stringify(error.response.data)
          );
        } else if (error.request) {
          throw new CustomError("No response received from OpenAI API");
        } else {
          throw new CustomError(error.message);
        }
      } finally {
        if (fs.existsSync(finalPath)) {
          console.log("delete filePathDocx:" + finalPath);
          fs.unlinkSync(finalPath);
        }
      }
    }
  );

  // const mailListens = await MailListen.find({
  //   state: "start",
  // });
  // console.log(mailListens.length);
  // for (const model of mailListens) {
  //   console.log(model);
  //   mailListenerStart(model);
  // }

  app.listen(process.env.PORT || 7001, () => {
    console.log(
      `ai consultant server started on http://localhost:7001${apolloServer.graphqlPath}`
    );
  });
};

const bootstrap = async (): Promise<void> => {
  await establishDatabaseConnection();
  initExpressGraphql();
};

bootstrap();
