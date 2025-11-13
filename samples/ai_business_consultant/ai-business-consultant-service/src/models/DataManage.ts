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
class DataManage extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  name: string; //数据源名称

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  type: string; //数据源类型

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  supplier: string; //数据提供商

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  updateRate: number; //更新频率

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  desc: string; //数据源描述

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  apiKey: string; //密钥

  @Field()
  @Column("varchar", { nullable: true })
  api: string; //api接口地址

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

export default DataManage;
