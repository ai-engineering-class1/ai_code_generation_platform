import {
    BaseEntity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    ManyToMany,
    OneToOne,
    Entity,
  } from "typeorm";
  import is from "@/utils/validations";
  import { Organization, EmailListFolder, Sfbot, EmailCampaign } from "@/models";
  import { ObjectType, Field, Int } from "type-graphql";
  
  @ObjectType()
  @Entity()
  class EmailList extends BaseEntity {
    //
    static validations = {
      email: [is.required(), is.maxLength(100)],
    };
  
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;
  
    @Field()
    @Column("varchar")
    email: string;
  
    @Field()
    @Column("varchar")
    firstName: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    lastName: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    title: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    company: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    companyNameForEmails: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    emailStatus: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    emailConfidence: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    seniority: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    departments: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    contactOwner: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    firstPhone: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    workDirectPhone: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    homePhone: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    mobilePhone: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    corporatePhone: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    otherPhone: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true, default: "cold" })
    stage: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    lists: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    lastContacted: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    accountOwner: string;
  
    @Field(() => Int)
    @Column("integer", { default: 0 })
    employees: number;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    industry: string;
  
    @Field({ nullable: true })
    @Column("text", { nullable: true })
    keywords: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    personLinkedinUrl: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    website: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    companyLinkedinUrl: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    facebookUrl: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    twitterUrl: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    city: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    state: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    country: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    companyAddress: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    companyCity: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    companyState: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    companyCountry: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    companyPhone: string;
  
    @Field({ nullable: true })
    @Column("text", { nullable: true })
    SEODescription: string;
  
    @Field({ nullable: true })
    @Column("text", { nullable: true })
    technologies: string;
  
    @Field(() => Int, { nullable: true })
    @Column("integer", { nullable: true })
    annualRevenue: number;
  
    @Field(() => Int, { nullable: true })
    @Column("integer", { nullable: true })
    totalFunding: number;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    latestFunding: string;
  
    @Field(() => Int, { nullable: true })
    @Column("integer", { nullable: true })
    latestFundingAmount: number;
  
    @Field(() => Date, { nullable: true })
    @Column("datetime", { nullable: true })
    lastRaisedAt: Date | null;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    emailSent: string;
  
    @Field(() => Int)
    @Column("tinyint", { default: 0 })
    emailOpen: number;
  
    @Field(() => Int)
    @Column("tinyint", { default: 0 })
    emailBounced: number;
  
    @Field(() => Int)
    @Column("tinyint", { default: 0 })
    replied: number;
  
    @Field(() => Int)
    @Column("tinyint", { default: 0 })
    demoed: number;
  
    @Field(() => Int, { nullable: true })
    @Column("integer", { nullable: true })
    numberOfRetailLocations: number;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    apolloContactId: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    apolloAccountId: string;
  
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
  
    @Field(() => Int)
    @Column("tinyint", { default: 0 })
    enableIndex: number;
  
    @Field()
    @Column("varchar", { default: "No index" })
    indexStatus: string;
  
    @Field(() => Int)
    @Column("integer")
    emailListFolderId: number;
  
    @Field(() => EmailListFolder)
    @ManyToOne(() => EmailListFolder, { onDelete: "CASCADE" })
    @JoinColumn({ name: "emailListFolderId" })
    emailListFolder: EmailListFolder;
  
    // @Field(() => Int, { nullable: true })
    // @Column("integer", { nullable: true })
    // sfbotId: number;
  
    @Field(() => Int, { nullable: true })
    @Column("integer", { nullable: true })
    sfbotId: number | null;
  
    @Field(() => Sfbot, { nullable: true })
    @OneToOne(() => Sfbot, { onDelete: "SET NULL" })
    @JoinColumn({ name: "sfbotId" })
    sfbot: Sfbot;
  
    @Field(() => Int, { nullable: true })
    @Column("integer", { nullable: true })
    indexCount: number;
  
    @Field()
    @Column("varchar", { default: "yes" })
    subscribe: string;
  
    @Field(() => Int)
    @Column("integer", { default: 0 })
    contactedCount: number;
  
    @Field(() => Int)
    @Column("integer", { default: 0 })
    viewCount: number;
  
    @Field(() => Int)
    @Column("integer", { default: 0 })
    tryChatAiCount: number;
  
    @Field(() => Int)
    @Column("integer", { default: 0 })
    replyCount: number;
  
    @Field()
    @Column("varchar", { default: "No contacted" })
    contactStatus: string;
  
    @Field(() => Date, { nullable: true })
    @Column("datetime", { nullable: true })
    contactDate: Date | null;
  
    @Field(() => [EmailCampaign], { nullable: true })
    @ManyToMany(
      () => EmailCampaign,
      (emailCampaign) => emailCampaign.toEmailLists,
      { onDelete:"CASCADE" }
    )
    emailCampaigns: EmailCampaign[];
  
    @Field(() => Int)
    @Column("integer", { default: 0 })
    trymeChatAiCount: number;
  }
  
  export default EmailList;
  