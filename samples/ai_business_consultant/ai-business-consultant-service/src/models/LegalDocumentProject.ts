import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  // RelationId,
  Entity,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  DeleteDateColumn,
} from "typeorm";
import { ObjectType, Field, Int, Float } from "type-graphql";
import {
  LegalDocumentTemplate,
  LegalDocumentElement,
  Organization,
  User,
  WxUser,
} from "@/models";

@ObjectType()
@Entity()
class LegalDocumentProject extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  name: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  desc: string;

  @Field()
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Field(() => [LegalDocumentTemplate])
  @OneToMany(
    () => LegalDocumentTemplate,
    (legalDocumentTemplate) => legalDocumentTemplate.legalDocumentProject,
    {
      cascade: true,
    }
  )
  legalDocumentTemplates: LegalDocumentTemplate[];

  @Field(() => [LegalDocumentElement])
  @OneToMany(
    () => LegalDocumentElement,
    (legalDocumentElement) => legalDocumentElement.legalDocumentProject,
    {
      cascade: true,
    }
  )
  legalDocumentElements: LegalDocumentElement[];

  @Field(() => Int)
  @Column("integer")
  organizationId: number;

  @Field(() => Organization)
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  character_desc: string;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  chatAiName: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  chatAiGreeting: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  chatAiAvatarUrl: string;

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

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  prompt_doc: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  reference_doc: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  charDescAsk: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  chardesc_doc: string;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  creatorId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "creatorId" })
  creator: User;

  @Field(() => [User], { nullable: true })
  @ManyToMany(() => User, (user) => user.legalDocumentProject, {
    cascade: true,
  })
  @JoinTable()
  members: User[];

  @Field({ nullable: true })
  @DeleteDateColumn()
  deletedAt?: Date;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  copyLegalDocumentProjectId: number;

  @Field(() => LegalDocumentProject, { nullable: true })
  @ManyToOne(() => LegalDocumentProject, { onDelete: "CASCADE" })
  @JoinColumn({ name: "copyLegalDocumentProjectId" })
  copylegalDocumentProject: LegalDocumentProject;

  @Field(() => [WxUser], { nullable: true })
  @ManyToMany(() => WxUser, (wxUser) => wxUser.legalDocumentProject, {
    cascade: true,
  })
  @JoinTable()
  testers: WxUser[];

  @Field()
  @Column("integer", { default: 0 })
  trialConsultQuota: number;

  @Field()
  @Column("tinyint", { default: 0 })
  isConsult: number;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  qrCodeUrl: string;

  @Field()
  @Column("integer", { default: 0 })
  turnsCki: number;

  @Field()
  @Column("integer", { default: 0 })
  turnsAsk: number;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  llmCfgKbx: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  llmCfgQos: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  llmCfgCki: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  llmCfgAsk: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  llmCfgDoc: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  nextCkiLabel: string;

  @Field()
  @Column("integer", { default: 0 })
  turnsRpt: number;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  nextCkiDesc: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  promptAskLast: string;
}

export default LegalDocumentProject;
