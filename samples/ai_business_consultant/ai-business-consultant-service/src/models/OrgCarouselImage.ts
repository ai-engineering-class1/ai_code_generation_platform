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

@ObjectType()
@Entity()
class OrgCarouselImage extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  title: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  desc: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  imageUrl: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  detailUrl: string;

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
  @ManyToOne(
    () => Organization,
    (organization) => organization.orgCarouselImages,
    { onDelete: "CASCADE" }
  )
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "userId" })
  user: User;
}

export default OrgCarouselImage;
