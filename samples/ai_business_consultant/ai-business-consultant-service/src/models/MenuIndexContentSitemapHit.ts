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
  import { MenuIndexContent } from "@/models";
  import { ObjectType, Field, Int } from "type-graphql";
  
  @ObjectType()
  @Entity()
  class MenuIndexContentSitemapHit extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;
  
    @Field(() => String)
    @Column("text")
    url: string;
  
    @Field(() => Int)
    @Column("integer", { default: 0 })
    hit: number;
  
    @Field(() => Int)
    @Column("integer")
    menuIndexContentId: number;
  
    @Field(() => MenuIndexContent)
    @ManyToOne(
      () => MenuIndexContent,
      (menuIndexContent) => menuIndexContent.menuIndexContentSitemapHit,
      { onDelete: "CASCADE" }
    )
    @JoinColumn({ name: "menuIndexContentId" })
    menuIndexContent: MenuIndexContent;
  
    @Field()
    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;
  
    @Field()
    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
  }
  
  export default MenuIndexContentSitemapHit;
  