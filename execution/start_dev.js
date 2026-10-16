/**
 * Deterministic full-stack startup script
 * Layer 3: Execution
 */
const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const appDir = path.join(rootDir, 'my-app');

console.log('🚀 Starting SWAG INC. VAMP 4 Full Stack...');

const serverProcess = spawn('node', ['index.js'], {
  cwd: serverDir,
  stdio: 'inherit',
  shell: true
});

const clientProcess = spawn('npm', ['run', 'dev'], {
  cwd: appDir,
  stdio: 'inherit',
  shell: true
});

const cleanup = () => {
  console.log('\n🛑 Shutting down processes...');
  try { serverProcess.kill(); } catch {}
  try { clientProcess.kill(); } catch {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
