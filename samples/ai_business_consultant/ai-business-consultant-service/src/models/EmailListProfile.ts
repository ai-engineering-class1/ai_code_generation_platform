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
  //   import is from "@/utils/validations";
  import { Organization } from "@/models";
  import { ObjectType, Field, Int } from "type-graphql";
  
  @ObjectType()
  @Entity()
  class EmailListProfile extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;
  
    @Field()
    @Column("varchar")
    email: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    firstname: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true })
    lastname: string;
  
    @Field({ nullable: true })
    @Column("text", { nullable: true })
    profile: string;
  
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
  
  export default EmailListProfile;
  