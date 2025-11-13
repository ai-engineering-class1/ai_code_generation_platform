import { Configuration, OpenAIApi } from "openai";
require("dotenv").config();

async function openaiEmbedding(input: any) {
  const embedding: any = {};
  try {
    const openai = new OpenAIApi(
      new Configuration({ apiKey: process.env.OPENAI_KEY })
    );
    const response = await openai.createEmbedding({
      model: "text-embedding-3-small",
      input: input,
    });
    const vector = response.data.data[0].embedding;
    const float32Array = new Float32Array(vector);
    embedding.data = Buffer.from(float32Array.buffer);
  } catch (error: any) {
    console.log("openaiEmbedding error");
    console.log(new Date(), error.message);
    if (error.response) {
      console.log(new Date(), error.response.status, error.response.data);
    }
  }
  return embedding;
}

function create_hybrid_field(field_name: string, value: string, orgid: any) {
  if (orgid) {
    return `(@orgid:${orgid} @${field_name}:"${value}")`;
  }
  return `@${field_name}:"${value}"`;
}

async function runSearch(
  query: string,
  vector_field = "text_vector",
  return_fields = ["id", "category", "title", "vector_score"],
  hybrid_fields = "*",
  k = 10
) {
  const indexName = "sflow-index";

  const redis = require("redis");
  const redisClient = redis.createClient({
    url: process.env.REDIS_URL,
  });

  redisClient.on("error", (err: any) => {
    console.log(new Date(), "redis error:", err);
  });
  redisClient.on("connect", () => {
    console.log(new Date(), "try to connect redis");
  });
  redisClient.on("ready", () => {
    console.log(new Date(), "redis is ready");
  });
  redisClient.on("message", function (channel: string, message: string) {
    console.log(
      new Date(),
      "Message: " + message + " on channel: " + channel + " is arrived."
    );
  });
  await redisClient.connect();
  // await redisClient.select(0);
  const query_embedding = await openaiEmbedding(query);
  const base_query = `${hybrid_fields}=>[KNN ${k} @${vector_field} $BLOB AS vector_score]`;
  const results = await redisClient.ft.search(indexName, base_query, {
    PARAMS: { BLOB: query_embedding.data },
    SORTBY: "vector_score",
    LIMIT: { from: 0, size: k },
    DIALECT: 2,
    RETURN: return_fields,
  });
  await redisClient.quit();
  return results;
}

export const runTest = async (query: string, orgid: any, category: string) => {
  const vector_field = "text_vector";
  const return_fields = ["id", "category", "title", "vector_score", "text"];
  const hybrid_fields = create_hybrid_field("category", category, orgid);
  const res = await runSearch(
    query,
    vector_field,
    return_fields,
    hybrid_fields,
    5
  );
  // console.log(JSON.stringify(res, null, 2));
  // console.log("Query:", query);
  // console.log("Matched records:", res.total);
  // for (const doc of res.documents) {
  //   const docid = doc.value.id;
  //   if (doc.value.vector_score) {
  //     const doescore = doc.value.vector_score;
  //     const score = (1 - parseInt(doescore)).toFixed(3);
  //     console.log(docid, doc.value.category, score, doc.value.title);
  //   }
  // }
  return res;
};

export const runBidDocumentKb = async (
  query: string,
  orgid: any,
  project: string
) => {
  const vector_field = "text_vector";
  const return_fields = ["id", "title", "text", "vector_score"];
  const hybrid_fields = create_hybrid_field("project", project, orgid);
  const res = await runSearch(
    query,
    vector_field,
    return_fields,
    hybrid_fields,
    20
  );
  return res;
};

export const runEmbeddingFAQContent = async (
  query: string,
  orgid: any,
  category: string,
  chatbots: any,
  externalFlag: any
) => {
  const vector_field = "title_vector";
  const return_fields = ["id", "title", "text", "vector_score"];
  let hybrid_fields = `(@orgid:${orgid} @category:"${category}")`;
  if (chatbots) {
    hybrid_fields = `(@orgid:${orgid} @chatbots:{${chatbots}} @category:"${category}")`;
  }

  if (chatbots && externalFlag === 1) {
    hybrid_fields = `(@orgid:${orgid} @chatbots:{${chatbots}} @public:[1 1] @category:"${category}")`;
  }
  console.log(hybrid_fields);
  //create_hybrid_field(category, project, orgid);
  const res = await runSearch(
    query,
    vector_field,
    return_fields,
    hybrid_fields,
    20
  );
  return res;
};

export const runEmbeddingContent = async (
  query: string,
  hybrid_fields: any,
) => {
  const vector_field = "title_vector";
  const return_fields = ["id", "title", "text", "vector_score"];
  // let hybrid_fields = `(@orgid:${orgid} @category:"${category}")`;
  // if (chatbots) {
  //   hybrid_fields = `(@orgid:${orgid} @chatbots:{${chatbots}} @category:"${category}")`;
  // }

  // if (chatbots && externalFlag === 1) {
  //   hybrid_fields = `(@orgid:${orgid} @chatbots:{${chatbots}} @public:[1 1] @category:"${category}")`;
  // }
  console.log(hybrid_fields);
  //create_hybrid_field(category, project, orgid);
  const res = await runSearch(
    query,
    vector_field,
    return_fields,
    hybrid_fields,
    20
  );
  return res;
};

export const getEmbedding = async (text: string) => {
  const query_embedding = await openaiEmbedding(text);
  return query_embedding;
};

// const query = "how to relax and calm down";
// runTest(query);
