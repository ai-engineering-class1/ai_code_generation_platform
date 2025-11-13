import { Resolver, UseMiddleware, Query, Arg, Int } from "type-graphql";

import { IsAuth } from "@/middlewares/isAuth";
import { ErrorInterceptor, ResolveTime } from "@/middlewares";
import axios from "axios";
import redis from "ioredis";
import { CommonError } from "@/errors";

const getTradeatlasToken = async () => {
  const client = new redis(process.env.REDIS_URL);
  client.select(0);
  let token = await client.get(`tradeatlas_token`);
  console.log(`redis tradeatlas_token:${token}`);
  if (token === null || token === "") {
    const res = await axios.post(
      "https://api.tradeatlas.com/api/v1/user/login",
      {
        userName: "easiio",
        password: "*3As1i0_",
      },
      {
        headers: {
          "content-type": "application/json",
        },
      }
    );
    console.log(res.data.access_token);
    token = res.data.access_token;
    client.set(`tradeatlas_token`, token!, "EX", 20000);
  }
  return token;
};

@Resolver()
class TradeatlasResolver {
  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getTradeatlasFirmsCount(
    @Arg("countries", () => [String]) countries: string[],
    @Arg("startDate", () => String) startDate: string,
    @Arg("endDate", () => String) endDate: string,
    @Arg("HS_CODE", () => String) HS_CODE: string,
    @Arg("importer_name", () => String) importer_name: string
  ): Promise<string> {
    const token = await getTradeatlasToken();
    const res = await axios.post(
      "https://api.tradeatlas.com/api/v1/firms/count",
      {
        countries: countries,
        startDate: startDate,
        endDate: endDate,
        parameters: [{ HS_CODE: HS_CODE }, { IMPORTER_NAME: importer_name }],
      },
      {
        headers: {
          "content-type": "application/json",
          Authorization: token!,
        },
      }
    );
    console.log(res.data);
    return JSON.stringify(res.data);
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getTradeatlasFirms(
    @Arg("countries", () => [String]) countries: string[],
    @Arg("startDate", () => String) startDate: string,
    @Arg("endDate", () => String) endDate: string,
    @Arg("HS_CODE", () => String) HS_CODE: string,
    @Arg("importer_name", () => String) importer_name: string
  ): Promise<string> {
    const token = await getTradeatlasToken();
    const res = await axios.post(
      "https://api.tradeatlas.com/api/v1/firms/search",
      {
        countries: countries,
        startDate: startDate,
        endDate: endDate,
        firmType: "EXPORTER",
        parameters: [{ HS_CODE: HS_CODE }, { IMPORTER_NAME: importer_name }],
        page: 1,
      },
      {
        headers: {
          "content-type": "application/json",
          Authorization: token!,
        },
      }
    );
    console.log(res.data);
    return JSON.stringify(res.data);
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getTradeatlasShipmentsCount(
    @Arg("countries", () => [String]) countries: string[],
    @Arg("startDate", () => String) startDate: string,
    @Arg("endDate", () => String) endDate: string,
    @Arg("HS_CODE", () => String) HS_CODE: string,
    @Arg("importer_name", () => String) importer_name: string
  ): Promise<string> {
    const token = await getTradeatlasToken();
    const res = await axios.post(
      "https://api.tradeatlas.com/api/v1/shipments/count",
      {
        countries: countries,
        startDate: startDate,
        endDate: endDate,
        parameters: [{ HS_CODE: HS_CODE }, { IMPORTER_NAME: importer_name }],
      },
      {
        headers: {
          "content-type": "application/json",
          Authorization: token!,
        },
      }
    );
    console.log(res.data);
    return JSON.stringify(res.data);
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getTradeatlasShipments(
    @Arg("countries", () => [String]) countries: string[],
    @Arg("startDate", () => String) startDate: string,
    @Arg("endDate", () => String) endDate: string,
    @Arg("HS_CODE", () => String) HS_CODE: string,
    @Arg("importer_name", () => String) importer_name: string
  ): Promise<string> {
    const token = await getTradeatlasToken();
    const res = await axios.post(
      "https://api.tradeatlas.com/api/v1/shipments/search",
      {
        countries: countries,
        startDate: startDate,
        endDate: endDate,
        parameters: [{ HS_CODE: HS_CODE }, { IMPORTER_NAME: importer_name }],
        size: 100,
      },
      {
        headers: {
          "content-type": "application/json",
          Authorization: token!,
        },
      }
    );
    console.log(res.data);
    return JSON.stringify(res.data);
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => String)
  async getTradeatlasFirmsProduct(
    @Arg("countries", () => [String]) countries: string[],
    @Arg("startDate", () => String) startDate: string,
    @Arg("endDate", () => String) endDate: string,
    @Arg("HS_CODE", () => String) HS_CODE: string,
    @Arg("product_details", () => String) product_details: string,
    @Arg("firmType", () => String) firmType: string,
    @Arg("page", () => Int) page: number,
    @Arg("size", () => Int) size: number
  ): Promise<string> {
    const token = await getTradeatlasToken();
    const input = {
      countries: countries,
      startDate: startDate,
      endDate: endDate,
      firmType: firmType, //"EXPORTER",
      parameters: [{ HS_CODE: HS_CODE }, { PRODUCT_DETAILS: product_details }],
      page: page,
      size: size,
    };
    console.log(input);
    try {
      const res = await axios.post(
        "https://api.tradeatlas.com/api/v1/firms/search",
        input,
        {
          headers: {
            "content-type": "application/json",
            Authorization: token!,
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
}

export default TradeatlasResolver;
