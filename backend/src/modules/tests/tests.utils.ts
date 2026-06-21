export function resolveTestStatus(test: {
  status: string;
  scheduledAt: Date | null;
  durationMinutes: number;
}): string {
  if (test.status === 'SCHEDULED' && test.scheduledAt) {
    const endTime = test.scheduledAt.getTime() + test.durationMinutes * 60 * 1000;
    if (Date.now() >= endTime) {
      return 'COMPLETED';
    }
  }
  return test.status;
}
