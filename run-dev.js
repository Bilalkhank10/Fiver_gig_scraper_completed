import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const nodeCmd = isWin ? 'node.exe' : 'node';

console.log('🚀 Starting GigRadar — Fiverr Intelligence Suite...');

// Start Server
const server = spawn(nodeCmd, ['server/server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// Start Client
const client = spawn(npmCmd, ['--prefix', 'client', 'run', 'dev'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

const cleanup = () => {
  console.log('\n🛑 Shutting down GigRadar...');
  server.kill();
  client.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
