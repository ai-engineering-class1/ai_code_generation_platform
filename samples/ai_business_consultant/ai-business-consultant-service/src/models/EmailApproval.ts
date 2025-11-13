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
  Organization,
  MailListen,
  TargetCustomerAnalysis,
  User,
} from "@/models";
import { ObjectType, Field, Int } from "type-graphql";

//邮件审批
@ObjectType()
@Entity()
class EmailApproval extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  title: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  desc: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  emailContent: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  opinion: string;

  @Field()
  @Column("varchar", { default: "waiting" })
  state: string; //waiting,approved,rejected,cancelled

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
  mailListenId: number;

  @Field(() => MailListen)
  @ManyToOne(() => MailListen, { onDelete: "CASCADE" })
  @JoinColumn({ name: "mailListenId" })
  mailListen: MailListen;

  @Field(() => Int)
  @Column("integer")
  targetCustomerAnalysisId: number;

  @Field(() => TargetCustomerAnalysis)
  @ManyToOne(() => TargetCustomerAnalysis, { onDelete: "CASCADE" })
  @JoinColumn({ name: "targetCustomerAnalysisId" })
  targetCustomerAnalysis: TargetCustomerAnalysis;

  @Field(() => String)
  @Column("varchar")
  approvalUserId: string;

  @Field(() => User)
  @ManyToOne(() => User, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "approvalUserId" })
  approvalUser: User;

  @Field(() => String)
  @Column("varchar")
  currentUserId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "currentUserId" })
  currentUser: User;
}

export default EmailApproval;
