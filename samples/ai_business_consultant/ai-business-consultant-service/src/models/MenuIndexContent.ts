import {
    BaseEntity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    ManyToMany,
    Entity,
    OneToMany,
    JoinTable,
    BeforeRemove,
  } from "typeorm";
  import {
    Organization,
    MenuIndexContentSitemapHit,
    Sfbot,
    SfbotCharacter,
  } from "@/models";
  import { ObjectType, Field, Int } from "type-graphql";
  
  @ObjectType()
  @Entity()
  class MenuIndexContent extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;
  
    @Field(() => String)
    @Column("text")
    content: string;
  
    @Field(() => String)
    @Column("varchar")
    type: string;
  
    @Field(() => String, { nullable: true })
    @Column("varchar", { nullable: true })
    category: string;
  
    @Field(() => Int)
    @Column("integer")
    organizationId: number;
  
    @Field(() => Organization)
    @ManyToOne(() => Organization, { onDelete: "CASCADE" })
    @JoinColumn({ name: "organizationId" })
    organization: Organization;
  
    @Field(() => String)
    @Column("varchar", { default: "processing" })
    indexStatus: string;
  
    @Field()
    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;
  
    @Field()
    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
  
    @Field(() => Int)
    @Column("integer", { default: 0 })
    hit: number;
  
    @Field(() => [MenuIndexContentSitemapHit])
    @OneToMany(
      () => MenuIndexContentSitemapHit,
      (menuIndexContentSitemapHit) => menuIndexContentSitemapHit.menuIndexContent,
      {
        cascade: true,
      }
    )
    menuIndexContentSitemapHit: MenuIndexContentSitemapHit[];
  
    @Field(() => Int)
    @Column("tinyint", { default: 1 })
    permissionFlag: number;
  
    @Field(() => [Sfbot], { nullable: true })
    @ManyToMany(() => Sfbot, (sfbot) => sfbot.menuIndexContents)
    @JoinTable()
    sfbots: Sfbot[];
  
    @Field(() => String, { nullable: true })
    @Column("varchar", { nullable: true, default: "" })
    from: string;
  
    @Field(() => String, { nullable: true })
    @Column("text", { nullable: true })
    error: string;
  
    @Field(() => Int, { nullable: true })
    @Column("integer", { nullable: true })
    sfbotCharacterId: number;
  
    @Field(() => SfbotCharacter, { nullable: true })
    @ManyToOne(() => SfbotCharacter, { onDelete: "CASCADE" })
    @JoinColumn({ name: "sfbotCharacterId" })
    sfbotCharacter: SfbotCharacter;
  
    @Field(() => String)
    @Column("varchar", { default: "org" })
    source: string;
  
    @Field(() => String, { nullable: true })
    @Column("varchar", { nullable: true, default: "" }) //file,email,folder
    indexedSource: string;
  
    @Field(() => String, { nullable: true })
    @Column("varchar", { nullable: true, default: "" })
    subject: string;
  
    @Field(() => Int)
    @Column("integer", { default: 0 })
    parentId: number;
  
    @Field(() => Int)
    @Column("integer", { default: 0 })
    markId: number;
  
    @Field(() => String, { nullable: true })
    @Column("varchar", { nullable: true, default: "" })
    fileName: string;
  
    @BeforeRemove()
    logMenuIndexContentRemoval() {
      console.log(`MenuIndexContent with ID ${this.id} is being removed`);
    }
  }
  
  export default MenuIndexContent;
  