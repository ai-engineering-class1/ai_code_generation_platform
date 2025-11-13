import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  // ManyToMany,
  Entity,
  // DeleteDateColumn,
  // AfterInsert,
  // getRepository,
} from "typeorm";
import { LegalDocumentProject, Organization } from "@/models";
import { ObjectType, Field, Int } from "type-graphql";

@ObjectType()
@Entity()
class LegalDocumentElement extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("varchar")
  name: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  desc: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  spec: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  sample: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  question: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  questionMore: string;

  @Field()
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Field(() => Int)
  @Column("integer")
  legalDocumentProjectId: number;

  @Field(() => LegalDocumentProject)
  @ManyToOne(
    () => LegalDocumentProject,
    (legalDocumentProject) => legalDocumentProject.legalDocumentElements,
    { onDelete: "CASCADE" }
  )
  @JoinColumn({ name: "legalDocumentProjectId" })
  legalDocumentProject: LegalDocumentProject;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  parentLegalDocumentElementId: number;

  @Field(() => LegalDocumentElement, { nullable: true })
  @ManyToOne(
    () => LegalDocumentElement,
    (legalDocumentElement) =>
      legalDocumentElement.subclassLegalDocumentElements,
    { onDelete: "CASCADE" }
  )
  @JoinColumn({ name: "parentLegalDocumentElementId" })
  parentLegalDocumentElement: LegalDocumentElement;

  @Field(() => [LegalDocumentElement])
  @OneToMany(
    () => LegalDocumentElement,
    (subclassLegalDocumentElement) =>
      subclassLegalDocumentElement.parentLegalDocumentElement,
    {
      cascade: true,
    }
  )
  subclassLegalDocumentElements: LegalDocumentElement[];

  @Field(() => Int)
  @Column("integer")
  organizationId: number;

  @Field(() => Organization)
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  dependencyFactor: string; //依赖项

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  dependencyValue: string; //依赖值

  @Field(() => Int)
  @Column("tinyint", { default: 1 })
  flag: number;

  // @Field({ nullable: true })
  // @Column("text", { nullable: true })
  // prompt: string;

  @Field(() => Int)
  @Column("integer", { default: 1 })
  orderId: number;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  dependencyCondOp: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  promptAsk: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  promptRef: string;

  @Field({ nullable: true })
  @Column("text", { nullable: true })
  promptFig: string;

  @Field(() => Int)
  @Column("tinyint", { default: 0 })
  enableAsk: number;

  // @AfterInsert()
  // async setOrder() {
  //   console.log("set order");
  //   await getManager().transaction(async transactionalEntityManager => {
  //     await transactionalEntityManager.update(LegalDocumentElement, this.id, {
  //       orderId: this.id,
  //     });
  //   });
  // }
}

export default LegalDocumentElement;
