import {
  Resolver,
  //   Mutation,
  Arg,
  UseMiddleware,
  Int,
  Query,
  //   Ctx,
} from "type-graphql";

// import { GQLContext } from "@/types/context";
import { IsAuth } from "@/middlewares/isAuth";
import { ErrorInterceptor, ResolveTime } from "@/middlewares";
// import { DataManage, DataAPIManage } from "@/models";
import axios from "axios";
import { CommonError } from "@/errors";

@Resolver()
class RestfulApiWITSResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getWITSGlobalProductFuels(
    // @Ctx() ctx: GQLContext,
    @Arg("year", () => Int) year: number
  ): Promise<string> {
    try {
      const res = await axios.get(
        `https://wits.worldbank.org/API/V1/SDMX/V21/datasource/tradestats-trade/reporter/wld/year/${year}/partner/wld/product/fuels/indicator/MPRT-TRD-VL?format=JSON`,
        {
          headers: {
            "content-type": "application/json",
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
  @Query(() => String)
  async getWITSUSAProductFuels(
    @Arg("year", () => Int) year: number
  ): Promise<string> {
    try {
      const res = await axios.get(
        `https://wits.worldbank.org/API/V1/SDMX/V21/datasource/tradestats-trade/reporter/usa/year/${year}/partner/wld/product/fuels/indicator/MPRT-TRD-VL?format=JSON`,
        {
          headers: {
            "content-type": "application/json",
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
  @Query(() => String)
  async getWITSReporter(): Promise<string> {
    const xml2js = require("xml2js");
    try {
      const res = await axios.get(
        `https://wits.worldbank.org/API/V1/wits/datasource/tradestats-trade/country/ALL?format=JSON`,
        {
          headers: {
            "content-type": "application/json",
          },
        }
      );
      console.log(res.data);

      // 解析 XML
      // 解析 XML

      const data = await new Promise<string>((resolve, _reject) => {
        xml2js.parseString(
          res.data,
          { explicitArray: false },
          async (err: any, result: { xml: any }) => {
            if (err) {
              console.error("Error parsing XML:", err);
              throw new CommonError(err);
            }
            // 输出解析后的 JavaScript 对象
            console.log("Parsed XML:", result);

            // 根据解析后的数据进行处理
            //   const message = result.xml;
            resolve(JSON.stringify(result));
          }
        );
      });
      return data;
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
  async getWITSYear(): Promise<string> {
    const xml2js = require("xml2js");
    try {
      const res = await axios.get(
        `https://wits.worldbank.org/API/V1/wits/datasource/tradestats-trade/dataavailability/`,
        {
          headers: {
            "content-type": "application/json",
          },
        }
      );
      console.log(res.data);

      // 解析 XML
      // 解析 XML

      const data = await new Promise<string>((resolve, _reject) => {
        xml2js.parseString(
          res.data,
          { explicitArray: false },
          async (err: any, result: { xml: any }) => {
            if (err) {
              console.error("Error parsing XML:", err);
              throw new CommonError(err);
            }
            // 输出解析后的 JavaScript 对象
            console.log("Parsed XML:", result);

            // 根据解析后的数据进行处理
            //   const message = result.xml;
            resolve(JSON.stringify(result));
          }
        );
      });
      return data;
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
  async getWITSPartner(): Promise<string> {
    const xml2js = require("xml2js");
    try {
      const res = await axios.get(
        `https://wits.worldbank.org/API/V1/wits/datasource/tradestats-trade/country/ALL`,
        {
          headers: {
            "content-type": "application/json",
          },
        }
      );
      console.log(res.data);

      // 解析 XML
      // 解析 XML

      const data = await new Promise<string>((resolve, _reject) => {
        xml2js.parseString(
          res.data,
          { explicitArray: false },
          async (err: any, result: { xml: any }) => {
            if (err) {
              console.error("Error parsing XML:", err);
              throw new CommonError(err);
            }
            // 输出解析后的 JavaScript 对象
            console.log("Parsed XML:", result);

            // 根据解析后的数据进行处理
            //   const message = result.xml;
            resolve(JSON.stringify(result));
          }
        );
      });
      return data;
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
  async getWITSProduct(): Promise<string> {
    const xml2js = require("xml2js");
    try {
      const res = await axios.get(
        `https://wits.worldbank.org/API/V1/wits/datasource/tradestats-trade/product/ALL`,
        {
          headers: {
            "content-type": "application/json",
          },
        }
      );
      console.log(res.data);

      // 解析 XML
      // 解析 XML

      const data = await new Promise<string>((resolve, _reject) => {
        xml2js.parseString(
          res.data,
          { explicitArray: false },
          async (err: any, result: { xml: any }) => {
            if (err) {
              console.error("Error parsing XML:", err);
              throw new CommonError(err);
            }
            // 输出解析后的 JavaScript 对象
            console.log("Parsed XML:", result);

            // 根据解析后的数据进行处理
            //   const message = result.xml;
            resolve(JSON.stringify(result));
          }
        );
      });
      return data;
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
  async getWITSIndicator(): Promise<string> {
    const xml2js = require("xml2js");
    try {
      const res = await axios.get(
        `https://wits.worldbank.org/API/V1/wits/datasource/tradestats-trade/indicator/ALL`,
        {
          headers: {
            "content-type": "application/json",
          },
        }
      );
      console.log(res.data);

      // 解析 XML
      // 解析 XML

      const data = await new Promise<string>((resolve, _reject) => {
        xml2js.parseString(
          res.data,
          { explicitArray: false },
          async (err: any, result: { xml: any }) => {
            if (err) {
              console.error("Error parsing XML:", err);
              throw new CommonError(err);
            }
            // 输出解析后的 JavaScript 对象
            console.log("Parsed XML:", result);

            // 根据解析后的数据进行处理
            //   const message = result.xml;
            resolve(JSON.stringify(result));
          }
        );
      });
      return data;
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
}

export default RestfulApiWITSResolver;
