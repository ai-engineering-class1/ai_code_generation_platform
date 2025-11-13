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
  DeleteDateColumn,
  OneToMany,
  OneToOne
} from "typeorm";
import { Organization, User, DistributorSplitRatio } from "@/models";
import { ObjectType, Field, Int } from "type-graphql";

@ObjectType()
@Entity()
class Distributor extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  name: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  desc: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  wxQrCode: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  t2QrCode: string;

  @Field()
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  t1DistributorId: number;

  @Field(() => Distributor, { nullable: true })
  @ManyToOne(() => Distributor, (distributor) => distributor.t2Distributors, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "t1DistributorId" })
  t1Distributor: Distributor;

  @Field(() => [Distributor])
  @OneToMany(() => Distributor, (distributor) => distributor.t1Distributor, {
    cascade: true,
  })
  t2Distributors: Distributor[];

  @Field(() => Int)
  @Column("integer")
  organizationId: number;

  @Field(() => Organization)
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @Field({ nullable: true })
  @DeleteDateColumn()
  deletedAt?: Date;

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  uuid: string;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @OneToOne(() => User,(user) => user.distributor, { onDelete: "SET NULL" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  distributorSplitRatioId: number;

  @Field(() => DistributorSplitRatio, { nullable: true })
  @ManyToOne(() => DistributorSplitRatio, { onDelete: "CASCADE" })
  @JoinColumn({ name: "distributorSplitRatioId" })
  distributorSplitRatio: DistributorSplitRatio;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  distributorSplitRatio2Id: number;

  @Field(() => DistributorSplitRatio, { nullable: true })
  @ManyToOne(() => DistributorSplitRatio, { onDelete: "CASCADE" })
  @JoinColumn({ name: "distributorSplitRatio2Id" })
  distributorSplitRatio2: DistributorSplitRatio;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  distributorSplitRatio3Id: number;

  @Field(() => DistributorSplitRatio, { nullable: true })
  @ManyToOne(() => DistributorSplitRatio, { onDelete: "CASCADE" })
  @JoinColumn({ name: "distributorSplitRatio3Id" })
  distributorSplitRatio3: DistributorSplitRatio;
}

export default Distributor;
