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
  
  @ObjectType()
  @Entity()
  class OrgBranch extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    name: string;
  
    @Field({ nullable: true })
    @Column("text", { nullable: true })
    address: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    phone: string;
  
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
      (organization) => organization.orgBranchs,
      { onDelete: "CASCADE" }
    )
    @JoinColumn({ name: "organizationId" })
    organization: Organization;
  }
  
  export default OrgBranch;
  