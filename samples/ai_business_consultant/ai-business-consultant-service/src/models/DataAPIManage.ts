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

//数据源管理
@ObjectType()
@Entity()
class DataAPIManage extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  name: string; //名称

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  desc: string; //描述

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  count: number; //调用次数

  @Field(() => Date, { nullable: true })
  @Column("datetime", { nullable: true })
  updateTime: Date; //更新时间

  @Field(() => Int, { nullable: true })
  @Column("tinyint", { nullable: true })
  billingMode: number; //计费模式

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

export default DataAPIManage;
