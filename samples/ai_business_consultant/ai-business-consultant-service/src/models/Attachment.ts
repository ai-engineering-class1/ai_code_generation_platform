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
  
  
  //附件管理表
  @ObjectType()
  @Entity()
  class Attachment extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;
  
    @Field()
    @Column("varchar")
    name: string;//附件名称
  
    @Field({ nullable: true })
    @Column("text",{ nullable: true })
    description: string;//附件描述
  
    @Field({ nullable: true })
    @Column("text",{ nullable: true })
    keywords: string;//附件关键词

    @Field()
    @Column("varchar")
    fileLocation: string;//附件路径
  
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

    @Field(() => String)
    @Column("varchar")
    userId: string;
  
    @Field(() => User)
    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;
  }
  
  export default Attachment;
  