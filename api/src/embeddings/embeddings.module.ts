import { Module } from '@nestjs/common';
import { config } from '../config';
import { EMBEDDING_PROVIDER } from './embedding-provider';
import { EmbeddingsService } from './embeddings.service';
import { LocalEmbeddingProvider } from './local-embedding.provider';
import { OpenAIEmbeddingProvider } from './openai-embedding.provider';

@Module({
  providers: [
    {
      provide: EMBEDDING_PROVIDER,
      useFactory: () =>
        config.embeddingProvider === 'openai'
          ? new OpenAIEmbeddingProvider()
          : new LocalEmbeddingProvider(),
    },
    EmbeddingsService,
  ],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
