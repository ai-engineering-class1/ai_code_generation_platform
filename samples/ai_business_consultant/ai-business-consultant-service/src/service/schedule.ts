import schedule from "node-schedule";
import { MailListen, TargetCustomerAnalysis } from "@/models";
import {
  imapFlowStartListenActive,
  imapFlowImportSentMessagesBoxActive,
} from "@/service/mailImapFlow";
import { Not } from "typeorm";
// import { isValidNumber } from "@/utils/validations";

let isRunning = false;
const executeEmailMonitoring = () => {
  // 3分钟运行一次//0 0/3 * * * ?      30 * * * * ?
  schedule.scheduleJob("0 0/3 * * * ?", async () => {
    if (isRunning) {
      console.log("Previous task still running, skipping...");
      return;
    }

    try {
      isRunning = true;
      console.log("executeEmailMonitoring start");

      const mailListens = await MailListen.find({ state: "start" });
      console.log("EmailListen find result:", mailListens.length);

      for (const model of mailListens) {
        console.log(model);
        const result = await imapFlowStartListenActive(model);
        console.log(result);

        if (result !== "success") {
          model.errInfo = "邮箱链接失败：" + result;
          await model.save();
        } else {
          model.errInfo = "";
          await model.save();
        }
      }
      console.log("executeEmailMonitoring end");
    } catch (error) {
      console.error("Email monitoring error:", error);
    } finally {
      isRunning = false;
    }
  });
};

let isOutBoxRunning = false;
const executeEmailOutBoxMonitoring = () => {
  // 10分钟运行一次//0 0/10 * * * ?      30 * * * * ?
  schedule.scheduleJob("0 0/10 * * * ?", async function () {
    if (isOutBoxRunning) {
      console.log("Previous task still running, EmailOutBox skipping...");
      return;
    }
    console.log("executeEmailOutBoxMonitoring start");
    try {
      isOutBoxRunning = true;
      const mailListens = await MailListen.find({
        state: "start",
      });
      console.log("EmailListen find result:" + mailListens.length);
      for (const model of mailListens) {
        await imapFlowImportSentMessagesBoxActive(model);
      }
    } catch (error) {
      console.error("Email monitoring error:", error);
    } finally {
      isOutBoxRunning = false;
    }
  });
};

const executeTCATraceStatusUpdate = () => {
  // 每天00:01:30运行一次
  schedule.scheduleJob("30 1 0 * * ?", async function () {
    console.log("executeTCATraceStatusUpdate start");
    const models = await TargetCustomerAnalysis.find({
      where: {
        traceStatus: "待跟进",
      },
    });
    console.log("TargetCustomerAnalysis find result:" + models.length);
    for (const model of models) {
      if (model.countdown && model.countdown > 0) {
        // if (model.countdown === 1){
        //   model.traceStatus = "待跟进";
        //   model.countdown = 0;
        // }
        model.countdown = model.countdown - 1;
        await model.save();
      }
    }
  });
};

const executeTCAReplyStatusUpdate = () => {
  // 每小时运行一次
  schedule.scheduleJob("30 0 0/1 * * *", async function () {
    console.log("executeCustomerStatusUpdate start");
    const models = await TargetCustomerAnalysis.find({
      where: {
        replyStatus: "已回复",
        receiveEmailTime: Not(null),
      },
    });
    console.log("TargetCustomerAnalysis find result:" + models.length);
    const now = new Date();
    for (const model of models) {
      const diffInMs =
        now.getTime() - new Date(model.receiveEmailTime!).getTime();
      const hoursDiff = diffInMs / (1000 * 60 * 60); // 毫秒转小时

      if (hoursDiff > 24) {
        console.log("已经超过24小时");
        model.replyStatus = "待沟通";
        await model.save();
      }
    }
  });
};

export const scheduleInit = () => {
  executeEmailMonitoring();
  executeTCATraceStatusUpdate();
  executeTCAReplyStatusUpdate();
  executeEmailOutBoxMonitoring();
};
