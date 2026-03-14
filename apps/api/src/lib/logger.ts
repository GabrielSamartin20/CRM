export interface Logger {
  debug(payload: Record<string, unknown>, message: string): void;
  info(payload: Record<string, unknown>, message: string): void;
  error(payload: Record<string, unknown>, message: string): void;
}

const write = (level: 'debug' | 'info' | 'error', payload: Record<string, unknown>, message: string): void => {
  const line = JSON.stringify({ level, message, ...payload, timestamp: new Date().toISOString() });
  if (level === 'error') {
    process.stderr.write(`${line}\n`);
    return;
  }
  process.stdout.write(`${line}\n`);
};

export const logger: Logger = {
  debug(payload, message) {
    write('debug', payload, message);
  },
  info(payload, message) {
    write('info', payload, message);
  },
  error(payload, message) {
    write('error', payload, message);
  }
};
