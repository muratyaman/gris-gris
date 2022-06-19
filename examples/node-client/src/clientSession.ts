import http2 from 'node:http2';
import fs from 'node:fs';
import { makeConfig } from './config';
import { resolve } from 'node:path';

export function makeClientSession(
  onConnect: (session: http2.ClientHttp2Session) => void,
) {
  const conf = makeConfig(process.env);

  const session = http2.connect(conf.http2.host, {
    ca: fs.readFileSync(resolve(__dirname, '..', '..', 'localhost-cert.pem')),
  });

  session.on('error',   (err)     => console.error('clientSession error:', err));
  session.on('close',   (...args) => console.warn('clientSession close:', args));

  session.on('connect', (...args) => {
    console.info('clientSession connect:', args);
    session.ping(Buffer.from('pingping'), (err, duration, payloadBuffer) => {
      console.log('ping result', { err, duration, payloadBuffer });
      console.log('ping result payload', payloadBuffer.toString('utf-8'));
    });
    onConnect(args[0]);
  });

  session.on('stream', (...args) => console.info('clientSession stream:', args));

  return session;
}
