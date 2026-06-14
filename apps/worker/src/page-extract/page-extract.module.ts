import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from '@scientia/shared';
import { StorageModule } from '../storage/storage.module';
import { PageExtractProcessor } from './page-extract.processor';
import { PageExtractProducerService } from './page-extract-producer.service';
import { PromptBuilderService } from './prompt-builder.service';
import { GeminiClientService } from './gemini-client.service';
import { ExtractionValidatorService } from './extraction-validator.service';
import { ExtractionPersistenceService } from './extraction-persistence.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: QueueName.PageExtract }),
    StorageModule,
  ],
  providers: [
    PageExtractProcessor,
    PageExtractProducerService,
    PromptBuilderService,
    GeminiClientService,
    ExtractionValidatorService,
    ExtractionPersistenceService,
  ],
  exports: [PageExtractProducerService],
})
export class PageExtractModule {}
