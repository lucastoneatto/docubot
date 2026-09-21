import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class HistoryMessageDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  @MaxLength(4000)
  content!: string;
}

export class ChatDto {
  @IsUUID()
  collectionId!: string;

  @IsString()
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoryMessageDto)
  history?: HistoryMessageDto[];
}

export class FeedbackDto {
  @IsUUID()
  collectionId!: string;

  @IsUUID()
  sessionId!: string;

  @IsUUID()
  messageId!: string;

  @IsIn(['up', 'down'])
  rating!: 'up' | 'down';
}
