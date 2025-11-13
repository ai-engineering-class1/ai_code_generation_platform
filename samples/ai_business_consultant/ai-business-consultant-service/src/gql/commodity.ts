import {
  Resolver,
  UseMiddleware,
  Mutation,
  Query,
  Arg,
  Int,
  Ctx,
} from "type-graphql";
import { ErrorInterceptor, ResolveTime } from "@/middlewares";
import { Commodity, LegalDocumentProject, WxUser, User } from "@/models";
import {
  IsAuth,
  IsAdminAndOperatorAuth,
  IsAdminAuth,
} from "@/middlewares/isAuth";
import { CommodityInput } from "./types";
import { GQLContext } from "@/types/context";
import { CommonError } from "@/errors";
import { IsNull, Like, MoreThan, Not, getRepository } from "typeorm";
import { isNonEmptyString } from "@/utils/validations";

@Resolver()
class CommodityResolver {
  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async setCommodityUuid(): Promise<Boolean> {
    const commoditys = await Commodity.find();
    for (const model of commoditys) {
      const uuid = require("uuid");
      const uuidStr = uuid.v4();
      const QRCode = require("qrcode");
      // 定义二维码内容，可以是带参数的 URL 或任何字符串https://orth5.saasflow.cn/#/pricedetail/
      const qrContent = `https://${process.env.WECHAT_H5}/#/pricedetail/${uuidStr}`;
      const qrCode = await QRCode.toDataURL(qrContent);
      model.uuid = uuidStr;
      model.h5Link = qrContent;
      model.qrCode = qrCode;
      await model.save();
    }

    return true;
  }

