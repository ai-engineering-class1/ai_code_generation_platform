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

//谈判助理
@ObjectType()
@Entity()
class NegotiationAssistant extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  name: string;

  @Field()
  @Column("varchar")
  area: string; //地区

  @Field()
  @Column("varchar")
  product: string; //产品

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  target: string; //目标

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  companyOverview: string; //公司概况

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  businessModel: string; //业务模式

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  transactionRecords: string; //历史交易记录

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  cultural: string; //文化特点

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  negotiationStrategies: string; //谈判策略

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  negotiationStrategiesDetail: string; //AI推荐策略

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  IOTrends: string; //进出口趋势

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  tariffPolicy: string; //进出口趋势

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  supplyChain: string; //供应链分析

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  negotiationText: string; //谈判文本

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  negotiationTextResult: string; //谈判文本

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
  targetCustomerAnalysisId: number | null;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  negotiationContent: string;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}

export default NegotiationAssistant;
