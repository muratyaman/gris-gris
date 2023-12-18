import { ILogger, IMessage, IStreamManager, IStreamManagerOptions } from './types';
import { extractHeader, extractMsgId, extractMsgKind, jsonPayloadAdapter, msgPackPayloadAdapter, ts } from './utils';
import { HTTP2_HEADER_METHOD, HTTP2_HEADER_PATH, HTTP2_JSON_ERROR, HTTP2_JSON_OK, HTTP2_MSGPACK_ERROR, HTTP2_MSGPACK_OK } from './constants';

export abstract class BaseStreamManager {

  protected logger: ILogger;

  constructor(protected options: IStreamManagerOptions) {
    this.logger = options.logger || console;
    options.stream.on('error', this.onError);
    options.stream.on('close', this.onClose);
    // options.stream.on('end', this.onEnd); // attached in subclasses
  }

  onError = (err: unknown) => {
    this.logger.error('stream on error', this.options.stream.id, err);
  }

  onClose = () => {
    this.logger.info('stream on close', this.options.stream.id);
  }

  respondOK = () => {}

  respondError = (_err: string) => {}

  write = (msgOut: any) => {
    this.logger.debug('stream writing message...', this.options.stream.id, msgOut);
    this.options.stream.write(this.options.payloadAdapter.encode(msgOut));
  }

  end = () => {
    this.logger.debug('stream ending...', this.options.stream.id);
    this.options.stream.end();
  }
}

export class JsonStreamManager extends BaseStreamManager implements IStreamManager {

  constructor(
    public options: IStreamManagerOptions,
  ) {
    super(options);
    const at = ts();
    const {
      stream,
      headers,
      flags,
      streamId = String(stream.id),
      payloadAdapter = jsonPayloadAdapter,
    } = options;
    const { logger } = this;
    const method = extractHeader(headers, HTTP2_HEADER_METHOD);
    const path   = extractHeader(headers, HTTP2_HEADER_PATH);
    logger.info('server on stream', { streamId, stream, headers, flags, method, path });

    const msgId  = extractMsgId(headers);
    const msgKind = extractMsgKind(headers);

    const payloadChunksStr: string[] = [];

    stream.on('data', (chunk: string) => {
      logger.debug('');
      logger.debug('stream data chunk', stream.id);
      logger.debug(chunk);
      logger.debug('');
      if (typeof chunk === 'string') {
        payloadChunksStr.push(chunk);
      } else {
        logger.error('stream data chunk is not a string', stream.id, chunk);
      }
    });
  
    stream.on('end', () => {
      // prepare payload
      const payloadStr = payloadChunksStr.join('');
      const payload = payloadAdapter.decode(payloadStr);
      // TODO: idx
      const msgIn: IMessage = { msgKind, msgId, streamId, at, idx: 0, done: false, payload };
      this.onDataEnd(msgIn);
    });
  }

  onDataEnd = (msgIn: IMessage) => {
    this.logger.info('stream on end', this.options.stream.id);
    return this.options.msgProxy.processMessage(msgIn, this);
  }

  respondOK = () => {
    if (!this.options.stream.headersSent) {
      // inform client, we are on it
      this.options.stream.respond(HTTP2_JSON_OK);
    }
  }

  respondError = (error: string) => {
    if (!this.options.stream.headersSent) {
      this.options.stream.respond(HTTP2_JSON_ERROR);
    }
    this.write({ error });
  }
}

export class MsgPackStreamManager extends BaseStreamManager implements IStreamManager {

  constructor(
    public options: IStreamManagerOptions,
  ) {
    super(options);
    const at = ts();
    const {
      stream,
      headers,
      flags,
      streamId = String(stream.id),
      payloadAdapter = msgPackPayloadAdapter,
    } = options;
    const { logger } = this;
    const method = extractHeader(headers, HTTP2_HEADER_METHOD);
    const path   = extractHeader(headers, HTTP2_HEADER_PATH);
    logger.info('server on stream', { streamId, stream, headers, flags, method, path });

    const msgId  = extractMsgId(headers);
    const msgKind = extractMsgKind(headers);

    const payloadChunksBuff: Buffer[] = [];

    stream.on('data', (chunk: Buffer) => {
      logger.debug('');
      logger.debug('stream data chunk', stream.id);
      logger.debug(chunk);
      logger.debug('');
      if (chunk instanceof Buffer) {
        payloadChunksBuff.push(chunk);
      } else {
        logger.error('stream data chunk is not a buffer', stream.id, chunk);
      }
    });
  
    stream.on('end', () => {
      // prepare payload
      const payloadBuff = Buffer.concat(payloadChunksBuff);
      const payload = payloadAdapter.decode(payloadBuff);
      // TODO: idx
      const msgIn: IMessage = { msgKind, msgId, streamId, at, idx: 0, done: false, payload };
      this.onDataEnd(msgIn);
    });
  }

  onDataEnd = (msgIn: IMessage) => {
    this.logger.info('stream on end', this.options.stream.id);
    return this.options.msgProxy.processMessage(msgIn, this);
  }

  respondOK = () => {
    if (!this.options.stream.headersSent) {
      // inform client, we are on it
      this.options.stream.respond(HTTP2_MSGPACK_OK);
    }
  }

  respondError = (error: string) => {
    if (!this.options.stream.headersSent) {
      this.options.stream.respond(HTTP2_MSGPACK_ERROR);
    }
    this.write({ error });
  }
}
