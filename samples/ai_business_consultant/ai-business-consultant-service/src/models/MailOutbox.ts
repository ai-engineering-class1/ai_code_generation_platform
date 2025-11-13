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
import {
  EmailCampaign,
  EmailCampaignHistory,
  MailSender,
  Organization,
  TargetCustomerAnalysis,
  User
} from "@/models";
import { ObjectType, Field, Int } from "type-graphql";

@ObjectType()
@Entity()
class MailOutbox extends BaseEntity {
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
  sendTime: Date;

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

  @Field(() => String)
  @Column("varchar", { default: "unread" })
  readFlag: string;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  emailCampaignId: number;

  @Field(() => EmailCampaign, { nullable: true })
  @ManyToOne(() => EmailCampaign, (emailCampaign) => emailCampaign.mailOutbox, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "emailCampaignId" })
  emailCampaign: EmailCampaign;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  uuid: string;

  @Field(() => Int)
  @Column("integer", { default: 0 })
  readCount: number;

  @Field(() => String)
  @Column("varchar", { default: "no reply" })
  replyFlag: string;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  emailCampaignHistoryId: number;

  @Field(() => EmailCampaignHistory, { nullable: true })
  @ManyToOne(
    () => EmailCampaignHistory,
    (emailCampaignHistory) => emailCampaignHistory.mailOutbox,
    {
      onDelete: "SET NULL",
    }
  )
  @JoinColumn({ name: "emailCampaignHistoryId" })
  emailCampaignHistory: EmailCampaignHistory;

  @Field(() => Int)
  @Column("integer", { default: 0 })
  tryChatAiCount: number;

  @Field(() => Int)
  @Column("integer", { default: 0 })
  replyCount: number;

  @Field(() => String)
  @Column("varchar", { default: "done" })
  sendStatus: string;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  bcc: string;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  mailSenderId: number;

  @Field(() => MailSender, { nullable: true })
  @ManyToOne(() => MailSender, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "mailSenderId" })
  mailSender: MailSender;

  @Field(() => String)
  @Column("varchar", { default: "" })
  failureReason: string;

  @Field(() => Int)
  @Column("integer", { default: 0 })
  trymeChatAiCount: number;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  attachments: string;

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
  promotionalLetterId: number;

  // @Index('IDX_MESSAGE_ID')
  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  messageId: string;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  inReplyTo: string;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}

export default MailOutbox;
