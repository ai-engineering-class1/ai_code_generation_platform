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
  
  
  //账单与发票
  @ObjectType()
  @Entity()
  class OrgInvoice extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;
  
    @Field()
    @Column("varchar")
    name: string;
  
    @Field()
    @Column("varchar")
    type: string;//系数
  
    @Field()
    @Column("varchar")
    identificationNumber: string;//识别码
  
    @Field()
    @Column("varchar")
    address: string;//地址
  
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
  
  export default OrgInvoice;
  