  @UseMiddleware([IsAdminAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async setCommodityUuidById(
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const model = await Commodity.findOneOrFail(id);
    const uuid = require("uuid");
    const uuidStr = uuid.v4();
    const QRCode = require("qrcode");
    // 定义二维码内容，可以是带参数的 URL 或任何字符串https://orth5.saasflow.cn/#/pricedetail/
    const qrContent = `https://${process.env.WECHAT_H5}/#/pricedetail/${uuidStr}`;
    const qrCode = await QRCode.toDataURL(qrContent);
    model.uuid = uuidStr;
    model.h5Link = qrContent;
    model.qrCode = qrCode;
    await model.save();

    return true;
  }
  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Commodity)
  async createCommodity(
    @Ctx() ctx: GQLContext,
    @Arg("commodity")
    commodityInput: CommodityInput,
    @Arg("lawyerIds", () => [String]) lawyerIds: string[]
  ): Promise<Commodity> {
    if (commodityInput.price < 0) {
      throw new CommonError("The price cannot be less than 0");
    }
    if (commodityInput.stock && commodityInput.stock < 0) {
      throw new CommonError("Stock cannot be negative");
    }
    if (
      commodityInput.state &&
      commodityInput.state !== "Public" &&
      commodityInput.state !== "Private"
    ) {
      throw new CommonError("Error state");
    }
    const user = ctx.req.currentUser;
    if (user.role === 1) {
      if (commodityInput.legalDocumentProjectId) {
        await LegalDocumentProject.findOneOrFail({
          where: {
            id: commodityInput.legalDocumentProjectId,
            organizationId: user.organizationId,
          },
        });
      } else {
        commodityInput.legalDocumentProjectId = null;
      }
    } else {
      if (!commodityInput.legalDocumentProjectId) {
        throw new CommonError("No found project");
      }
      const project = await LegalDocumentProject.findOne({
        where: {
          id: commodityInput.legalDocumentProjectId,
          organizationId: user.organizationId,
          creatorId: user.id,
        },
      });
      if (!project) {
        throw new CommonError(
          "The project does not exist or you are not the creator."
        );
      }
    }
    const uuid = require("uuid");
    const uuidStr = uuid.v1();
    const QRCode = require("qrcode");

    // 定义二维码内容，可以是带参数的 URL 或任何字符串
    // const qrContent = `${process.env.CHECK_COMMODITY}${uuidStr}`;
    const qrContent = `https://${process.env.WECHAT_H5}/#/pricedetail/${uuidStr}`;
    const qrCode = await QRCode.toDataURL(qrContent);
    const model = await Commodity.create({
      ...commodityInput,
      organizationId: user.organizationId,
      creatorId: user.id,
      uuid: uuidStr,
      qrCode: qrCode,
      h5Link: qrContent,
    }).save();
    const userRepository = getRepository(User);
    const commodityRepository = getRepository(Commodity);
    const users = await userRepository.findByIds(lawyerIds, {
      organizationId: user.organizationId,
    });
    model.lawyers = users;
    await commodityRepository.save(model);
    return await Commodity.findOneOrFail(model.id, {
      relations: ["lawyers"],
    });
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Commodity)
  async updateCommodity(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("commodity")
    commodityInput: CommodityInput,
    @Arg("lawyerIds", () => [String]) lawyerIds: string[]
  ): Promise<Commodity> {
    const user = ctx.req.currentUser;
    const existCommodity = await Commodity.findOneOrFail(id);
    if (existCommodity.status === "Release" && user.role !== 1) {
      console.log(`name:${user.name},role:${user.role}`);
      throw new CommonError("No permission.");
    }
    if (commodityInput.price < 0) {
      throw new CommonError("The price cannot be less than 0");
    }
    if (commodityInput.stock && commodityInput.stock < 0) {
      throw new CommonError("Stock cannot be negative");
    }
    if (
      commodityInput.state &&
      commodityInput.state !== "Public" &&
      commodityInput.state !== "Private"
    ) {
      throw new CommonError("Error state");
    }
    if (user.role === 1) {
      if (commodityInput.legalDocumentProjectId) {
        await LegalDocumentProject.findOneOrFail({
          where: {
            id: commodityInput.legalDocumentProjectId,
            organizationId: user.organizationId,
          },
        });
      } else {
        commodityInput.legalDocumentProjectId = null;
      }

      await Commodity.findOneOrFail({
        id: id,
        organizationId: user.organizationId,
      });
    } else {
      if (!commodityInput.legalDocumentProjectId) {
        throw new CommonError("No found project");
      }
      const project = await LegalDocumentProject.findOne({
        where: {
          id: commodityInput.legalDocumentProjectId,
          organizationId: user.organizationId,
          creatorId: user.id,
        },
      });
      if (!project) {
        throw new CommonError(
          "The project does not exist or you are not the creator."
        );
      }
      const commodity = await Commodity.findOne({
        id: id,
        organizationId: user.organizationId,
        creatorId: user.id,
      });
      if (!commodity) {
        throw new CommonError("You are not the creator of this commodity.");
      }
    }

    const userRepository = getRepository(User);
    const commodityRepository = getRepository(Commodity);
    const users = await userRepository.findByIds(lawyerIds, {
      organizationId: user.organizationId,
    });
    existCommodity.lawyers = users;
    await commodityRepository.save(existCommodity);
    await Commodity.update(id, commodityInput);
    return await Commodity.findOneOrFail(existCommodity.id, {
      relations: ["lawyers"],
    });
    // const model = await Commodity.findOneOrFail(id);

    // return model;
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async deleteCommodity(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    if (user.role === 1) {
      const model = await Commodity.findOneOrFail({
        id: id,
        organizationId: user.organizationId,
      });
      await model.softRemove();
    } else {
      const model = await Commodity.findOne({
        id: id,
        organizationId: user.organizationId,
        creatorId: user.id,
        status: "Testing",
      });
      if (!model) {
        throw new CommonError("You are not the creator of this commodity.");
      }
      await model.softRemove();
    }

    return true;
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Commodity)
  async copyCommodity(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("name", () => String) name: string,
    @Arg("legalDocumentProjectId", () => Int) legalDocumentProjectId: number
  ): Promise<Commodity> {
    const user = ctx.req.currentUser;
    const model = await Commodity.findOneOrFail({
      where: {
        id: id,
        organizationId: user.organizationId,
      },
      relations: ["lawyers"],
    });

    if (user.role === 1) {
      await LegalDocumentProject.findOneOrFail({
        where: {
          id: legalDocumentProjectId,
          organizationId: user.organizationId,
        },
      });
    } else {
      const project = await LegalDocumentProject.findOne({
        where: {
          id: legalDocumentProjectId,
          organizationId: user.organizationId,
          creatorId: user.id,
        },
      });
      if (!project) {
        throw new CommonError(
          "The project does not exist or you are not the creator."
        );
      }
    }

    const uuid = require("uuid");
    const uuidStr = uuid.v1();
    const QRCode = require("qrcode");

    // 定义二维码内容，可以是带参数的 URL 或任何字符串
    const qrContent = `https://${process.env.WECHAT_H5}/#/pricedetail/${uuidStr}`;
    const qrCode = await QRCode.toDataURL(qrContent);
    const res = await Commodity.create({
      ...model,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      name: name,
      creatorId: user.id,
      state: "Private",
      legalDocumentProjectId: legalDocumentProjectId,
      uuid: uuidStr,
      qrCode: qrCode,
      h5Link: qrContent,

      // name: name,
      // price: model.price,
      // availableQueries: model.availableQueries,
      // organizationId: model.organizationId,
      // mainImg: model.mainImg,
      // description: model.description,
      // marketPrice: model.marketPrice,
      // details: model.details,
      // salesVolume: model.salesVolume,
      // carouselImgs: model.carouselImgs,
      // detailImgs: model.detailImgs,
      // status: model.status,
      // creatorId: user.id,
      // stock: model.stock,
      // state: "Private",
      // legalDocumentProjectId: legalDocumentProjectId,
      // uuid: uuidStr,
      // qrCode: qrCode,
      // h5Link: qrContent,
    }).save();
    if (model.lawyers.length > 0) {
      const commodityRepository = getRepository(Commodity);
      res.lawyers = model.lawyers;
      await commodityRepository.save(res);
    }

    return res;
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async setOfflineCommodity(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    if (user.role === 1) {
      const model = await Commodity.findOneOrFail({
        id: id,
        organizationId: user.organizationId,
      });
      model.status = "Offline";
      await model.save();
    } else {
      const model = await Commodity.findOneOrFail({
        id: id,
        organizationId: user.organizationId,
        creatorId: user.id,
        // status: "Testing",
      });
      // if (!model) {
      //   throw new CommonError("No found commodity.");
      // }
      model.status = "Offline";
      await model.save();
    }

    return true;
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Boolean)
  async setReleaseCommodity(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number
  ): Promise<Boolean> {
    const user = ctx.req.currentUser;
    if (user.role === 1) {
      const model = await Commodity.findOneOrFail({
        id: id,
        organizationId: user.organizationId,
      });
      model.status = "Release";
      await model.save();
    } else {
      const model = await Commodity.findOneOrFail({
        id: id,
        organizationId: user.organizationId,
        creatorId: user.id,
      });
      model.status = "Release";
      await model.save();
    }

    return true;
  }

  @UseMiddleware([IsAuth, ErrorInterceptor, ResolveTime])
  @Query(() => [Commodity])
  async getCommoditys(@Ctx() ctx: GQLContext): Promise<Commodity[]> {
    const user = ctx.req.currentUser;
    if (user.role !== 1 && user.role !== 3) {
      const models = await Commodity.find({
        where: {
          organizationId: user.organizationId,
          status: "Release",
        },
        relations: ["legalDocumentProject", "lawyers"],
        order: { id: "DESC" },
      });
      return models;
    } else {
      const models = await Commodity.find({
        where: {
          organizationId: user.organizationId,
          // status: Not("Offline"),
        },
        relations: ["legalDocumentProject", "lawyers"],
        order: { id: "DESC" },
      });
      return models;
    }
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => [Commodity])
  async getCommoditysByWxUser(
    @Arg("openid", () => String, { nullable: true }) openid: string,
    @Arg("name", () => String, { nullable: true }) name: string
  ): Promise<Commodity[]> {
    if (!isNonEmptyString(openid)) {
      const releaseCommoditys = await Commodity.find({
        where: [
          {
            status: "Release",
            state: "Public",
            stock: IsNull(),
            ...(name ? { name: Like(`%${name}%`) } : {}),
          },
          {
            status: "Release",
            state: "Public",
            stock: MoreThan(0),
            ...(name ? { name: Like(`%${name}%`) } : {}),
          },
        ],
        relations: ["legalDocumentProject"],
      });
      return releaseCommoditys;
    }
    const wxUser = await WxUser.findOneOrFail({
      openId: openid,
    });
    const releaseCommoditys = await Commodity.find({
      where: [
        {
          organizationId: wxUser.organizationId,
          status: "Release",
          state: "Public",
          stock: IsNull(),
          ...(name ? { name: Like(`%${name}%`) } : {}),
        },
        {
          organizationId: wxUser.organizationId,
          status: "Release",
          state: "Public",
          stock: MoreThan(0),
          ...(name ? { name: Like(`%${name}%`) } : {}),
        },
      ],
      relations: ["legalDocumentProject"],
    });
    const testingCommoditys = await Commodity.find({
      where: [
        {
          organizationId: wxUser.organizationId,
          status: "Testing",
          state: "Public",
          stock: IsNull(),
          ...(name ? { name: Like(`%${name}%`) } : {}),
        },
        {
          organizationId: wxUser.organizationId,
          status: "Testing",
          state: "Public",
          stock: MoreThan(0),
          ...(name ? { name: Like(`%${name}%`) } : {}),
        },
      ],
      relations: ["legalDocumentProject", "legalDocumentProject.testers"],
    });
    const myTestingCommoditys: any = [];
    testingCommoditys.forEach((commodity) => {
      if (
        commodity.legalDocumentProject &&
        commodity.legalDocumentProject.testers.some(
          (item) => item.id === wxUser.id
        )
      ) {
        myTestingCommoditys.push(commodity);
      }
    });

    return releaseCommoditys.concat(myTestingCommoditys);
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => Commodity)
  async getOneCommodityByWxUser(
    @Arg("openid", () => String, { nullable: true }) openid: string,
    @Arg("commodityId", () => Int) commodityId: number
  ): Promise<Commodity> {
    if (!isNonEmptyString(openid)) {
      const commodity = await Commodity.findOneOrFail({
        where: [
          {
            id: commodityId,
            status: "Release",
            stock: IsNull(),
          },
          {
            id: commodityId,
            status: "Release",
            stock: MoreThan(0),
          },
        ],
        relations: ["legalDocumentProject"],
      });
      return commodity;
    }
    const wxUser = await WxUser.findOneOrFail({
      openId: openid,
    });
    const commodity = await Commodity.findOneOrFail({
      where: [
        {
          id: commodityId,
          organizationId: wxUser.organizationId,
          status: Not("Offline"),
          stock: IsNull(),
        },
        {
          id: commodityId,
          organizationId: wxUser.organizationId,
          status: Not("Offline"),
          stock: MoreThan(0),
        },
      ],
      relations: ["legalDocumentProject", "legalDocumentProject.testers"],
    });
    if (commodity.status === "Testing" && commodity.legalDocumentProject) {
      if (
        !commodity.legalDocumentProject.testers.some(
          (item) => item.id === wxUser.id
        )
      ) {
        throw new CommonError("No found commodity");
      }
    }
    return commodity;
  }

  @UseMiddleware([IsAdminAndOperatorAuth, ErrorInterceptor, ResolveTime])
  @Mutation(() => Commodity)
  async updateCommodityLawyers(
    @Ctx() ctx: GQLContext,
    @Arg("id", () => Int) id: number,
    @Arg("lawyerIds", () => [String]) lawyerIds: string[]
  ): Promise<Commodity> {
    const user = ctx.req.currentUser;
    let commodity;
    if (user.role === 1) {
      commodity = await Commodity.findOneOrFail({
        where: {
          id: id,
          organizationId: user.organizationId,
        },
      });
    } else {
      commodity = await Commodity.findOne({
        id: id,
        organizationId: user.organizationId,
        creatorId: user.id,
      });
      if (!commodity) {
        throw new CommonError("You are not the creator of this commodity.");
      }
      if (commodity.state === "Release") {
        throw new CommonError(
          "Only administrators can edit published products"
        );
      }
    }
    const userRepository = getRepository(User);
    const commodityRepository = getRepository(Commodity);
    const users = await userRepository.findByIds(lawyerIds, {
      organizationId: user.organizationId,
    });
    commodity.lawyers = users;
    await commodityRepository.save(commodity);
    return await Commodity.findOneOrFail(id, {
      relations: ["lawyers"],
    });
  }

  @UseMiddleware([ErrorInterceptor, ResolveTime])
  @Query(() => Commodity)
  async getOneCommodityByUuid(
    @Arg("openid", () => String, { nullable: true }) openid: string,
    @Arg("uuid", () => String) uuid: string
  ): Promise<Commodity> {
    if (!isNonEmptyString(openid)) {
      const commodity = await Commodity.findOneOrFail({
        where: [
          {
            uuid: uuid,
            status: "Release",
            stock: IsNull(),
          },
          {
            uuid: uuid,
            status: "Release",
            stock: MoreThan(0),
          },
        ],
        relations: ["legalDocumentProject"],
      });
      return commodity;
    }
    const wxUser = await WxUser.findOneOrFail({
      openId: openid,
    });
    const commodity = await Commodity.findOneOrFail({
      where: [
        {
          uuid: uuid,
          organizationId: wxUser.organizationId,
          status: Not("Offline"),
          stock: IsNull(),
        },
        {
          uuid: uuid,
          organizationId: wxUser.organizationId,
          status: Not("Offline"),
          stock: MoreThan(0),
        },
      ],
      relations: ["legalDocumentProject", "legalDocumentProject.testers"],
    });
    if (commodity.status === "Testing" && commodity.legalDocumentProject) {
      if (
        !commodity.legalDocumentProject.testers.some(
          (item) => item.id === wxUser.id
        )
      ) {
        throw new CommonError("No found commodity");
      }
    }
    return commodity;
  }
}

export default CommodityResolver;
