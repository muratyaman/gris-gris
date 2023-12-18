import { randomUUID } from 'node:crypto';
import http2 from 'node:http2';
import { ILogger, IMessageProcessor, IPayloadAdapter, IServer, IServerOptions, IStreamManager } from './types';
import { makePayloadAdapter } from './utils/payloadAdapter';
import { JsonStreamManager, MsgPackStreamManager } from './streamManagers';
import { ts } from './utils';
import { MessageProxy } from './MessageProxy';

export interface GrisGrisOptions {
  serverOptions       : IServerOptions;
  secureServerOptions : http2.SecureServerOptions;
  logger             ?: ILogger;
  payloadKind        ?: 'json' | 'msgpack';
  msgProxy            : MessageProxy;
}

export class GrisGris implements IServer {

  public readonly _server: http2.Http2SecureServer;

  protected streams: Record<string, IStreamManager> = {};

  protected payloadAdapter: IPayloadAdapter;

  protected logger: ILogger;

  constructor(protected options: GrisGrisOptions) {
    const {
      secureServerOptions,
      logger = console,
      payloadKind = 'json',
    } = options;
    this.logger = logger;
    this.payloadAdapter = makePayloadAdapter(payloadKind);

    // prepare server; do NOT use default HTTP/1 handler!
    this._server = http2.createSecureServer(secureServerOptions);

    // attach error handler
    this._server.on('error', this.onServerError);

    this._server.on('connection', this.onConnection);
    this._server.on('session', this.onSession);
    this._server.on('stream', this.onStream);
  }

  onConnection = (socket: any) => {
    this.logger.info('server on connection', socket);
  }

  onServerError = (err: unknown) => {
    this.logger.error('server on error:', err);
  }

  onSession = (session: http2.ServerHttp2Session) => {
    this.logger.info('server on session', session);
  }

  protected registerStream = (streamId: string, stream: IStreamManager) => {
    this.streams[streamId] = stream;
  }

  unregisterStream = (streamId: string) => {
    delete this.streams[streamId];
  }

  onMessage<TPayloadIn = any>(msgKind: string, msgProcessor: IMessageProcessor<TPayloadIn>): void {
    this.options.msgProxy.onMessage(msgKind, msgProcessor);
  }

  onStream = (stream: http2.ServerHttp2Stream, headers: http2.IncomingHttpHeaders, flags: number) => {
    const at = ts();
    const { logger } = this;
    const streamId = stream.id ? String(stream.id) : randomUUID();
    logger.info('server on stream', { streamId, at, stream, headers, flags });

    const { payloadAdapter } = this;
    const { msgProxy } = this.options;

    const streamManager = this.options.payloadKind === 'json'
      ? new JsonStreamManager({ stream, headers, flags, streamId, payloadAdapter, logger, msgProxy })
      : new MsgPackStreamManager({ stream, headers, flags, streamId, payloadAdapter, logger, msgProxy });

    this.registerStream(streamId, streamManager);
  }

  start = () => {
    const { logger } = this;
    logger.info('starting server...');

    this._server.listen(this.options.serverOptions.port, () => {
      logger.info('starting server... done!');
    });
  }

  stop = () => {
    const { logger } = this;
    logger.info('stopping server...');

    this._server.close(() => {
      logger.info('stopping server... done!');
    });
  }
}
