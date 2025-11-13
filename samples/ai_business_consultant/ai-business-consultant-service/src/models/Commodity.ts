import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  ManyToMany,
  JoinTable,
  Entity,
  // RelationId,
} from "typeorm";
import { LegalDocumentProject, Organization, User } from "@/models";
import { ObjectType, Field, Int, Float } from "type-graphql";

@ObjectType()
@Entity()
class Commodity extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  name: string;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  legalDocumentProjectId?: number | null;

  @Field(() => LegalDocumentProject, { nullable: true })
  @ManyToOne(() => LegalDocumentProject, { onDelete: "CASCADE" })
  @JoinColumn({ name: "legalDocumentProjectId" })
  legalDocumentProject: LegalDocumentProject;

  @Field(() => Float)
  @Column("float", { default: 0 })
  price: number;

  @Field(() => Int)
  @Column("integer", { default: 20 })
  availableQueries: number;

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

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  mainImg: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  description: string;

  @Field(() => Float, { nullable: true })
  @Column("float", { nullable: true })
  marketPrice: number;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  details: string;

  @Field(() => Int)
  @Column("integer", { default: 0 })
  salesVolume: number;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  carouselImgs: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  detailImgs: string;

  @Field()
  @Column("varchar", { default: "Testing" }) //Release, Testing, Offline
  status: string;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  creatorId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "creatorId" })
  creator: User;

  @Field({ nullable: true })
  @DeleteDateColumn()
  deletedAt?: Date;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  stock: number;

  @Field()
  @Column("varchar", { default: "Public" }) //Public, Private
  state: string;

  @Field(() => [User], { nullable: true })
  @ManyToMany(() => User, (user) => user.commodity, {
    cascade: true,
  })
  @JoinTable()
  lawyers: User[];

  @Field(() => String)
  @Column("varchar")
  uuid: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  qrCode: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  h5Link: string;
  // @Field(() => [String], { nullable: true })
  // @RelationId((commodity: Commodity) => commodity.lawyers)
  // lawyerIds: string[];

  @Field(() => Int)
  @Column("integer", { default: 0 })
  validDays: number;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  distributorStatus: string;
}

export default Commodity;
