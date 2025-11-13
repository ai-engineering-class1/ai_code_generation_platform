import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  // ManyToMany,
  Entity,
} from "typeorm";
import { Organization, User } from "@/models";
import { ObjectType, Field, Int } from "type-graphql";

//关系维护->客户管理
@ObjectType()
@Entity()
class Customer extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  name: string;

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  industryType: string; //行业类型

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  enterpriseScale: string; //企业规模

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  revenue: number; //年营收

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  address: string; //需求分析

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  createDateStr: string; //创建时间

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  website: string; //标签

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  desc: string; //公司简介

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  contacts: string; //联系人

  @Field(() => Date, { nullable: true })
  @Column("datetime", { nullable: true })
  recentContactTime: Date;

  @Field(() => Date,{ nullable: true })
  @Column("datetime", { nullable: true })
  partnerStartTime: Date; //合作开始时间

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  partnership: string; //合作状态

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  AIanalysis: string; //AI洞察

  @Field()
  @Column("tinyint", { default: 1 }) //1没有风险
  risk: number; //风险

  @Field()
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Field(() => Int)
  @Column("integer")
  organizationId: number;

  @Field(() => Organization)
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  cooperationValue: number; //合作价值

  @Field()
  @Column("tinyint", { default: 1 })
  priority: number; //优先级

  @Field()
  @Column("tinyint", { default: 1 })
  isCooperate: number; //合作中

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  cooperateType: string; //合作类型

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  activeHistory: string; //互动历史

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  maintenancePlan: string; //维护计划

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  relationshipAnalysis: string; //关系分析

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  AIAlert: string; //AI提醒

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  sendMonthlyReport: string; //发送定期月度报告

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  returnVisit: string; //电话回访

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  newProductRecommendation: string; //新产品推荐

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  AIRelationshipAdvice: string; //AI关系维护建议

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}

export default Customer;
