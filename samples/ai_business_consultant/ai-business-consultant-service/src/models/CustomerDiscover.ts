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
import { Organization, MailListen, User } from "@/models";
import { ObjectType, Field, Int } from "type-graphql";

//邮件潜在客户发现设置
@ObjectType()
@Entity()
class CustomerDiscover extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  name: string;

  @Field(() => Int)
  @Column("tinyint", { default: 0 })
  enableListen: number;

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  titleFilter: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  aiPrompt: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  exceptEmails: string;

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
  mailListenId: number;

  @Field(() => MailListen, { nullable: true })
  @ManyToOne(() => MailListen, { onDelete: "CASCADE" })
  @JoinColumn({ name: "mailListenId" })
  mailListen: MailListen;

  @Field(() => Int)
  @Column("tinyint", { default: 1 })
  type: number;

  @Field(() => Date, { nullable: true })
  @Column("datetime", { nullable: true })
  scanStartTime: Date; //开始扫描时间

  @Field(() => Date, { nullable: true })
  @Column("datetime", { nullable: true })
  scanEndTime: Date; //结束扫描时间

  @Field(() => Int)
  @Column("integer", { default: 0 })
  scanCount: number; //扫描数量

  @Field(() => Int)
  @Column("integer", { default: 0 })
  scanSuccessCount: number; //扫描成功数量

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  specialAIPrompt: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  specialField: string;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}

export default CustomerDiscover;
