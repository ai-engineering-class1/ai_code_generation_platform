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

//建立连接
@ObjectType()
@Entity()
class EstablishCommunication extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  name: string; //客户名称

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  industry: string; //行业

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  contact: string; //联系人

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  score: number; //评分

  @Field({ nullable: true })
  @Column("varchar", { nullable: true, default: "待沟通" })
  status: string; //状态

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  emailTemplates: string; //邮件模版

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  communicationMethods: string; //沟通方式

  @Field(() => Date, { nullable: true })
  @Column("datetime", { nullable: true })
  recentContactTime: Date;

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

  @Field(() => Int,{ nullable: true })
  @Column("integer", { nullable: true })
  dealRate: number; //潜在成交率

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}

export default EstablishCommunication;
