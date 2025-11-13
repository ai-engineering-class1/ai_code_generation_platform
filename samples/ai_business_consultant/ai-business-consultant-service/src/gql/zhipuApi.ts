import {
  Resolver,
  UseMiddleware,
  Query,
  Arg,
  Int,
  Ctx,
  Float,
  Mutation,
} from "type-graphql";
import { ErrorInterceptor, ResolveTime } from "@/middlewares";
import jwt from "jsonwebtoken";
import axios from "axios";
import { CommonError } from "@/errors";
import { IsAdminAuth, IsAuth } from "@/middlewares/isAuth";
import { GQLContext } from "@/types/context";
import { LlmTrace } from "@/models";
import { isNonEmptyString, isValidNumber } from "@/utils/validations";
import { printLogInfo } from "@/utils/common";

const getToken = async function (): Promise<string> {
  const [id, secret] = process.env.ZPKEY.split(".");
  const payload = {
    api_key: id,
    exp: new Date().getTime() + 3600,
    timestamp: new Date().getTime(),
  };
  console.log(payload);
  const token = jwt.sign(payload, secret, {
    algorithm: "HS256",
    header: { alg: "HS256", sign_type: "SIGN" },
  });
  console.log(token);
  return token;
};

@Resolver()
class ZhiPuApiResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getZhiPuAllKb(
    @Arg("page", () => Int, { nullable: true }) page: number,
    @Arg("size", () => Int, { nullable: true }) size: number
  ): Promise<string> {
    try {
      const res = await axios.get(
        `https://open.bigmodel.cn/api/llm-application/open/knowledge?page=${
          isValidNumber(page) ? page : 1
        }&size=${isValidNumber(size) ? size : 200}`,
        {
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );
      console.log(res.data);
      return JSON.stringify(res.data);
    } catch (error: any) {
      if (error.response) {
        throw new CommonError(JSON.stringify(error.response.data));
      } else if (error.request) {
        throw new CommonError(JSON.stringify(error.request));
      } else {
        throw new CommonError(error.message);
      }
    }
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getZhiPuKbByKbId(
    @Arg("kbId", () => String) kbId: string
  ): Promise<string> {
    try {
      const res = await axios.get(
        `https://open.bigmodel.cn/api/llm-application/open/knowledge/${kbId}`,
        {
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );
      console.log(res.data);
      return JSON.stringify(res.data);
    } catch (error: any) {
      if (error.response) {
        throw new CommonError(JSON.stringify(error.response.data));
      } else if (error.request) {
        throw new CommonError(JSON.stringify(error.request));
      } else {
        throw new CommonError(error.message);
      }
    }
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getZhiPuKbFilesByKbId(
    @Arg("kbId", () => String) kbId: string
  ): Promise<string> {
    try {
      const res = await axios.get(
        `https://open.bigmodel.cn/api/llm-application/open/document?knowledge_id=${kbId}`,
        {
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );
      console.log(res.data);
      return JSON.stringify(res.data);
    } catch (error: any) {
      if (error.response) {
        throw new CommonError(JSON.stringify(error.response.data));
      } else if (error.request) {
        throw new CommonError(JSON.stringify(error.request));
      } else {
        throw new CommonError(error.message);
      }
    }
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getZhiPuKbFileByFileId(
    @Arg("fileId", () => String) fileId: string
  ): Promise<string> {
    try {
      const res = await axios.get(
        `https://open.bigmodel.cn/api/llm-application/open/document/${fileId}`,
        {
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );
      console.log(res.data);
      return JSON.stringify(res.data);
    } catch (error: any) {
      if (error.response) {
        throw new CommonError(JSON.stringify(error.response.data));
      } else if (error.request) {
        throw new CommonError(JSON.stringify(error.request));
      } else {
        throw new CommonError(error.message);
      }
    }
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => String)
  async debugChatZhiPuKbByLlmTraceId(
    @Arg("id", () => Int) id: number,
    @Arg("messages", () => String) messages: string,
    @Arg("temperature", () => Float) temperature: number,
    @Arg("top_p", () => Float) top_p: number,
    @Ctx() ctx: GQLContext,
    @Arg("kb_id", () => String, { nullable: true }) kb_id: string,
    @Arg("kb_prompt", () => String, { nullable: true }) kb_prompt: string,
    @Arg("model", () => String) model: string
  ): Promise<string> {
    const llmTrace = await LlmTrace.findOneOrFail({
      where: {
        id: id,
        organizationId: ctx.req.currentUser.organizationId,
      },
    });

    try {
      let tools;
      if (isNonEmptyString(kb_id) && isNonEmptyString(kb_prompt)) {
        tools = [
          {
            type: "retrieval",
            retrieval: { knowledge_id: kb_id, prompt_template: kb_prompt },
          },
        ];
        if (!model.includes("glm-4")) {
          model = "glm-4-0520";
        }
      } else {
        tools = [{ type: "web_search", web_search: { enable: false } }];
      }
      if (isNonEmptyString(model) && model.includes("qwen-2.5-32b")) {
        const messagesModel = JSON.parse(messages);
        if (messagesModel[1].role === "assistant") {
          messagesModel.splice(1, 1);
        }
        const input = {
          model: model,
          temperature: temperature,
          top_p: top_p,
          stream: false,
          messages: messagesModel,
        };
        console.log(input);
        printLogInfo(model, JSON.stringify(input));
        const res = await axios.post(
          `https://via.sflow.io/openai/v1/chat/completions`,
          JSON.stringify(input),
          {
            headers: {
              "content-type": "application/json",
              Authorization: `Bearer ${process.env.QWENKEY_25_32B}`,
            },
          }
        );
        console.log(JSON.stringify(res.data));
        return JSON.stringify(res.data);
      } else if (isNonEmptyString(model) && model.includes("qwen")) {
        const messagesModel = JSON.parse(messages);
        if (messagesModel[1].role === "assistant") {
          messagesModel.splice(1, 1);
        }
        const input = {
          model: model,
          temperature: temperature,
          top_p: top_p,
          stream: false,
          // max_tokens: llmTrace.max_tokens,
          // tools: tools, //[{ type: "web_search", web_search: { enable: false } }],
          messages: messagesModel, //JSON.parse(messages),
        };
        console.log(input);
        printLogInfo(model, JSON.stringify(input));
        const res = await axios.post(
          `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`,
          JSON.stringify(input),
          {
            headers: {
              "content-type": "application/json",
              Authorization: `Bearer ${process.env.QWENKEY}`,
            },
          }
        );
        console.log(JSON.stringify(res.data));
        return JSON.stringify(res.data);
      } else if (isNonEmptyString(model) && model.includes("farui-plus")) {
        const messagesModel = JSON.parse(messages);
        if (messagesModel[1].role === "assistant") {
          messagesModel.splice(1, 1);
        }
        const input = {
          model: model,
          temperature: temperature,
          top_p: top_p,
          stream: false,
          messages: messagesModel, //JSON.parse(messages),
        };
        console.log("farui-plus");
        console.log(input);
        printLogInfo(model, JSON.stringify(input));
        const res = await axios.post(
          `https://chat.saasflow.cn/v1/chat/completions`,
          JSON.stringify(input),
          {
            headers: {
              "content-type": "application/json",
              Authorization: `Bearer ${process.env.QWENKEY_PROXY}`,
            },
          }
        );
        console.log(JSON.stringify(res.data));
        return JSON.stringify(res.data);
      } else if (isNonEmptyString(model) && model.includes("gpt")) {
        const messagesModel = JSON.parse(messages);
        const input = {
          model: model,
          temperature: temperature,
          top_p: top_p,
          stream: false,
          messages: messagesModel, //JSON.parse(messages),
        };
        console.log("gpt");
        console.log(input);
        printLogInfo(model, JSON.stringify(input));
        const res = await axios.post(
          `https://gpt.sflow.io/v1/chat/completions`,
          JSON.stringify(input),
          {
            headers: {
              "content-type": "application/json",
              Authorization: `Bearer ${process.env.GPT_PROXY}`,
            },
          }
        );
        console.log(JSON.stringify(res.data));
        return JSON.stringify(res.data);
      } else if (isNonEmptyString(model) && model.includes("deepseek")) {
        const messagesModel = JSON.parse(messages);
        if (messagesModel[1].role === "assistant") {
          messagesModel.splice(1, 1);
        }
        const input = {
          model: model,
          temperature: temperature,
          top_p: top_p,
          stream: false,
          messages: messagesModel, //JSON.parse(messages),
        };
        console.log(input);
        printLogInfo(model, JSON.stringify(input));
        const res = await axios.post(
          `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`,
          JSON.stringify(input),
          {
            headers: {
              "content-type": "application/json",
              Authorization: `Bearer ${process.env.QWENKEY}`,
            },
          }
        );
        console.log(JSON.stringify(res.data));
        return JSON.stringify(res.data);
      } else {
        const input = {
          model: model,
          temperature: temperature,
          top_p: top_p,
          stream: false,
          max_tokens: llmTrace.max_tokens,
          tools: tools, //[{ type: "web_search", web_search: { enable: false } }],
          messages: JSON.parse(messages),
        };
        console.log(input);
        printLogInfo(model, JSON.stringify(input));
        const res = await axios.post(
          `https://open.bigmodel.cn/api/paas/v4/chat/completions`,
          JSON.stringify(input),
          {
            headers: {
              "content-type": "application/json",
              Authorization: `Bearer ${await getToken()}`,
            },
          }
        );
        console.log(JSON.stringify(res.data));
        return JSON.stringify(res.data);
      }
    } catch (error: any) {
      if (error.response) {
        throw new CommonError(JSON.stringify(error.response.data));
      } else if (error.request) {
        throw new CommonError(JSON.stringify(error.request));
      } else {
        throw new CommonError(error.message);
      }
    }
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getZhiPuAllKbs(
    @Arg("page", () => Int, { nullable: true }) page: number,
    @Arg("size", () => Int, { nullable: true }) size: number
  ): Promise<string> {
    try {
      const res = await axios.get(
        `https://open.bigmodel.cn/api/paas/v4/knowledge?page=${
          isValidNumber(page) ? page : 1
        }&size=${isValidNumber(size) ? size : 200}`,
        {
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );
      console.log(res.data);
      return JSON.stringify(res.data);
    } catch (error: any) {
      if (error.response) {
        throw new CommonError(JSON.stringify(error.response.data));
      } else if (error.request) {
        throw new CommonError(JSON.stringify(error.request));
      } else {
        throw new CommonError(error.message);
      }
    }
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Mutation(() => String)
  async convertMarkdownToHtml(
    @Arg("markdownString", () => String) markdownString: string
  ): Promise<string> {
    const marked = require("marked");
    try {
      return marked.parse(markdownString);
    } catch (error) {
      throw new CommonError("转换失败");
    }
  }
}

export default ZhiPuApiResolver;
