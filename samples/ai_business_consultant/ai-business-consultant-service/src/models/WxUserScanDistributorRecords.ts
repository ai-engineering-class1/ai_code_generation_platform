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
import { Distributor, WxUser } from "@/models";
import { ObjectType, Field, Int } from "type-graphql";

@ObjectType()
@Entity()
class WxUserScanDistributorRecords extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column("varchar")
  wxUserId: string;

  @Field(() => WxUser)
  @ManyToOne(() => WxUser, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "wxUserId" })
  wxUser: WxUser;

  @Field(() => Int)
  @Column("integer")
  distributorId: number;

  @Field(() => Distributor)
  @ManyToOne(() => Distributor, { onDelete: "CASCADE" })
  @JoinColumn({ name: "distributorId" })
  distributor: Distributor;

  @Field(() => String)
  @Column("varchar", { default: "valid" })
  state: string;

  @Field()
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}

export default WxUserScanDistributorRecords;
