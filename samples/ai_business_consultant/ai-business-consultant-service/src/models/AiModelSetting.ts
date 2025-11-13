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
import { Organization, User } from "@/models";
import { ObjectType, Field, Int } from "type-graphql";


//AI模型设置
@ObjectType()
@Entity()
class AiModelSetting extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  name: string;

  @Field()
  @Column("varchar")
  coefficient: string;//系数

  @Field()
  @Column("varchar")
  randomParam: string;//随机性参数

  @Field(() => Int,{ nullable: true })
  @Column("integer", { nullable: true })
  responseTime: number; //响应长度

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

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}

export default AiModelSetting;
