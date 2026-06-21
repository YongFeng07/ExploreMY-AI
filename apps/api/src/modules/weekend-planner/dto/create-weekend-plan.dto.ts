import {
  IsString, IsNumber, IsArray, IsOptional, Min, Max, MinLength, MaxLength, IsInt,
} from 'class-validator';

export class CreateWeekendPlanDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  destination!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  destinationLat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  destinationLng!: number;

  @IsString()
  startDate!: string;

  @IsString()
  endDate!: string;

  @IsString()
  planType!: string;

  @IsNumber()
  @Min(1)
  @Max(50000)
  budget!: number;

  @IsOptional()
  @IsString()
  budgetCurrency?: string;

  @IsOptional()
  @IsString()
  transportMode?: string;

  @IsString()
  groupType!: string;

  @IsOptional()
  @IsNumber()
  originLat?: number;

  @IsOptional()
  @IsNumber()
  originLng?: number;

  @IsOptional()
  @IsNumber()
  tripDistance?: number;

  @IsArray()
  @IsString({ each: true })
  travelStyles!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialPreferences?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  groupSize?: number;

  @IsOptional()
  @IsString()
  userId?: string;
}
