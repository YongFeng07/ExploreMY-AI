import { IsString, IsArray, IsOptional } from 'class-validator';

export class OptimizePlanDto {
  @IsString()
  strategy!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  factors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lockedStopIds?: string[];
}
