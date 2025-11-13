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

//市场定位
@ObjectType()
@Entity()
class MarketPositioning extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  name: string; //名称

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

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}

export default MarketPositioning;
