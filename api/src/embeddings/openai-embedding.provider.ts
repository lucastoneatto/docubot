import { InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { config } from '../config';
import type { EmbeddingProvider } from './embedding-provider';

const BATCH_SIZE = 64;

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = config.embeddingDimensions;
  private readonly client = new OpenAI({ apiKey: config.openaiApiKey });

  private async embed(texts: string[]): Promise<number[][]> {
    const vectors: number[][] = [];
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      try {
        const response = await this.client.embeddings.create({
          model: config.embeddingModelType,
          input: batch,
          dimensions: this.dimensions,
        });
        vectors.push(...response.data.map((item) => item.embedding));
      } catch (error) {
        throw new InternalServerErrorException(
          `Embeddings failed: ${(error as Error).message}`,
        );
      }
    }
    return vectors;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    return this.embed(texts);
  }

  async embedQuery(text: string): Promise<number[]> {
    const [vector] = await this.embed([text]);
    return vector;
  }
}
