import dayjs from 'dayjs';

/**
 * Returns true when the given event has already finished.
 */
export function hasEventEnded(start?: string, end?: string): boolean {
  const now = dayjs();

  if (end) {
    const endDate = dayjs(end);
    if (endDate.isValid()) {
      return endDate.isBefore(now);
    }
  }

  if (start) {
    const startDate = dayjs(start);
    if (startDate.isValid()) {
      return startDate.isBefore(now);
    }
  }

  return false;
}
