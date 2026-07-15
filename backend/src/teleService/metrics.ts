export interface MetricsSnapshot {
  totalUploads:           number;
  totalFailures:          number;
  totalRollbacks:         number;
  totalOrphans:           number;
  totalRetries:           number;
  totalDuplicateWarnings: number;
  totalRateLimited:       number;
  avgDurationMs:          number | null;
  avgStreamingMs:         number | null;
  avgDbMs:                number | null;
  avgImageBytes:          number | null;
  startedAt:              string;
}

class UploadMetrics {
  private totalUploads           = 0;
  private totalFailures          = 0;
  private totalRollbacks         = 0;
  private totalOrphans           = 0;
  private totalRetries           = 0;
  private totalDuplicateWarnings = 0;
  private totalRateLimited       = 0;

  private durationSamples:  number[] = [];
  private streamingSamples: number[] = [];
  private dbSamples:        number[] = [];
  private imageSizeSamples: number[] = [];

  readonly startedAt = new Date();

  recordSuccess(params: {
    totalMs?:    number;
    streamingMs?: number;
    dbMs?:       number;
    imageBytes?: number;
  }): void {
    this.totalUploads++;
    if (params.totalMs     != null) this.durationSamples.push(params.totalMs);
    if (params.streamingMs != null) this.streamingSamples.push(params.streamingMs);
    if (params.dbMs        != null) this.dbSamples.push(params.dbMs);
    if (params.imageBytes  != null) this.imageSizeSamples.push(params.imageBytes);
  }

  recordFailure():    void { this.totalFailures++; }
  recordRollback():   void { this.totalRollbacks++; }
  recordOrphan():     void { this.totalOrphans++; }
  recordRetry():      void { this.totalRetries++; }
  recordDuplicate():  void { this.totalDuplicateWarnings++; }
  recordRateLimited(): void { this.totalRateLimited++; }

  private avg(arr: number[]): number | null {
    if (!arr.length) return null;
    return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
  }

  snapshot(): MetricsSnapshot {
    return {
      totalUploads:           this.totalUploads,
      totalFailures:          this.totalFailures,
      totalRollbacks:         this.totalRollbacks,
      totalOrphans:           this.totalOrphans,
      totalRetries:           this.totalRetries,
      totalDuplicateWarnings: this.totalDuplicateWarnings,
      totalRateLimited:       this.totalRateLimited,
      avgDurationMs:          this.avg(this.durationSamples),
      avgStreamingMs:         this.avg(this.streamingSamples),
      avgDbMs:                this.avg(this.dbSamples),
      avgImageBytes:          this.avg(this.imageSizeSamples),
      startedAt:              this.startedAt.toISOString(),
    };
  }
}

// Singleton — in-process metrics, resets on restart
export const uploadMetrics = new UploadMetrics();
