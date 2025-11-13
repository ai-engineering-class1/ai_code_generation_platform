import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  ManyToOne,
  // JoinTable,
  // ManyToMany,
  OneToMany,
  JoinColumn,
} from "typeorm";
import is from "@/utils/validations";

import { ObjectType, Field, Int } from "type-graphql";
import { User, Organization } from "@/models";

@Entity()
@ObjectType()
class Department extends BaseEntity {
  static validations = {
    name: [is.required(), is.maxLength(50000)],
    organizationId: [is.required()],
  };

  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  name: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  description: string | null;

  @Field(() => Int)
  @Column("integer", { default: 0 })
  parentDepartmentId: number;

  @Field(() => String)
  @Column({ name: "leaderUserId" })
  leaderUserId: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.departmentLeaders, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "leaderUserId" })
  leaderUser: User;

  // @Field(() => [User], { nullable: true })
  // @ManyToMany(() => User, (user) => user.departments)
  // @JoinTable({
  //   name: "department_users",
  // })
  // departmentUsers: User[];

  @Field(() => [User])
  @OneToMany(() => User, (user) => user.department, {
    cascade: true,
  })
  users: User[];

  @Field(() => Int)
  @Column("integer")
  organizationId: number;

  @Field(() => Organization)
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @Field()
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}

export default Department;
