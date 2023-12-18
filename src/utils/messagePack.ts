import { unpack, pack } from 'msgpackr';

export function messagePackEncode(data: any): Buffer {
  return pack(data);
}

export function messagePackDecode<T = any>(data: Buffer): T {
  return unpack(data) as T; // pretending to be T
}
