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
import is from "@/utils/validations";
import { WxUser, Organization, Commodity } from "@/models";
import { ObjectType, Field, Int } from "type-graphql";

@ObjectType()
@Entity()
class WxRefundOrders extends BaseEntity {
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

  @Field()
  @Column("varchar")
  out_refund_no: string;

  @Field(() => Int)
  @Column("integer")
  total: number;

  @Field(() => Int)
  @Column("integer", { default: 0 })
  refund: number;

  @Field()
  @Column("varchar", { default: "CNY" })
  currency: string;

  @Field()
  @Column("varchar", { default: "PROCESSING" })
  status: string;

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  channel: string;

  @Field()
  @Column("varchar", { default: "weixinpay" })
  type: string;

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  refund_id: string;

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
  @ManyToOne(() => WxUser, { onDelete: "CASCADE" })
  @JoinColumn({ name: "wxUserId" })
  wxUser: WxUser;

  @Field()
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

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

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  commodityId: number;

  @Field(() => Commodity, { nullable: true })
  @ManyToOne(() => Commodity, { onDelete: "SET NULL" })
  @JoinColumn({ name: "commodityId" })
  commodity: Commodity;
}

export default WxRefundOrders;
