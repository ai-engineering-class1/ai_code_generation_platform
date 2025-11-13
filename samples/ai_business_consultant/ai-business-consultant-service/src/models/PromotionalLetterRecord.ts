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

//开发信发送记录
@ObjectType()
@Entity()
class PromotionalLetterRecord extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  title: string; //名称

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  content: string; //内容

  @Field({ nullable: true })
  @Column("tinyint", { nullable: true })
  status: number; //状态 , 1: 成功, 2: 失败, 3: 部分成功

  @Field(() => Int,{ nullable: true })
  @Column("integer",{ nullable: true })
  allCount: number; //总数

  @Field(() => Int,{ nullable: true })
  @Column("integer",{ nullable: true })
  successCount: number; //成功总数

  @Field(() => Int,{ nullable: true })
  @Column("integer",{ nullable: true })
  failedCount: number; //失败总数

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  failedEmailText: string; //失败邮箱

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

  @Field(() => Int)
  @Column("integer")
  promotionalLetterId: number;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  successEmailText: string; //失败邮箱

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  attachmentEmail: string; //邮件附件

  @Field(() => Int)
  @Column("integer",{default:0})
  readFlag: number;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  readEmailText: string; //邮件附件

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

//   @Field(() => Date, { nullable: true })
//   @Column("datetime", { nullable: true })
//   sendTime: Date; //发送时间
}

export default PromotionalLetterRecord;
