import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  // OneToMany,
  OneToOne,
  // ManyToMany,
  Entity,
} from "typeorm";
import is from "@/utils/validations";
import {
  WxUser,
  Organization,
  Commodity,
  Paperwork,
  DistributorWithdrawFunds,
} from "@/models";
import { ObjectType, Field, Int } from "type-graphql";

@ObjectType()
@Entity()
class WxPaidOrders extends BaseEntity {
  //
  static validations = {
    out_trade_no: [is.required()],
  };

  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  out_trade_no: string;

  @Field(() => Int)
  @Column("integer")
  total: number;

  @Field()
  @Column("varchar", { default: "CNY" })
  currency: string;

  @Field()
  @Column("varchar", { default: "USERPAYING" })
  state: string;

  @Field()
  @Column("varchar", { default: "weixinpay" })
  type: string;

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  notify_id: string;

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  transaction_id: string;

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  success_time: string;

  @Field(() => String)
  @Column("varchar")
  wxUserId: string;

  @Field(() => WxUser)
  @ManyToOne(() => WxUser, (wxUser) => wxUser.wxPaidOrders, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "wxUserId" })
  wxUser: WxUser;

  @Field()
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Field(() => Int)
  @Column("tinyint", { default: 0 })
  isRead: number;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  rawData: string;

  @Field(() => Int)
  @Column("integer")
  organizationId: number;

  @Field(() => Organization)
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @Field(() => Int)
  @Column("tinyint", { default: 0 })
  status: number; //（0/新下单、1/调查中、2/要素已提取、3/文书已生成待审核、4/已完结）；初始=0，收到用户第一条消息则=1

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  commodityId: number;

  @Field(() => Commodity, { nullable: true })
  @ManyToOne(() => Commodity, { onDelete: "SET NULL" })
  @JoinColumn({ name: "commodityId" })
  commodity: Commodity;

  @Field(() => Paperwork, { nullable: true })
  @OneToOne(() => Paperwork, (paperwork) => paperwork.wxPaidOrders, {
    cascade: true,
  })
  paperwork: Paperwork;

  @Field(() => Int)
  @Column("integer", { default: 0 })
  t1_share: number;

  @Field(() => Int)
  @Column("integer", { default: 0 })
  t2_share: number;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  t1DistributorWithdrawFundsId: number;

  @Field(() => DistributorWithdrawFunds, { nullable: true })
  @ManyToOne(
    () => DistributorWithdrawFunds,
    (t1DistributorWithdrawFunds) => t1DistributorWithdrawFunds.t1WxPaidOrders,
    { onDelete: "SET NULL" }
  )
  @JoinColumn({ name: "t1DistributorWithdrawFundsId" })
  t1DistributorWithdrawFunds: DistributorWithdrawFunds;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  t2DistributorWithdrawFundsId: number;

  @Field(() => DistributorWithdrawFunds, { nullable: true })
  @ManyToOne(
    () => DistributorWithdrawFunds,
    (t2DistributorWithdrawFunds) => t2DistributorWithdrawFunds.t2WxPaidOrders,
    { onDelete: "SET NULL" }
  )
  @JoinColumn({ name: "t2DistributorWithdrawFundsId" })
  t2DistributorWithdrawFunds: DistributorWithdrawFunds;
}

export default WxPaidOrders;
