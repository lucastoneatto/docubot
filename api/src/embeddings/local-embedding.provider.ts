import { Logger } from '@nestjs/common';
import { config } from '../config';
import type { EmbeddingProvider } from './embedding-provider';

export class LocalEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = config.embeddingDimensions;
  private readonly logger = new Logger(LocalEmbeddingProvider.name);
  private extractor: any = null;
  private loading: Promise<any> | null = null;

  private getExtractor(): Promise<any> {
    if (this.extractor) return Promise.resolve(this.extractor);
    if (!this.loading) {
      this.loading = (async () => {
        const transformers: any = await import('@huggingface/transformers');
        const model = config.embeddingModel;
        try {
          return await transformers.pipeline('feature-extraction', model, {
            dtype: 'q8',
          });
        } catch (error) {
          this.logger.warn(
            `Quantized model unavailable (${error}), falling back to fp32`,
          );
          return await transformers.pipeline('feature-extraction', model);
        }
      })();
    }
    return this.loading;
  }

  private async extract(texts: string[]): Promise<number[][]> {
    const extractor = await this.getExtractor();
    const output = await extractor(texts, { pooling: 'mean', normalize: true });
    return output.tolist();
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    return this.extract(texts.map((text) => `passage: ${text}`));
  }

  async embedQuery(text: string): Promise<number[]> {
    const [vector] = await this.extract([`query: ${text}`]);
    return vector;
  }
}
