import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueName, QUEUE_RETRY_CONFIG } from '@scientia/shared';
import type { PageExtractJobData } from '@scientia/shared';

@Injectable()
export class PageExtractProducerService {
  constructor(
    @InjectQueue(QueueName.PageExtract) private readonly queue: Queue<PageExtractJobData>,
  ) {}

  async enqueue(data: PageExtractJobData): Promise<void> {
    const jobId = `page-extract:${data.pdfPageId}`;

    await this.queue.add(QueueName.PageExtract, data, {
      jobId,
      attempts: QUEUE_RETRY_CONFIG.attempts,
      backoff: QUEUE_RETRY_CONFIG.backoff,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    });
  }
}
