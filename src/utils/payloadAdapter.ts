import { IPayloadAdapter } from '../types';
import { jsonParse, jsonStringify } from './json';
import { messagePackDecode, messagePackEncode } from './messagePack';

export const jsonPayloadAdapter: IPayloadAdapter = {
  encode: jsonStringify,
  decode: jsonParse,
};

export const msgPackPayloadAdapter: IPayloadAdapter = {
  encode: messagePackEncode,
  decode: messagePackDecode,
};

export function makePayloadAdapter(kind: 'json' | 'msgpack'): IPayloadAdapter {
  switch (kind) {
    case 'json': return jsonPayloadAdapter;
    case 'msgpack': return msgPackPayloadAdapter;
    default: throw new Error(`unknown payload kind: ${kind}`);
  }
}
