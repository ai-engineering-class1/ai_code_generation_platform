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

//产业分析
@ObjectType()
@Entity()
class IndustryAnalysis extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  name: string;

  @Field()
  @Column("varchar")
  industry: string; //行业

  @Field()
  @Column("varchar")
  childIndustry: string; //子行业

  @Field()
  @Column("varchar")
  dateRange: string; //分析时间范围

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  industryHotspots: string; //产业热点

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  policyImpact: string; //产业热点

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  competitiveLandscape: string; //竞争格局

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  trackRecommendation: string; //赛道推荐

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  feasibilityAssessment: string; //可行性评估

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  SWOTAnalysis: string; //swot分析

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  developmentForecast: string; //发展预测

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  industryUpstream: string; //产业链上游

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  industryMidstream: string; //产业链中游

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  industryDownstream: string; //产业链下游

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  investmentAdvice: string; //投资建议

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  riskWarning: string; //投资建议

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
  aiReport: string;

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  session_id: string;

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  session_name: string;

  @Field()
  @Column("varchar", { default: "done" })
  state: string; //报告状态

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}

export default IndustryAnalysis;
