import {
  Model,
  Table,
  Column,
  PrimaryKey,
  AutoIncrement,
  DataType,
  CreatedAt,
  ForeignKey,
  BelongsTo,
  Default
} from "sequelize-typescript";
import EmailWebhookLink from "./EmailWebhookLink";
import Company from "./Company";

@Table({
  tableName: "EmailWebhookLogs",
  timestamps: true,
  updatedAt: false
})
export class EmailWebhookLog extends Model<EmailWebhookLog> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => EmailWebhookLink)
  @Column
  emailWebhookLinkId: number;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @Column
  platform: string;

  @Column
  eventType: string;

  @Column(DataType.JSON)
  payloadRaw: object;

  @Column(DataType.JSON)
  payloadProcessed: object;

  @Column(DataType.JSON)
  variablesExtracted: object;

  // Dados do email
  @Column
  recipientEmail: string;

  @Column
  recipientName: string;

  @Column
  emailSubject: string;

  // Status do processamento
  @Default(false)
  @Column
  emailScheduled: boolean;

  @Column
  scheduledFor: Date;

  @Default(false)
  @Column
  emailSent: boolean;

  @Column
  sentAt: Date;

  @Column
  emailStatus: string; // 'pending', 'sent', 'failed', 'bounced'

  @Column
  httpStatus: number;

  @Column
  responseTimeMs: number;

  @Column(DataType.TEXT)
  errorMessage: string;

  @Column
  ipAddress: string;

  @Column(DataType.TEXT)
  userAgent: string;

  @BelongsTo(() => EmailWebhookLink)
  emailWebhookLink: EmailWebhookLink;

  @BelongsTo(() => Company)
  company: Company;

  @CreatedAt
  createdAt: Date;
}

export default EmailWebhookLog;