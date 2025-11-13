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
    OneToMany,
  } from "typeorm";
  //   import is from "@/utils/validations";
  import { MailOutbox, EmailCampaign, Organization } from "@/models";
  import { ObjectType, Field, Int, Float } from "type-graphql";
  
  @ObjectType()
  @Entity()
  class EmailCampaignHistory extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;
  
    @Field()
    @Column("varchar")
    subject: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    name: string;
  
    @Field({ nullable: true })
    @Column("text", { nullable: true })
    from: string;
  
    @Field()
    @Column("text")
    to: string;
  
    @Field()
    @Column("text")
    content: string;
  
    @Field(() => Int)
    @Column("integer")
    emailCampaignId: number;
  
    @Field(() => EmailCampaign)
    @ManyToOne(
      () => EmailCampaign,
      (emailCampaign) => emailCampaign.emailCampaignHistory,
      { onDelete: "CASCADE" }
    )
    @JoinColumn({ name: "emailCampaignId" })
    emailCampaign: EmailCampaign;
  
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
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    bodyKey: string;
  
    @Field({ nullable: true })
    @Column("text", { nullable: true })
    bodyChatAiKey: string;
  
    @Field({ nullable: true })
    @Column("text", { nullable: true })
    toBodyChatAiKey: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    bcc: string;
  
    @Field(() => Float)
    @Column("float", { default: 1 })
    bccRate: number;
  
    @Field(() => [MailOutbox])
    @OneToMany(
      () => MailOutbox,
      (mailOutbox) => mailOutbox.emailCampaignHistory,
      {
        cascade: true,
      }
    )
    mailOutbox: MailOutbox[];
  
    @Field(() => Int)
    @Column("integer", { default: 0 })
    sendCount: number;
  
    @Field(() => Int)
    @Column("integer", { default: 0 })
    viewCount: number;
  
    @Field(() => Int)
    @Column("integer", { default: 0 })
    tryChatAiCount: number;
  
    @Field(() => Int)
    @Column("integer", { default: 0 })
    replyCount: number;
  
    @Field(() => Int)
    @Column("integer", { default: 0 })
    trymeChatAiCount: number;
  
    @Field(() => String, { nullable: true })
    attachments: string;
  }
  
  export default EmailCampaignHistory;
  