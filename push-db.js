const { spawn } = require('child_process');

const child = spawn('npm', ['run', 'db:push'], {
  stdio: ['pipe', 'inherit', 'inherit']
});

// Automatically answer the prompt
setTimeout(() => {
  child.stdin.write('\n');
  child.stdin.end();
}, 3000);

child.on('close', (code) => {
  process.exit(code);
});
