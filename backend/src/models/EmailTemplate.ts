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
import EmailSequenceStep from "./EmailSequenceStep";

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
  designJson: object; // JSON do editor visual

  @Column(DataType.JSON)
  variables: object; // Variáveis esperadas [{name, type, required, example}]

  @Default(true)
  @Column
  active: boolean;

  @Column(DataType.STRING)
  category: string; // 'welcome', 'abandoned_cart', 'post_purchase', 'custom'

  @Column(DataType.JSON)
  metadata: object; // Dados extras como configurações de estilo

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => User)
  user: User;

  @HasMany(() => EmailSequenceStep)
  sequenceSteps: EmailSequenceStep[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default EmailTemplate;