export const MAX_LOG_FILE_BYTES = 64_000;

export class LogFileError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = 'LogFileError';
  }
}

export interface LocalKubernetesLog {
  fileName: string;
  content: string;
}

export async function readLocalKubernetesLog(file: File): Promise<LocalKubernetesLog> {
  if (!file.name.toLowerCase().endsWith('.log')) {
    throw new LogFileError('Only .log files can be analyzed.');
  }
  if (file.size === 0) {
    throw new LogFileError('The selected log file is empty.');
  }
  if (file.size > MAX_LOG_FILE_BYTES) {
    throw new LogFileError(`The log file exceeds the ${MAX_LOG_FILE_BYTES}-byte limit.`, 413);
  }

  const originalName = file.name.split(/[\\/]/).pop() ?? 'kubernetes.log';
  const fileName = originalName
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 100);
  if (!fileName.toLowerCase().endsWith('.log')) {
    throw new LogFileError('The filename must end with .log.');
  }

  return {
    fileName,
    content: await file.text(),
  };
}
