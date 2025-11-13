import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  DeleteDateColumn,
  OneToMany,
} from "typeorm";
import { ObjectType, Field, Int } from "type-graphql";
import {
  Organization,
  LegalDocumentProject,
  Distributor,
  WxPaidOrders,
} from "@/models";

@ObjectType()
@Entity()
class WxUser extends BaseEntity {
  @Field(() => String)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column("varchar")
  name: string;

  @Field({ nullable: true })
  @Column("varchar", { nullable: true, length: 2000 })
  avatarUrl: string;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  openId: string;

  @Field(() => Date, { nullable: true })
  @Column("datetime", { nullable: true })
  lastOperateDate: Date | null;

  @Field(() => Date, { nullable: true })
  @Column("datetime", { nullable: true })
  lastPayDate: Date | null;

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
  @Column("integer", { default: 20 })
  availableQueries: number;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  sex: number;

  @Field(() => [LegalDocumentProject], { nullable: true })
  @ManyToMany(
    () => LegalDocumentProject,
    (legalDocumentProject) => legalDocumentProject.testers
  )
  legalDocumentProject: LegalDocumentProject[];

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  distributorId: number;

  @Field(() => Distributor, { nullable: true })
  @ManyToOne(() => Distributor, { onDelete: "SET NULL" })
  @JoinColumn({ name: "distributorId" })
  distributor: Distributor;

  @Field({ nullable: true })
  @DeleteDateColumn()
  deletedAt?: Date;

  @Field()
  @Column("varchar", { default: "subscribe" })
  officialAccountState: string;

  @Field(() => [WxPaidOrders])
  @OneToMany(() => WxPaidOrders, (wxPaidOrders) => wxPaidOrders.wxUser, {
    cascade: true,
  })
  wxPaidOrders: WxPaidOrders[];

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  phoneNumber: string;

  @Field(() => Int)
  @Column("integer", { default: 0 })
  freeTimes: number;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  fromUserId: string;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  miniOpenId: string;
}

export default WxUser;
