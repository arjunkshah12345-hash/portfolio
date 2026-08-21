import leaderboard from '../api/bid/leaderboard.js';

function runHandler(handler, reqInit = {}) {
  return new Promise((resolve) => {
    const chunks = [];
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      writeHead(code, headers) { this.statusCode = code; Object.assign(this.headers, headers || {}); return this; },
      end(str) { if (str) chunks.push(Buffer.isBuffer(str) ? str : Buffer.from(String(str))); resolve({ statusCode: this.statusCode, headers: this.headers, body: Buffer.concat(chunks).toString('utf8') }); }
    };
    const req = Object.assign({ method: 'GET', headers: {} }, reqInit);
    handler(req, res);
  });
}

const out = await runHandler(leaderboard, { method: 'GET' });
const data = JSON.parse(out.body);
if (!Array.isArray(data.entries) || !data.entries.length) {
  throw new Error('leaderboard returned no entries');
}
console.log('leaderboard ok:', { entries: data.entries.length, storage: data.storage });
