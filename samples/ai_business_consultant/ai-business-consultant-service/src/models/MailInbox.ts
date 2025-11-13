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
  Index,
} from "typeorm";
import { Organization, TargetCustomerAnalysis, User } from "@/models";
import { ObjectType, Field, Int } from "type-graphql";

// @Index('IDX_PROMO_TARGET', ['promotionalLetterId', 'targetCustomerAnalysisId'])
@ObjectType()
@Entity()
class MailInbox extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column("varchar")
  subject: string;

  @Field(() => String)
  @Column("varchar")
  from: string;

  @Field(() => String)
  @Column("varchar")
  fromName: string;

  @Field(() => String)
  @Column("varchar")
  to: string;

  @Field(() => String)
  @Column("mediumtext")
  text: string;

  @Field(() => String)
  @Column("mediumtext")
  html: string;

  @Field(() => Date)
  @Column("datetime")
  receiveTime: Date;

  @Index('IDX_MESSAGE_ID')
  @Field(() => String)
  @Column("varchar")
  messageId: string;

  @Field(() => Int)
  @Column("integer")
  organizationId: number;

  @Field(() => Organization)
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @Field()
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  replyUuid: string;

  @Field(() => String)
  @Column("varchar", { default: "No indexed" })
  indexStatus: string;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  targetCustomerAnalysisId: number | null;

  @Field(() => TargetCustomerAnalysis, { nullable: true })
  @ManyToOne(() => TargetCustomerAnalysis, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "targetCustomerAnalysisId" })
  targetCustomerAnalysis: TargetCustomerAnalysis;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  promotionalLetterId: number | null;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  customerDiscoverId: number | null;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  inReplyTo: string;

  @Field(() => Int)
  @Column("tinyint", { default: 0 })
  readFlag: number; // 0: unread, 1: read

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

}

export default MailInbox;
