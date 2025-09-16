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
import EmailSequence from "./EmailSequence";
import EmailTemplate from "./EmailTemplate";
import EmailJob from "./EmailJob";

@Table({
  tableName: "EmailSequenceSteps"
})
export class EmailSequenceStep extends Model<EmailSequenceStep> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => EmailSequence)
  @Column
  sequenceId: number;

  @ForeignKey(() => EmailTemplate)
  @Column
  templateId: number;

  @Column
  stepOrder: number; // Ordem do passo na sequência (1, 2, 3...)

  @Default(0)
  @Column
  delayMinutes: number; // Atraso em minutos (0 = imediato)

  @Column(DataType.JSON)
  conditions: object; // Condições para executar este passo

  @Column(DataType.STRING)
  delayType: string; // 'immediate', 'fixed_delay', 'business_hours', 'specific_time'

  @Column(DataType.JSON)
  delayConfig: object; // Configurações específicas do atraso

  @Default(true)
  @Column
  active: boolean;

  @Default(0)
  @Column
  executionCount: number;

  @Default(0)
  @Column
  successCount: number;

  @Default(0)
  @Column
  failureCount: number;

  @BelongsTo(() => EmailSequence)
  sequence: EmailSequence;

  @BelongsTo(() => EmailTemplate)
  template: EmailTemplate;

  @HasMany(() => EmailJob)
  jobs: EmailJob[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default EmailSequenceStep;