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
  
  //用户管理&订阅->权限配置
  @ObjectType()
  @Entity()
  class UserRole extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;
  
    @Field()
    @Column("varchar")
    name: string;

    @Field()
    @Column("varchar",{default:""})
    industry: string;//产业前景分析

    @Field()
    @Column("varchar",{default:""})
    market: string;//市场分析

    @Field()
    @Column("varchar",{default:""})
    assistant: string;//国际谈判助手

    @Field()
    @Column("varchar",{default:""})
    data: string;//数据api

    @Field()
    @Column("varchar",{default:""})
    team: string;//团队管理
  
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
  
  export default UserRole;
  