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
  import { EmailCampaign, MailOutbox, Organization } from "@/models";
  import { ObjectType, Field, Int } from "type-graphql";
  
  @ObjectType()
  @Entity()
  class MailSender extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;
  
    @Field(() => String)
    @Column("varchar")
    firstName: string;
  
    @Field(() => String)
    @Column("varchar")
    lastName: string;
  
    @Field(() => String)
    @Column("varchar")
    email: string;
  
    @Field(() => String)
    @Column("varchar")
    password: string;
  
    @Field(() => String)
    @Column("varchar")
    smtpHost: string;
  
    @Field(() => Int)
    @Column("integer")
    smtpPort: number;
  
    @Field(() => String, { nullable: true })
    @Column("varchar", { nullable: true })
    imapHost: string;
  
    @Field(() => Int, { nullable: true })
    @Column("integer", { nullable: true })
    imapPort: number;
  
    // @Field(() => String)
    // @Column("varchar", { default: "stop" })
    // state: string;
  
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
  
    @Field(() => [EmailCampaign])
    boundEmailCampaigns: EmailCampaign[];
  
    @Field(() => [MailOutbox])
    bound24HMailOutbox: MailOutbox[];
  
    @Field(() => [MailOutbox])
    bound7DMailOutbox: MailOutbox[];
  
    @Field(() => [MailOutbox])
    bound24HDomainMailOutbox: MailOutbox[];
  }
  
  export default MailSender;
  