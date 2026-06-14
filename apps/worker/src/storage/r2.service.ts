import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { Readable } from 'node:stream';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class R2Service implements OnModuleInit {
  private readonly logger = new Logger(R2Service.name);
  private client!: S3Client;
  private bucket!: string;

  constructor(private readonly config: AppConfigService) {}

  onModuleInit(): void {
    const accountId = this.config.get('R2_ACCOUNT_ID');
    this.bucket = this.config.get('R2_BUCKET_NAME');

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.get('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.config.get('R2_SECRET_ACCESS_KEY'),
      },
    });

    this.logger.log(`R2 client initialized (bucket: ${this.bucket})`);
  }

  async download(key: string): Promise<Buffer> {
    this.logger.log(`R2 download: ${key}`);

    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );

    if (!response.Body) {
      throw new Error(`R2 returned empty body for key: ${key}`);
    }

    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as Readable) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
    }

    const buffer = Buffer.concat(chunks);
    this.logger.log(`R2 download complete: ${key} (${buffer.length} bytes)`);
    return buffer;
  }

  async downloadPdf(key: string): Promise<Buffer> {
    return this.download(key);
  }

  async uploadPage(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ContentLength: body.length,
      }),
    );

    this.logger.debug(`R2 upload: ${key} (${body.length} bytes)`);
  }
}
