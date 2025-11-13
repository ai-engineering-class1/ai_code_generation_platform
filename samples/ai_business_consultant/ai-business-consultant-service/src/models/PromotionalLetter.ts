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
import { Organization,User } from "@/models";
import { ObjectType, Field, Int } from "type-graphql";

//开发信管理
@ObjectType()
@Entity()
class PromotionalLetter extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  name: string; //名称

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  feature: string; //产品特点

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  advantage: string; //产品优势

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  industry: string; //目标行业

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  country: string; //目标国家

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  size: string; //公司规模

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  emailStyle: string; //邮件风格

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  otherDesc: string; //其他需求

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  subjectEmail: string; //邮件标题

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  previewEmail: string; //生成预览

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  attachmentEmail: string; //附件

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

  @Field(() => Date, { nullable: true })
  @Column("datetime", { nullable: true })
  sendTime: Date; //发送时间

  @Field({ nullable: true })
  @Column("varchar", { nullable: true, default: "EN" })
  language: string; //语言

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}

export default PromotionalLetter;
