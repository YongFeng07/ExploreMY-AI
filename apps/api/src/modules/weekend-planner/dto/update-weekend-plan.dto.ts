import { IsString, IsBoolean, IsArray, IsOptional, IsNumber } from 'class-validator';

class StopUpdateDto {
  @IsString()
  id!: string;

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @IsOptional()
  @IsString()
  userNote?: string;
}

class DayUpdateDto {
  @IsNumber()
  dayNumber!: number;

  @IsOptional()
  @IsArray()
  stops?: StopUpdateDto[];
}

class BudgetItemUpdateDto {
  @IsString()
  category!: string;

  @IsOptional()
  @IsNumber()
  actualCost?: number;
}

export class UpdateWeekendPlanDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsArray()
  days?: DayUpdateDto[];

  @IsOptional()
  @IsArray()
  budgetItems?: BudgetItemUpdateDto[];
}
