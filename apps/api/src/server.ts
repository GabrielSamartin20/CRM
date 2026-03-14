import { buildApp } from './app';
import { env } from './lib/env';

const app = buildApp();

app
  .listen({ host: '0.0.0.0', port: env.PORT })
  .then(() => {
    process.stdout.write(`API listening on ${env.PORT}\n`);
  })
  .catch((error) => {
    process.stderr.write(`${String(error)}\n`);
    process.exit(1);
  });
