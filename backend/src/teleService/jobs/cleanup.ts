import { prisma } from '../../lib/prisma';
import { CloudinaryService } from '../services/cloudinary.service';
import { logger } from '../../shared/logger';
import { uploadMetrics } from '../metrics';

export interface CleanupResult {
  found:    number;
  resolved: number;
  failed:   number;
}

const cloudinary = new CloudinaryService();

/**
 * Finds all ORPHANED UploadJobs, retries Cloudinary deletion, and marks
 * each job as FAILED once the cloud asset is confirmed gone.
 * Called by the Telegram /cleanup command.
 */
export async function runCleanup(): Promise<CleanupResult> {
  const orphans = await prisma.uploadJob.findMany({
    where:  { status: 'ORPHANED' },
    select: { id: true, cloudinaryPublicId: true },
  });

  let resolved = 0;
  let failed   = 0;

  for (const job of orphans) {
    if (!job.cloudinaryPublicId) {
      // No asset to delete — mark as resolved immediately
      await prisma.uploadJob.update({
        where: { id: job.id },
        data:  { status: 'FAILED', errorMessage: 'Resolved by cleanup: no Cloudinary asset' },
      });
      resolved++;
      logger.info('CLEANUP_RESOLVED_NO_ASSET', { uploadJobId: job.id });
      continue;
    }

    try {
      await cloudinary.delete(job.cloudinaryPublicId);
      await prisma.uploadJob.update({
        where: { id: job.id },
        data:  {
          status:       'FAILED',
          errorMessage: 'Resolved by cleanup: Cloudinary asset deleted',
          resolvedAt:   new Date(),
        },
      });
      resolved++;
      logger.info('CLEANUP_RESOLVED', { uploadJobId: job.id, publicId: job.cloudinaryPublicId });
    } catch (err) {
      failed++;
      logger.error('CLEANUP_RETRY_FAILED', {
        uploadJobId: job.id,
        publicId:    job.cloudinaryPublicId,
        error:       err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (failed > 0) uploadMetrics.recordOrphan(); // still-live orphans after cleanup
  logger.info('CLEANUP_COMPLETE', { found: orphans.length, resolved, failed });
  return { found: orphans.length, resolved, failed };
}
