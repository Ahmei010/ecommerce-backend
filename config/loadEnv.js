import { appendFileSync, chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));

if (!existsSync(envPath)) {
  writeFileSync(envPath, '', { flag: 'wx', mode: 0o600 });
}

const result = dotenv.config({ path: envPath });

if (result.error) {
  throw new Error(`Could not load backend environment file: ${result.error.message}`);
}

if (process.platform !== 'win32') {
  chmodSync(envPath, 0o600);
}

if (!process.env.JWT_SECRET?.trim()) {
  const secret = randomBytes(64).toString('hex');
  const contents = readFileSync(envPath, 'utf8');
  const separator = contents.length > 0 && !contents.endsWith('\n') ? '\n' : '';

  appendFileSync(envPath, `${separator}JWT_SECRET=${secret}\n`, { mode: 0o600 });
  process.env.JWT_SECRET = secret;
}
