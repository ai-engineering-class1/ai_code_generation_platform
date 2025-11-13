import {
    BaseEntity,
    PrimaryGeneratedColumn,
    Column,
    Entity,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
  } from "typeorm";
  import is from "@/utils/validations";
  import { ObjectType, Field, Int } from "type-graphql";
  import { EmailList, Organization } from "@/models";
  
  @ObjectType()
  @Entity()
  class EmailListFolder extends BaseEntity {
    static validations = {
      name: [is.required()],
    };
  
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;
  
    @Field(() => String)
    @Column("varchar")
    name: string;
  
    @Field(() => String, { nullable: true })
    @Column("text", { nullable: true })
    description: string;
  
    @Field(() => Int)
    @Column("integer")
    organizationId: number;
  
    @Field(() => Organization)
    @ManyToOne(() => Organization, { onDelete: "CASCADE" })
    @JoinColumn({ name: "organizationId" })
    organization: Organization;
  
    @Field(() => [EmailList])
    @OneToMany(() => EmailList, (emailList) => emailList.emailListFolder, {
      cascade: true,
    })
    emailList: EmailList[];
  
    @Field()
    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;
  
    @Field()
    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
  
    @Field(() => Int)
    @Column("integer", { default: 0 })
    emailListCount: number;
  
    @Field(() => Int)
    @Column("tinyint", { default: 0 })
    testAccount: number;
  }
  
  export default EmailListFolder;
  