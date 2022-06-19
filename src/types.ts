import http2 from 'node:http2';

export type ILogger = typeof console;

export interface IServer {
  _server: http2.Http2Server;
  start: () => void;
  onMessage<TPayloadIn = any>(kind: string, mp: IMessageProcessor<TPayloadIn>): void;
}

export interface IStream {
  _stream: http2.ServerHttp2Stream;
  write<TPayloadOut = any>(msgOut: IMessage<TPayloadOut>): void;
  end(): void;
}

export interface IServerOptions {
  port: number;
}

export interface IMessage<TPayload = any> {
  cid:      string; // identifier given by client
  sid:      string; // identifier given by server
  at:       string; // timestamp
  kind:     string;
  idx:      number;
  done:     boolean; // last message or not
  payload?: TPayload | null;
}

export interface IMessageProcessor<TPayloadIn = any> {
  (m: IMessage<TPayloadIn>, stream: IStream): Promise<void>;
}

export interface IMessageGenerator<TPayloadIn = any, TPayloadOut = any> {
  generate(m: IMessage<TPayloadIn>): Promise<IGenerator<IMessage<TPayloadOut>>>;
}

export interface IGenerator<T = any, TReturn = any, TNext = unknown> extends Iterator<T, TReturn, TNext> {
  // NOTE: 'next' is defined using a tuple to ensure we report the correct assignability errors in all places.
  next(...args: [] | [TNext]): IteratorResult<T, TReturn>;
  return(value: TReturn): IteratorResult<T, TReturn>;
  throw(e: any): IteratorResult<T, TReturn>;
  [Symbol.iterator](): IGenerator<T, TReturn, TNext>;
}
