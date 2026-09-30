import http from 'node:http';

const listenHost = '127.0.0.1';
const listenPort = 8001;
const upstreamUrl = 'http://127.0.0.1:8000/api/webhooks/xendit';
const maxBodyBytes = 1024 * 1024;

const server = http.createServer((request, response) => {
  if (request.method !== 'POST' || request.url !== '/api/webhooks/xendit') {
    response.writeHead(404, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ message: 'Not found' }));
    return;
  }

  const chunks = [];
  let receivedBytes = 0;

  request.on('data', (chunk) => {
    receivedBytes += chunk.length;
    if (receivedBytes > maxBodyBytes) {
      response.writeHead(413, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ message: 'Payload too large' }));
      request.destroy();
      return;
    }
    chunks.push(chunk);
  });

  request.on('end', async () => {
    if (response.writableEnded) return;

    try {
      const upstreamResponse = await fetch(upstreamUrl, {
        method: 'POST',
        headers: {
          'content-type': request.headers['content-type'] || 'application/json',
          'x-callback-token': request.headers['x-callback-token'] || '',
          'x-xendit-callback-token': request.headers['x-xendit-callback-token'] || '',
          'webhook-id': request.headers['webhook-id'] || '',
        },
        body: Buffer.concat(chunks),
      });

      const body = Buffer.from(await upstreamResponse.arrayBuffer());
      response.writeHead(upstreamResponse.status, {
        'content-type': upstreamResponse.headers.get('content-type') || 'application/json',
      });
      response.end(body);
    } catch {
      response.writeHead(502, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ message: 'Webhook upstream unavailable' }));
    }
  });
});

server.listen(listenPort, listenHost, () => {
  process.stdout.write(`Xendit webhook proxy listening on http://${listenHost}:${listenPort}\n`);
});
