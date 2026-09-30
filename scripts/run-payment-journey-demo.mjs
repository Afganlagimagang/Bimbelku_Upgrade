import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const backendDirectory = fileURLToPath(new URL('../bimbelku-backend/', import.meta.url));
const result = spawnSync('php', ['artisan', 'test', '--filter=PaymentJourneyDemoTest'], {
  cwd: backendDirectory,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  process.stderr.write(`Gagal menjalankan PHP demo: ${result.error.message}\n`);
}
process.exit(result.status ?? 1);
