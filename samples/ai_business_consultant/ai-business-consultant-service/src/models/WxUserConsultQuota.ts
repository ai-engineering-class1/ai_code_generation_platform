import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  // OneToMany,
  // ManyToMany,
  Entity,
} from "typeorm";
import { LegalDocumentProject, Organization, WxUser } from "@/models";
import { ObjectType, Field, Int } from "type-graphql";

@ObjectType()
@Entity()
class WxUserConsultQuota extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column("varchar")
  wxUserId: string;

  @Field(() => WxUser)
  @ManyToOne(() => WxUser, { onDelete: "CASCADE" })
  @JoinColumn({ name: "wxUserId" })
  wxUser: WxUser;

  @Field(() => Int)
  @Column("integer")
  legalDocumentProjectId: number;

  @Field(() => LegalDocumentProject, { nullable: true })
  @ManyToOne(() => LegalDocumentProject, { onDelete: "CASCADE" })
  @JoinColumn({ name: "legalDocumentProjectId" })
  legalDocumentProject: LegalDocumentProject;

  @Field(() => Int)
  @Column("integer")
  organizationId: number;

  @Field(() => Organization)
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @Field(() => Int)
  @Column("integer", { default: 0 })
  quotaConsult: number;

  @Field()
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column("datetime", { nullable: true })
  latestOrderTime: Date;

  @Field(() => Int)
  @Column("integer", { default: 0 })
  validDays: number;
}

export default WxUserConsultQuota;
