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

//市场分析报告
@ObjectType()
@Entity()
class MarketAnalysisReport extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  name: string; //名称

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  desc: string; //摘要

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  indicators: string; //关键市场指标

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  participant: string; //主要市场参与者

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

  //市场定位
  @Field({ nullable: true })
  @Column("text", { nullable: true })
  SegmentedPositioningName: string; //细分定位分析名称

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  SegmentedPositioning: string; //细分定位分析

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  segmentedScenesName: string; //按应用场景分析名称

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  segmentedScenes: string; //按应用场景分析

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  distributionChannel: string; //销售渠道

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  distributionChannelAnalysis: string; //销售渠道分析

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  dataIndicators: string; //关键数据指标

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  segmentedCustomer: string; //客户细分分布

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  customerProfile: string; //客户画像

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  customerBehavior: string; //客户行为

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  AIMarketingSuggestions: string; //根据客户画像的营销建议

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  AIStrategySuggestions: string; //整体策略建议

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  AIPriceSuggestions: string; //AI价格推荐

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  AIPriceAnalysis: string; //AI价格弹性分析

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  AICompetitorPriceAnalysis: string; //竞争对手价格分析

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  AIPriceAdjustAnalysis: string; //AI价格敏感度分析

  //竞争策略
  @Field({ nullable: true })
  @Column("text", { nullable: true })
  competitorStrategy: string; //竞争对手策略

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  SWOTAnalysis: string; //swot分析

  //策略建议
  @Field({ nullable: true })
  @Column("text", { nullable: true })
  marketingStrategySuggestions: string; //策略建议

  @Field(() => Int)
  @Column("integer", { default: 1 })
  category: number;//市场分析主分类

  @Field(() => Int)
  @Column("integer", { default: 1 })
  positionCategory: number;//市场分析定位分类

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  aiReport: string;

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  session_id: string;

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  session_name: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  aiReport2: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  aiReport3: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  aiReport4: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  template: string;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}

export default MarketAnalysisReport;
