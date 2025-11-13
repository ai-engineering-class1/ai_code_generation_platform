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
import { MailInbox, MailListen, Organization, User } from "@/models";
import { ObjectType, Field, Int } from "type-graphql";

//目标客户分析
@ObjectType()
@Entity()
class TargetCustomerAnalysis extends BaseEntity {
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
  score: number; //得分

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  desc: string; //需求分析

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  tips: string; //标签

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  devHistory: string; //发展历程

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  createDate: string; //成立时间

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  registeredCapital: string; //注册资本

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  companyType: string; //企业类型

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  business: string; //主营业务

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  website: string; //官网

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  address: string; //地址

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  service: string; //服务

  @Field(() => Int, { nullable: true })
  @Column("tinyint", { nullable: true })
  trace: number; //跟进或者放弃

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

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  aiAdvice: string; //ai推荐

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  employees: string; //企业规模

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  dealRate: number; //潜在成交率

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  matchlRate: number; //匹配度

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  activeRate: number; //活跃度

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  city: string; //城市城市

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  contactInfo: string; //联系人信息

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  interactiveHistory: string; //互动历史

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  partnership: string; //合作可能性

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  customerType: string; //客户类型 邮箱添加 导入添加

  @Field({ nullable: true })
  @Column("varchar", { nullable: true, default: "待沟通" })
  replyStatus: string; //状态: 待跟进、待沟通

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  revenue: number; //年营收

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  createDateStr: string; //创建时间

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  emailTemplate: string; //邮件模版

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  negotiationContent: string;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true, default: 1 })
  customerState: number; //客户状态

  @Field(() => Date, { nullable: true })
  @Column("datetime", { nullable: true })
  customerStateChangeTime: Date; //客户状态变更时间

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  lastMailListenId: number; //上一个发送邮件的人

  @Field(() => MailListen, { nullable: true })
  @ManyToOne(() => MailListen, { onDelete: "SET NULL" })
  @JoinColumn({ name: "lastMailListenId" })
  lastMailListen: MailListen;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  emailTemplateEN: string; //英文邮件模版

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  emailTemplateCN: string; //中文邮件模版

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  companySituation: string; //公司情况

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  companyProductAndService: string; //产品与服务

  @Field(() => MailInbox, { nullable: true })
  lastMailInbox?: MailInbox; //最新的邮件

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  countdown: number | null; //倒计时

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true, default: "" })
  traceStatus: string; //跟进状态  待跟进

  @Field(() => Date, { nullable: true })
  @Column("datetime", { nullable: true })
  receiveEmailTime: Date | null;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  failedReason: string; //分析客户数据失败

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}

export default TargetCustomerAnalysis;
