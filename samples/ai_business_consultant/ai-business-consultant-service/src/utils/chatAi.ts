import axios from "axios";
import { Sfbot, SfbotCharacter } from "@/models";
import path from "path";
import fs from "fs";
import { OSSmanager } from "@/utils/staticClass";
// import { CommonError } from "@/errors";
export const askChatAiQuestion = async function (
  sfbot: Sfbot,
  text: string,
  website: string
): Promise<any> {
  const data = `username=org:${sfbot.organizationId}:bot:${sfbot.id}&password=${sfbot.password}`;
  const result = await axios.post(
    `${process.env.API_URL.replace("graphql", "")}sfbot/login2`,
    data
  );

  console.log(result.data);

  const uuid = require("uuid");
  const uuidStr = uuid.v1();
  const chatInput = {
    id: uuidStr,
    msg: text,
    character_desc: sfbot.character_desc,
    res: 0,
    userflag: "external",
    website: website,
  };
  try {
    const res = await axios.post(
      `${process.env.API_URL.replace("graphql", "")}sfbot/chat`,
      JSON.stringify(chatInput),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: result.data,
        },
      }
    );
    console.log(res.data);
    return res.data;
  } catch (error: any) {
    if (error.response) {
      console.error(JSON.stringify(error.response.data));
    } else if (error.request) {
      console.error(JSON.stringify(error.request));
    } else {
      console.error(error.message);
    }
    try {
      const res = await axios.post(
        `${process.env.API_URL.replace("graphql", "")}sfbot/chat`,
        JSON.stringify(chatInput),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: result.data,
          },
        }
      );
      console.log(res.data);
      return res.data;
    } catch (error: any) {
      if (error.response) {
        console.error(JSON.stringify(error.response.data));
      } else if (error.request) {
        console.error(JSON.stringify(error.request));
      } else {
        console.error(error.message);
      }
      return "";
    }
  }
};

export const askChatAiCharacterQuestion = async function (
  sfbotCharacter: SfbotCharacter,
  text: string
): Promise<any> {
  const data = `username=org:${sfbotCharacter.sfbot.organizationId}:bot:${sfbotCharacter.sfbot.id}&password=${sfbotCharacter.sfbot.password}`;
  const result = await axios.post(
    `${process.env.API_URL.replace("graphql", "")}sfbot/login2`,
    data
  );

  console.log(result.data);

  const uuid = require("uuid");
  const uuidStr = uuid.v1();
  const chatInput = {
    id: uuidStr,
    msg: text,
    character_desc: sfbotCharacter.prompt,
    character_id: sfbotCharacter.id,
    res: 0,
    userflag: "external",
  };
  try {
    const res = await axios.post(
      `${process.env.API_URL.replace("graphql", "")}sfbot/chat`,
      JSON.stringify(chatInput),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: result.data,
        },
      }
    );
    console.log(res.data);
    return res.data;
  } catch (error: any) {
    if (error.response) {
      console.error(JSON.stringify(error.response.data));
    } else if (error.request) {
      console.error(JSON.stringify(error.request));
    } else {
      console.error(error.message);
    }
    try {
      const res = await axios.post(
        `${process.env.API_URL.replace("graphql", "")}sfbot/chat`,
        JSON.stringify(chatInput),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: result.data,
          },
        }
      );
      console.log(res.data);
      return res.data;
    } catch (error: any) {
      if (error.response) {
        console.error(JSON.stringify(error.response.data));
      } else if (error.request) {
        console.error(JSON.stringify(error.request));
      } else {
        console.error(error.message);
      }
      return "";
    }
  }
};

