import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import axios from "axios";
import striptags from "striptags";

export const sendEmail = async (
  email: string,
  message: string,
  subject: string,
  app_name: string
) => {
  const sesClient = new SESClient({ region: process.env.EMAIL_REGION });
  // const encodedWord = require('encoded-word');
  const encodeAppName =
    "=?UTF-8?B?" + Buffer.from(app_name).toString("base64") + "?=";
  const params = {
    Destination: {
      /* required */
      CcAddresses: [
        /* more items */
      ],
      ToAddresses: [
        email, //RECEIVER_ADDRESS
        /* more To-email addresses */
      ],
    },
    Message: {
      /* required */
      Body: {
        /* required */
        Html: {
          Charset: "UTF-8",
          Data: message,
        },
        Text: {
          Charset: "UTF-8",
          Data: striptags(message),
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    Source: `${encodeAppName}<notification@${process.env.HOST_URL}>`, //'Jira<noreply@service.guildplatform.io>',//'Jira<noreply@easiio.com>',//, // SENDER_ADDRESS  @guildplatform.io
    ReplyToAddresses: [
      /* more items */
    ],
  };
  sesClient.send(new SendEmailCommand(params));
};

export const sendSMS = async (text: string, sendto: number[]) => {
  const requestData = {
    text: text,
    sendto: sendto,
  };
  const res = await axios.post(
    "https://uim.easiio.com/send/sms",
    JSON.stringify(requestData),
    {
      headers: {
        "content-type": "application/json",
        Authorization:
          "Basic ZWFzaWlvOjRjODA3NzRjZTFhZDBiMDUzNjQ5ZDc2NzMzNTBjMGU4MmQ0MDNiYzA=",
      },
    }
  );
  return res;
};

export const designSendEmail = async (
  email: string[],
  message: string,
  subject: string,
  app_name: string,
  from = ""
) => {
  const sesClient = new SESClient({ region: process.env.EMAIL_REGION });
  // const encodedWord = require('encoded-word');
  const encodeAppName =
    "=?UTF-8?B?" + Buffer.from(app_name).toString("base64") + "?=";
  let sourceFrom = "notification@" + process.env.HOST_URL;
  console.log(from);
  if (from !== "") {
    sourceFrom = from;
  }
  console.log(sourceFrom);
  const params = {
    Destination: {
      /* required */
      CcAddresses: [
        /* more items */
      ],
      ToAddresses: email,
    },
    Message: {
      /* required */
      Body: {
        /* required */
        Html: {
          Charset: "UTF-8",
          Data: message,
        },
        Text: {
          Charset: "UTF-8",
          Data: striptags(message),
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    Source: encodeAppName + `<${sourceFrom}>`, //'Jira<noreply@service.guildplatform.io>',//'Jira<noreply@easiio.com>',//, // SENDER_ADDRESS  @guildplatform.io
    ReplyToAddresses: [
      /* more items */
    ],
  };
  sesClient.send(new SendEmailCommand(params));
};