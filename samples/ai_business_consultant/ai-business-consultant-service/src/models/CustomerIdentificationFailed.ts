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
import { Organization } from "@/models";
import { ObjectType, Field, Int } from "type-graphql";


//大模型客户解析失败的记录
@ObjectType()
@Entity()
class CustomerIdentificationFailed extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("text")
  prompt: string;//提示词

  @Field()
  @Column("text")
  emailSubject: string;//邮件主题

  @Field()
  @Column("text")
  emailText: string;//邮件文本

  @Field()
  @Column("text")
  failedResponse: string;//失败描述

  @Field()
  @Column("text")
  res: string;//大模型返回失败的数据

  @Field()
  @Column("text")
  mailText: string;//邮件模型

  @Field(() => Int)
  @Column("integer")
  customerDiscoverId: number;

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

}

export default CustomerIdentificationFailed;
