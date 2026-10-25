import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import handler from '../api/index.ts';
import type { Request, Response } from 'express';

test('API handler works without Vercel or production environment flags', async () => {
  const server = createServer((req, res) => {
    handler(req as Request, res as Response).catch((error) => res.destroy(error));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  try {
    for (let i = 0; i < 2; i++) {
      const response = await fetch(`${base}/api/health?probe=${i}`);
      assert.equal(response.status, 200);
      assert.equal((await response.json()).status, 'ok');
    }
    const missing = await fetch(`${base}/api/does-not-exist`);
    assert.equal(missing.status, 404);
    assert.match(missing.headers.get('content-type') || '', /application\/json/);
    const invalid = await fetch(`${base}/api/gemini/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json()).error, true);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
