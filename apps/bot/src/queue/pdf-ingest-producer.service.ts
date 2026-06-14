import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueName, QUEUE_RETRY_CONFIG } from '@scientia/shared';
import type { PdfIngestJobData } from '@scientia/shared';

@Injectable()
export class PdfIngestProducerService {
  private readonly logger = new Logger(PdfIngestProducerService.name);

  constructor(
    @InjectQueue(QueueName.PdfIngest) private readonly queue: Queue<PdfIngestJobData>,
  ) {}

  async enqueue(data: PdfIngestJobData): Promise<void> {
    // jobId is deterministic so a duplicate enqueue (e.g. after crash) is a no-op
    const job = await this.queue.add('ingest', data, {
      ...QUEUE_RETRY_CONFIG,
      jobId: `pdf-ingest:${data.pdfId}`,
    });

    this.logger.log(`Enqueued job ${job.id} on ${QueueName.PdfIngest} for pdf ${data.pdfId}`);
  }
}
