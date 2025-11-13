import {
    BaseEntity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Entity,
    ManyToOne,
    JoinColumn,
    // OneToOne,
  } from "typeorm";
  import is from "@/utils/validations";
  import { ObjectType, Field, Int } from "type-graphql";
  import { Organization, Sfbot } from "@/models";
  
  @ObjectType()
  @Entity()
  class SfbotCharacter extends BaseEntity {
    static validations = {
      title: [is.required(), is.maxLength(200)],
    };
  
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;
  
    @Field()
    @Column("varchar")
    title: string;
  
    @Field({ nullable: true })
    @Column("text", { nullable: true })
    desc: string;
  
    @Field({ nullable: true })
    @Column("text", { nullable: true })
    prompt: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true, length: 2000 })
    icon: string;
  
    @Field()
    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;
  
    @Field()
    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
  
    @Field(() => Int)
    @Column("integer")
    sfbotId: number;
  
    @Field(() => Sfbot)
    @ManyToOne(() => Sfbot, { onDelete: "CASCADE" })
    @JoinColumn({ name: "sfbotId" })
    sfbot: Sfbot;
  
    @Field(() => Int)
    @Column("integer")
    organizationId: number;
  
    @Field(() => Organization)
    @ManyToOne(() => Organization, { onDelete: "CASCADE" })
    @JoinColumn({ name: "organizationId" })
    organization: Organization;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true, default: "private" })
    state: string;
  
    @Field({ nullable: true })
    @Column("text", { nullable: true })
    startersJson: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true, default: "base" })
    type: string;
  
    @Field({ nullable: true })
    @Column("varchar", { nullable: true, default: "external" })
    premission: string;
  }
  
  export default SfbotCharacter;
  