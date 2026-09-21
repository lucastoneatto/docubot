import { IsIn, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdatePlanDto {
  @IsIn(['free', 'paid'])
  plan!: 'free' | 'paid';
}

export class UpdateQuotaDto {
  /** null = no limit. */
  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyMessageLimit?: number | null;

  /** null = no spending cap. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyBudgetUsd?: number | null;
}
