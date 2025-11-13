import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  // ManyToMany,
  Entity,
} from "typeorm";
import { Organization } from "@/models";
import { ObjectType, Field, Int } from "type-graphql";

@ObjectType()
@Entity()
class DistributorSplitRatio extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("text")
  name: string;

  @Field()
  @Column("text")
  ratioJson: string;

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
}

export default DistributorSplitRatio;
