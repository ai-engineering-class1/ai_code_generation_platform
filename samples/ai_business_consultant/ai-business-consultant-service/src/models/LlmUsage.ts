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
import { Organization, Sfbot } from "@/models";
import { ObjectType, Field, Int } from "type-graphql";

@ObjectType()
@Entity()
class LlmUsage extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column("varchar")
  out_trade_no: string;

  @Field(() => String)
  @Column("varchar")
  provider: string;

  @Field(() => String)
  @Column("varchar")
  model: string;

  @Field(() => String)
  @Column("varchar")
  openId: string;

  @Field(() => Int)
  @Column("integer")
  prompt_tokens: number;

  @Field(() => Int)
  @Column("integer")
  completion_tokens: number;

  @Field(() => Int)
  @Column("integer")
  total_tokens: number;

  @Field(() => Int)
  @Column("integer")
  organizationId: number;

  @Field(() => Organization)
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @Field(() => Int)
  @Column("integer")
  sfbotId: number;

  @Field(() => Sfbot)
  @ManyToOne(() => Sfbot, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sfbotId" })
  sfbot: Sfbot;

  @Field()
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  phoneNumber: string;
}

export default LlmUsage;
