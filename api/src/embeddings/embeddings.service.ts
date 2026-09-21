import { Inject, Injectable } from '@nestjs/common';
import { EMBEDDING_PROVIDER, type EmbeddingProvider } from './embedding-provider';

@Injectable()
export class EmbeddingsService {
  constructor(
    @Inject(EMBEDDING_PROVIDER) private readonly provider: EmbeddingProvider,
  ) {}

  get dimensions(): number {
    return this.provider.dimensions;
  }

  embedDocuments(texts: string[]): Promise<number[][]> {
    return this.provider.embedDocuments(texts);
  }

  embedQuery(text: string): Promise<number[]> {
    return this.provider.embedQuery(text);
  }
}
