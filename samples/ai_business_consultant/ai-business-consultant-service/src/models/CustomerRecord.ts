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

//邮件客户设置-客户记录
@ObjectType()
@Entity()
class CustomerRecord extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  name: string; //客户名称

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  company: string; //公司

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  email: string; //邮箱

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  interest: string; //产品

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  source: string; //来源

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  status: string; //状态

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  emailSubject: string; //邮箱

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  emailContent: string; //内容

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  aiResult: string; //大模型返回数据

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

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  phone: string; //电话

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  firstContactDate: string; //首次联系日期

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  priority: string; //优先级

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  position: string; //职位

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  receiveDate: string; //邮件接收时间

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  customerDiscoverId: number | null;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}

export default CustomerRecord;
