import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  // RelationId,
  Entity,
  DeleteDateColumn,
  ManyToMany,
  OneToOne,
  OneToMany,
} from "typeorm";
import { ObjectType, Field, Int } from "type-graphql";
// import is from "@/utils/validations";
import {
  Organization,
  LegalDocumentProject,
  Commodity,
  WxUser,
  Distributor,
  Department,
  MailListen,
} from "@/models";

//用户管理&订阅->团队管理
@ObjectType()
@Entity()
class User extends BaseEntity {
  @Field(() => String)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column("varchar")
  name: string;

  @Field()
  @Column("varchar")
  email: string;

  @Field()
  @Column("varchar", { default: "" })
  phone: string;

  // @Field()
  @Column("varchar")
  password: string;

  @Field()
  @Column("integer", { default: 2 })
  role: number; //1:管理员，2:律师，3:市场专员
  
  @Field({ nullable: true })
  @Column("varchar", { nullable: true, length: 2000 })
  avatarUrl: string;

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
  @DeleteDateColumn()
  deletedAt?: Date;

  @Field(() => [LegalDocumentProject], { nullable: true })
  @ManyToMany(
    () => LegalDocumentProject,
    (legalDocumentProject) => legalDocumentProject.members
  )
  legalDocumentProject: LegalDocumentProject[];

  @Field(() => [Commodity], { nullable: true })
  @ManyToMany(() => Commodity, (commodity) => commodity.lawyers)
  commodity: Commodity[];

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  wxUserId: string;

  @Field(() => WxUser, { nullable: true })
  @ManyToOne(() => WxUser, { onDelete: "SET NULL" })
  @JoinColumn({ name: "wxUserId" })
  wxUser: WxUser;

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  realName: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  desc: string;

  @Field(() => Distributor, { nullable: true })
  @OneToOne(() => Distributor, (distributor) => distributor.user, {
    cascade: true,
  })
  distributor: Distributor;

  @Field(() => Int)
  @Column("tinyint", { default: 1 }) //1.待激活， 2 已激活
  state: number;

  @Field(() => [Department], { nullable: true })
  @OneToMany(() => Department, (department) => department.leaderUser)
  departmentLeaders: Department[];

  // @Field(() => [Department], { nullable: true })
  // @ManyToMany(() => Department, (department) => department.departmentUsers)
  // departments: Department[];

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  departmentId: number | null;

  @Field(() => Department, { nullable: true })
  @ManyToOne(() => Department, (department) => department.users, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "departmentId" })
  department: Department;

  @Field(() => [MailListen], { nullable: true })
  @OneToMany(() => MailListen, (mailListens) => mailListens.ownerUser)
  mailListens: MailListen[];

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  companySituation: string; //公司情况

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  companyProductAndService: string; //产品与服务

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  title: string; //职位

  @Field({ nullable: true })
  orgName: string; //公司名称
}

export default User;
