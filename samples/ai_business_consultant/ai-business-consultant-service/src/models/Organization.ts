import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  OneToMany,
} from "typeorm";
import { ObjectType, Field, Int } from "type-graphql";
import {
  OrgCarouselImage,
  OrgMainImage,
  OrgModelText,
  OrgUsageExample,
  OrgLawyer,
  OrgBranch,
} from "@/models";

@ObjectType()
@Entity()
class Organization extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  name: string;

  @Field()
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  sharedTitle: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  sharedDescription: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  sharedImageUrl: string;

  @Field(() => [OrgCarouselImage])
  @OneToMany(
    () => OrgCarouselImage,
    (orgCarouselImage) => orgCarouselImage.organization,
    {
      cascade: true,
    }
  )
  orgCarouselImages: OrgCarouselImage[];

  @Field(() => [OrgMainImage])
  @OneToMany(() => OrgMainImage, (orgMainImage) => orgMainImage.organization, {
    cascade: true,
  })
  orgMainImages: OrgMainImage[];

  @Field(() => [OrgModelText])
  @OneToMany(() => OrgModelText, (orgModelText) => orgModelText.organization, {
    cascade: true,
  })
  orgModelTexts: OrgModelText[];

  @Field(() => [OrgUsageExample])
  @OneToMany(
    () => OrgUsageExample,
    (orgUsageExample) => orgUsageExample.organization,
    {
      cascade: true,
    }
  )
  orgUsageExamples: OrgUsageExample[];

  @Field(() => [OrgLawyer])
  @OneToMany(() => OrgLawyer, (orgLawyer) => orgLawyer.organization, {
    cascade: true,
  })
  orgLawyers: OrgLawyer[];

  @Field(() => [OrgBranch])
  @OneToMany(() => OrgBranch, (orgBranch) => orgBranch.organization, {
    cascade: true,
  })
  orgBranchs: OrgBranch[];

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  miniMsgReply: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  miniSubscriptionReply: string;

  @Field(() => Int)
  @Column("tinyint", { default: 1 })
  plan: number;

  @Field(() => Int)
  @Column("tinyint", { default: 1 })
  enableFree: number;

  @Field({ nullable: true })
  @Column("varchar", { nullable: true })
  website: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  description: string;
}

export default Organization;
