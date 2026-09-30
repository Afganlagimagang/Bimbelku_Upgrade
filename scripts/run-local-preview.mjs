import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';
import net from 'node:net';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backendRoot = path.join(root, 'bimbelku-backend');
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');

const children = new Set();
let stopping = false;

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    socket.setTimeout(500);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(false));
  });
}

function start(label, command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    windowsHide: true,
  });

  children.add(child);
  child.once('error', (error) => {
    console.error(`[${label}] gagal dijalankan: ${error.message}`);
    shutdown(1);
  });
  child.once('exit', (code, signal) => {
    children.delete(child);
    if (!stopping) {
      const reason = signal ? `signal ${signal}` : `kode ${code ?? 0}`;
      console.error(`[${label}] berhenti (${reason}).`);
      shutdown(code ?? 1);
    }
  });
}

function shutdown(exitCode = 0) {
  if (stopping) return;
  stopping = true;

  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }

  setTimeout(() => process.exit(exitCode), 250).unref();
}

console.log('Menjalankan Bimbelku lokal:');
console.log('- Frontend: http://127.0.0.1:8080');
console.log('- Backend : http://127.0.0.1:8000');
console.log('Tekan Ctrl+C untuk menghentikan proses yang dijalankan perintah ini.\n');

if (await isPortOpen(8000)) {
  console.log('[backend] port 8000 sudah aktif; memakai proses yang ada.');
} else {
  start('backend', 'php', ['artisan', 'serve', '--host=127.0.0.1', '--port=8000'], backendRoot);
}

if (await isPortOpen(8080)) {
  console.log('[frontend] port 8080 sudah aktif; tidak menjalankan proses kedua.');
} else {
  start('frontend', process.execPath, [viteBin, 'preview', '--host=127.0.0.1', '--port=8080'], root);
}

process.once('SIGINT', () => shutdown(0));
process.once('SIGTERM', () => shutdown(0));
