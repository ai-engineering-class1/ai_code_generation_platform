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
import { Organization, WxUser } from "@/models";
import { ObjectType, Field, Int, Float } from "type-graphql";

@ObjectType()
@Entity()
class LlmTrace extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column("varchar")
  openid: string;

  @Field(() => WxUser, { nullable: true })
  wxUser: WxUser|undefined;

  @Field(() => String)
  @Column("varchar")
  taskid: string;

  @Field(() => String)
  @Column("varchar")
  project: string;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  element: string;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  model: string;

  @Field(() => Float, { nullable: true })
  @Column("float", { nullable: true })
  temperature: number;

  @Field(() => Float, { nullable: true })
  @Column("float", { nullable: true })
  top_p: number;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  max_tokens: number;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  messages: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  response: string;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  prompt_tokens: number;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  completion_tokens: number;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  total_tokens: number;

  @Field(() => Date, { nullable: true })
  @Column("datetime", { nullable: true })
  time_tx: Date;

  @Field(() => Date, { nullable: true })
  @Column("datetime", { nullable: true })
  time_rx: Date;

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

  // @Field(() => String)
  // @Column("varchar", { default: "No Review" }) //Positive，Negative，No Review
  // evaluate: string;

  @Field(() => Int)
  @Column("tinyint", { default: 0 }) //-1 ,0 ,1
  evaluate: number;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  feedback: string;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  msgid: number;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  kb_id: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  kb_prompt: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  kb_slice: string;

  @Field(() => Int)
  @Column("tinyint", { default: 0 })
  action: number;

  @Field(() => Int)
  @Column("tinyint", { default: 0 })
  solved: number;

  @Field(() => Int)
  @Column("integer", { default: 0 })
  projectId: number;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  phoneNumber: string;
}

export default LlmTrace;
