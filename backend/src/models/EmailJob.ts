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
  Default
} from "sequelize-typescript";
import Company from "./Company";
import EmailSequence from "./EmailSequence";
import EmailSequenceStep from "./EmailSequenceStep";
import EmailTemplate from "./EmailTemplate";

@Table({
  tableName: "EmailJobs"
})
export class EmailJob extends Model<EmailJob> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @ForeignKey(() => EmailSequence)
  @Column
  sequenceId: number;

  @ForeignKey(() => EmailSequenceStep)
  @Column
  stepId: number;

  @ForeignKey(() => EmailTemplate)
  @Column
  templateId: number;

  @Column
  recipientEmail: string;

  @Column
  recipientName: string;

  @Column(DataType.JSON)
  variables: object; // Dados do webhook para substituição no template

  @Column
  scheduledAt: Date; // Quando deve ser enviado

  @Column
  sentAt: Date; // Quando foi enviado

  @Column
  processedAt: Date; // Quando foi processado pela fila

  @Column(DataType.ENUM('pending', 'processing', 'sent', 'failed', 'cancelled'))
  status: string;

  @Column(DataType.TEXT)
  errorMessage: string;

  @Default(0)
  @Column
  attempts: number;

  @Column(DataType.STRING)
  messageId: string; // ID retornado pelo provedor de email

  @Column(DataType.JSON)
  deliveryInfo: object; // Informações de entrega do provedor

  @Column(DataType.STRING)
  priority: string; // 'low', 'normal', 'high'

  @Column(DataType.JSON)
  metadata: object; // Dados extras

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => EmailSequence)
  sequence: EmailSequence;

  @BelongsTo(() => EmailSequenceStep)
  step: EmailSequenceStep;

  @BelongsTo(() => EmailTemplate)
  template: EmailTemplate;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default EmailJob;