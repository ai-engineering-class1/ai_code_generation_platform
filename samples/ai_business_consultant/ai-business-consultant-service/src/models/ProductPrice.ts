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

//产品报价表
@ObjectType()
@Entity()
class ProductPrice extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  productName: string; //产品名称

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  description: string; //报价描述

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  keywords: string; //报价关键词

  @Field()
  @Column("varchar")
  priceLevel: string; //报价等级（如：标准、高、中、低）

  @Field(() => Int)
  @Column("integer")
  priceValue: number; //报价金额

  @Field(() => Int)
  @Column("integer")
  quoteRatio: number; //各报价等级的使用概率（0~1）

  @Field(() => Int)
  @Column("integer")
  successRate: number; //成交率

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

export default ProductPrice;
