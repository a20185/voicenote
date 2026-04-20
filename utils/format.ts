import i18n from 'i18next';

// Format duration from milliseconds to MM:SS or HH:MM:SS
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Format file size to human readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

// Format date to relative time
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return i18n.t('dates:justNow');
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return i18n.t('dates:minutesAgo', { count: diffInMinutes });
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return i18n.t('dates:hoursAgo', { count: diffInHours });
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return i18n.t('dates:daysAgo', { count: diffInDays });
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return i18n.t('dates:weeksAgo', { count: diffInWeeks });
  }

  // Format as date for older items
  return then.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: then.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

// Format date to display format
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format time to display format
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get Chinese date group label for note grouping
 */
export function getChineseDateGroup(date: Date | string | number): string {
  const now = new Date();
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const noteDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - noteDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return i18n.t('dates:today');
  if (diffDays === 1) return i18n.t('dates:yesterday');
  if (diffDays === 2) return i18n.t('dates:dayBeforeYesterday');

  // Same week (Monday-based)
  const dayOfWeek = now.getDay() || 7;
  if (diffDays < dayOfWeek) return i18n.t('dates:thisWeek');

  if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) return i18n.t('dates:thisMonth');

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  if (d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear()) return i18n.t('dates:lastMonth');

  const quarter = Math.floor(now.getMonth() / 3);
  const noteQuarter = Math.floor(d.getMonth() / 3);
  if (noteQuarter === quarter && d.getFullYear() === now.getFullYear()) return i18n.t('dates:thisQuarter');

  if (d.getFullYear() === now.getFullYear()) return i18n.t('dates:thisYear');
  if (d.getFullYear() === now.getFullYear() - 1) return i18n.t('dates:lastYear');

  return i18n.t('dates:overAYear');
}

/**
 * Format date to HH:mm (24-hour) for note time display
 */
export function formatNoteTime(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
