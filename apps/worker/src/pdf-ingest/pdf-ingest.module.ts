import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from '@scientia/shared';
import { StorageModule } from '../storage/storage.module';
import { PageExtractModule } from '../page-extract/page-extract.module';
import { PdfIngestProcessor } from './pdf-ingest.processor';
import { PdfConverterService } from './pdf-converter.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: QueueName.PdfIngest }),
    StorageModule,
    PageExtractModule,
  ],
  providers: [PdfIngestProcessor, PdfConverterService],
})
export class PdfIngestModule {}
