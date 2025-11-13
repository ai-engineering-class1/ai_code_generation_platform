import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  ManyToMany
} from "typeorm";
import { Organization, MenuIndexContent } from "@/models";
import { ObjectType, Field, Int, Float } from "type-graphql";

@ObjectType()
@Entity()
class Sfbot extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  password: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  character_desc: string;

  @Field(() => String)
  @Column("varchar")
  chatAiName: string;

  @Field(() => String)
  @Column("text")
  chatAiGreeting: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  chatAiAvatarUrl: string;

  @Field()
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Field()
  @Column("varchar")
  uuid: string;

  @Field(() => Int)
  @Column("integer")
  organizationId: number;

  @Field(() => Organization)
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @Field()
  @Column("varchar", { default: "glm-3-turbo" })
  model: string;

  @Field(() => Float, { nullable: true })
  @Column("float", { nullable: true })
  temperature: number;

  @Field(() => Float, { nullable: true })
  @Column("float", { nullable: true })
  top_p: number;

  @Field({ nullable: true })
  @Column("integer", { nullable: true })
  max_tokens: number;

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  kbId: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  charDescLaw: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  charDescQos: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  charDescCki: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  promptKbx: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  promptQos: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  promptCki: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  promptAsk: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  chatAiPeroration: string; //起诉状所需案件信息已收集。请通过「案件要素」对已收集信息进行修改和确认。

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  rechargeReminder: string; //您的咨询次数已用完。如需继续法律咨询，请购买我们的咨询服务，谢谢支持。

  @Field(() => [MenuIndexContent], { nullable: true })
  @ManyToMany(
    () => MenuIndexContent,
    (menuIndexContent) => menuIndexContent.sfbots
  )
  menuIndexContents: MenuIndexContent[];
}

export default Sfbot;
