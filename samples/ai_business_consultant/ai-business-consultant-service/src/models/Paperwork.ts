import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  Entity,
} from "typeorm";
import {
  LegalDocumentProject,
  Organization,
  User,
  WxUser,
  WxPaidOrders,
} from "@/models";
import { ObjectType, Field, Int } from "type-graphql";

@ObjectType()
@Entity()
class Paperwork extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

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

  @Field(() => LegalDocumentProject, {nullable:true})
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

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  wxPaidOrdersId: number;

  @Field(() => WxPaidOrders, { nullable: true })
  @OneToOne(() => WxPaidOrders, (wxPaidOrders) => wxPaidOrders.paperwork, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "wxPaidOrdersId" })
  wxPaidOrders: WxPaidOrders;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  docJson: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  reviewDocJson: string;

  @Field(() => String, { nullable: true })
  @Column("mediumtext", { nullable: true })
  chatJson: string;//mediumtext

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  dataJson: string;

  @Field()
  @Column("varchar", { default: "unapproved" })
  state: string;

  @Field(() => String)
  @Column("varchar")
  uuid: string;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  fileUrl: string;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  lawyerId: string | null;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "lawyerId" })
  lawyer: User;

  @Field(() => Date, { nullable: true })
  @Column("datetime", { nullable: true })
  confirmedAt: Date;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  errorInfo: string;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  aiFileUrl: string;
}

export default Paperwork;