export const exportAiReport = async function (
  existModel: any,
  fileUrl: string,
  fileName: string
): Promise<any> {
  const Docxtemplater = require("docxtemplater");
  const JSZip = require("jszip");
  const time = new Date().getTime();
  // const fileUrl =
  //   "https://file.sflow.pro/abc/industry_analysis_report_template.docx";
  try {
    console.log("ready reviewDocModel");
    const reviewDocModel:any = JSON.parse(existModel.aiReport);
    reviewDocModel.session_name = existModel.session_name;
    console.log("get reviewDocModel");
    console.log(reviewDocModel);
    const data = await new Promise<String>((resolve, reject) => {
      axios
        .get(fileUrl, {
          responseType: "arraybuffer", // 指示axios返回ArrayBuffer
        })
        .then((response: { data: string }) => {
          const uuid = require("uuid");
          const uuidStr = uuid.v1().replace(/-/g, "");
          const filePathDocx = path.join(
            process.cwd(),
            `file/${uuidStr}.docx`
          );
          console.log(filePathDocx);
          if (!fs.existsSync(path.join(process.cwd(), "file"))) {
            fs.mkdirSync(path.join(process.cwd(), "file"));
          }
          // 你可以在这里处理文件内容，例如将其保存到本地或进行其他处理
          const fileContent = Buffer.from(response.data, "binary");
          // fileContent现在包含了文件的内容，你可以将其写入本地文件，或进行其他处理
          fs.writeFile(filePathDocx, fileContent, async (err: any) => {
            if (err) {
              console.error("Error writing file:", err);
              reject("Error writing file");
              return;
            } else {
              console.log(`File has been saved to ${filePathDocx}`);

              // 读取 .docx 文件
              const content = fs.readFileSync(filePathDocx);
              // 解压缩 .docx 文件
              const zip = new JSZip(content);

              // 创建 docxtemplater 实例
              // const doc = new Docxtemplater();
              // doc.loadZip(zip);
              const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
              });

              // 准备要插入的字符串
              // const data = reviewDocModel;
              let data: any = {};
              for (const key in reviewDocModel) {
                if (
                  typeof reviewDocModel[key] === "object" &&
                  reviewDocModel[key] !== null &&
                  !Array.isArray(reviewDocModel[key])
                ) {
                  const subObject = reviewDocModel[key];
                  for (const subKey in subObject) {
                    // data[`${subKey}`] = subObject[subKey];
                    if (
                      typeof subObject[subKey] === "object" &&
                      subObject[subKey] !== null &&
                      !Array.isArray(subObject[subKey])
                    ) {
                      const subObject2 = subObject[subKey];
                      for (const subKey2 in subObject2) {
                        data[`${subKey2}`] = subObject2[subKey2];
                      }
                    } else {
                      data[subKey] = subObject[subKey];
                    }
                  }
                } else {
                  data[key] = reviewDocModel[key];
                }
              }
              // 将数据填充到 .docx 模板中
              doc.setData(data);
              doc.render();

              // 将文档生成为一个 Buffer
              const buffer = doc.getZip().generate({ type: "nodebuffer" });
              const outputFilePathDocx = path.join(
                process.cwd(),
                `file/output${uuidStr}.docx`
              );
              // 写入到新的 .docx 文件
              fs.writeFileSync(outputFilePathDocx, buffer);
              console.log("写入成功");
              // resolve(outputFilePathDocx);
              const name =
                uuidStr.slice(0, 1) +
                "/" +
                uuidStr.slice(1, 2) +
                "/" +
                time +
                "_" +
                fileName +
                path.extname(outputFilePathDocx);
              const oss = OSSmanager.getInstance();
              await oss.put(name, fs.createReadStream(outputFilePathDocx));
              if (fs.existsSync(filePathDocx)) {
                console.log("delete filePathDocx:" + filePathDocx);
                fs.unlinkSync(filePathDocx);
              }
              if (fs.existsSync(outputFilePathDocx)) {
                console.log(
                  "delete outputFilePathDocx:" + outputFilePathDocx
                );
                fs.unlinkSync(outputFilePathDocx);
              }

              console.log(name);
              resolve(
                `${process.env.OSS_FILE}/${name}`
              );
            }
          });
        })
        .catch((error: any) => {
          console.error("Error fetching the file:", error);
          reject("Error fetching the file");
        });
    });
    console.log("create file");
    if (data.includes("Error")) {
      // throw new CommonError(data.toString());
      console.error(data.toString());
      return "";
    }
    console.log(data.toString());
    return data.toString();
  } catch (error: any) {
    if (error.response) {
      console.error(JSON.stringify(error.response.data));
    } else if (error.request) {
      console.error(JSON.stringify(error.request));
    } else {
      console.error(error.message);
    }
    return "";
  }
  
}

export const requestPerplexityJsonParseEmailContent = async (prompt: string) => {
  const res = await axios.post(
    "https://api.perplexity.ai/chat/completions",
    {
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content: "Be precise and concise.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    },
    {
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        Authorization: `Bearer ${process.env.PERPLEXITY_APIKEY}`,
      },
    }
  );
  console.log(`data:${JSON.stringify(res.data)}`);
  // return res.data.choices[0].message.content;
  if (res.data.choices[0].message.content) {
    try {
      const content = res.data.choices[0].message.content;
      JSON.parse(
        content.replaceAll("```json", "").replaceAll("```", "")
      );
      console.log(content);
      return content
        .replaceAll("```json", "")
        .replaceAll("```", "");
    } catch (error) {
      return "";
    }
  }
  return "";
};

export const getCustomerProfilePersonFromChatGPT = async (email: string) => {

  try {
    const res = await axios.post(
      "https://abc.easiio.com/chatapi/execute/service3/customer_profile/get_person",
      {
        args: {
          json_data: {
            email: email,
          },
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      }
    );
    console.log(res.data);
    if (res.data.result.data.person){
      console.log(res.data.result.data.person);
      return res.data.result.data.person;
    }
    return null;
  } catch (error) {
    return null;
  }
};


export const getCustomerProfileCompanyFromChatGPT = async (name: string) => {
  try {
    const res = await axios.post(
      "https://abc.easiio.com/chatapi/execute/service3/customer_profile/get_company",
      {
        args: {
          json_data: {
            name: name,
          },
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      }
    );
    console.log(res.data);
    if (res.data.result.data){
      console.log(res.data.result.data);
      return JSON.parse(res.data.result.data);
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const requestQuestionFromChatGPTMini = async (prompt: string) => {
  try {
    const res = await axios.post(
      "http://127.0.0.1:5700/askQuestionFromChatGPTMini",
      {
        content: prompt
      },
      {
        headers: {
          "content-type": "application/json",
        },
      }
    );
    console.log(`data:${JSON.stringify(res.data)}`);
    return res.data.data.choices[0].message.content;
  } catch (error) {
    return "request chatgpt error";
  }
  
}

export const requestQuestionFromPerplexity = async (prompt: string) => {
  try {
    const res = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: "Be precise and concise.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.PERPLEXITY_APIKEY}`,
        },
      }
    );
    console.log(`data:${JSON.stringify(res.data)}`);
    return res.data.choices[0].message.content;
  } catch (error) {
    return "request perplexity error";
  }
  
}
