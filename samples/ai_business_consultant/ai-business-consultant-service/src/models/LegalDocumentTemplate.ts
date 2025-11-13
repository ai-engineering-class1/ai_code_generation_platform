import {
    BaseEntity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    DeleteDateColumn
  } from "typeorm";
  import { ObjectType, Field, Int } from "type-graphql";
  import {
    User,
    LegalDocumentProject,
    LegalDocumentType,
    Organization,
  } from "@/models";
  
  @ObjectType()
  @Entity()
  class LegalDocumentTemplate extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;
  
    @Field()
    @Column("varchar")
    fileName: string;
  
    @Field(() => String, { nullable: true })
    @Column("varchar", { nullable: true })
    fileUrl: string;
  
    @Field({ nullable: true })
    @Column("integer", { nullable: true, default: 0 })
    size: number;
  
    @Field(() => String)
    @Column("varchar", { default: "processing" })
    indexStatus: string;
  
    @Field(() => String)
    @Column("varchar")
    userId: string;
  
    @Field(() => User)
    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;
  
    @Field()
    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;
  
    @Field()
    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
  
    @Field(() => String, { nullable: true })
    @Column("text", { nullable: true })
    error: string;
  
    @Field(() => Int)
    @Column("integer")
    legalDocumentProjectId: number;
  
    @Field(() => LegalDocumentProject)
    @ManyToOne(
      () => LegalDocumentProject,
      (legalDocumentProject) => legalDocumentProject.legalDocumentTemplates,
      { onDelete: "CASCADE" }
    )
    @JoinColumn({ name: "legalDocumentProjectId" })
    legalDocumentProject: LegalDocumentProject;
  
    @Field(() => Int, { nullable: true })
    @Column("integer", { nullable: true })
    legalDocumentTypeId: number;
  
    @Field(() => LegalDocumentType, { nullable: true })
    @ManyToOne(() => LegalDocumentType, { onDelete: "SET NULL" })
    @JoinColumn({ name: "legalDocumentTypeId" })
    legalDocumentType: LegalDocumentType;
  
    @Field(() => Int)
    @Column("integer")
    organizationId: number;
  
    @Field(() => Organization)
    @ManyToOne(() => Organization, { onDelete: "CASCADE" })
    @JoinColumn({ name: "organizationId" })
    organization: Organization;

    @Field({ nullable: true })
    @DeleteDateColumn()
    deletedAt?: Date;
  }
  
  export default LegalDocumentTemplate;
  