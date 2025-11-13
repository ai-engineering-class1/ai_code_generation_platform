import {
    BaseEntity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    ManyToMany,
    Entity,
    OneToMany,
    JoinTable
  } from "typeorm";
  //   import is from "@/utils/validations";
  import {
    MailOutbox,
    Organization,
    EmailCampaignFollow,
    EmailCampaignHistory,
    SfbotCharacter,
    EmailList,
  } from "@/models";
  import { ObjectType, Field, Int, Float } from "type-graphql";
  
  @ObjectType()
  @Entity()
  class EmailCampaign extends BaseEntity {
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
    @Column("text")//mediumtext
    content: string;
  
    @Field()
    @Column("varchar", { default: "unsent" })
    state: string;
  
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
    @Column("datetime", { nullable: true })
    dueDate: Date;
  
    // @Field(() => Int, { nullable: true })
    // @Column("integer", { nullable: true })
    // mailListenId: number | null;
  
    // @Field(() => MailListen, { nullable: true })
    // @ManyToOne(() => MailListen, { onDelete: "SET NULL" })
    // @JoinColumn({ name: "mailListenId" })
    // mailListen: MailListen;
  
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
    @OneToMany(() => MailOutbox, (mailOutbox) => mailOutbox.emailCampaign, {
      cascade: true,
    })
    mailOutbox: MailOutbox[];
  
    @Field(() => Int)
    @Column("integer", { default: 0 })
    sendCount: number;
  
    @Field(() => [EmailCampaignFollow])
    @OneToMany(
      () => EmailCampaignFollow,
      (emailCampaignFollow) => emailCampaignFollow.emailCampaign,
      {
        cascade: true,
      }
    )
    emailCampaignFollow: EmailCampaignFollow[];
  
    @Field(() => [EmailCampaignHistory])
    @OneToMany(
      () => EmailCampaignHistory,
      (emailCampaignHistory) => emailCampaignHistory.emailCampaign,
      {
        cascade: true,
      }
    )
    emailCampaignHistory: EmailCampaignHistory[];
  
    @Field(() => Int, { nullable: true })
    @Column("integer", { nullable: true, default: 0 })
    dailySendLimit: number;
  
    @Field(() => Int, { nullable: true })
    @Column("integer", { nullable: true, default: 0 })
    sendInterval: number;
  
    @Field(() => Int, { nullable: true })
    @Column("integer", { nullable: true })
    sfbotCharacterId: number;
  
    @Field(() => SfbotCharacter, { nullable: true })
    @ManyToOne(() => SfbotCharacter, { onDelete: "SET NULL" })
    @JoinColumn({ name: "sfbotCharacterId" })
    sfbotCharacter: SfbotCharacter;
  
    @Field(() => [EmailList], { nullable: true })
    @ManyToMany(() => EmailList, (emailList) => emailList.emailCampaigns)
    @JoinTable()
    toEmailLists: EmailList[];
  
    @Field(() => Int, { nullable: true })
    viewCount: number;
  
    @Field(() => Int, { nullable: true })
    replyCount: number;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    notiEmail: string;
  
    @Field(() => Int)
    @Column("tinyint", { default:0 })
    stopOnAutoReply: number;
  
    @Field(() => Int)
    @Column("tinyint", { default:0 })
    linkTracking: number;
  
    @Field(() => Int)
    @Column("tinyint", { default:0 })
    sendEmailAsTextonly: number;
  
    @Field(() => Int, { nullable: true })
    @Column("integer", { nullable: true })
    maxNewLeads: number;
  
    @Field(() => Int)
    @Column("tinyint", { default:0 })
    prioritizeNewLeads: number;
  
    @Field(() => Int)
    @Column("tinyint", { default:0 })
    providerMatching: number;
  
    @Field(() => Int)
    @Column("tinyint", { default:0 })
    stopCampaignFromCampanyOnreply: number;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    cc: string;
  
    @Field(() => Int)
    @Column("integer", { default: 0 })
    emailCampaignScheduleId: number;
  
    @Field({ nullable: true })
    @Column("text", { nullable: true })
    attachments: string;
  }
  
  export default EmailCampaign;
  