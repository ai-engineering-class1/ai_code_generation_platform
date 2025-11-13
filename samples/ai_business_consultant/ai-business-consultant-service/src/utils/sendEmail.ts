import { format } from "date-fns";
import { sendEmail } from "@/utils/msgNotice";
import { emailCampaignNotiModel } from "@/utils/mailModel";
// import { Organization } from "@/models";
import { CommonError } from "@/errors";
export const emailCampaignViewed = async function (model: any): Promise<any> {
    // APP_NAME=Sflow
    // APP_ICON=https://file.sflow.pro/sflowicon.png
  const sflow = "Sflow";
  const sflowLogo = "https://file.sflow.pro/sflowicon.png";
  
//   let domain = model.req.headers.host;//model.req.headers["origin"];
  const footer_year = format(new Date(), "yyyy");
  let domain = "https://abc.easiio.com";
  
  let messageHtml = emailCampaignNotiModel();
  messageHtml = messageHtml.replace(new RegExp("{sflow}", "g"), sflow);
  messageHtml = messageHtml.replace("{sflowLogo}", sflowLogo);
  messageHtml = messageHtml.replace("{emailCampaign}", model.text);
  messageHtml = messageHtml.replace("{footer_year}", footer_year);
  messageHtml = messageHtml.replace(
    "{emailCampaign_link}",
    `${domain}/#/login`
  );

  try {
    await sendEmail(
      model.emailCampaign.notiEmail,
      messageHtml,
      `Email campaign notice(${model.emailCampaign.name})`,
      sflow
    );
  } catch (err) {
    throw new CommonError("error:send failed");
  }
  return "";
};
