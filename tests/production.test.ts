import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { once } from 'node:events';
import { test } from 'node:test';

test('built standalone server serves frontend assets and API', {
  skip: !existsSync('dist/server.cjs'),
  timeout: 15000,
}, async () => {
  const child = spawn(process.execPath, ['dist/server.cjs'], {
    env: { ...process.env, NODE_ENV: 'production', PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    const port = await new Promise<string>((resolve, reject) => {
      let output = '';
      const timer = setTimeout(() => reject(new Error(`Startup timed out: ${output}`)), 10000);
      child.stdout.on('data', (data) => {
        output += data;
        const match = output.match(/http:\/\/0\.0\.0\.0:(\d+)/);
        if (match) { clearTimeout(timer); resolve(match[1]); }
      });
      child.once('error', (error) => { clearTimeout(timer); reject(error); });
      child.once('exit', (code) => { clearTimeout(timer); reject(new Error(`Exited: ${code}`)); });
      child.stderr.on('data', (data) => { output += data; });
    });
    const base = `http://127.0.0.1:${port}`;
    const home = await fetch(base);
    assert.equal(home.status, 200);
    const html = await home.text();
    const script = html.match(/src="([^\"]+\.js)"/);
    assert.ok(script, 'Built HTML must reference a JavaScript asset');
    assert.equal((await fetch(`${base}${script[1]}`)).status, 200);
    assert.equal((await fetch(`${base}/api/health`)).status, 200);
    assert.equal((await fetch(`${base}/api/missing`)).status, 404);
  } finally {
    if (child.exitCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
  }
});
