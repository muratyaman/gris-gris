import { randomUUID } from 'crypto';
import { IncomingHttpHeaders } from 'http2';
import { HEADER_KEY_CID, HEADER_KEY_KIND, HTTP2_HEADER_METHOD, HTTP2_HEADER_PATH } from '../constants';

export function extractHeader(headers: IncomingHttpHeaders, key: string, defVal = ''): string {
  if (key in headers && (typeof headers[key] === 'string')) {
    return String(headers[key]);
  }
  return defVal;
}

export function extractMsgCid(headers: IncomingHttpHeaders): string {
  return extractHeader(headers, HEADER_KEY_CID, randomUUID());
}

export function extractMsgKind(headers: IncomingHttpHeaders): string {
  const method = extractHeader(headers, HTTP2_HEADER_METHOD);
  const path   = extractHeader(headers, HTTP2_HEADER_PATH);
  return extractHeader(headers, HEADER_KEY_KIND, `${method} ${path}`);
}
