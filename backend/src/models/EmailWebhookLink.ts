import {
  Model,
  Table,
  Column,
  PrimaryKey,
  AutoIncrement,
  DataType,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  BeforeCreate,
  Default,
  HasMany
} from "sequelize-typescript";
import Company from "./Company";
import User from "./User";
import EmailTemplate from "./EmailTemplate";
import EmailWebhookLog from "./EmailWebhookLog";
import crypto from "crypto";

@Table({
  tableName: "EmailWebhookLinks"
})
export class EmailWebhookLink extends Model<EmailWebhookLink> {
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

  @ForeignKey(() => EmailTemplate)
  @Column
  emailTemplateId: number;

  @Column
  name: string;

  @Column(DataType.TEXT)
  description: string;

  @Column
  platform: string; // kiwify, hotmart, braip, monetizze, cacto, perfectpay, eduzz, generic

  @Column
  webhookHash: string;

  @Column(DataType.TEXT)
  webhookUrl: string;

  // Configurações de delay
  @Column
  delayType: string; // 'immediate', 'minutes', 'hours', 'days'

  @Default(0)
  @Column
  delayValue: number; // Valor numérico do delay

  @Column(DataType.JSON)
  triggerEvents: string[]; // Eventos que disparam o email

  @Default(true)
  @Column
  active: boolean;

  @Default(0)
  @Column
  totalRequests: number;

  @Default(0)
  @Column
  successfulRequests: number;

  @Default(0)
  @Column
  emailsSent: number;

  @Column
  lastRequestAt: Date;

  @Column(DataType.JSON)
  metadata: object;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => EmailTemplate)
  emailTemplate: EmailTemplate;

  @HasMany(() => EmailWebhookLog)
  logs: EmailWebhookLog[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BeforeCreate
  static async generateWebhookHash(instance: EmailWebhookLink) {
    // Gerar hash único para o webhook
    const hash = crypto.randomBytes(20).toString('hex');
    instance.webhookHash = hash;

    // Gerar URL completa do webhook
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    instance.webhookUrl = `${baseUrl}/webhook/email/${hash}`;
  }
}

export default EmailWebhookLink;