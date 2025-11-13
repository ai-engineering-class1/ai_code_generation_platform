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
import { WxUser, Organization } from "@/models";
import { ObjectType, Field, Int } from "type-graphql";

@ObjectType()
@Entity()
class ChatHistory extends BaseEntity {
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
  organizationId: number;

  @Field(() => Organization)
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @Field(() => String)
  @Column("varchar", { default: "send" })
  state: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  message: string;

  @Field()
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}

export default ChatHistory;
