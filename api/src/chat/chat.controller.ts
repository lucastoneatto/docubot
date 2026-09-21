import {
  Body,
  Controller,
  ForbiddenException,
  Logger,
  NotFoundException,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { config } from '../config';
import { ChatDto, FeedbackDto } from './chat.dto';
import { ChatService, isNoInfoAnswer } from './chat.service';
import { UsageService } from '../usage/usage.service';
import type { Collection } from '../db/schema';

function dedupeSources<T extends { path: string }>(sources: T[]): T[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    if (seen.has(source.path)) return false;
    seen.add(source.path);
    return true;
  });
}

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chat: ChatService,
    private readonly usage: UsageService,
  ) {}

  private assertOriginAllowed(req: Request, collection: Collection) {
    const origin = req.headers.origin;
    const allowedOrigins = [...collection.allowedOrigins, ...config.dashboardOrigins];
    if (
      !config.corsRelaxed &&
      origin &&
      allowedOrigins.length > 0 &&
      !allowedOrigins.includes(origin)
    ) {
      throw new ForbiddenException('Origin not allowed for this collection');
    }
  }

  @Post()
  @Throttle({ default: { limit: config.chatIpLimit, ttl: 60_000 } })
  async handle(
    @Body() dto: ChatDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const collection = await this.chat.findCollection(dto.collectionId);
    if (!collection) throw new NotFoundException('Collection not found');

    this.assertOriginAllowed(req, collection);

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const send = (payload: unknown) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    let closed = false;
    const controller = new AbortController();
    req.on('close', () => {
      closed = true;
      controller.abort();
    });

    const sessionId = await this.chat.ensureSession(dto.collectionId, dto.sessionId);
    const branding = await this.chat.showsBranding(collection);
    send({ type: 'session', sessionId, branding });

    if (!this.chat.sessionLimiter.check(sessionId)) {
      send({
        type: 'error',
        code: 'rate_limited',
        message: 'Too many messages. Wait a moment and try again.',
      });
      res.end();
      return;
    }

    const monthly = await this.usage.monthlyUsage(dto.collectionId);
    if (
      (collection.monthlyMessageLimit != null &&
        monthly.messages >= collection.monthlyMessageLimit) ||
      (collection.monthlyBudgetUsd != null && monthly.cost >= collection.monthlyBudgetUsd)
    ) {
      send({
        type: 'error',
        code: 'quota_exceeded',
        message: 'The assistant reached its monthly limit. Contact the administrator.',
      });
      res.end();
      return;
    }

    try {
      const retrieved = await this.chat.retrieve(dto.collectionId, dto.message);
      const prompt = this.chat.buildPrompt(collection, dto.message, retrieved);
      let answer = '';
      let usage: { promptTokens: number; completionTokens: number } | undefined;

      for await (const token of this.chat.streamAnswer({
        collection,
        question: dto.message,
        prompt,
        history: dto.history ?? [],
        signal: controller.signal,
        onUsage: (value) => {
          usage = value;
        },
      })) {
        if (closed) break;
        answer += token;
        send({ type: 'token', value: token });
      }

      if (usage) {
        await this.usage.record({
          collectionId: dto.collectionId,
          type: 'chat',
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
        });
      }

      const noInfo = answer.length === 0 || isNoInfoAnswer(answer);
      const sources = noInfo
        ? []
        : dedupeSources(
            retrieved.map(({ filename, path, score }) => ({ filename, path, score })),
          );
      send({ type: 'sources', sources });

      let assistantMessageId: string | undefined;
      if (answer) {
        const saved = await this.chat.saveMessages({
          sessionId,
          question: dto.message,
          answer,
          sources,
          noInfo,
        });
        assistantMessageId = saved.assistantMessageId || undefined;
      }

      if (assistantMessageId) {
        send({ type: 'message', id: assistantMessageId });
      }

      send({ type: 'done' });
    } catch (error) {
      if (!closed) {
        this.logger.error(`Chat failed: ${(error as Error).message}`);
        send({ type: 'error', message: (error as Error).message });
      }
    } finally {
      res.end();
    }
  }

  @Post('feedback')
  @Throttle({ default: { limit: config.chatIpLimit, ttl: 60_000 } })
  async feedback(@Body() dto: FeedbackDto, @Req() req: Request) {
    const collection = await this.chat.findCollection(dto.collectionId);
    if (!collection) throw new NotFoundException('Collection not found');
    this.assertOriginAllowed(req, collection);

    const updated = await this.chat.setFeedback({
      collectionId: dto.collectionId,
      sessionId: dto.sessionId,
      messageId: dto.messageId,
      rating: dto.rating,
    });
    if (!updated) throw new NotFoundException('Message not found');
    return { ok: true };
  }
}
