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

//智能谈判助手
@ObjectType()
@Entity()
class IntelligentNegotiationAssistant extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  name: string; //合作项目

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  successRate: number; //预测成功率

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  progress: number; //谈判进度

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  customerInterest: number; //客户兴趣度

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  negotiationStrategy: string; //谈判策略

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  productCustomization: string; //产品定制

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  priceNegotiation: string; //价格谈判策略

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  focusShift: string; //关注点转移

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  assistedCommunication: string; //辅助沟通

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  customerInformationAnalysis: string; //客户信息分析

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  leaderAnalysis: string; //决策者分析

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  competitorSituation: string; //竞争对手情况

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

export default IntelligentNegotiationAssistant;
