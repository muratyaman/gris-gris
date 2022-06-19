import { randomUUID } from 'node:crypto';
import http2 from 'node:http2';
import { HEADER_KEY_CID, HEADER_KEY_KIND } from './constants';
import { IClientStreamOnComplete } from './types';

export function makeClientStream(
  session: http2.ClientHttp2Session,
  kind: string,
  onComplete: IClientStreamOnComplete,
): http2.ClientHttp2Stream {

  const input = {
    [http2.constants.HTTP2_HEADER_METHOD]: 'GET',
    [http2.constants.HTTP2_HEADER_PATH]  : '/',
    [HEADER_KEY_CID]                     : randomUUID(),
    [HEADER_KEY_KIND]                    : kind,
  };
  console.info('makeClientStream new request', input);
  const stream = session.request(input);

  // stream.setEncoding('utf8');

  stream.on('error', (err)     => console.error(stream.id, 'clientStream error:', err));
  stream.on('close', (...args) => console.warn(stream.id, 'clientStream close:', args));

  stream.on('response', (...args) => {
    console.log(stream.id, 'clientStream on response', args);
  });

  let data = '';

  stream.on('data', (chunk) => {
    console.log('');
    console.log(stream.id, 'clientStream on data');
    console.log(data);
    console.log('');
    data += chunk;
  });

  stream.on('end', () => {
    console.log(stream.id, 'clientStream on end', { data });
    onComplete(data, stream);
  });

  return stream;
}
