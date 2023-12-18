import http2 from 'node:http2';

export type ILogger = Pick<typeof console, 'debug' | 'info' | 'warn' | 'error'>;

export interface IServerOptions {
  port: number;
}

export interface IServer {
  _server: http2.Http2Server;
  start: () => void;
  stop: () => void;
  onMessage<TPayloadIn = any>(msgKind: string, msgProcessor: IMessageProcessor<TPayloadIn>): void;
}

export interface IStream {
  write<TPayloadOut = any>(msgOut: IMessage<TPayloadOut>): void;
  end(): void;
  respondOK(): void;
  respondError(err: string): void;
}

export interface IMessage<TPayload = any> {
  msgKind:  string;
  msgId:    string; // identifier given by client
  streamId: string; // identifier given by server
  at:       string; // timestamp
  idx:      number;
  done:     boolean; // last message or not
  payload?: TPayload | null;
}

export interface IPayloadAdapter {
  encode(data: any): Buffer | string;
  decode(data: Buffer | string): any;
}

export interface IMessageProxyOptions {
  payloadKind   : 'json' | 'msgpack';
  msgProcessors?: Record<string, IMessageProcessor>;
  logger?       : ILogger;
  payloadAdapter: IPayloadAdapter;
}

export interface IMessageProxy {
  options: IMessageProxyOptions;
  onMessage<TPayloadIn = any>(msgKind: string, msgProcessor: IMessageProcessor<TPayloadIn>): void;
  removeMessageProcessor(msgKind: string): void;
  processMessage(msgIn: IMessage, streamMgr: IStreamManager): Promise<void>;
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

export interface IStreamManagerOptions {
  stream        : http2.ServerHttp2Stream;
  headers       : http2.IncomingHttpHeaders;
  flags         : number;
  streamId?     : string;
  payloadAdapter: IPayloadAdapter;
  logger?       : ILogger;
  msgProxy      : IMessageProxy;
}

export interface IStreamManager extends IStream {
  options: IStreamManagerOptions;
}
