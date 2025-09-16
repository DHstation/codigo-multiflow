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
import EmailWebhookLink from "./EmailWebhookLink";

@Table({
  tableName: "EmailTemplates"
})
export class EmailTemplate extends Model<EmailTemplate> {
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

  @Column
  name: string;

  @Column(DataType.TEXT)
  description: string;

  @Column
  subject: string;

  @Column(DataType.TEXT)
  htmlContent: string;

  @Column(DataType.TEXT)
  textContent: string;

  @Column(DataType.JSON)
  variables: string[];

  @Column(DataType.JSON)
  previewData: object;

  @Default(true)
  @Column
  active: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => User)
  user: User;

  @HasMany(() => EmailWebhookLink)
  emailWebhookLinks: EmailWebhookLink[];
}

export default EmailTemplate;