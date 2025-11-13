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
import { Organization, SfbotCharacter, User } from "@/models";
import { ObjectType, Field, Int } from "type-graphql";

@ObjectType()
@Entity()
class MailListen extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column("varchar")
  firstName: string;

  @Field(() => String)
  @Column("varchar")
  lastName: string;

  @Field(() => String)
  @Column("varchar")
  email: string;

  @Field(() => String)
  @Column("varchar")
  password: string;

  @Field(() => String)
  @Column("varchar")
  imapHost: string;

  @Field(() => Int)
  @Column("integer")
  imapPort: number;

  @Field(() => String)
  @Column("varchar", { default: "stop" })
  state: string;

  @Field(() => Int)
  @Column("integer")
  organizationId: number;

  @Field(() => Organization)
  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @Field()
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  errInfo: string;

  @Field(() => String)
  @Column("varchar")
  smtpHost: string;

  @Field(() => Int)
  @Column("integer")
  smtpPort: number;

  @Field(() => Int)
  @Column("integer")
  sfbotCharacterId: number;

  @Field(() => SfbotCharacter)
  @ManyToOne(() => SfbotCharacter, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sfbotCharacterId" })
  sfbotCharacter: SfbotCharacter;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  signiture: string;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  bcc: string;

  @Field(() => Int, { nullable: true })
  @Column("integer", { nullable: true })
  customerDiscoverId: number | null;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  ownerUserId: string | null;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.mailListens, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "ownerUserId" })
  ownerUser: User;

  @Field(() => String, { nullable: true })
  @Column("varchar", { nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: User;
}

export default MailListen;
