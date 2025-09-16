import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  DataType,
  Default,
  HasMany
} from "sequelize-typescript";
import Company from "./Company";
import User from "./User";
import WebhookLink from "./WebhookLink";
import EmailSequenceStep from "./EmailSequenceStep";
import EmailJob from "./EmailJob";

@Table({
  tableName: "EmailSequences"
})
export class EmailSequence extends Model<EmailSequence> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @ForeignKey(() => WebhookLink)
  @Column
  webhookLinkId: number;

  @Column
  name: string;

  @Column(DataType.TEXT)
  description: string;

  @Column(DataType.STRING)
  triggerEvent: string; // 'immediate', 'purchase_complete', 'purchase_canceled', 'abandoned_cart'

  @Column(DataType.JSON)
  triggerConditions: object; // Condições para ativação da sequência

  @Default(true)
  @Column
  active: boolean;

  @Default(0)
  @Column
  totalExecutions: number;

  @Default(0)
  @Column
  successfulExecutions: number;

  @Column
  lastExecutionAt: Date;

  @Column(DataType.JSON)
  settings: object; // Configurações gerais da sequência

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => WebhookLink)
  webhookLink: WebhookLink;

  @HasMany(() => EmailSequenceStep, {
    onDelete: "CASCADE",
    hooks: true
  })
  steps: EmailSequenceStep[];

  @HasMany(() => EmailJob)
  jobs: EmailJob[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default EmailSequence;