import { randomUUID } from 'node:crypto';
import http2 from 'node:http2';
import { HEADER_VAL_APP_JSON, HTTP2_HEADER_CONTENT_TYPE, HTTP2_HEADER_METHOD, HTTP2_HEADER_PATH, HTTP2_JSON_ERROR, HTTP2_JSON_OK } from './constants';
import { ILogger, IMessage, IMessageProcessor, IServer, IServerOptions } from './types';
import { extractHeader, extractMsgCid, extractMsgKind, jsonStringify, ts } from './utils';

export class GrisGris implements IServer {

  public readonly _server: http2.Http2SecureServer;

  protected streams: Record<string, http2.ServerHttp2Stream> = {};

  protected msgProcessors: Record<string, IMessageProcessor> = {};

  constructor(
    protected readonly options: IServerOptions,
    protected readonly ssOptions: http2.SecureServerOptions,
    protected readonly logger: ILogger,
  ) {
    // prepare server; do NOT use default HTTP/1 handler!
    this._server = http2.createSecureServer(ssOptions);

    // attach error handler
    this._server.on('error', this.onServerError);

    this._server.on('session', this.onSession);
    this._server.on('stream', this.onStream);
  }

  onServerError = (err: unknown) => {
    this.logger.error('server on error:', err);
  }

  onSession = (session: http2.ServerHttp2Session) => {
    this.logger.info('server on session', session);
  }

  registerStream = (sid: string, stream: http2.ServerHttp2Stream) => {
    this.streams[sid] = stream;
  }

  unregisterStream = (sid: string) => {
    delete this.streams[sid];
  }

  onStream = (stream: http2.ServerHttp2Stream, headers: http2.IncomingHttpHeaders, flags: number) => {
    const at = ts();
    const { logger } = this;
    const sid = randomUUID();
    this.registerStream(sid, stream); // * * *

    const method = extractHeader(headers, HTTP2_HEADER_METHOD);
    const path   = extractHeader(headers, HTTP2_HEADER_PATH);

    const cid  = extractMsgCid(headers);
    const kind = extractMsgKind(headers);

    this.logger.info('server on stream', { stream, headers, flags, sid, cid, method, path, kind });

    stream.on('error', (...args) => { logger.error('stream on error', args); });
    stream.on('close', (...args) => { logger.warn('stream on close', args); });
    stream.on('end',   (...args) => { logger.info('stream on end', args); this.unregisterStream(sid); });

    // TODO: payload
    const msgIn: IMessage = { kind, cid, sid, at, idx: 0, done: false, payload: null };
    return this.processMessage(msgIn, stream);
  }

  onMessage = <TPayloadIn = any>(kind: string, mp: IMessageProcessor<TPayloadIn>): void => {
    this.msgProcessors[kind] = mp;
  }

  processMessage = async (msgIn: IMessage, _stream: http2.ServerHttp2Stream) => {
    const { logger } = this;
    logger.info('processMessage', msgIn);

    if (msgIn.kind in this.msgProcessors) {

      logger.info('we know this message kind!');

      if (!_stream.headersSent) _stream.respond(HTTP2_JSON_OK); // inform client, we are on it
      const proc = this.msgProcessors[msgIn.kind];

      let idx = 0;

      const myStream = {
        _stream,
        write: (msgOut: IMessage) => {
          logger.info('writing message', idx++, 'state', _stream.state);
          _stream.write(jsonStringify(msgOut));
        },
        end: () => {
          _stream.end();
        },
      };

      await proc(msgIn, myStream);

    } else {

      if (!_stream.headersSent) _stream.respond(HTTP2_JSON_ERROR);
      _stream.write(jsonStringify({ error: 'unknown message kind' }));
    }

    //return _stream.end(jsonStringify({ done: true })); // TODO: verify
  }

  start = () => {
    const { logger } = this;
    logger.info('starting server...');

    this._server.listen(this.options.port, () => {
      logger.info('starting server... done!');
    });
  }
}
