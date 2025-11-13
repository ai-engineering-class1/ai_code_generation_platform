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
  //   import is from "@/utils/validations";
  import { EmailCampaign } from "@/models";
  import { ObjectType, Field, Int, Float } from "type-graphql";
  
  @ObjectType()
  @Entity()
  class EmailCampaignFollow extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;
  
    @Field()
    @Column("text")
    content: string;
  
    @Field()
    @Column("varchar", { default: "unsent" })
    state: string;
  
    @Field(() => Int)
    @Column("integer")
    emailCampaignId: number;
  
    @Field(() => EmailCampaign)
    @ManyToOne(
      () => EmailCampaign,
      (emailCampaign) => emailCampaign.emailCampaignFollow,
      { onDelete: "CASCADE" }
    )
    @JoinColumn({ name: "emailCampaignId" })
    emailCampaign: EmailCampaign;
  
    @Field({ nullable: true })
    @Column("datetime", { nullable: true })
    dueDate: Date;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    bodyChatAiKey: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    toBodyChatAiKey: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    bcc: string;
  
    @Field(() => Float)
    @Column("float", { default: 1 })
    bccRate: number;
  
    @Field(() => Int)
    @Column("integer", { default: 0 })
    sendCount: number;
  
    @Field()
    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;
  
    @Field()
    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
  
    @Field(() => Int)
    @Column("integer", { default: 0 })
    waitDay: number;
  }
  
  export default EmailCampaignFollow;
  