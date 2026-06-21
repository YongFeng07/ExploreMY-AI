/**
 * TLS-bypassing fetch for environments with SSL inspection (corporate proxies, sandboxes).
 * Node.js native fetch() uses undici which ignores NODE_TLS_REJECT_UNAUTHORIZED.
 * This wrapper uses the https module which respects the env var.
 */
import * as https from 'https';
import * as http from 'http';

export async function tlsFetch(url: string, options: {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
  timeout?: number;
} = {}): Promise<{ ok: boolean; status: number; json: () => Promise<any>; text: () => Promise<string> }> {
  const urlObj = new URL(url);
  const isHttps = urlObj.protocol === 'https:';
  const transport = isHttps ? https : http;

  const reqOptions: https.RequestOptions = {
    hostname: urlObj.hostname,
    port: urlObj.port || (isHttps ? 443 : 80),
    path: urlObj.pathname + urlObj.search,
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      'Content-Length': Buffer.byteLength(options.body || ''),
    },
    rejectUnauthorized: false, // TLS bypass
    timeout: options.timeout || 15000,
  };

  const controller = new AbortController();
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (err: Error | null, result?: any) => {
      if (settled) return;
      settled = true;
      if (err) reject(err); else resolve(result);
    };

    const req = transport.request(reqOptions, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8');
        done(null, {
          ok: (res.statusCode || 500) >= 200 && (res.statusCode || 500) < 300,
          status: res.statusCode || 500,
          json: async () => JSON.parse(body),
          text: async () => body,
        });
      });
      res.on('error', (err) => done(err));
    });

    req.on('error', (err) => done(err));
    req.on('timeout', () => { req.destroy(); done(new Error('Request timeout')); });
    controller.signal.addEventListener('abort', () => { req.destroy(); done(new Error('Aborted')); });

    if (options.body) req.write(options.body);
    req.end();
  });
}
