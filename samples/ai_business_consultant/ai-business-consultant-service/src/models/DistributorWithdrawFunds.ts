import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Entity,
  OneToMany,
} from "typeorm";
import { Distributor, WxPaidOrders, User } from "@/models";
import { ObjectType, Field, Int } from "type-graphql";

@ObjectType()
@Entity()
class DistributorWithdrawFunds extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Int)
  @Column("integer")
  amount: number;

  @Field()
  @Column("varchar")
  out_batch_no: string;

  @Field()
  @Column("text")
  batch_id: string;

  @Field()
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Field(() => Int)
  @Column("integer")
  distributorId: number;

  @Field(() => Distributor)
  @ManyToOne(() => Distributor, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "distributorId" })
  distributor: Distributor;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Field()
  @Column("varchar", { default: "ACCEPTED" }) //PROCESSING ACCEPTED FINISHED
  batch_status: string;

  @Field(() => [WxPaidOrders])
  @OneToMany(
    () => WxPaidOrders,
    (t1WxPaidOrders) => t1WxPaidOrders.t1DistributorWithdrawFunds,
    {
      cascade: true,
    }
  )
  t1WxPaidOrders: WxPaidOrders[];

  @Field(() => [WxPaidOrders])
  @OneToMany(
    () => WxPaidOrders,
    (t2WxPaidOrders) => t2WxPaidOrders.t2DistributorWithdrawFunds,
    {
      cascade: true,
    }
  )
  t2WxPaidOrders: WxPaidOrders[];

  @Field(() => Date, { nullable: true })
  @Column("datetime", { nullable: true })
  approvedDate: Date | null;

  @Field(() => Date, { nullable: true })
  @Column("datetime", { nullable: true })
  finishedDate: Date | null;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  notiyInfo: string;
}

export default DistributorWithdrawFunds;
